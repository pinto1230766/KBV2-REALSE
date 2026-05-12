import { describe, it, expect } from "vitest";
import { resolveVariables } from "./variableResolver";
import type { Visit, Speaker, CongregationProfile, HostAssignment } from "../store/visitTypes";

const fmtFull = (s?: string) => (s ? `D:${s}` : "___");
const fmtDay = (s?: string) => (s ? `J:${s}` : "___");
const t = (k: string) => k;

function makeCtx(overrides: {
  visit?: Partial<Visit>;
  detail?: Partial<Visit>;
  speakers?: Speaker[];
  congregation?: Partial<CongregationProfile>;
  templateLang?: "fr" | "cv" | "pt";
}) {
  const visit: Visit = {
    visitId: "v1",
    nom: "Jean Dupont",
    congregation: "Lyon",
    visitDate: "2026-06-01",
    locationType: "kingdom_hall",
    status: "scheduled",
    talkNoOrType: "42",
    talkTheme: "Espérance",
    speakerPhone: "0600000000",
    ...overrides.visit,
  };
  return {
    viewVisit: visit,
    detailForm: { ...visit, ...overrides.detail } as Partial<Visit>,
    templateLang: overrides.templateLang || ("fr" as const),
    speakers: overrides.speakers || [],
    congregation: { responsableName: "Marc", responsablePhone: "0611", time: "11:30", ...overrides.congregation } as CongregationProfile,
    formatDateFull: fmtFull,
    formatDayOnly: fmtDay,
    t,
  };
}

describe("resolveVariables", () => {
  it("substitutes basic speaker/visit variables", () => {
    const out = resolveVariables(
      "{prenom_orateur} {nom_orateur} – {congregation_orateur} – {tel_orateur} – {date_visite} – {numero_discours} – {theme_discours}",
      makeCtx({})
    );
    expect(out).toBe("Jean Dupont – Lyon – 0600000000 – D:2026-06-01 – 42 – Espérance");
  });

  it("returns 'Aucune' for empty allergies and accompagnants in FR", () => {
    const out = resolveVariables("{allergies_orateur}|{noms_accompagnants}|{nb_accompagnants}", makeCtx({}));
    expect(out).toBe("Aucune|Aucune|0");
  });

  it("localizes 'Aucun' in cv and pt", () => {
    expect(resolveVariables("{allergies_orateur}", makeCtx({ templateLang: "cv" }))).toBe("Ninhun");
    expect(resolveVariables("{allergies_orateur}", makeCtx({ templateLang: "pt" }))).toBe("Nenhuma");
  });

  it("computes total people: speaker + spouse + children + companions", () => {
    const speaker: Speaker = { id: "s1", nom: "Jean Dupont", congregation: "Lyon", householdType: "couple", spouseName: "Marie", childrenCount: 2 };
    const out = resolveVariables("{nb_total_personnes}", makeCtx({
      speakers: [speaker],
      detail: { companions: [{ id: "c1", nom: "Paul" }] },
    }));
    expect(out).toBe("5");
  });

  it("renders host details with phone, address and maps URL", () => {
    const ha: HostAssignment = { role: "hebergement", hostName: "Alice", hostPhone: "0622", hostAddress: "1 rue X", day: "2026-06-01", time: "20:00" };
    const out = resolveVariables("{hebergement_details}", makeCtx({ detail: { hostAssignments: [ha] } }));
    expect(out).toContain("Alice");
    expect(out).toContain("D:2026-06-01");
    expect(out).toContain("20:00");
    expect(out).toContain("0622");
    expect(out).toContain("1 rue X");
    expect(out).toContain("https://www.google.com/maps/search/?api=1&query=");
  });

  it("returns 'Non défini' for empty host section", () => {
    expect(resolveVariables("{hebergement_details}", makeCtx({}))).toBe("Non défini");
  });

  it("sorts host assignments by day+time ascending", () => {
    const has: HostAssignment[] = [
      { role: "repas", hostName: "B", day: "2026-06-02", time: "12:00" },
      { role: "repas", hostName: "A", day: "2026-06-01", time: "20:00" },
    ];
    const out = resolveVariables("{repas_planning}", makeCtx({ detail: { hostAssignments: has } }));
    const idxA = out.indexOf("A");
    const idxB = out.indexOf("B");
    expect(idxA).toBeGreaterThanOrEqual(0);
    expect(idxA).toBeLessThan(idxB);
  });

  it("conditional question_enfants_block shown only when no children", () => {
    const speakerWith: Speaker = { id: "s1", nom: "Jean Dupont", congregation: "Lyon", childrenCount: 1 };
    expect(resolveVariables("{question_enfants_block}", makeCtx({}))).not.toBe("");
    expect(resolveVariables("{question_enfants_block}", makeCtx({ speakers: [speakerWith] }))).toBe("");
  });

  it("collapses 3+ consecutive newlines to 2", () => {
    const out = resolveVariables("a\n\n\n\nb", makeCtx({}));
    expect(out).toBe("a\n\nb");
  });

  it("uses congregation responsable for {ton_nom} and {mon_tel}", () => {
    const out = resolveVariables("{ton_nom}|{mon_tel}", makeCtx({}));
    expect(out).toBe("Marc|0611");
  });

  it("location label adapts to locationType and templateLang", () => {
    expect(resolveVariables("{location}", makeCtx({ detail: { locationType: "kingdom_hall" } }))).toBe("Salle du Royaume");
    expect(resolveVariables("{location}", makeCtx({ detail: { locationType: "kingdom_hall" }, templateLang: "cv" }))).toBe("Salon di Reinu");
    expect(resolveVariables("{location}", makeCtx({ detail: { locationType: "zoom" } }))).toBe("Zoom");
  });
});
