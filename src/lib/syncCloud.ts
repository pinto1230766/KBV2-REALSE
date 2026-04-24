import { supabase } from "../lib/supabase";
import type { Visit, Speaker, Host } from "../store/visitTypes";
import { useVisitStore } from "../store/useVisitStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useHostStore } from "../store/useHostStore";
import { useSettingsStore } from "../store/useSettingsStore";

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
  host_assignments: any | null;
  companions: any | null;
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
  updated_at: string | null;
}

interface HostRow {
  id: string;
  nom: string;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  notes: string | null;
  role: string | null;
  photo_url: string | null;
  tags: string[] | null;
  capacity: number | null;
  updated_at: string | null;
}

// ─── Normalize name ───
export function normalizeName(name: string): string {
  if (!name) return "";
  return name.replace(/\n/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

// ─── Dedup helper ───
function dedup<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

// ─── Safety Parse ───
function safeJson(val: any) {
  if (!val) return [];
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return val;
}

// ─── Helpers: convert between app model and actual DB columns ───

function visitToRow(v: Visit): Partial<VisitRow> {
  return {
    visit_id: v.visitId,
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
    id: s.id,
    nom: s.nom,
    congregation: s.congregation,
    telephone: s.telephone || null,
    email: s.email || null,
    photo_url: s.photoUrl || null,
    wife_photo_url: s.spousePhotoUrl || null,
    household_type: s.householdType || "single",
    wife_name: s.spouseName || null,
    notes: s.notes || null,
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
  };
}

function hostToRow(h: Host): Partial<HostRow> {
  return {
    id: h.id,
    nom: h.nom,
    telephone: h.telephone || null,
    email: h.email || null,
    adresse: h.adresse || null,
    notes: h.notes || null,
    role: h.role || null,
    photo_url: h.photoUrl || null,
    tags: [],
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

export async function syncCloud(): Promise<SyncResult> {
  console.log("Starting cloud sync...");
  const result: SyncResult = {
    pushed: { visits: 0, speakers: 0, hosts: 0 },
    pulled: { visits: 0, speakers: 0, hosts: 0 },
  };

  if (!supabase) {
    console.error("Supabase client not initialized!");
    return result;
  }

  // ── 1. PULL & MERGE: Resolve conflicts locally using timestamps ──
  
  // A. VISITS
  const { data: remoteVisits, error: pullVisitsError } = await supabase.from("visits").select("*");
  if (pullVisitsError) {
    console.error("Pull visits error:", pullVisitsError);
    throw pullVisitsError;
  }
  
  const localVisits = useVisitStore.getState().visits;
  const remoteVisitsConverted = (remoteVisits || []).map(rowToVisit);
  console.log(`Pulled ${remoteVisitsConverted.length} visits from remote.`);
  
  const mergedVisitsMap = new Map<string, Visit>();
  localVisits.forEach(v => mergedVisitsMap.set(v.visitId, v));
  remoteVisitsConverted.forEach(rv => {
    const lv = mergedVisitsMap.get(rv.visitId);
    if (!lv || (rv.updatedAt && lv.updatedAt && rv.updatedAt > lv.updatedAt) || (rv.updatedAt && !lv.updatedAt)) {
      mergedVisitsMap.set(rv.visitId, rv);
    }
  });
  
  const finalVisits = dedup(Array.from(mergedVisitsMap.values()), (v) => {
    if (!v.nom) return `empty-${Math.random()}`;
    const datePart = v.visitDate ? v.visitDate.split('T')[0] : '';
    return `${normalizeName(v.nom)}|${datePart}`;
  });
  useVisitStore.getState().setVisits(finalVisits);
  result.pulled.visits = remoteVisitsConverted.length;

  // B. SPEAKERS
  const { data: remoteSpeakers, error: pullSpeakersError } = await supabase.from("speakers").select("*");
  if (pullSpeakersError) throw pullSpeakersError;
  
  const localSpeakers = useSpeakerStore.getState().speakers;
  const remoteSpeakersConverted = (remoteSpeakers || []).map(rowToSpeaker);
  const mergedSpeakersMap = new Map<string, Speaker>();
  
  localSpeakers.forEach(s => mergedSpeakersMap.set(s.id, s));
  remoteSpeakersConverted.forEach(rs => {
    const ls = mergedSpeakersMap.get(rs.id);
    if (!ls || (rs.updatedAt && ls.updatedAt && rs.updatedAt > ls.updatedAt) || (rs.updatedAt && !ls.updatedAt)) {
      mergedSpeakersMap.set(rs.id, rs);
    }
  });
  
  const finalSpeakers = Array.from(mergedSpeakersMap.values());
  useSpeakerStore.getState().setSpeakers(finalSpeakers);
  result.pulled.speakers = remoteSpeakersConverted.length;

  // C. HOSTS
  const { data: remoteHosts, error: pullHostsError } = await supabase.from("hosts").select("*");
  if (pullHostsError) throw pullHostsError;
  
  const localHosts = useHostStore.getState().hosts;
  const remoteHostsConverted = (remoteHosts || []).map(rowToHost);
  const mergedHostsMap = new Map<string, Host>();
  
  localHosts.forEach(h => mergedHostsMap.set(h.id, h));
  remoteHostsConverted.forEach(rh => {
    const lh = mergedHostsMap.get(rh.id);
    if (!lh || (rh.updatedAt && lh.updatedAt && rh.updatedAt > lh.updatedAt) || (rh.updatedAt && !lh.updatedAt)) {
      mergedHostsMap.set(rh.id, rh);
    }
  });
  
  const finalHosts = Array.from(mergedHostsMap.values());
  useHostStore.getState().setHosts(finalHosts);
  result.pulled.hosts = remoteHostsConverted.length;

  // ── 2. PUSH: Send the fully reconciled state back to the cloud ──
  
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
