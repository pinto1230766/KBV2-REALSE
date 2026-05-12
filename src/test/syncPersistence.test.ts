import { describe, it, expect, beforeEach } from "vitest";
import { useVisitStore } from "../store/useVisitStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useHostStore } from "../store/useHostStore";
import { mergeVisits, mergeSpeakers, mergeHosts } from "../lib/dedup";
import type { Visit, Speaker, Host } from "../store/visitTypes";

/**
 * End-to-end persistence tests.
 *
 * Scenario reproduced for each entity (Speaker / Host / Visit):
 *  1. The user creates the entity locally (initial state, e.g. "couple").
 *  2. The cloud receives that version (simulated).
 *  3. The user edits the entity locally (e.g. switches to "single",
 *     clears spouseName) → updatedAt becomes NOW.
 *  4. An automatic Supabase pull returns the OLDER cloud copy
 *     (and possibly a duplicate row with the same name).
 *  5. We feed the pulled rows into the store via setX (mimicking syncCloud).
 *  6. We read the store back (mimicking the user closing & re-opening the
 *     screen, since the Zustand store is the single source of truth that
 *     the UI re-mounts from).
 *
 * The local edit MUST survive every step.
 */

const HOUR_AGO = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const NOW = () => new Date().toISOString();

function resetStores() {
  useVisitStore.setState({ visits: [] });
  useSpeakerStore.setState({ speakers: [] });
  useHostStore.setState({ hosts: [] });
}

