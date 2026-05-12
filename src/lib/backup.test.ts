import { describe, it, expect, beforeEach } from "vitest";
import { findDuplicates, deleteFromAllStores, type BackupData } from "./backup";
import { useVisitStore } from "../store/useVisitStore";
import { useSpeakerStore } from "../store/useSpeakerStore";
import { useHostStore } from "../store/useHostStore";
import { safeParseBackup } from "./validation";
import type { Visit, Speaker, Host } from "../store/visitTypes";

const resetStores = () => {
  useVisitStore.setState({ visits: [] });
  useSpeakerStore.setState({ speakers: [] });
  useHostStore.setState({ hosts: [] });
};

describe("findDuplicates", () => {
  it("repère les visites dupliquées (même clé métier)", () => {
    const visits: Visit[] = [
      { visitId: "v1", nom: "Jean Dupont", congregation: "Lyon", visitDate: "2030-01-01", status: "scheduled", talkNoOrType: "1", locationType: "kingdom_hall", notes: "" },
      { visitId: "v2", nom: "JEAN DUPONT", congregation: "Lyon", visitDate: "2030-01-01", status: "scheduled", talkNoOrType: "1", locationType: "kingdom_hall", notes: "" },
    ];
    const dups = findDuplicates(visits, [], []);
    expect(dups).toHaveLength(1);
    expect(dups[0].type).toBe("visit");
    expect(dups[0].ids.sort()).toEqual(["v1", "v2"]);
  });

  it("retourne tableau vide quand pas de doublons", () => {
    const speakers: Speaker[] = [
      { id: "s1", nom: "A", congregation: "X" },
      { id: "s2", nom: "B", congregation: "X" },
    ];
    expect(findDuplicates([], speakers, [])).toEqual([]);
  });

  it("repère les hôtes dupliqués", () => {
    const hosts: Host[] = [
      { id: "h1", nom: "Marc", telephone: "+33600000001", role: "hebergement" },
      { id: "h2", nom: "MARC ", telephone: "+33600000001", role: "hebergement" },
    ];
    const dups = findDuplicates([], [], hosts);
    expect(dups).toHaveLength(1);
    expect(dups[0].type).toBe("host");
  });
});

describe("deleteFromAllStores", () => {
  beforeEach(resetStores);

  it("supprime les entités correspondantes dans chaque store", () => {
    useVisitStore.getState().addVisit({
      visitId: "v1", nom: "X", congregation: "Y", visitDate: "2030-01-01",
      status: "scheduled", talkNoOrType: "1", locationType: "kingdom_hall", notes: "",
    });
    useSpeakerStore.getState().addSpeaker({ id: "s1", nom: "Speaker", congregation: "Z" });
    useHostStore.getState().addHost({ id: "h1", nom: "Host", telephone: "+33600000000", role: "hebergement" });

    deleteFromAllStores(["v1", "s1", "h1"]);

    expect(useVisitStore.getState().visits).toHaveLength(0);
    expect(useSpeakerStore.getState().speakers).toHaveLength(0);
    expect(useHostStore.getState().hosts).toHaveLength(0);
  });

  it("n'échoue pas sur des IDs inconnus", () => {
    expect(() => deleteFromAllStores(["does-not-exist"])).not.toThrow();
  });
});

describe("Backup round-trip via safeParseBackup", () => {
  it("préserve un payload bien formé (visits/speakers/hosts)", () => {
    const payload: BackupData = {
      visits: [{ visitId: "v1", nom: "Jean", congregation: "Lyon", visitDate: "2030-05-01", status: "scheduled", talkNoOrType: "1", locationType: "kingdom_hall", notes: "" }],
      speakers: [{ id: "s1", nom: "Jean", congregation: "Paris" }],
      hosts: [{ id: "h1", nom: "Marc", telephone: "+33600000000", role: "hebergement" }],
      exportedAt: new Date().toISOString(),
    };
    const json = JSON.parse(JSON.stringify(payload));
    const parsed = safeParseBackup(json);
    expect(parsed.ok).toBe(true);
    expect(parsed.data.visits).toHaveLength(1);
    expect(parsed.data.speakers).toHaveLength(1);
    expect(parsed.data.hosts).toHaveLength(1);
  });
});
