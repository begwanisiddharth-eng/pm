import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { NewCardForm } from "@/components/NewCardForm";

describe("NewCardForm", () => {
  it("toggles the form open and closed", async () => {
    render(<NewCardForm onAdd={vi.fn()} />);
    expect(screen.queryByPlaceholderText(/card title/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /add a card/i }));
    expect(screen.getByPlaceholderText(/card title/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByPlaceholderText(/card title/i)).not.toBeInTheDocument();
  });

  it("ignores submit when the title is only whitespace", async () => {
    const onAdd = vi.fn();
    render(<NewCardForm onAdd={onAdd} />);
    await userEvent.click(screen.getByRole("button", { name: /add a card/i }));

    await userEvent.type(screen.getByPlaceholderText(/card title/i), "   ");
    await userEvent.click(screen.getByRole("button", { name: /add card/i }));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("submits a trimmed title and details, then closes", async () => {
    const onAdd = vi.fn();
    render(<NewCardForm onAdd={onAdd} />);
    await userEvent.click(screen.getByRole("button", { name: /add a card/i }));

    await userEvent.type(screen.getByPlaceholderText(/card title/i), "  Ship it  ");
    await userEvent.type(screen.getByPlaceholderText(/details/i), "  soon  ");
    await userEvent.click(screen.getByRole("button", { name: /add card/i }));

    expect(onAdd).toHaveBeenCalledWith("Ship it", "soon");
    expect(screen.queryByPlaceholderText(/card title/i)).not.toBeInTheDocument();
  });
});
