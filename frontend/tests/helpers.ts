import { expect, type Page } from "@playwright/test";

/** Log in with the hardcoded MVP credentials and wait for the board. */
export async function login(page: Page) {
  await page.goto("/");
  await page.getByLabel(/username/i).fill("user");
  await page.getByLabel(/password/i).fill("password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(
    page.getByRole("heading", { name: "Kanban Studio" })
  ).toBeVisible();
}
