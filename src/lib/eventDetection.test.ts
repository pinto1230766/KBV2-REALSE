import { describe, it, expect } from "vitest";
import { isEventName, isEventVisit } from "./eventDetection";

describe("isEventName", () => {
  it("détecte les événements connus (FR/PT/CV)", () => {
    expect(isEventName("Assemblée régionale")).toBe(true);
    expect(isEventName("Assembleia de circuito")).toBe(true);
    expect(isEventName("Visita do superintendente")).toBe(true);
    expect(isEventName("Congresso 2026")).toBe(true);
    expect(isEventName("Komemorason")).toBe(true);
    expect(isEventName("Bétel — visite")).toBe(true);
  });

  it("retourne false pour un nom d'orateur normal", () => {
    expect(isEventName("Jean Dupont")).toBe(false);
    expect(isEventName("Maria Silva")).toBe(false);
  });

  it("gère null/undefined/empty", () => {
    expect(isEventName(null)).toBe(false);
    expect(isEventName(undefined)).toBe(false);
    expect(isEventName("")).toBe(false);
  });
});

describe("isEventVisit", () => {
  it("retourne true si isEvent est explicitement à true", () => {
    expect(isEventVisit({ isEvent: true, nom: "Jean Dupont", talkNoOrType: "" })).toBe(true);
  });

  it("retourne false si la visite a un numéro de discours, même avec un nom évoquant un événement", () => {
    expect(isEventVisit({ isEvent: false, nom: "Visita régulière", talkNoOrType: "42" })).toBe(false);
  });

  it("détecte un événement par mot-clé du nom quand pas de numéro de discours", () => {
    expect(isEventVisit({ isEvent: false, nom: "Congresso 2026", talkNoOrType: "" })).toBe(true);
  });

  it("retourne false pour null/undefined", () => {
    expect(isEventVisit(null)).toBe(false);
    expect(isEventVisit(undefined)).toBe(false);
  });
});
