"use client";

import { useEffect, useRef, useState } from "react";
import { getBoard, getBoards, updateBoard } from "@/lib/api";
import type { BoardData } from "@/lib/kanban";

/**
 * Loads the user's first board and persists changes with a debounced save.
 * Local edits apply immediately; a failed save rolls back to the last saved
 * state and surfaces an error.
 */
export function useBoard() {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [boardId, setBoardId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const lastSaved = useRef<BoardData | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const boards = await getBoards();
      const full = await getBoard(boards[0].id);
      if (!active) {
        return;
      }
      setBoardId(full.id);
      setBoard(full.data);
      lastSaved.current = full.data;
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (board === null || boardId === null || board === lastSaved.current) {
      return;
    }
    const handle = setTimeout(async () => {
      try {
        await updateBoard(boardId, board);
        lastSaved.current = board;
        setError("");
      } catch {
        setError("Failed to save changes");
        setBoard(lastSaved.current);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [board, boardId]);

  return { board, setBoard, error };
}
