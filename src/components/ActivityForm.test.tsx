import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ActivityForm from "./ActivityForm";

describe("ActivityForm", () => {
  it("creates a personal one-off activity", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ActivityForm onSave={onSave} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Activity name"), "Renew insurance");
    await user.selectOptions(screen.getByLabelText("Category"), "personal");
    await user.type(screen.getByLabelText("Date"), "2025-01-06");
    await user.click(screen.getByRole("button", { name: "Add activity" }));

    expect(onSave).toHaveBeenCalledWith({
      title: "Renew insurance",
      category: "personal",
      dueDate: "2025-01-06",
    });
  });

  it("creates an official activity on selected weekdays", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ActivityForm onSave={onSave} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Activity name"), "Gym session");
    await user.selectOptions(screen.getByLabelText("Category"), "official");
    await user.type(screen.getByLabelText("Date"), "2025-01-06");
    await user.click(screen.getByLabelText("Repeat weekly"));
    await user.click(screen.getByLabelText("Monday"));
    await user.click(screen.getByLabelText("Wednesday"));
    await user.click(screen.getByLabelText("Friday"));
    await user.click(screen.getByRole("button", { name: "Add activity" }));

    expect(onSave).toHaveBeenCalledWith({
      title: "Gym session",
      category: "official",
      dueDate: "2025-01-06",
      weekdays: [1, 3, 5],
    });
  });

  it("edits a task and shows validation for blank title and missing date", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <ActivityForm
        initialActivity={{
          id: "renewal",
          title: "Renew insurance",
          category: "personal",
          dueDate: "2025-01-06",
        }}
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    const title = screen.getByLabelText("Activity name");
    await user.clear(title);
    await user.clear(screen.getByLabelText("Date"));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("Enter an activity name.")).toBeInTheDocument();
    expect(screen.getByText("Choose a due date.")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
