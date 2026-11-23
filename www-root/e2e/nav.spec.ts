import { expect, test } from "@playwright/test";

const MAIN_MENU = [
  "Featured Projects",
  "Websites",
  "Games",
  "3D",
  "Design & Motion",
  "Art",
  "Contact & Español",
] as const;

test("initial state shows the nav menu", async ({ page }) => {
  await page.goto("/en");

  await expect(page).toHaveURL(/\/en\/?$/);
  const nav = page.locator("[data-component='NavItems']");
  for (const label of MAIN_MENU) {
    await expect(nav.getByRole("button", { name: label, exact: true })).toBeVisible();
  }
  await expect(page.locator("[data-component='ContentPage']")).toHaveCount(0);
});

test("opens the websites menu", async ({ page }) => {
  await page.goto("/en");

  await page
    .locator("[data-component='NavItems']")
    .getByRole("button", { name: "Websites", exact: true })
    .click();

  await expect(page).toHaveURL(/\/en\/websites\/?$/);
  await expect(page.locator("[data-component='ThumbnailGrid']")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sky Terra Nova" })).toBeVisible();
});

test("opens one website from that menu", async ({ page }) => {
  await page.goto("/en/websites");

  await page.getByRole("link", { name: "Sky Terra Nova" }).click();

  await expect(page).toHaveURL(/\/en\/websites\/terranova\/?$/);
  await expect(page.locator("[data-component='ArticleView']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sky Terra Nova" })).toBeVisible();
  await expect(page.getByText("Microsite for Terra Nova TV series")).toBeVisible();
});
