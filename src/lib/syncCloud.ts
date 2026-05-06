import { supabase } from "../lib/supabase";
import type { Visit, Speaker, Host, HostAssignment, Companion } from "../store/visitTypes";
import { useVisitStore } from "../store/useVisitStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useHostStore } from "../store/useHostStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { mergeHosts, mergeSpeakers, mergeVisits, normalizeName } from "./dedup";

export { normalizeName };

// ─── Types for Supabase database rows ───
interface VisitRow {
  visit_id: string;
  nom: string;
  congregation: string;
  visit_date: string;
  heure_visite: string | null;
  location_type: string;
  status: string;
  is_event: boolean | null;
  event_type: string | null;
  talk_no_or_type: string | null;
  talk_theme: string | null;
  speaker_phone: string | null;
  notes: string | null;
  feedback: string | null;
  feedback_rating: number | null;
  host_assignments: HostAssignment[] | null;
  companions: Companion[] | null;
  date_arrivee: string | null;
  heure_arrivee: string | null;
  date_depart: string | null;
  heure_depart: string | null;
  updated_at: string;
}

interface SpeakerRow {
  id: string;
  nom: string;
  congregation: string;
  telephone: string | null;
  email: string | null;
  photo_url: string | null;
  wife_photo_url: string | null;
  household_type: string | null;
  wife_name: string | null;
  notes: string | null;
  talk_history: string | null;
  local_speaker: boolean | null;
  updated_at: string | null;
}

interface HostRow {
  id: string;
  nom: string;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  notes: string | null;
  role?: string | null;
  photo_url: string | null;
  capacity: number | null;
  updated_at: string | null;
}

// ─── UUID Conversion & Validation ───
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Converts any string to a deterministic valid UUID v4 format.
 * This allows "sheet-xxx" IDs to be stored in Supabase UUID columns.
 */
function toUUID(str: string): string {
  if (!str) return "00000000-0000-4000-8000-000000000000";
  if (isValidUUID(str)) return str;

  // Simple deterministic hash
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  
  const h = Math.abs(hash).toString(16).padStart(8, '0');
  // Return a valid UUID-looking string using the hash
  return `550e8400-e29b-41d4-a716-${h.repeat(3).substring(0, 12)}`;
}

// ─── Safety Parse ───
function safeJson(val: unknown) {
  if (!val) return [];
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return val;
}

// ─── Helpers: convert between app model and actual DB columns ───

function visitToRow(v: Visit): Partial<VisitRow> {
  return {
    visit_id: toUUID(v.visitId), // Convert to valid UUID for DB
    nom: v.nom,
    congregation: v.congregation,
    visit_date: v.visitDate,
    heure_visite: v.heure_visite || null,
    location_type: v.locationType,
    status: v.status,
    is_event: v.isEvent || false,
    event_type: v.eventType || null,
    talk_no_or_type: v.talkNoOrType,
    talk_theme: v.talkTheme || null,
    speaker_phone: v.speakerPhone || null,
    notes: v.notes || null,
    feedback: v.feedback || null,
    feedback_rating: v.feedbackRating || null,
    host_assignments: v.hostAssignments || [],
    companions: v.companions || [],
    date_arrivee: v.date_arrivee || null,
    heure_arrivee: v.heure_arrivee || null,
    date_depart: v.date_depart || null,
    heure_depart: v.heure_depart || null,
    updated_at: v.updatedAt || new Date().toISOString(),
  };
}

function rowToVisit(r: VisitRow): Visit {
  return {
    visitId: r.visit_id,
    nom: r.nom,
    congregation: r.congregation,
    visitDate: r.visit_date,
    heure_visite: r.heure_visite || undefined,
    locationType: (r.location_type || "kingdom_hall") as Visit["locationType"],
    status: (r.status || "scheduled") as Visit["status"],
    isEvent: r.is_event ?? undefined,
    eventType: r.event_type as Visit["eventType"],
    talkNoOrType: r.talk_no_or_type ?? "",
    talkTheme: r.talk_theme ?? undefined,
    speakerPhone: r.speaker_phone ?? undefined,
    notes: r.notes ?? undefined,
    feedback: r.feedback ?? undefined,
    feedbackRating: r.feedback_rating ?? undefined,
    hostAssignments: safeJson(r.host_assignments),
    companions: safeJson(r.companions),
    date_arrivee: r.date_arrivee ?? undefined,
    heure_arrivee: r.heure_arrivee ?? undefined,
    date_depart: r.date_depart ?? undefined,
    heure_depart: r.heure_depart ?? undefined,
    updatedAt: r.updated_at,
  };
}

function speakerToRow(s: Speaker): Partial<SpeakerRow> {
  return {
    id: toUUID(s.id),
    nom: s.nom,
    congregation: s.congregation,
    telephone: s.telephone || null,
    email: s.email || null,
    photo_url: s.photoUrl || null,
    wife_photo_url: s.spousePhotoUrl || null,
    household_type: s.householdType || "single",
    wife_name: s.spouseName || null,
    notes: s.notes || null,
    local_speaker: s.localSpeaker || false,
    updated_at: s.updatedAt || new Date().toISOString(),
  };
}

function rowToSpeaker(r: SpeakerRow): Speaker {
  return {
    id: r.id,
    nom: r.nom,
    congregation: r.congregation,
    telephone: r.telephone || undefined,
    email: r.email || undefined,
    photoUrl: r.photo_url || undefined,
    spousePhotoUrl: r.wife_photo_url || undefined,
    householdType: r.household_type as Speaker["householdType"],
    spouseName: r.wife_name ?? undefined,
    notes: r.notes ?? undefined,
    updatedAt: r.updated_at || undefined,
    localSpeaker: r.local_speaker ?? false,
  };
}

