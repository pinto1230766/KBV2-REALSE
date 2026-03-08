import { useEffect, useRef, useCallback } from "react";
import { useVisitStore } from "../store/useVisitStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { syncCloud, normalizeName } from "../lib/syncCloud";
import { toast } from "sonner";
import type { Visit, Speaker } from "../store/visitTypes";

// ─── CSV Parsing (same as SettingsPage) ───
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') { current += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { current += char; }
    } else {
      if (char === '"') { inQuotes = true; }
      else if (char === ",") { row.push(current.trim()); current = ""; }
      else if (char === "\n" || (char === "\r" && text[i + 1] === "\n")) {
        row.push(current.trim()); current = "";
        if (row.some((c) => c !== "")) rows.push(row);
        row = [];
        if (char === "\r") i++;
      } else { current += char; }
    }
  }
  row.push(current.trim());
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

function extractSheetInfo(url: string): { id: string; gid: string } | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;
  const gidMatch = url.match(/gid=(\d+)/);
  return { id: match[1], gid: gidMatch ? gidMatch[1] : "0" };
}

function parseSheetDate(dateStr: string): string {
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return dateStr;
}

function parseRowsToData(rows: string[][]): { visits: Visit[]; speakers: Speaker[] } {
  const visits: Visit[] = [];
  const speakerMap = new Map<string, Speaker>();

  for (const row of rows) {
    const dateStr = row[1]?.trim();
    if (!dateStr || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) continue;
    const orador = row[2]?.trim() || "";
    const congregation = row[3]?.trim() || "";
    const talkNo = row[4]?.trim() || "";
    const theme = row[5]?.trim() || "";
    if (!orador) continue;

    const isEvent = !talkNo && (
      orador.toLowerCase().includes("assemblei") ||
      orador.toLowerCase().includes("runion") ||
      orador.toLowerCase().includes("visita") ||
      orador.toLowerCase().includes("asenbleia") ||
      orador.toLowerCase().includes("komemorason")
    );

    const visitDate = parseSheetDate(dateStr);
    const visitId = `sheet-${visitDate}`;

    visits.push({
      visitId,
      nom: orador,
      congregation,
      visitDate,
      locationType: "kingdom_hall",
      status: new Date(visitDate) < new Date() ? "completed" : "scheduled",
      isEvent: isEvent || undefined,
      talkNoOrType: talkNo || (isEvent ? "event" : ""),
      talkTheme: theme,
    });

    if (!isEvent) {
      const key = orador.toLowerCase().replace(/\s+/g, " ");
      if (!speakerMap.has(key)) {
        speakerMap.set(key, {
          id: `sheet-spk-${key.replace(/\s/g, "-")}`,
          nom: orador,
          congregation,
        });
      }
    }
  }
  return { visits, speakers: Array.from(speakerMap.values()) };
}

async function syncGoogleSheet(sheetUrl: string): Promise<{ addedVisits: number; addedSpeakers: number }> {
  const info = extractSheetInfo(sheetUrl);
  if (!info) return { addedVisits: 0, addedSpeakers: 0 };

  const csvUrl = `https://docs.google.com/spreadsheets/d/${info.id}/gviz/tq?tqx=out:csv&gid=${info.gid}`;
  let text: string;
  try {
    const resp = await fetch(csvUrl);
    if (!resp.ok) {
      const fallback = await fetch(`https://docs.google.com/spreadsheets/d/${info.id}/export?format=csv&gid=${info.gid}`);
      if (!fallback.ok) throw new Error(`HTTP ${fallback.status}`);
      text = await fallback.text();
    } else {
      text = await resp.text();
    }
  } catch {
    return { addedVisits: 0, addedSpeakers: 0 };
  }

  const rows = parseCSV(text);
  const { visits: newVisits, speakers: newSpeakers } = parseRowsToData(rows);

  // Dedup visits
  const existingKeys = new Set(
    useVisitStore.getState().visits.map((v) => `${normalizeName(v.nom)}|${v.visitDate}`)
  );
  let addedVisits = 0;
  for (const v of newVisits) {
    const key = `${normalizeName(v.nom)}|${v.visitDate}`;
    if (!existingKeys.has(key)) {
      useVisitStore.getState().addVisit(v);
      existingKeys.add(key);
      addedVisits++;
    }
  }

  // Dedup speakers
  const existingSpeakers = new Set(
    useSpeakerStore.getState().speakers.map((s) => normalizeName(s.nom))
  );
  let addedSpeakers = 0;
  for (const s of newSpeakers) {
    const key = normalizeName(s.nom);
    if (!existingSpeakers.has(key)) {
      useSpeakerStore.getState().addSpeaker(s);
      existingSpeakers.add(key);
      addedSpeakers++;
    }
  }

  return { addedVisits, addedSpeakers };
}

/** Auto-sync on mount + every 15 min. Deduplicates before inserting. */
export function useAutoSync() {
  const lastSyncRef = useRef(0);

  const runSync = useCallback(async (silent = true) => {
    const now = Date.now();
    // Minimum 5 min between syncs
    if (now - lastSyncRef.current < 5 * 60 * 1000) return;
    lastSyncRef.current = now;

    const sheetUrl = useSettingsStore.getState().settings.congregation.googleSheetUrl;

    try {
      // 1. Google Sheets sync (if configured)
      let sheetResult = { addedVisits: 0, addedSpeakers: 0 };
      if (sheetUrl) {
        sheetResult = await syncGoogleSheet(sheetUrl);
      }

      // 2. Supabase cloud sync
      let cloudResult;
      try {
        cloudResult = await syncCloud();
      } catch {
        cloudResult = null;
      }

      // Update last sync timestamp
      useSettingsStore.getState().updateCongregation({
        lastSyncAt: new Date().toISOString(),
      });

      if (!silent) {
        const parts: string[] = [];
        if (sheetResult.addedVisits || sheetResult.addedSpeakers) {
          parts.push(`Sheet: +${sheetResult.addedVisits} visites, +${sheetResult.addedSpeakers} orateurs`);
        }
        if (cloudResult) {
          const pushed = cloudResult.pushed.visits + cloudResult.pushed.speakers + cloudResult.pushed.hosts;
          const pulled = cloudResult.pulled.visits + cloudResult.pulled.speakers + cloudResult.pulled.hosts;
          parts.push(`Cloud: ↑${pushed} ↓${pulled}`);
        }
        if (parts.length > 0) {
          toast.success(`🔄 Sync OK — ${parts.join(" | ")}`);
        } else {
          toast.success("🔄 Déjà à jour — aucun doublon");
        }
      }
    } catch (err) {
      console.error("Auto-sync error:", err);
      if (!silent) toast.error("Erreur de synchronisation automatique");
    }
  }, []);

  useEffect(() => {
    // Sync on mount (silent)
    const timeout = setTimeout(() => runSync(true), 3000);

    // Sync every 15 min
    const interval = setInterval(() => runSync(true), 15 * 60 * 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [runSync]);

  return { runSync };
}
