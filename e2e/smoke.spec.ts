import { test, expect, type Page } from "@playwright/test";

/**
 * Smoke tests — vérifient que l'app démarre et que les écrans clés
 * sont accessibles sans crash. Étendre au fur et à mesure.
 */

test.describe("KBV smoke", () => {
  test("the shell loads and renders the logo", async ({ page }: { page: Page }) => {
    await page.goto("/");
    // Splash or onboarding may appear; the global shell always contains "KBV".
    await expect(page.locator("text=KBV").first()).toBeVisible({ timeout: 10_000 });
  });

  test("Cmd+K focuses the global search", async ({ page, browserName }: { page: Page, browserName: string }) => {
    await page.goto("/");
    // Skip onboarding if present
    const skip = page.getByRole("button", { name: /passer|skip|terminer/i });
    if (await skip.isVisible().catch(() => false)) await skip.click();

    const modifier = browserName === "webkit" ? "Meta" : "Control";
    await page.keyboard.press(`${modifier}+KeyK`);
    const search = page.locator("#kbv-global-search");
    await expect(search).toBeFocused();
  });

  test("navigation to speakers page works", async ({ page }: { page: Page }) => {
    await page.goto("/");
    
    // On saute l'onboarding si nécessaire
    const skip = page.getByRole("button", { name: /passer|skip|terminer/i });
    if (await skip.isVisible().catch(() => false)) await skip.click();

    // Clic sur l'onglet Orateurs (basé sur le texte traduit ou le rôle)
    await page.getByRole("button", { name: /orateurs|speakers/i }).click();
    await expect(page).toHaveURL(/.*tab=speakers/);
  });
});
