import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("edits a card's title via the edit form", async ({ page }) => {
  await login(page);

  const firstColumn = page.locator('[data-testid^="column-"]').first();
  await firstColumn.getByRole("button", { name: /^edit /i }).first().click();
  await firstColumn.getByLabel(/edit card title/i).fill("Edited via e2e");
  await firstColumn.getByRole("button", { name: /save card/i }).click();

  await expect(firstColumn.getByText("Edited via e2e")).toBeVisible();
});

test("logging out with unsaved changes shows a custom in-app prompt", async ({
  page,
}) => {
  await login(page);

  await page
    .locator('[data-testid^="column-"]')
    .first()
    .getByLabel("Column title")
    .fill("Unsaved edit");

  await page.getByRole("button", { name: "Log out", exact: true }).click();

  // Custom dialog, not the native browser confirm.
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /unsaved changes/i })
  ).toBeVisible();

  await page
    .getByRole("button", { name: /log out without saving/i })
    .click();
  await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();
});
