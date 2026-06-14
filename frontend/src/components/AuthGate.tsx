"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getMe, logout as apiLogout } from "@/lib/api";
import { AuthPanel } from "@/components/AuthPanel";

type AuthContextValue = { user: string; logout: () => Promise<void> };

const AuthContext = createContext<AuthContextValue | null>(null);

/** Access the current user and logout. Falls back to a no-op outside a gate. */
export const useAuth = (): AuthContextValue =>
  useContext(AuthContext) ?? { user: "", logout: async () => {} };

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

  const logout = async () => {
    await apiLogout();
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
    return <AuthPanel onAuthenticated={setUser} />;
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
