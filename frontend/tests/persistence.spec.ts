import { expect, test } from "@playwright/test";
import { login } from "./helpers";

const firstColumnTitle = (page: import("@playwright/test").Page) =>
  page.locator('[data-testid^="column-"]').first().getByLabel("Column title");

test("renaming a column persists after Save and reload", async ({ page }) => {
  await login(page);

  await firstColumnTitle(page).fill("Persisted Column");
  const saved = page.waitForResponse(
    (res) =>
      res.url().includes("/api/boards/") &&
      res.request().method() === "PUT" &&
      res.ok()
  );
  await page.getByRole("button", { name: /^save$/i }).click();
  await saved;

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Kanban Studio" })
  ).toBeVisible();
  await expect(firstColumnTitle(page)).toHaveValue("Persisted Column");
});

test("unsaved edits are discarded on reload", async ({ page }) => {
  await login(page);

  await firstColumnTitle(page).fill("Temporary name");
  await page.reload();

  await expect(
    page.getByRole("heading", { name: "Kanban Studio" })
  ).toBeVisible();
  await expect(firstColumnTitle(page)).not.toHaveValue("Temporary name");
});

test("a saved card persists across a fresh login", async ({ page, context }) => {
  await login(page);

  const firstColumn = page.locator('[data-testid^="column-"]').first();
  await firstColumn.getByRole("button", { name: /add a card/i }).click();
  await firstColumn.getByPlaceholder("Card title").fill("Persisted Card");
  await firstColumn.getByPlaceholder("Details").fill("Survives re-login.");
  await firstColumn.getByRole("button", { name: /add card/i }).click();

  const saved = page.waitForResponse(
    (res) =>
      res.url().includes("/api/boards/") &&
      res.request().method() === "PUT" &&
      res.ok()
  );
  await page.getByRole("button", { name: /^save$/i }).click();
  await saved;

  await context.clearCookies();
  await login(page);

  await expect(page.getByText("Persisted Card")).toBeVisible();
});
