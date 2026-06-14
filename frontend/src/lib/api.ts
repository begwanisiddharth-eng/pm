/** Client for the backend API. Same origin in production; dev proxies /api. */

import type { BoardData } from "@/lib/kanban";

export type User = { user: string };

export type BoardSummary = { id: number; title: string };

export type Board = { id: number; title: string; data: BoardData };

export type ChatMessage = { role: string; content: string };

export type ChatResult = { reply: string; board: BoardData | null };

export async function getMe(): Promise<User | null> {
  const res = await fetch("/api/me", { credentials: "include" });
  if (res.status === 401) {
    return null;
  }
  if (!res.ok) {
    throw new Error("Failed to load session");
  }
  return res.json();
}

export async function login(username: string, password: string): Promise<User> {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  if (res.status === 401) {
    throw new Error("Invalid username or password");
  }
  if (!res.ok) {
    throw new Error("Login failed");
  }
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch("/api/logout", { method: "POST", credentials: "include" });
}

export async function getBoards(): Promise<BoardSummary[]> {
  const res = await fetch("/api/boards", { credentials: "include" });
  if (!res.ok) {
    throw new Error("Failed to load boards");
  }
  return res.json();
}

export async function getBoard(id: number): Promise<Board> {
  const res = await fetch(`/api/boards/${id}`, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Failed to load board");
  }
  return res.json();
}

export async function updateBoard(id: number, data: BoardData): Promise<Board> {
  const res = await fetch(`/api/boards/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to save board");
  }
  return res.json();
}

export async function chatWithBoard(
  boardId: number,
  message: string,
  history: ChatMessage[]
): Promise<ChatResult> {
  const res = await fetch(`/api/boards/${boardId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) {
    throw new Error("Chat request failed");
  }
  return res.json();
}
