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
    role: h.role || null,
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

// ─── Sync: push local → remote, then pull remote → local ───

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
  if (localVisits.length > 0) {
    const { error } = await supabase
      .from("visits")
      .upsert(localVisits.map(visitToRow), { onConflict: "visit_id" });
    if (error) console.error("Push visits error:", error);
    else result.pushed.visits = localVisits.length;
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

  // ── PULL: fetch remote data and merge into local (by normalized name to avoid duplicates) ──
  const { data: remoteVisits } = await supabase.from("visits").select("*");
  if (remoteVisits) {
    const localVisitIds = new Set(localVisits.map((v) => v.visitId));
    // Also build a set of normalized names+dates for extra dedup
    const localVisitKeys = new Set(
      localVisits.map((v) => `${normalizeName(v.nom)}|${v.visitDate}`)
    );
    remoteVisits.forEach((r) => {
      const visit = rowToVisit(r);
      const key = `${normalizeName(visit.nom)}|${visit.visitDate}`;
      if (!localVisitIds.has(visit.visitId) && !localVisitKeys.has(key)) {
        useVisitStore.getState().addVisit(visit);
        result.pulled.visits++;
        localVisitKeys.add(key);
      }
    });
  }

  const { data: remoteSpeakers } = await supabase.from("speakers").select("*");
  if (remoteSpeakers) {
    const localIds = new Set(localSpeakers.map((s) => s.id));
    const localNames = new Set(localSpeakers.map((s) => normalizeName(s.nom)));
    remoteSpeakers.forEach((r) => {
      const speaker = rowToSpeaker(r);
      const nameKey = normalizeName(speaker.nom);
      if (!localIds.has(speaker.id) && !localNames.has(nameKey)) {
        useSpeakerStore.getState().addSpeaker(speaker);
        result.pulled.speakers++;
        localNames.add(nameKey);
      }
    });
  }

  const { data: remoteHosts } = await supabase.from("hosts").select("*");
  if (remoteHosts) {
    const localIds = new Set(localHosts.map((h) => h.id));
    const localNames = new Set(localHosts.map((h) => normalizeName(h.nom)));
    remoteHosts.forEach((r) => {
      const host = rowToHost(r);
      const nameKey = normalizeName(host.nom);
      if (!localIds.has(host.id) && !localNames.has(nameKey)) {
        useHostStore.getState().addHost(host);
        result.pulled.hosts++;
        localNames.add(nameKey);
      }
    });
  }

  useSettingsStore.getState().updateCongregation({
    lastSyncAt: new Date().toISOString(),
  });

  return result;
}
