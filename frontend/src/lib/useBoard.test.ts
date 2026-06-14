import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, vi } from "vitest";
import * as api from "@/lib/api";
import type { BoardData } from "@/lib/kanban";
import { useBoard } from "@/lib/useBoard";

vi.mock("@/lib/api");

const loaded: BoardData = {
  columns: [{ id: "c1", title: "A", cardIds: [] }],
  cards: {},
};

beforeEach(() => {
  vi.mocked(api.getBoards).mockResolvedValue([{ id: 1, title: "B" }]);
  vi.mocked(api.getBoard).mockResolvedValue({ id: 1, title: "B", data: loaded });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useBoard", () => {
  it("loads the first board", async () => {
    vi.mocked(api.updateBoard).mockResolvedValue({
      id: 1,
      title: "B",
      data: loaded,
    });
    const { result } = renderHook(() => useBoard());
    await waitFor(() => expect(result.current.board).not.toBeNull());
    expect(result.current.board?.columns[0].title).toBe("A");
  });

  it("saves changes to the backend", async () => {
    vi.mocked(api.updateBoard).mockResolvedValue({
      id: 1,
      title: "B",
      data: loaded,
    });
    const { result } = renderHook(() => useBoard());
    await waitFor(() => expect(result.current.board).not.toBeNull());

    act(() => {
      result.current.setBoard({
        columns: [{ id: "c1", title: "Renamed", cardIds: [] }],
        cards: {},
      });
    });

    await waitFor(() =>
      expect(api.updateBoard).toHaveBeenCalledWith(1, {
        columns: [{ id: "c1", title: "Renamed", cardIds: [] }],
        cards: {},
      })
    );
  });

  it("rolls back and shows an error on a failed save", async () => {
    vi.mocked(api.updateBoard).mockRejectedValue(new Error("fail"));
    const { result } = renderHook(() => useBoard());
    await waitFor(() => expect(result.current.board).not.toBeNull());

    act(() => {
      result.current.setBoard({
        columns: [{ id: "c1", title: "Changed", cardIds: [] }],
        cards: {},
      });
    });
    expect(result.current.board?.columns[0].title).toBe("Changed");

    await waitFor(() =>
      expect(result.current.error).toBe("Failed to save changes")
    );
    expect(result.current.board?.columns[0].title).toBe("A");
  });
});
