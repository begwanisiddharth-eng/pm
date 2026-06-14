import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, vi } from "vitest";
import { AuthPanel } from "@/components/AuthPanel";
import * as api from "@/lib/api";

vi.mock("@/lib/api");

afterEach(() => {
  vi.restoreAllMocks();
});

const fill = async (username: string, password: string) => {
  await userEvent.type(screen.getByLabelText(/username/i), username);
  await userEvent.type(screen.getByLabelText(/password/i), password);
};

describe("AuthPanel", () => {
  it("logs in with valid credentials", async () => {
    vi.mocked(api.login).mockResolvedValue({ user: "user" });
    const onAuthenticated = vi.fn();
    render(<AuthPanel onAuthenticated={onAuthenticated} />);

    await fill("user", "password");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(api.login).toHaveBeenCalledWith("user", "password");
    expect(onAuthenticated).toHaveBeenCalledWith("user");
  });

  it("shows an error on invalid login", async () => {
    vi.mocked(api.login).mockRejectedValue(new Error("Invalid credentials"));
    render(<AuthPanel onAuthenticated={vi.fn()} />);

    await fill("user", "wrong");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid/i);
  });

  it("registers a new account after toggling to sign up", async () => {
    vi.mocked(api.register).mockResolvedValue({ user: "alice" });
    const onAuthenticated = vi.fn();
    render(<AuthPanel onAuthenticated={onAuthenticated} />);

    await userEvent.click(
      screen.getByRole("button", { name: /create an account/i })
    );
    await fill("alice", "wonderland");
    await userEvent.click(
      screen.getByRole("button", { name: /^create account$/i })
    );

    expect(api.register).toHaveBeenCalledWith("alice", "wonderland");
    expect(onAuthenticated).toHaveBeenCalledWith("alice");
  });
});
