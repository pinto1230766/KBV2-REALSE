import { test, expect } from "@playwright/test";

test.describe("Paramètres et Localisation", () => {
  test("doit changer la langue de l'interface dynamiquement", async ({ page }) => {
    await page.goto("/?tab=settings");
    
    // Sauter l'onboarding
    const skip = page.getByRole("button", { name: /passer|skip|terminer/i });
    if (await skip.isVisible().catch(() => false)) await skip.click();

    // Vérifier le titre en Français
    await expect(page.getByText("Paramètres")).toBeVisible();

    // Changer la langue pour le Portugais (pt)
    // On assume que le label contient "Langue" ou "Language"
    await page.getByLabel(/langue|language/i).selectOption("pt");

    // Vérifier que le titre a changé en Portugais (Configurações)
    await expect(page.getByText("Configurações")).toBeVisible();
  });
});