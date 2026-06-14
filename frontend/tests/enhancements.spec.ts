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

test("logging out with unsaved changes prompts to save", async ({ page }) => {
  await login(page);

  await page
    .locator('[data-testid^="column-"]')
    .first()
    .getByLabel("Column title")
    .fill("Unsaved edit");

  let dialogMessage = "";
  page.once("dialog", (dialog) => {
    dialogMessage = dialog.message();
    dialog.dismiss();
  });

  await page.getByRole("button", { name: /log out/i }).click();

  expect(dialogMessage).toContain("unsaved changes");
  await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();
});
