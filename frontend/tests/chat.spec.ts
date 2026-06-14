import { expect, test } from "@playwright/test";
import { login } from "./helpers";

// The chat backend (and OpenAI) is stubbed so the test is deterministic and
// free; it verifies the sidebar wiring and automatic board refresh.
test("assistant replies and updates the board without a reload", async ({
  page,
}) => {
  await login(page);

  await page.route("**/api/boards/*/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reply: "Done, I added it.",
        board: {
          columns: [
            { id: "col-backlog", title: "Backlog", cardIds: ["ai-1"] },
          ],
          cards: {
            "ai-1": {
              id: "ai-1",
              title: "AI Added Card",
              details: "from the assistant",
            },
          },
        },
      }),
    });
  });

  await page.getByLabel(/message the assistant/i).fill("Please add a card");
  await page.getByRole("button", { name: /send/i }).click();

  await expect(page.getByText("Done, I added it.")).toBeVisible();
  // The board refreshed automatically from the assistant's update.
  await expect(page.getByText("AI Added Card")).toBeVisible();
});
