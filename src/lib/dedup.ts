import type { Host, Speaker, Visit } from "../store/visitTypes";

export function normalizeName(name: string | undefined | null): string {
  return (name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeDatePart(date: string | undefined | null): string {
  return (date || "").split("T")[0].trim();
}

export function getVisitKey(visit: Visit): string {
  const name = normalizeName(visit.nom);
  const date = normalizeDatePart(visit.visitDate);
  return name && date ? `${name}|${date}` : `id:${visit.visitId}`;
}

export function getSpeakerKey(speaker: Speaker): string {
  const name = normalizeName(speaker.nom);
  return name || `id:${speaker.id}`;
}

export function getHostKey(host: Host): string {
  const name = normalizeName(host.nom);
  return name || `id:${host.id}`;
}

function hasValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function isNewer(next?: string, current?: string): boolean {
  if (!next) return false;
  if (!current) return true;
  return new Date(next).getTime() >= new Date(current).getTime();
}

function mergeItem<T extends { updatedAt?: string }>(current: T, next: T, idField: keyof T): T {
  const output = { ...current } as Record<string, unknown>;
  const nextWins = isNewer(next.updatedAt, current.updatedAt);

  Object.entries(next as Record<string, unknown>).forEach(([field, value]) => {
    if (field === idField) return;
    if (field === "updatedAt") {
      if (isNewer(value as string | undefined, output.updatedAt as string | undefined)) output.updatedAt = value;
      return;
    }
    if (!hasValue(value)) return;
    if (!hasValue(output[field]) || nextWins) output[field] = value;
  });

  return output as T;
}

function mergeByKey<T extends { updatedAt?: string }>(items: T[], keyFn: (item: T) => string, idField: keyof T): T[] {
  const merged = new Map<string, T>();
  items.forEach((item) => {
    const key = keyFn(item);
    const existing = merged.get(key);
    merged.set(key, existing ? mergeItem(existing, item, idField) : item);
  });
  return Array.from(merged.values());
}

export function mergeVisits(...groups: Visit[][]): Visit[] {
  return mergeByKey(groups.flat(), getVisitKey, "visitId");
}

export function mergeSpeakers(...groups: Speaker[][]): Speaker[] {
  return mergeByKey(groups.flat(), getSpeakerKey, "id");
}

export function mergeHosts(...groups: Host[][]): Host[] {
  return mergeByKey(groups.flat(), getHostKey, "id");
}