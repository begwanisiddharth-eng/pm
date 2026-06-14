import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";
import { LoginForm } from "@/components/LoginForm";

afterEach(() => {
  vi.restoreAllMocks();
});

const fillAndSubmit = async (username: string, password: string) => {
  await userEvent.type(screen.getByLabelText(/username/i), username);
  await userEvent.type(screen.getByLabelText(/password/i), password);
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
};

describe("LoginForm", () => {
  it("calls onSuccess with the user on valid credentials", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ user: "user" }), { status: 200 })
    );
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);

    await fillAndSubmit("user", "password");

    expect(onSuccess).toHaveBeenCalledWith("user");
  });

  it("shows an error on invalid credentials", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("nope", { status: 401 })
    );
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);

    await fillAndSubmit("user", "wrong");

    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid/i);
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
