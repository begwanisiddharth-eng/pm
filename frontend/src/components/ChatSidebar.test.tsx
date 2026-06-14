import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, vi } from "vitest";
import { ChatSidebar } from "@/components/ChatSidebar";
import * as api from "@/lib/api";
import type { BoardData } from "@/lib/kanban";

vi.mock("@/lib/api");

afterEach(() => {
  vi.restoreAllMocks();
});

const openAndSend = async (text: string) => {
  await userEvent.click(screen.getByRole("button", { name: /ask the assistant/i }));
  await userEvent.type(screen.getByLabelText(/message the assistant/i), text);
  await userEvent.click(screen.getByRole("button", { name: /send/i }));
};

describe("ChatSidebar", () => {
  it("sends a message and shows the user message and AI reply", async () => {
    vi.mocked(api.chatWithBoard).mockResolvedValue({
      reply: "There are 5 columns.",
      board: null,
    });
    const onBoardUpdate = vi.fn();
    render(<ChatSidebar boardId={1} onBoardUpdate={onBoardUpdate} />);

    await openAndSend("How many columns?");

    expect(screen.getByText("How many columns?")).toBeInTheDocument();
    expect(await screen.findByText("There are 5 columns.")).toBeInTheDocument();
    expect(api.chatWithBoard).toHaveBeenCalledWith(1, "How many columns?", []);
    expect(onBoardUpdate).not.toHaveBeenCalled();
  });

  it("applies a board update returned by the assistant", async () => {
    const updated: BoardData = {
      columns: [{ id: "c1", title: "Backlog", cardIds: ["x1"] }],
      cards: { x1: { id: "x1", title: "AI card", details: "d" } },
    };
    vi.mocked(api.chatWithBoard).mockResolvedValue({
      reply: "Added a card.",
      board: updated,
    });
    const onBoardUpdate = vi.fn();
    render(<ChatSidebar boardId={2} onBoardUpdate={onBoardUpdate} />);

    await openAndSend("Add a card");

    expect(await screen.findByText("Added a card.")).toBeInTheDocument();
    expect(onBoardUpdate).toHaveBeenCalledWith(updated);
  });
});
