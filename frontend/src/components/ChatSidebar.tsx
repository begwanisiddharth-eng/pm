"use client";

import { useState, type FormEvent } from "react";
import { chatWithBoard } from "@/lib/api";
import type { BoardData } from "@/lib/kanban";

type Message = { role: "user" | "assistant"; content: string };

type ChatSidebarProps = {
  boardId: number;
  onBoardUpdate: (board: BoardData) => void;
};

export const ChatSidebar = ({ boardId, onBoardUpdate }: ChatSidebarProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) {
      return;
    }
    const history = messages;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const result = await chatWithBoard(boardId, text, history);
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
      if (result.board) {
        onBoardUpdate(result.board);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-[var(--secondary-purple)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow)] transition hover:brightness-110"
      >
        Ask the assistant
      </button>
    );
  }

  return (
    <aside
      className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[380px] flex-col border-l border-[var(--stroke)] bg-white shadow-[var(--shadow)]"
      aria-label="AI assistant"
    >
      <header className="flex items-center justify-between border-b border-[var(--stroke)] px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gray-text)]">
            Assistant
          </p>
          <h2 className="font-display text-lg font-semibold text-[var(--navy-dark)]">
            Board copilot
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-[var(--stroke)] px-3 py-1 text-xs font-semibold text-[var(--gray-text)] transition hover:text-[var(--navy-dark)]"
          aria-label="Close assistant"
        >
          Close
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <p className="text-sm leading-6 text-[var(--gray-text)]">
            Ask me to add, move, or rename things, or just ask about the board.
          </p>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl bg-[var(--primary-blue)] px-4 py-2 text-sm text-white"
                : "mr-auto max-w-[85%] rounded-2xl bg-[var(--surface)] px-4 py-2 text-sm text-[var(--navy-dark)]"
            }
          >
            {message.content}
          </div>
        ))}
        {loading && (
          <div className="mr-auto max-w-[85%] rounded-2xl bg-[var(--surface)] px-4 py-2 text-sm text-[var(--gray-text)]">
            Thinking...
          </div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-[var(--stroke)] px-4 py-4"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Message the assistant"
          aria-label="Message the assistant"
          className="flex-1 rounded-full border border-[var(--stroke)] bg-white px-4 py-2 text-sm text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[var(--secondary-purple)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </aside>
  );
};
