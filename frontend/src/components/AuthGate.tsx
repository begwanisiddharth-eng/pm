"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getMe, logout } from "@/lib/api";
import { LoginForm } from "@/components/LoginForm";

type AuthGateProps = {
  children: ReactNode;
};

export const AuthGate = ({ children }: AuthGateProps) => {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((result) => setUser(result?.user ?? null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center text-sm text-[var(--gray-text)]">
        Loading...
      </main>
    );
  }

  if (!user) {
    return <LoginForm onSuccess={setUser} />;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleLogout}
        className="fixed right-6 top-6 z-50 rounded-full border border-[var(--stroke)] bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--navy-dark)] shadow-[var(--shadow)] transition hover:border-[var(--primary-blue)]"
      >
        Log out
      </button>
      {children}
    </>
  );
};
