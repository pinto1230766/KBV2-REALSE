import { useEffect, useRef, useCallback } from "react";
import { useVisitStore } from "../store/useVisitStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { syncCloud, normalizeName } from "../lib/syncCloud";
import { toast } from "sonner";
import { parseCSV, extractSheetInfo, parseRowsToData } from "../lib/sheetUtils";

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
        console.log("🔄 Triggering cloud sync from useAutoSync...");
        cloudResult = await syncCloud();
        console.log("✅ Cloud sync finished:", cloudResult);
      } catch (err) {
        console.error("❌ Cloud sync critical error:", err);
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
