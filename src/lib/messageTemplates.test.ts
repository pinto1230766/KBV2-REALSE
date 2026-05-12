import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { messageTemplates, type TemplateEntry } from "./messageTemplates";

// Lit les variables connues directement dans le source du resolver pour
// éviter d'avoir à instancier un contexte complet.
const resolverSrc = readFileSync(
  resolve(__dirname, "./variableResolver.ts"),
  "utf8"
);
const KNOWN_VARS = new Set<string>(
  Array.from(resolverSrc.matchAll(/"\{([a-zA-Z0-9_]+)\}"\s*:/g)).map((m) => `{${m[1]}}`)
);

const LANGS = ["fr", "cv", "pt"] as const;

describe("messageTemplates – complétude", () => {
  it("expose au moins quelques templates", () => {
    expect(Object.keys(messageTemplates).length).toBeGreaterThan(5);
  });

  it("chaque template définit les 3 langues avec title/desc/body non vides", () => {
    for (const [key, tpl] of Object.entries(messageTemplates) as [string, TemplateEntry][]) {
      expect(tpl.category, `${key}: catégorie manquante`).toBeTruthy();
      for (const lang of LANGS) {
        const entry = tpl[lang];
        expect(entry, `${key}.${lang} manquant`).toBeTruthy();
        expect(entry.title.trim(), `${key}.${lang}.title vide`).not.toBe("");
        expect(entry.desc.trim(), `${key}.${lang}.desc vide`).not.toBe("");
        expect(entry.body.trim(), `${key}.${lang}.body vide`).not.toBe("");
      }
    }
  });

  it("toutes les variables {xxx} utilisées dans les templates existent dans variableResolver", () => {
    const unknown = new Set<string>();
    for (const [key, tpl] of Object.entries(messageTemplates) as [string, TemplateEntry][]) {
      for (const lang of LANGS) {
        const body = tpl[lang].body;
        const refs = body.match(/\{[a-zA-Z0-9_]+\}/g) || [];
        for (const ref of refs) {
          if (!KNOWN_VARS.has(ref)) unknown.add(`${key}.${lang} → ${ref}`);
        }
      }
    }
    expect([...unknown]).toEqual([]);
  });
});
