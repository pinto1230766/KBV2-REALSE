import { supabase } from "../lib/supabase";
import type { Visit, Speaker, Host, AppSettings } from "../store/visitTypes";
import { useVisitStore } from "../store/useVisitStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useHostStore } from "../store/useHostStore";
import { useSettingsStore } from "../store/useSettingsStore";

// ─── Helpers: convert between camelCase (app) and snake_case (DB) ───

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
    expenses: v.expenses || [],
    date_arrivee: v.date_arrivee || null,
    heure_arrivee: v.heure_arrivee || null,
    date_depart: v.date_depart || null,
    heure_depart: v.heure_depart || null,
    speaker_dietary: v.speakerDietary || null,
    spouse_dietary: v.spouseDietary || null,
    group_meal_type: v.groupMealType || null,
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
    expenses: r.expenses,
    date_arrivee: r.date_arrivee,
    heure_arrivee: r.heure_arrivee,
    date_depart: r.date_depart,
    heure_depart: r.heure_depart,
    speakerDietary: r.speaker_dietary,
    spouseDietary: r.spouse_dietary,
    groupMealType: r.group_meal_type,
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
    spouse_photo_url: s.spousePhotoUrl || null,
    household_type: s.householdType || "single",
    spouse_name: s.spouseName || null,
    notes: s.notes || null,
    talks: s.talks || [],
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
    spousePhotoUrl: r.spouse_photo_url,
    householdType: r.household_type,
    spouseName: r.spouse_name,
    notes: r.notes,
    talks: r.talks,
  };
}

function hostToRow(h: Host) {
  return {
    id: h.id,
    nom: h.nom,
    telephone: h.telephone || null,
    email: h.email || null,
    adresse: h.adresse || null,
    address: h.address || null,
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
    address: r.address,
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

  // ── PUSH: upsert local data to Supabase ──
  const localVisits = useVisitStore.getState().visits;
  const localSpeakers = useSpeakerStore.getState().speakers;
  const localHosts = useHostStore.getState().hosts;
  const localSettings = useSettingsStore.getState().settings;

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

  // Push settings
  await supabase.from("app_settings").upsert({
    id: "main",
    language: localSettings.language,
    dark_mode: localSettings.darkMode,
    notifications: localSettings.notifications,
    congregation: localSettings.congregation,
  }, { onConflict: "id" });

  // ── PULL: fetch remote data and merge into local ──
  const { data: remoteVisits } = await supabase.from("visits").select("*");
  if (remoteVisits) {
    const localIds = new Set(localVisits.map((v) => v.visitId));
    remoteVisits.forEach((r) => {
      const visit = rowToVisit(r);
      if (!localIds.has(visit.visitId)) {
        useVisitStore.getState().addVisit(visit);
        result.pulled.visits++;
      }
    });
  }

  const { data: remoteSpeakers } = await supabase.from("speakers").select("*");
  if (remoteSpeakers) {
    const localIds = new Set(localSpeakers.map((s) => s.id));
    remoteSpeakers.forEach((r) => {
      const speaker = rowToSpeaker(r);
      if (!localIds.has(speaker.id)) {
        useSpeakerStore.getState().addSpeaker(speaker);
        result.pulled.speakers++;
      }
    });
  }

  const { data: remoteHosts } = await supabase.from("hosts").select("*");
  if (remoteHosts) {
    const localIds = new Set(localHosts.map((h) => h.id));
    remoteHosts.forEach((r) => {
      const host = rowToHost(r);
      if (!localIds.has(host.id)) {
        useHostStore.getState().addHost(host);
        result.pulled.hosts++;
      }
    });
  }

  // Update last sync timestamp
  useSettingsStore.getState().updateCongregation({
    lastSyncAt: new Date().toISOString(),
  });

  return result;
}
