import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("renaming a column persists across reload", async ({ page }) => {
  await login(page);

  const firstColumnTitle = page
    .locator('[data-testid^="column-"]')
    .first()
    .getByLabel("Column title");
  await firstColumnTitle.fill("Persisted Column");

  await page.waitForResponse(
    (res) =>
      res.url().includes("/api/boards/") &&
      res.request().method() === "PUT" &&
      res.ok()
  );

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Kanban Studio" })
  ).toBeVisible();
  await expect(
    page.locator('[data-testid^="column-"]').first().getByLabel("Column title")
  ).toHaveValue("Persisted Column");
});

test("an added card persists across a fresh login", async ({ page, context }) => {
  await login(page);

  const firstColumn = page.locator('[data-testid^="column-"]').first();
  await firstColumn.getByRole("button", { name: /add a card/i }).click();
  await firstColumn.getByPlaceholder("Card title").fill("Persisted Card");
  await firstColumn.getByPlaceholder("Details").fill("Survives re-login.");
  await firstColumn.getByRole("button", { name: /add card/i }).click();

  await page.waitForResponse(
    (res) =>
      res.url().includes("/api/boards/") &&
      res.request().method() === "PUT" &&
      res.ok()
  );

  // New session: clear cookies and log in again.
  await context.clearCookies();
  await login(page);

  await expect(page.getByText("Persisted Card")).toBeVisible();
});
