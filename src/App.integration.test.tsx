import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe("daily planner reminder flow", () => {
  it("creates an activity and completes it from its in-app alert", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 6, 5, 59));
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "+ Add activity" }));
    fireEvent.change(screen.getByLabelText("Activity name"), {
      target: { value: "Renew insurance" },
    });
    fireEvent.change(screen.getByLabelText("Category"), {
      target: { value: "personal" },
    });
    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "2025-01-06" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add activity" }));

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByRole("alertdialog")).toHaveTextContent("Renew insurance");
    fireEvent.click(screen.getByRole("button", { name: "Mark complete" }));

    const stored = JSON.parse(
      localStorage.getItem("daily-activity-planner:v1") ?? "{}",
    ) as {
      activities: Array<{ id: string }>;
      overrides: Record<string, { completed?: boolean }>;
    };
    expect(stored.overrides[`${stored.activities[0].id}::2025-01-06`]).toEqual({
      completed: true,
    });
  });

  it("clears presentation state when an alerted occurrence is rescheduled", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 6, 6, 0));
    localStorage.setItem(
      "daily-activity-planner:v1",
      JSON.stringify({
        activities: [{
          id: "renewal",
          title: "Renew insurance",
          category: "personal",
          dueDate: "2025-01-06",
        }],
        overrides: {},
        reminderState: {
          presentedOccurrenceKeys: [],
          snoozedUntilByOccurrence: {},
        },
        preferences: { summaryTime: "23:59", defaultSnoozeMinutes: 60 },
      }),
    );
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Change date" }));
    fireEvent.change(screen.getByLabelText("New date"), {
      target: { value: "2025-01-07" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save date" }));

    const stored = JSON.parse(
      localStorage.getItem("daily-activity-planner:v1") ?? "{}",
    ) as { reminderState: { presentedOccurrenceKeys: string[] } };
    expect(stored.reminderState.presentedOccurrenceKeys).not.toContain(
      "renewal::2025-01-06",
    );
  });

  it("updates the tomorrow date after the local day rolls over", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 6, 23, 59));
    render(<App />);
    expect(document.querySelector("time")?.getAttribute("datetime")).toBe("2025-01-07");

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(document.querySelector("time")?.getAttribute("datetime")).toBe("2025-01-08");
  });
});
