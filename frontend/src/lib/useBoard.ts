"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import { getBoard, getBoards, updateBoard } from "@/lib/api";
import type { BoardData } from "@/lib/kanban";

/**
 * Loads the user's board and persists only on explicit save. Local edits mark
 * the board dirty; `save()` writes to the backend. AI updates applied via
 * `applyServerBoard` are already persisted server-side and stay clean.
 */
export function useBoard() {
  const [board, setBoardState] = useState<BoardData | null>(null);
  const [boardId, setBoardId] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
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
      setBoardState(full.data);
      lastSaved.current = full.data;
      setDirty(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const setBoard = useCallback((value: SetStateAction<BoardData | null>) => {
    setBoardState(value);
    setDirty(true);
  }, []);

  // Apply a board the server already persisted (e.g. an AI update): stays clean.
  const applyServerBoard = useCallback((next: BoardData) => {
    lastSaved.current = next;
    setBoardState(next);
    setDirty(false);
  }, []);

  const save = useCallback(async () => {
    if (board === null || boardId === null) {
      return;
    }
    setSaving(true);
    try {
      await updateBoard(boardId, board);
      lastSaved.current = board;
      setDirty(false);
      setError("");
    } catch {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }, [board, boardId]);

  return { board, boardId, setBoard, applyServerBoard, save, dirty, saving, error };
}