function hostToRow(h: Host): Partial<HostRow> {
  return {
    id: toUUID(h.id),
    nom: h.nom,
    telephone: h.telephone || null,
    email: h.email || null,
    adresse: h.adresse || null,
    notes: h.notes || null,
    photo_url: h.photoUrl || null,
    capacity: h.capacity || null,
    updated_at: h.updatedAt || new Date().toISOString(),
  };
}

function rowToHost(r: HostRow): Host {
  return {
    id: r.id,
    nom: r.nom,
    telephone: r.telephone || undefined,
    email: r.email || undefined,
    adresse: r.adresse || undefined,
    notes: r.notes || undefined,
    role: r.role as Host["role"] ?? undefined,
    photoUrl: r.photo_url || undefined,
    capacity: r.capacity || undefined,
    updatedAt: r.updated_at || undefined,
  };
}

export interface SyncResult {
  pushed: { visits: number; speakers: number; hosts: number };
  pulled: { visits: number; speakers: number; hosts: number };
}

/**
 * Store a large data set to localStorage safely, clearing the key first
 * to avoid quota exceeded errors when using Zustand persist.
 */
function safeStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    // Quota exceeded — remove existing keys to free space, then retry
    console.warn(`Storage quota exceeded for "${key}", clearing some caches...`);
    // Remove the key first, then retry
    localStorage.removeItem(key);
    try {
      localStorage.setItem(key, value);
    } catch {
      // If it still fails, we cannot do much
      throw new Error(`Impossible d'écrire "${key}" dans le stockage local (quota dépassé). Essayez de libérer de l'espace.`);
    }
  }
}

export async function syncCloud(): Promise<SyncResult> {
  console.log("Starting cloud sync...");
  const result: SyncResult = {
    pushed: { visits: 0, speakers: 0, hosts: 0 },
    pulled: { visits: 0, speakers: 0, hosts: 0 },
  };

  if (!supabase) return result;

  // ── 0. FREE UP STORAGE SPACE ──
  // Remove all persisted Zustand data before loading fresh data to avoid quota exceeded
  console.log("Clearing local storage before sync...");
  try {
    localStorage.removeItem("kbv-speakers");
    localStorage.removeItem("kbv-visits");
    localStorage.removeItem("kbv-hosts");
    localStorage.removeItem("kbv-notifications");
  } catch (e) {
    console.warn("Could not clear some storage keys:", e);
  }

  // ── 1. PULL & MERGE ──
  const { data: remoteVisits, error: pullVisitsError } = await supabase.from("visits").select("*");
  if (pullVisitsError) console.error("Pull visits error:", pullVisitsError);
  
  const localVisits = useVisitStore.getState().visits;
  const remoteVisitsConverted = (remoteVisits || []).map(rowToVisit);
  const finalVisits = mergeVisits(localVisits, remoteVisitsConverted);
  useVisitStore.getState().setVisits(finalVisits);
  result.pulled.visits = remoteVisitsConverted.length;

  // B. SPEAKERS
  const { data: remoteSpeakers, error: pullSpeakersError } = await supabase.from("speakers").select("*");
  if (pullSpeakersError) console.error("Pull speakers error:", pullSpeakersError);
  const localSpeakers = useSpeakerStore.getState().speakers;
  const remoteSpeakersConverted = (remoteSpeakers || []).map(rowToSpeaker);
  const finalSpeakers = mergeSpeakers(localSpeakers, remoteSpeakersConverted);
  useSpeakerStore.getState().setSpeakers(finalSpeakers);
  result.pulled.speakers = remoteSpeakersConverted.length;

  // C. HOSTS
  const { data: remoteHosts, error: pullHostsError } = await supabase.from("hosts").select("*");
  if (pullHostsError) console.error("Pull hosts error:", pullHostsError);
  const localHosts = useHostStore.getState().hosts;
  const remoteHostsConverted = (remoteHosts || []).map(rowToHost);
  const finalHosts = mergeHosts(localHosts, remoteHostsConverted);
  useHostStore.getState().setHosts(finalHosts);
  result.pulled.hosts = remoteHostsConverted.length;

  // ── 2. PUSH ──
  // Now we use toUUID() during conversion to ensure every entry is pushable
  if (finalVisits.length > 0) {
    const { error } = await supabase.from("visits").upsert(finalVisits.map(visitToRow), { onConflict: "visit_id" });
    if (error) console.error("Push visits error:", error);
    else result.pushed.visits = finalVisits.length;
  }
  
  if (finalSpeakers.length > 0) {
    const { error } = await supabase.from("speakers").upsert(finalSpeakers.map(speakerToRow), { onConflict: "id" });
    if (error) console.error("Push speakers error:", error);
    else result.pushed.speakers = finalSpeakers.length;
  }
  
  if (finalHosts.length > 0) {
    const { error } = await supabase.from("hosts").upsert(finalHosts.map(hostToRow), { onConflict: "id" });
    if (error) console.error("Push hosts error:", error);
    else result.pushed.hosts = finalHosts.length;
  }

  useSettingsStore.getState().updateCongregation({
    lastSyncAt: new Date().toISOString(),
  });
  
  console.log("Cloud sync finished successfully.", result);
  return result;
}

/**
 * Delete an item from Supabase by its ID.
 */
export async function deleteRemoteItem(table: "visits" | "speakers" | "hosts", id: string) {
  if (!supabase) return;
  const idField = table === "visits" ? "visit_id" : "id";
  const { error } = await supabase.from(table).delete().eq(idField, toUUID(id));
  if (error) console.error(`Delete from ${table} error:`, error);
}
