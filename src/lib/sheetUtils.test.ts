import { describe, it, expect } from "vitest";
import { parseCSV, extractSheetInfo, parseSheetDate, parseRowsToData, generateId } from "./sheetUtils";

describe("generateId", () => {
  it("génère un identifiant non vide", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });
});

describe("parseCSV", () => {
  it("parse un CSV simple", () => {
    const rows = parseCSV("a,b,c\n1,2,3");
    expect(rows).toEqual([["a", "b", "c"], ["1", "2", "3"]]);
  });

  it("gère les guillemets et virgules échappés", () => {
    const rows = parseCSV('name,desc\n"Doe, John","Hello ""world"""');
    expect(rows[1]).toEqual(["Doe, John", 'Hello "world"']);
  });

  it("ignore les lignes entièrement vides", () => {
    const rows = parseCSV("a,b\n\n1,2");
    expect(rows).toHaveLength(2);
  });
});

describe("extractSheetInfo", () => {
  it("extrait id et gid d'une URL Google Sheets", () => {
    const info = extractSheetInfo(
      "https://docs.google.com/spreadsheets/d/abc123_XYZ/edit#gid=456"
    );
    expect(info).toEqual({ id: "abc123_XYZ", gid: "456" });
  });

  it("renvoie gid=0 par défaut", () => {
    const info = extractSheetInfo("https://docs.google.com/spreadsheets/d/abc/edit");
    expect(info?.gid).toBe("0");
  });

  it("retourne null pour une URL invalide", () => {
    expect(extractSheetInfo("https://example.com")).toBeNull();
  });
});

describe("parseSheetDate", () => {
  it("convertit DD/MM/YYYY en YYYY-MM-DD", () => {
    expect(parseSheetDate("05/03/2026")).toBe("2026-03-05");
    expect(parseSheetDate("9/1/2026")).toBe("2026-01-09");
  });

  it("renvoie tel quel si format inattendu", () => {
    expect(parseSheetDate("2026-03-05")).toBe("2026-03-05");
  });
});

describe("parseRowsToData", () => {
  it("crée des visites et déduplique les orateurs par nom normalisé", () => {
    const rows = [
      ["", "05/03/2030", "Jean Dupont", "Paris", "42", "Thème A"],
      ["", "12/04/2030", "JEAN  DUPONT", "Paris", "43", "Thème B"],
      ["", "19/04/2030", "Marie Curie", "Lyon", "12", "Thème C"],
    ];
    const { visits, speakers } = parseRowsToData(rows);
    expect(visits).toHaveLength(3);
    expect(speakers).toHaveLength(2);
    expect(visits[0].talkTheme).toBe("Thème A");
    expect(visits[0].status).toBe("scheduled");
  });

  it("ignore les lignes sans date valide ou sans orateur", () => {
    const rows = [
      ["", "no-date", "Jean", "X", "1", ""],
      ["", "01/01/2030", "", "X", "1", ""],
    ];
    const { visits, speakers } = parseRowsToData(rows);
    expect(visits).toHaveLength(0);
    expect(speakers).toHaveLength(0);
  });

  it("marque les événements (sans n°) et ne crée pas de speaker", () => {
    const rows = [
      ["", "01/01/2030", "Congresso régional", "—", "", ""],
    ];
    const { visits, speakers } = parseRowsToData(rows);
    expect(visits).toHaveLength(1);
    expect(visits[0].isEvent).toBe(true);
    expect(visits[0].talkNoOrType).toBe("event");
    expect(speakers).toHaveLength(0);
  });
});
