import { describe, it, expect } from "vitest";
import { mergeSpeakers, normalizeName } from "./dedup";
import type { Speaker } from "../store/visitTypes";

describe("Deduplication & Merge Logic", () => {
  it("devrait normaliser les noms correctement", () => {
    expect(normalizeName("  Jean-Luc  ")).toBe("jean-luc");
    expect(normalizeName("Émilie")).toBe("emilie"); // Test accents
  });

  it("devrait fusionner deux versions d'un orateur (le plus récent gagne)", () => {
    const local: Speaker = {
      id: "1",
      nom: "Jean Dupont",
      congregation: "Lyon",
      updatedAt: "2023-01-01T10:00:00Z"
    };
    const remote: Speaker = {
      id: "1",
      nom: "Jean Dupont",
      congregation: "Lyon Nord", // Changement
      updatedAt: "2023-01-01T11:00:00Z" // Plus récent
    };

    const result = mergeSpeakers([local], [remote]);
    expect(result[0].congregation).toBe("Lyon Nord");
  });

  it("devrait conserver les champs définis si le gagnant ne les a pas", () => {
    const local: Speaker = {
      id: "1",
      nom: "Jean Dupont",
      congregation: "Lyon",
      telephone: "0600000000",
      updatedAt: "2023-01-01T10:00:00Z"
    };
    const remote: Speaker = {
      id: "1",
      nom: "Jean Dupont",
      congregation: "Lyon",
      updatedAt: "2023-01-01T11:00:00Z"
    };
    const result = mergeSpeakers([local], [remote]);
    expect(result[0].telephone).toBe("0600000000");
  });
});