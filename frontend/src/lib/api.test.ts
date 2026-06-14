import { afterEach, expect, vi } from "vitest";
import { getBoard, getBoards, updateBoard } from "@/lib/api";
import type { BoardData } from "@/lib/kanban";

afterEach(() => {
  vi.restoreAllMocks();
});

const emptyBoard: BoardData = { columns: [], cards: {} };

describe("api board client", () => {
  it("getBoards requests /api/boards with credentials", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: 1, title: "B" }]), { status: 200 })
    );
    const boards = await getBoards();
    expect(boards).toEqual([{ id: 1, title: "B" }]);
    expect(fetch).toHaveBeenCalledWith("/api/boards", { credentials: "include" });
  });

  it("getBoard requests the board by id", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: 2, title: "B", data: emptyBoard }), {
        status: 200,
      })
    );
    const board = await getBoard(2);
    expect(board.id).toBe(2);
    expect(fetch).toHaveBeenCalledWith("/api/boards/2", {
      credentials: "include",
    });
  });

  it("updateBoard PUTs the board data", async () => {
    const spy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: 1, title: "B", data: emptyBoard }), {
        status: 200,
      })
    );
    await updateBoard(1, emptyBoard);
    const [url, options] = spy.mock.calls[0];
    expect(url).toBe("/api/boards/1");
    expect(options).toMatchObject({ method: "PUT", credentials: "include" });
    expect(JSON.parse(options?.body as string)).toEqual(emptyBoard);
  });

  it("throws when the response is not ok", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("no", { status: 500 }));
    await expect(getBoard(1)).rejects.toThrow();
  });
});
