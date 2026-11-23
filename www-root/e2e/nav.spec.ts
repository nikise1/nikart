import { expect, test, type Page } from "@playwright/test";

// Baselines sit beside this file. `npm run test:e2e:update` rewrites them after a visual change.

const MAIN_MENU = [
  "Featured Projects",
  "Websites",
  "Games",
  "3D",
  "Design & Motion",
  "Art",
  "Contact & Español",
] as const;

async function waitForPaint(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => {
      const background = new Image();
      background.onload = () => resolve();
      background.onerror = () => resolve();
      background.src = "/content/bg/bg.jpg";
    });
    await Promise.all(
      [...document.images].map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
      ),
    );
  });
}

test("opens the language page from the home nav", async ({ page }) => {
  await page.goto("/en");

  await expect(page).toHaveURL(/\/en\/?$/);
  const nav = page.locator("[data-component='NavItems']");
  for (const label of MAIN_MENU) {
    await expect(nav.getByRole("button", { name: label, exact: true })).toBeVisible();
  }
  await expect(page.locator("[data-component='ContentPage']")).toHaveCount(0);
  await waitForPaint(page);
  await expect(page).toHaveScreenshot("nav-menu.png");

  await nav.getByRole("button", { name: "Contact & Español", exact: true }).click();

  await expect(page).toHaveURL(/\/en\/config\/?$/);
  const grid = page.locator("[data-component='ThumbnailGrid']");
  await expect(grid).toBeVisible();
  await expect(grid.getByRole("link", { name: "Español" })).toBeVisible();
  await waitForPaint(page);
  await expect(page).toHaveScreenshot("config-menu.png");

  await grid.getByRole("link", { name: "Español" }).click();

  await expect(page).toHaveURL(/\/en\/config\/language\/?$/);
  await expect(page.locator("[data-component='ArticleView']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Español" })).toBeVisible();
  await expect(page.getByText("Versión en Español")).toBeVisible();
  await waitForPaint(page);
  await expect(page).toHaveScreenshot("language.png");
});
