import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ActivityOccurrence } from "../domain/activity";
import ReminderCard from "./ReminderCard";

const occurrence: ActivityOccurrence = {
  activityId: "renewal",
  originalDate: "2025-01-06",
  date: "2025-01-06",
  title: "Renew insurance",
  category: "personal",
  completed: false,
};

describe("ReminderCard", () => {
  it("shows the configured snooze duration and all three actions", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const onSnooze = vi.fn();
    const onReschedule = vi.fn();
    render(
      <ReminderCard
        occurrence={occurrence}
        snoozeMinutes={180}
        onComplete={onComplete}
        onSnooze={onSnooze}
        onReschedule={onReschedule}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Snooze 3 hours" }));
    expect(onSnooze).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Mark complete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change date" })).toBeInTheDocument();
  });

  it("supports completing an alert from the keyboard", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <ReminderCard
        occurrence={occurrence}
        snoozeMinutes={60}
        onComplete={onComplete}
        onSnooze={vi.fn()}
        onReschedule={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Mark complete" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("keeps keyboard focus inside the alert dialog", async () => {
    const user = userEvent.setup();
    render(
      <ReminderCard
        occurrence={occurrence}
        snoozeMinutes={60}
        onComplete={vi.fn()}
        onSnooze={vi.fn()}
        onReschedule={vi.fn()}
      />,
    );

    const completeButton = screen.getByRole("button", { name: "Mark complete" });
    const changeDateButton = screen.getByRole("button", { name: "Change date" });
    expect(completeButton).toHaveFocus();
    await user.tab({ shift: true });
    expect(changeDateButton).toHaveFocus();
    await user.tab();
    expect(completeButton).toHaveFocus();
  });

  it("uses the new occurrence date when its occurrence changes", async () => {
    const user = userEvent.setup();
    const view = render(
      <ReminderCard
        occurrence={occurrence}
        snoozeMinutes={60}
        onComplete={vi.fn()}
        onSnooze={vi.fn()}
        onReschedule={vi.fn()}
      />,
    );
    view.rerender(
      <ReminderCard
        occurrence={{ ...occurrence, originalDate: "2025-01-07", date: "2025-01-07" }}
        snoozeMinutes={60}
        onComplete={vi.fn()}
        onSnooze={vi.fn()}
        onReschedule={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Change date" }));
    expect(screen.getByLabelText("New date")).toHaveValue("2025-01-07");
  });
});
