import { test, expect } from "@playwright/test";

/**
 * E2E Command Center (UI + API vía proxy Vite → 3100).
 *
 * Requisitos:
 * - API en BOPE_COMMAND_CENTER_API_URL (default http://127.0.0.1:3100)
 * - DB + .env del server configurados si el API no está ya levantado
 *
 * Credenciales: E2E_USERNAME / E2E_PASSWORD (default alineados con e2e.mjs del server)
 */
const E2E_USER = process.env.E2E_USERNAME ?? "operator";
const E2E_PASS = process.env.E2E_PASSWORD ?? "Santiago2026!";

test.describe.configure({ mode: "serial" });

test.describe("Command Center", () => {
  test("bootstrap o login y shell principal", async ({ page }) => {
    await page.goto("/");

    await page.waitForSelector(
      'button:has-text("CONFIGURAR ACCESO"), button:has-text("INGRESAR")',
      { timeout: 90_000 },
    );

    const bootstrap = page.getByRole("button", { name: "CONFIGURAR ACCESO" });
    const login = page.getByRole("button", { name: "INGRESAR" });

    if (await bootstrap.isVisible()) {
      await page.locator('input:not([type="password"])').first().fill(E2E_USER);
      await page.locator('input[type="password"]').nth(0).fill(E2E_PASS);
      await page.locator('input[type="password"]').nth(1).fill(E2E_PASS);
      await bootstrap.click();
    } else {
      await expect(login).toBeVisible();
      await page.locator('input:not([type="password"])').first().fill(E2E_USER);
      await page.locator('input[type="password"]').first().fill(E2E_PASS);
      await login.click();
    }

    await expect(page.getByText("BOPE", { exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("COMMAND CENTER")).toBeVisible();
    await expect(page.getByRole("link", { name: /Centro de Mando|Mando/ })).toBeVisible();
  });

  test("navegación principal", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(
      'button:has-text("CONFIGURAR ACCESO"), button:has-text("INGRESAR")',
      { timeout: 90_000 },
    );

    const bootstrap = page.getByRole("button", { name: "CONFIGURAR ACCESO" });
    const login = page.getByRole("button", { name: "INGRESAR" });

    if (await bootstrap.isVisible()) {
      await page.locator('input:not([type="password"])').first().fill(E2E_USER);
      await page.locator('input[type="password"]').nth(0).fill(E2E_PASS);
      await page.locator('input[type="password"]').nth(1).fill(E2E_PASS);
      await bootstrap.click();
    } else {
      await page.locator('input:not([type="password"])').first().fill(E2E_USER);
      await page.locator('input[type="password"]').first().fill(E2E_PASS);
      await login.click();
    }

    await expect(page.getByText("BOPE", { exact: true })).toBeVisible({ timeout: 30_000 });

    await page.getByRole("link", { name: /Misiones|◆/ }).click();
    await expect(page).toHaveURL(/\/missions/);

    await page.getByRole("link", { name: /Agentes|◉/ }).click();
    await expect(page).toHaveURL(/\/agents/);

    await page.getByRole("link", { name: /Ejecución|Ejecutar|▶/ }).click();
    await expect(page).toHaveURL(/\/execute/);
  });
});
