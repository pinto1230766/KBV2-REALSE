import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTranslation } from "./useTranslation";
import { useSettingsStore } from "../store/useSettingsStore";

describe("useTranslation - Pluriels", () => {
  it("devrait retourner le singulier pour 1 et le pluriel pour 0 ou 2 en Français", () => {
    useSettingsStore.getState().setLanguage("fr");
    const { result } = renderHook(() => useTranslation());
    
    // En français, 0 est souvent pluriel dans les outils de traduction (0 visites)
    expect(result.current.tn("visit", 1)).toContain("visite");
    expect(result.current.tn("visit", 1)).not.toContain("visites");
    
    expect(result.current.tn("visit", 0)).toContain("visites");
    expect(result.current.tn("visit", 2)).toContain("visites");
  });
});