describe("End-to-end sync persistence", () => {
  beforeEach(() => {
    resetStores();
  });

  describe("Speaker edits survive a Supabase pull", () => {
    it("keeps householdType change from couple → single after pull + reopen", () => {
      // 1. Initial local entry — speaker is a couple.
      const initial: Speaker = {
        id: "spk-1",
        nom: "Jean Dupont",
        congregation: "Paris Centre",
        telephone: "+33 6 12 34 56 78",
        householdType: "couple",
        spouseName: "Marie Dupont",
        updatedAt: HOUR_AGO,
      };
      useSpeakerStore.getState().addSpeaker(initial);

      // 3. User edits → switches to single, clears spouseName.
      useSpeakerStore.getState().updateSpeaker("spk-1", {
        householdType: "single",
        spouseName: "",
      });

      // Sanity: the local edit is in store.
      const afterEdit = useSpeakerStore.getState().speakers.find((s) => s.id === "spk-1");
      expect(afterEdit?.householdType).toBe("single");
      expect(afterEdit?.spouseName).toBe("");

      // 4. Supabase pull returns the OLDER cloud copy (still "couple").
      //    Plus a duplicate row from the cloud with a different id but
      //    same normalized name (this used to overwrite local edits).
      const remoteOld: Speaker = {
        id: "remote-uuid-1",
        nom: "Jean Dupont",
        congregation: "Paris Centre",
        telephone: "+33 6 12 34 56 78",
        householdType: "couple",
        spouseName: "Marie Dupont",
        updatedAt: HOUR_AGO,
      };
      const remoteDuplicate: Speaker = {
        id: "remote-uuid-2",
        nom: "  Jean   Dupont  ", // whitespace variant — same key
        congregation: "Paris Centre",
        householdType: "couple",
        spouseName: "Marie Dupont",
        updatedAt: HOUR_AGO,
      };

      // 5. Mimic syncCloud: merge local first, remote after.
      const local = useSpeakerStore.getState().speakers;
      const merged = mergeSpeakers(local, [remoteOld, remoteDuplicate]);
      useSpeakerStore.getState().setSpeakers(merged);

      // 6. Reopen the screen — read fresh from store.
      const reopened = useSpeakerStore.getState().speakers;
      const target = reopened.find((s) => s.nom.trim().toLowerCase() === "jean dupont");

      expect(reopened).toHaveLength(1); // duplicates collapsed
      expect(target?.householdType).toBe("single");
      expect(target?.spouseName).toBe("");
    });

    it("does NOT lose the local edit when the remote duplicate has the SAME timestamp", () => {
      const ts = NOW();

      const local: Speaker = {
        id: "spk-2",
        nom: "Pierre Martin",
        congregation: "Lyon",
        householdType: "single",
        notes: "Local note (edited)",
        updatedAt: ts,
      };
      useSpeakerStore.getState().addSpeaker(local);

      const remoteSameTs: Speaker = {
        id: "remote-uuid-3",
        nom: "Pierre Martin",
        congregation: "Lyon",
        householdType: "couple", // stale value
        notes: "Old remote note",
        updatedAt: ts,
      };

      const merged = mergeSpeakers(useSpeakerStore.getState().speakers, [remoteSameTs]);
      useSpeakerStore.getState().setSpeakers(merged);

      const reopened = useSpeakerStore.getState().speakers[0];
      // On equality, local (passed first) must win.
      expect(reopened.householdType).toBe("single");
      expect(reopened.notes).toBe("Local note (edited)");
    });

    it("accepts a strictly newer remote update when local is older", () => {
      const local: Speaker = {
        id: "spk-3",
        nom: "Old Local",
        congregation: "Marseille",
        householdType: "single",
        updatedAt: HOUR_AGO,
      };
      useSpeakerStore.getState().addSpeaker(local);
      // overwrite the auto-bumped updatedAt to keep it old
      useSpeakerStore.setState({
        speakers: useSpeakerStore.getState().speakers.map((s) =>
          s.id === "spk-3" ? { ...s, updatedAt: HOUR_AGO } : s
        ),
      });

      const remoteNewer: Speaker = {
        id: "remote-uuid-4",
        nom: "Old Local",
        congregation: "Marseille",
        householdType: "couple",
        spouseName: "New Spouse",
        updatedAt: NOW(),
      };

      const merged = mergeSpeakers(useSpeakerStore.getState().speakers, [remoteNewer]);
      useSpeakerStore.getState().setSpeakers(merged);

      const reopened = useSpeakerStore.getState().speakers[0];
      expect(reopened.householdType).toBe("couple");
      expect(reopened.spouseName).toBe("New Spouse");
    });
  });

  describe("Host edits survive a Supabase pull", () => {
    it("keeps locally-cleared address after pull + reopen", () => {
      const initial: Host = {
        id: "host-1",
        nom: "Famille Bernard",
        telephone: "+33 6 11 22 33 44",
        adresse: "12 rue Ancienne",
        capacity: 2,
        updatedAt: HOUR_AGO,
      };
      useHostStore.getState().addHost(initial);

      // User updates address and capacity.
      useHostStore.getState().updateHost("host-1", {
        adresse: "99 rue Nouvelle",
        capacity: 4,
      });

      const remoteOld: Host = {
        id: "remote-host-uuid",
        nom: "Famille Bernard",
        telephone: "+33 6 11 22 33 44",
        adresse: "12 rue Ancienne",
        capacity: 2,
        updatedAt: HOUR_AGO,
      };

      const merged = mergeHosts(useHostStore.getState().hosts, [remoteOld]);
      useHostStore.getState().setHosts(merged);

      const reopened = useHostStore.getState().hosts[0];
      expect(reopened.adresse).toBe("99 rue Nouvelle");
      expect(reopened.capacity).toBe(4);
    });
  });

  describe("Visit edits survive a Supabase pull", () => {
    it("keeps status change scheduled → confirmed and cleared notes after pull", () => {
      const initial: Visit = {
        visitId: "v-1",
        nom: "Jean Dupont",
        congregation: "Paris Centre",
        visitDate: "2026-05-10",
        status: "scheduled",
        talkNoOrType: "1",
        talkTheme: "Theme initial",
        notes: "Anciennes notes",
        locationType: "kingdom_hall",
        updatedAt: HOUR_AGO,
      };
      useVisitStore.getState().addVisit(initial);

      // User confirms the visit, clears the notes, picks Zoom.
      useVisitStore.getState().updateVisit("v-1", {
        status: "confirmed",
        notes: "",
        locationType: "zoom",
      });

      const remoteOld: Visit = {
        visitId: "remote-visit-uuid",
        nom: "Jean Dupont",
        congregation: "Paris Centre",
        visitDate: "2026-05-10", // same name + same date → same key
        status: "scheduled",
        talkNoOrType: "1",
        talkTheme: "Theme initial",
        notes: "Anciennes notes",
        locationType: "kingdom_hall",
        updatedAt: HOUR_AGO,
      };

      const merged = mergeVisits(useVisitStore.getState().visits, [remoteOld]);
      useVisitStore.getState().setVisits(merged);

      const reopened = useVisitStore.getState().visits;
      expect(reopened).toHaveLength(1);
      expect(reopened[0].status).toBe("confirmed");
      expect(reopened[0].notes).toBe("");
      expect(reopened[0].locationType).toBe("zoom");
    });

    it("keeps host assignments edited locally even if cloud has an older empty list", () => {
      const initial: Visit = {
        visitId: "v-2",
        nom: "Marie Pierre",
        congregation: "Lyon",
        visitDate: "2026-06-01",
        status: "scheduled",
        talkNoOrType: "5",
        locationType: "kingdom_hall",
        hostAssignments: [],
        updatedAt: HOUR_AGO,
      };
      useVisitStore.getState().addVisit(initial);

      useVisitStore.getState().updateVisit("v-2", {
        hostAssignments: [
          { hostId: "h1", hostName: "Famille A", role: "hebergement" },
          { hostId: "h2", hostName: "Famille B", role: "repas" },
        ],
      });

      const remoteOld: Visit = {
        visitId: "remote-uuid-v2",
        nom: "Marie Pierre",
        congregation: "Lyon",
        visitDate: "2026-06-01",
        status: "scheduled",
        talkNoOrType: "5",
        locationType: "kingdom_hall",
        hostAssignments: [],
        updatedAt: HOUR_AGO,
      };

      const merged = mergeVisits(useVisitStore.getState().visits, [remoteOld]);
      useVisitStore.getState().setVisits(merged);

      const reopened = useVisitStore.getState().visits[0];
      expect(reopened.hostAssignments).toHaveLength(2);
      expect(reopened.hostAssignments?.[0].hostName).toBe("Famille A");
    });
  });

  describe("Multiple sync cycles do not regress edits", () => {
    it("survives two consecutive pulls of stale remote data", () => {
      const speaker: Speaker = {
        id: "spk-multi",
        nom: "Sophie Laurent",
        congregation: "Bordeaux",
        householdType: "couple",
        spouseName: "Paul",
        updatedAt: HOUR_AGO,
      };
      useSpeakerStore.getState().addSpeaker(speaker);

      useSpeakerStore.getState().updateSpeaker("spk-multi", {
        householdType: "single",
        spouseName: "",
      });

      const stale: Speaker = {
        id: "remote-multi",
        nom: "Sophie Laurent",
        congregation: "Bordeaux",
        householdType: "couple",
        spouseName: "Paul",
        updatedAt: HOUR_AGO,
      };

      // Pull #1
      let merged = mergeSpeakers(useSpeakerStore.getState().speakers, [stale]);
      useSpeakerStore.getState().setSpeakers(merged);
      // Pull #2 (the autosync interval)
      merged = mergeSpeakers(useSpeakerStore.getState().speakers, [stale]);
      useSpeakerStore.getState().setSpeakers(merged);

      const reopened = useSpeakerStore.getState().speakers[0];
      expect(reopened.householdType).toBe("single");
      expect(reopened.spouseName).toBe("");
    });
  });
});
