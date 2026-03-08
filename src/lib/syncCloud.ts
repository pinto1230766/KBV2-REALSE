import { supabase } from "../lib/supabase";
import type { Visit, Speaker, Host } from "../store/visitTypes";
import { useVisitStore } from "../store/useVisitStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useHostStore } from "../store/useHostStore";
import { useSettingsStore } from "../store/useSettingsStore";

// ─── Normalize name: remove newlines, extra spaces, lowercase ───
export function normalizeName(name: string): string {
  return name.replace(/\n/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

// ─── UUID check ───
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUUID(s: string) { return UUID_RE.test(s); }

// ─── Dedup helper: keep first entry per key ───
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

// ─── Helpers: convert between app model and actual DB columns ───

function visitToRow(v: Visit) {
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

function rowToVisit(r: any): Visit {
  return {
    visitId: r.visit_id,
    nom: r.nom,
    congregation: r.congregation,
    visitDate: r.visit_date,
    heure_visite: r.heure_visite,
    locationType: r.location_type,
    status: r.status,
    isEvent: r.is_event,
    eventType: r.event_type,
    talkNoOrType: r.talk_no_or_type,
    talkTheme: r.talk_theme,
    speakerPhone: r.speaker_phone,
    notes: r.notes,
    feedback: r.feedback,
    feedbackRating: r.feedback_rating,
    hostAssignments: r.host_assignments,
    companions: r.companions,
    date_arrivee: r.date_arrivee,
    heure_arrivee: r.heure_arrivee,
    date_depart: r.date_depart,
    heure_depart: r.heure_depart,
    updatedAt: r.updated_at,
  };
}

function speakerToRow(s: Speaker) {
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
  };
}

function rowToSpeaker(r: any): Speaker {
  return {
    id: r.id,
    nom: r.nom,
    congregation: r.congregation,
    telephone: r.telephone,
    email: r.email,
    photoUrl: r.photo_url,
    spousePhotoUrl: r.wife_photo_url,
    householdType: r.household_type,
    spouseName: r.wife_name,
    notes: r.notes,
    talks: r.talk_history || [],
  };
}

function hostToRow(h: Host) {
  return {
    id: h.id,
    nom: h.nom,
    telephone: h.telephone || null,
    email: h.email || null,
    adresse: h.adresse || null,
    notes: h.notes || null,
    photo_url: h.photoUrl || null,
    tags: h.tags || [],
    capacity: h.capacity || null,
  };
}

function rowToHost(r: any): Host {
  return {
    id: r.id,
    nom: r.nom,
    telephone: r.telephone,
    email: r.email,
    adresse: r.adresse,
    notes: r.notes,
    role: r.role,
    photoUrl: r.photo_url,
    tags: r.tags,
    capacity: r.capacity,
  };
}

// ─── Sync: push local → remote, then pull remote → local (REPLACE, not merge) ───

export interface SyncResult {
  pushed: { visits: number; speakers: number; hosts: number };
  pulled: { visits: number; speakers: number; hosts: number };
}

export async function syncCloud(): Promise<SyncResult> {
  const result: SyncResult = {
    pushed: { visits: 0, speakers: 0, hosts: 0 },
    pulled: { visits: 0, speakers: 0, hosts: 0 },
  };

  const localVisits = useVisitStore.getState().visits;
  const localSpeakers = useSpeakerStore.getState().speakers;
  const localHosts = useHostStore.getState().hosts;

  // ── PUSH: upsert local data to Supabase ──
  // Filter visits with valid UUIDs only (sheet-imported visits have non-UUID ids)
  const pushableVisits = localVisits.filter((v) => isUUID(v.visitId));
  if (pushableVisits.length > 0) {
    const { error } = await supabase
      .from("visits")
      .upsert(pushableVisits.map(visitToRow), { onConflict: "visit_id" });
    if (error) console.error("Push visits error:", error);
    else result.pushed.visits = pushableVisits.length;
  }

  if (localSpeakers.length > 0) {
    const { error } = await supabase
      .from("speakers")
      .upsert(localSpeakers.map(speakerToRow), { onConflict: "id" });
    if (error) console.error("Push speakers error:", error);
    else result.pushed.speakers = localSpeakers.length;
  }

  if (localHosts.length > 0) {
    const { error } = await supabase
      .from("hosts")
      .upsert(localHosts.map(hostToRow), { onConflict: "id" });
    if (error) console.error("Push hosts error:", error);
    else result.pushed.hosts = localHosts.length;
  }

  // ── PULL: fetch remote data, merge with local, deduplicate, then REPLACE local store ──
  const { data: remoteVisits } = await supabase.from("visits").select("*");
  if (remoteVisits) {
    // Merge remote into local: remote wins for same visitId
    const remoteConverted = remoteVisits.map(rowToVisit);
    const remoteById = new Map(remoteConverted.map((v) => [v.visitId, v]));
    
    // Start with remote data, then add local-only entries
    const merged: Visit[] = [...remoteConverted];
    for (const lv of localVisits) {
      if (!remoteById.has(lv.visitId)) {
        merged.push(lv);
      }
    }
    
    // Deduplicate by normalized name + date
    const dedupedVisits = dedup(merged, (v) => `${normalizeName(v.nom)}|${v.visitDate}`);
    useVisitStore.getState().setVisits(dedupedVisits);
    result.pulled.visits = remoteConverted.length;
  }

  const { data: remoteSpeakers } = await supabase.from("speakers").select("*");
  if (remoteSpeakers) {
    const remoteConverted = remoteSpeakers.map(rowToSpeaker);
    const remoteById = new Map(remoteConverted.map((s) => [s.id, s]));
    
    const merged: Speaker[] = [...remoteConverted];
    for (const ls of localSpeakers) {
      if (!remoteById.has(ls.id)) {
        merged.push(ls);
      }
    }
    
    // Deduplicate by normalized name
    const dedupedSpeakers = dedup(merged, (s) => normalizeName(s.nom));
    useSpeakerStore.getState().setSpeakers(dedupedSpeakers);
    result.pulled.speakers = remoteConverted.length;
  }

  const { data: remoteHosts } = await supabase.from("hosts").select("*");
  if (remoteHosts) {
    const remoteConverted = remoteHosts.map(rowToHost);
    const remoteById = new Map(remoteConverted.map((h) => [h.id, h]));
    
    const merged: Host[] = [...remoteConverted];
    for (const lh of localHosts) {
      if (!remoteById.has(lh.id)) {
        merged.push(lh);
      }
    }
    
    const dedupedHosts = dedup(merged, (h) => normalizeName(h.nom));
    useHostStore.getState().setHosts(dedupedHosts);
    result.pulled.hosts = remoteConverted.length;
  }

  useSettingsStore.getState().updateCongregation({
    lastSyncAt: new Date().toISOString(),
  });

  return result;
}
