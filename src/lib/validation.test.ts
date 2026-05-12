import { describe, it, expect } from "vitest";
import { safeParseBackup } from "./validation";

describe("safeParseBackup", () => {
  it("devrait accepter un backup valide", () => {
    const payload = {
      speakers: [{ id: "1", nom: "Dupont", congregation: "Lyon" }],
      visits: [],
      hosts: []
    };
    const result = safeParseBackup(payload);
    expect(result.ok).toBe(true);
    expect(result.data.speakers).toHaveLength(1);
  });

  it("devrait ignorer les éléments malformés mais garder les bons", () => {
    const payload = {
      speakers: [
        { id: "1", nom: "Valide", congregation: "A" },
        { nom: "Invalide (pas d'ID)" }
      ]
    };
    const result = safeParseBackup(payload);
    expect(result.ok).toBe(true);
    expect(result.data.speakers).toHaveLength(1);
    expect(result.dropped.speakers).toBe(1);
  });
});