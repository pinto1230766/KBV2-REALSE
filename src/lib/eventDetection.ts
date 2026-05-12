import type { Visit } from "../store/visitTypes";
import { normalizeName } from "./dedup";

/**
 * Mots-clés (forme normalisée: minuscules, sans accents) qui identifient
 * un événement (congrès, assemblée, visite COC, semaine spéciale…) ne
 * nécessitant pas de plan d'hôtes/repas/transport.
 */
export const EVENT_KEYWORDS = [
  // Assemblées (FR "assemblée" → "assemblee", PT/CV)
  "assemble", "asenbleia", "assembleia",
  // Réunions / runions
  "runion", "reuniao", "reunion",
  // Visites COC
  "visita", "superintendente",
  // Commémoration
  "komemorason", "comemoracao",
  // Congrès
  "congresso", "kongresu",
  // Béthel / filiale
  "betel", "filial",
  // Siège mondial
  "sedi mundial", "sede mundial",
  // Représentant
  "reprizentanti", "representante",
] as const;

/** Detects events (congress, special weeks, circuit overseer visits) that don't need a host plan. */
export function isEventName(nom: string | undefined | null): boolean {
  if (!nom) return false;
  const norm = normalizeName(nom);
  return EVENT_KEYWORDS.some((k) => norm.includes(k));
}

export function isEventVisit(v: Pick<Visit, "isEvent" | "nom" | "talkNoOrType"> | null | undefined): boolean {
  if (!v) return false;
  if (v.isEvent) return true;
  const hasTalkNumber = !!(v.talkNoOrType && /^\d/.test(v.talkNoOrType.trim()));
  if (hasTalkNumber) return false;
  return isEventName(v.nom);
}
