"use client";

import { useState, type FormEvent } from "react";
import { login, register } from "@/lib/api";

type AuthPanelProps = {
  onAuthenticated: (user: string) => void;
};

export const AuthPanel = ({ onAuthenticated }: AuthPanelProps) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === "signup";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = isSignup
        ? await register(username, password)
        : await login(username, password);
      onAuthenticated(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(isSignup ? "login" : "signup");
    setError("");
  };

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl border border-[var(--stroke)] bg-white/90 p-8 shadow-[var(--shadow)]"
      >
        <h1 className="font-display text-2xl font-semibold text-[var(--navy-dark)]">
          {isSignup ? "Create account" : "Sign in"}
        </h1>
        <p className="mt-2 text-sm text-[var(--gray-text)]">
          {isSignup
            ? "Pick a username and password to start your board."
            : "Use your project credentials to open the board."}
        </p>
        <label className="mt-6 block text-xs font-semibold uppercase tracking-wide text-[var(--gray-text)]">
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
            autoComplete="username"
            required
          />
        </label>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[var(--gray-text)]">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
          />
        </label>
        {error && (
          <p role="alert" className="mt-4 text-sm text-[var(--secondary-purple)]">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-full bg-[var(--secondary-purple)] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {submitting
            ? isSignup
              ? "Creating..."
              : "Signing in..."
            : isSignup
              ? "Create account"
              : "Sign in"}
        </button>
        <button
          type="button"
          onClick={toggleMode}
          className="mt-4 w-full text-center text-xs font-semibold text-[var(--primary-blue)] transition hover:underline"
        >
          {isSignup ? "Have an account? Sign in" : "Create an account"}
        </button>
      </form>
    </main>
  );
};
