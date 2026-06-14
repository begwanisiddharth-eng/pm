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

const renamed: BoardData = {
  columns: [{ id: "c1", title: "Renamed", cardIds: [] }],
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
  it("loads the first board and is not dirty", async () => {
    const { result } = renderHook(() => useBoard());
    await waitFor(() => expect(result.current.board).not.toBeNull());
    expect(result.current.dirty).toBe(false);
    expect(result.current.board?.columns[0].title).toBe("A");
  });

  it("marks dirty on edit and clears it after save", async () => {
    vi.mocked(api.updateBoard).mockResolvedValue({
      id: 1,
      title: "B",
      data: renamed,
    });
    const { result } = renderHook(() => useBoard());
    await waitFor(() => expect(result.current.board).not.toBeNull());

    act(() => result.current.setBoard(renamed));
    expect(result.current.dirty).toBe(true);

    await act(async () => {
      await result.current.save();
    });
    expect(api.updateBoard).toHaveBeenCalledWith(1, renamed);
    expect(result.current.dirty).toBe(false);
  });

  it("stays clean when applying a server board (AI update)", async () => {
    const { result } = renderHook(() => useBoard());
    await waitFor(() => expect(result.current.board).not.toBeNull());

    const aiBoard: BoardData = { columns: [], cards: {} };
    act(() => result.current.applyServerBoard(aiBoard));

    expect(result.current.board).toEqual(aiBoard);
    expect(result.current.dirty).toBe(false);
    expect(api.updateBoard).not.toHaveBeenCalled();
  });

  it("surfaces an error and stays dirty when save fails", async () => {
    vi.mocked(api.updateBoard).mockRejectedValue(new Error("fail"));
    const { result } = renderHook(() => useBoard());
    await waitFor(() => expect(result.current.board).not.toBeNull());

    act(() => result.current.setBoard(renamed));
    await act(async () => {
      await result.current.save();
    });

    expect(result.current.error).toBe("Failed to save changes");
    expect(result.current.dirty).toBe(true);
  });
});
