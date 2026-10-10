import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ActivityOccurrence } from "../domain/activity";
import ActivityPlan from "./ActivityPlan";

const occurrences: ActivityOccurrence[] = [
  {
    activityId: "renewal",
    originalDate: "2025-01-06",
    date: "2025-01-06",
    title: "Renew insurance",
    category: "personal",
    completed: false,
  },
  {
    activityId: "status",
    originalDate: "2025-01-06",
    date: "2025-01-06",
    title: "Send project status",
    category: "official",
    scheduledTime: "14:00",
    completed: false,
  },
];

describe("ActivityPlan", () => {
  it("groups plan activities by category and filters to Personal", async () => {
    const user = userEvent.setup();
    render(
      <ActivityPlan
        occurrences={occurrences}
        filter="all"
        onComplete={vi.fn()}
        onReschedule={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    const personal = screen.getByRole("heading", { name: "Personal" }).parentElement!;
    const official = screen.getByRole("heading", { name: "Official" }).parentElement!;
    expect(within(personal).getByText("Renew insurance")).toBeInTheDocument();
    expect(within(official).getByText("Send project status")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Personal" }));
    expect(screen.getByText("Renew insurance")).toBeInTheDocument();
    expect(screen.queryByText("Send project status")).not.toBeInTheDocument();
  });

  it("reschedules one occurrence using its original occurrence date", async () => {
    const user = userEvent.setup();
    const onReschedule = vi.fn();
    render(
      <ActivityPlan
        occurrences={[occurrences[0]]}
        filter="all"
        onComplete={vi.fn()}
        onReschedule={onReschedule}
        onEdit={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Change date for Renew insurance" }));
    const dialog = screen.getByRole("dialog", { name: "Change activity date" });
    await user.clear(within(dialog).getByLabelText("New date"));
    await user.type(within(dialog).getByLabelText("New date"), "2025-01-07");
    await user.click(within(dialog).getByRole("button", { name: "Save date" }));

    expect(onReschedule).toHaveBeenCalledWith("renewal", "2025-01-06", "2025-01-07");
  });
});
