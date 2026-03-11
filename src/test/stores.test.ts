import { describe, it, expect, beforeEach } from "vitest";
import { useVisitStore } from "../store/useVisitStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useHostStore } from "../store/useHostStore";
import { useUIStore } from "../store/useUIStore";
import type { Visit, Speaker, Host } from "../store/visitTypes";

describe("Visit Store", () => {
  beforeEach(() => {
    useVisitStore.getState().visits.forEach((v: Visit) => 
      useVisitStore.getState().deleteVisit(v.visitId)
    );
  });

  it("should add a visit", () => {
    const visit: Visit = {
      visitId: "1",
      nom: "Test Visit",
      congregation: "Paris",
      visitDate: "2026-01-15",
      status: "scheduled",
      talkNoOrType: "1",
      talkTheme: "Test Theme",
      locationType: "kingdom_hall",
      notes: "Test notes",
    };
    
    useVisitStore.getState().addVisit(visit);
    const visits = useVisitStore.getState().visits;
    
    expect(visits).toHaveLength(1);
    expect(visits[0].visitId).toBe("1");
    expect(visits[0].talkTheme).toBe("Test Theme");
  });

  it("should delete a visit", () => {
    const visit: Visit = {
      visitId: "2",
      nom: "Another Visit",
      congregation: "Lyon",
      visitDate: "2026-01-20",
      status: "confirmed",
      talkNoOrType: "2",
      locationType: "zoom",
      notes: "",
    };
    
    useVisitStore.getState().addVisit(visit);
    expect(useVisitStore.getState().visits).toHaveLength(1);
    
    useVisitStore.getState().deleteVisit("2");
    expect(useVisitStore.getState().visits).toHaveLength(0);
  });

  it("should update a visit", () => {
    const visit: Visit = {
      visitId: "3",
      nom: "Original Visit",
      congregation: "Marseille",
      visitDate: "2026-01-25",
      status: "scheduled",
      talkNoOrType: "3",
      talkTheme: "Original Theme",
      locationType: "kingdom_hall",
      notes: "",
    };
    
    useVisitStore.getState().addVisit(visit);
    useVisitStore.getState().updateVisit("3", { status: "confirmed", talkTheme: "Updated Theme" });
    
    const updatedVisit = useVisitStore.getState().visits.find((v: Visit) => v.visitId === "3");
    expect(updatedVisit?.status).toBe("confirmed");
    expect(updatedVisit?.talkTheme).toBe("Updated Theme");
  });
});

describe("Speaker Store", () => {
  beforeEach(() => {
    useSpeakerStore.getState().speakers.forEach((s: Speaker) => 
      useSpeakerStore.getState().deleteSpeaker(s.id)
    );
  });

  it("should add a speaker", () => {
    const speaker: Speaker = {
      id: "speaker-1",
      nom: "Jean Dupont",
      congregation: "Paris Centre",
      telephone: "+33 6 12 34 56 78",
    };
    
    useSpeakerStore.getState().addSpeaker(speaker);
    const speakers = useSpeakerStore.getState().speakers;
    
    expect(speakers).toHaveLength(1);
    expect(speakers[0].nom).toBe("Jean Dupont");
  });

  it("should delete a speaker", () => {
    const speaker: Speaker = {
      id: "speaker-2",
      nom: "Marie Pierre",
      congregation: "Lyon",
      telephone: "+33 6 98 76 54 32",
    };
    
    useSpeakerStore.getState().addSpeaker(speaker);
    expect(useSpeakerStore.getState().speakers).toHaveLength(1);
    
    useSpeakerStore.getState().deleteSpeaker("speaker-2");
    expect(useSpeakerStore.getState().speakers).toHaveLength(0);
  });
});

describe("Host Store", () => {
  beforeEach(() => {
    useHostStore.getState().hosts.forEach((h: Host) => 
      useHostStore.getState().deleteHost(h.id)
    );
  });

  it("should add a host", () => {
    const host: Host = {
      id: "host-1",
      nom: "Pierre Martin",
      telephone: "+33 6 11 22 33 44",
      adresse: "123 Rue de la Paix, Paris",
      role: "hebergement",
    };
    
    useHostStore.getState().addHost(host);
    const hosts = useHostStore.getState().hosts;
    
    expect(hosts).toHaveLength(1);
    expect(hosts[0].nom).toBe("Pierre Martin");
    expect(hosts[0].role).toBe("hebergement");
  });
});

describe("UI Store", () => {
  it("should set active tab", () => {
    useUIStore.getState().setActiveTab("planning");
    expect(useUIStore.getState().activeTab).toBe("planning");
    
    useUIStore.getState().setActiveTab("speakers");
    expect(useUIStore.getState().activeTab).toBe("speakers");
  });

  it("should toggle user manual", () => {
    expect(useUIStore.getState().showUserManual).toBe(false);
    
    useUIStore.getState().setShowUserManual(true);
    expect(useUIStore.getState().showUserManual).toBe(true);
    
    useUIStore.getState().setShowUserManual(false);
    expect(useUIStore.getState().showUserManual).toBe(false);
  });

  it("should set pending visit", () => {
    useUIStore.getState().setPendingVisit("visit-123");
    expect(useUIStore.getState().pendingVisitId).toBe("visit-123");
    
    useUIStore.getState().setPendingVisit(null);
    expect(useUIStore.getState().pendingVisitId).toBeNull();
  });
});
