import { describe, it, expect } from "vitest";
import { resolveVariables } from "./variableResolver";
import type { Visit, Speaker, CongregationProfile } from "../store/visitTypes";

describe("variableResolver", () => {
  const mockVisit: Visit = {
    visitId: "v1",
    nom: "Jean Dupont",
    congregation: "Paris Centre",
    visitDate: "2026-06-15",
    heure_visite: "10:30",
    locationType: "kingdom_hall",
    status: "scheduled",
    talkNoOrType: "45",
    talkTheme: "Vivre avec espoir",
    hostAssignments: [
      { hostId: "h1", hostName: "Famille Martin", role: "hebergement" }
    ],
    updatedAt: new Date().toISOString(),
  };

  const mockCongregation: CongregationProfile = {
    name: "Paris Centre",
    responsableName: "Admin",
    responsablePhone: "0102030405",
  };

  const mockCtx = {
    viewVisit: mockVisit,
    detailForm: mockVisit,
    templateLang: "fr" as const,
    speakers: [] as Speaker[],
    congregation: mockCongregation,
    formatDateFull: (s?: string) => s || "",
    formatDayOnly: (s?: string) => s || "",
    t: (key: string) => key,
  };

  it("should resolve basic variables like name and congregation", () => {
    const template = "Bonjour {prenom_orateur}, votre visite à {congregation} est prévue.";
    const result = resolveVariables(template, mockCtx);
    expect(result).toContain("Bonjour Jean");
    expect(result).toContain("Paris Centre");
  });

  it("should resolve date and time variables", () => {
    const template = "Date: {date_visite}, Heure: {heure_visite}";
    const result = resolveVariables(template, mockCtx);
    expect(result).toContain("2026-06-15");
    expect(result).toContain("10:30");
  });

  it("should resolve host information", () => {
    const template = "Hébergement: {nom_hebergeur}";
    const result = resolveVariables(template, mockCtx);
    expect(result).toContain("Famille Martin");
  });

  it("should handle missing host information gracefully", () => {
    const ctxWithoutHost = { 
      ...mockCtx, 
      detailForm: { ...mockVisit, hostAssignments: [] } 
    };
    const template = "Hébergement: {nom_hebergeur}";
    const result = resolveVariables(template, ctxWithoutHost);
    expect(result).toContain("___");
  });

  it("should resolve theme and talk number", () => {
    const template = "Thème: {theme_discours}, N°: {numero_discours}";
    const result = resolveVariables(template, mockCtx);
    expect(result).toContain("Vivre avec espoir");
    expect(result).toContain("45");
  });

  it("should handle emojis or special characters if present in template", () => {
    const template = "Salut ! \u{1F600} {prenom_orateur}";
    const result = resolveVariables(template, mockCtx);
    expect(result).toContain("\u{1F600} Jean");
  });
});

