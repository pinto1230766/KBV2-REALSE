import { describe, it, expect, beforeEach } from "vitest";
import { useVisitStore } from "../store/useVisitStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useHostStore } from "../store/useHostStore";
import type { Visit, Speaker, Host } from "../store/visitTypes";

describe("Workflow Integration Test", () => {
  beforeEach(() => {
    // Clear all stores before each test
    useVisitStore.getState().setVisits([]);
    useSpeakerStore.getState().setSpeakers([]);
    useHostStore.getState().setHosts([]);
  });

  it("should handle a complete visit planning workflow", () => {
    // 1. Setup entities
    const speaker: Speaker = {
      id: "spk-1",
      nom: "Jean Intervenant",
      congregation: "Lyon Nord",
      telephone: "0601020304"
    };
    
    const host: Host = {
      id: "hst-1",
      nom: "Famille Accueil",
      telephone: "0611223344",
      adresse: "10 Rue de la Joie, Lyon",
      role: "hebergement"
    };

    useSpeakerStore.getState().addSpeaker(speaker);
    useHostStore.getState().addHost(host);

    expect(useSpeakerStore.getState().speakers).toHaveLength(1);
    expect(useHostStore.getState().hosts).toHaveLength(1);

    // 2. Create a visit linked to the speaker
    const visit: Visit = {
      visitId: "vst-1",
      nom: speaker.nom,
      congregation: speaker.congregation,
      visitDate: "2026-06-20",
      status: "scheduled",
      talkNoOrType: "45",
      talkTheme: "Vivre avec espoir",
      locationType: "kingdom_hall",
      speakerPhone: speaker.telephone,
      hostAssignments: []
    };

    useVisitStore.getState().addVisit(visit);
    expect(useVisitStore.getState().visits).toHaveLength(1);

    // 3. Assign host to the visit
    const updatedVisit: Partial<Visit> = {
      hostAssignments: [
        {
          hostId: host.id,
          hostName: host.nom,
          hostPhone: host.telephone,
          role: "hebergement" as const
        }
      ]
    };

    useVisitStore.getState().updateVisit(visit.visitId, updatedVisit);

    // 4. Verify end-to-end data integrity
    const finalVisit = useVisitStore.getState().visits[0];
    expect(finalVisit.nom).toBe("Jean Intervenant");
    expect(finalVisit.hostAssignments).toHaveLength(1);
    expect(finalVisit.hostAssignments![0].hostId).toBe("hst-1");
    expect(finalVisit.hostAssignments![0].hostName).toBe("Famille Accueil");

    // 5. Simulate deleting a speaker (should not automatically delete visit, but we can check existence)
    useSpeakerStore.getState().deleteSpeaker("spk-1");
    expect(useSpeakerStore.getState().speakers).toHaveLength(0);
    expect(useVisitStore.getState().visits).toHaveLength(1); // Visit remains for history
  });
});
