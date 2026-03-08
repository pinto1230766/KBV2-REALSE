import type { Visit, Speaker } from "../store/visitTypes";

/** Generate a unique ID */
export function generateId(): string {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11);
}

/** Parse CSV text into rows of cells */
export function parseCSV(text: string): string[][] {
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

/** Extract Google Sheet ID and gid from a URL */
export function extractSheetInfo(url: string): { id: string; gid: string } | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;
  const gidMatch = url.match(/gid=(\d+)/);
  return { id: match[1], gid: gidMatch ? gidMatch[1] : "0" };
}

/** Parse DD/MM/YYYY to YYYY-MM-DD */
export function parseSheetDate(dateStr: string): string {
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return dateStr;
}

/** Parse CSV rows into Visit and Speaker objects */
export function parseRowsToData(rows: string[][]): { visits: Visit[]; speakers: Speaker[] } {
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
