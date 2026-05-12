import { useSettingsStore } from "../store/useSettingsStore";
import type { Language } from "../store/visitTypes";
import type { TranslationEntry } from "./translations/types";
import { entries as commonEntries } from "./translations/common";
import { entries as domainEntries } from "./translations/domain";
import { entries as helpEntries } from "./translations/help";

const dictionary: Record<string, TranslationEntry> = {
  ...commonEntries,
  ...domainEntries,
  ...helpEntries,
};

type PluralKey = string;

export function useTranslation() {
  const language = useSettingsStore((s) => s.settings.language);

  const t = (key: string): string => {
    const entry = dictionary[key];
    if (!entry) return key;
    return entry[language as keyof TranslationEntry] || entry.fr || key;
  };

  /**
   * Pluralised translate. Looks up `${key}_one` / `${key}_other` and falls back
   * to `key` when variants are missing. Uses Intl.PluralRules.
   */
  const tn = (key: PluralKey, count: number): string => {
    const locale = language === "pt" ? "pt-PT" : language === "cv" ? "pt-CV" : "fr-FR";
    let rule: Intl.LDMLPluralRule = "other";
    try { rule = new Intl.PluralRules(locale).select(count); } catch { /* noop */ }
    if (count === 0) rule = "other";
    const variantKey = `${key}_${rule}`;
    const fallbackKey = `${key}_other`;
    const result = (dictionary[variantKey] || dictionary[fallbackKey] || dictionary[key]);
    if (!result) return `${count} ${key}`;
    const text = result[language as keyof TranslationEntry] || result.fr || key;
    return text.replace("{count}", String(count));
  };

  return { t, tn, language: language as Language };
}
