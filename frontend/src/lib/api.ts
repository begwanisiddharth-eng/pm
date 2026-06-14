/** Client for the backend API. Same origin in production; dev proxies /api. */

export type User = { user: string };

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
