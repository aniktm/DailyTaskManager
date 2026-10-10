import { describe, expect, it } from "vitest";
import type { Activity, OccurrenceOverrides } from "./activity";
import {
  completeOccurrence,
  listOccurrences,
  occurrenceKey,
  rescheduleOccurrence,
} from "./activitySchedule";

const activity = (overrides: Partial<Activity> = {}): Activity => ({
  id: "gym",
  title: "Gym",
  category: "personal",
  dueDate: "2025-01-06",
  weekdays: [1, 3, 5],
  ...overrides,
});

describe("listOccurrences", () => {
  it("includes one-off activities and weekly occurrences on selected weekdays", () => {
    const occurrences = listOccurrences(
      [
        activity(),
        activity({
          id: "insurance",
          title: "Renew insurance",
          dueDate: "2025-01-07",
          weekdays: undefined,
        }),
      ],
      {},
      "2025-01-06",
      "2025-01-12",
    );

    expect(occurrences.map(({ activityId, date }) => [activityId, date])).toEqual([
      ["gym", "2025-01-06"],
      ["insurance", "2025-01-07"],
      ["gym", "2025-01-08"],
      ["gym", "2025-01-10"],
    ]);
  });

  it("shows a rescheduled occurrence only on its new date", () => {
    const overrides: OccurrenceOverrides = rescheduleOccurrence(
      {},
      "gym",
      "2025-01-06",
      "2025-01-07",
    );
    const occurrences = listOccurrences(
      [activity()],
      overrides,
      "2025-01-06",
      "2025-01-13",
    );
    const gymDates = occurrences.map(({ date }) => date);

    expect(gymDates).toEqual(["2025-01-07", "2025-01-08", "2025-01-10", "2025-01-13"]);
    expect(gymDates).not.toContain("2025-01-06");
  });

  it("completes one occurrence without completing later occurrences", () => {
    const key = occurrenceKey("gym", "2025-01-06");
    const overrides = completeOccurrence({}, "gym", "2025-01-06");
    const occurrences = listOccurrences(
      [activity()],
      overrides,
      "2025-01-06",
      "2025-01-13",
    );

    expect(overrides[key]).toEqual({ completed: true });
    expect(occurrences.find(({ originalDate }) => originalDate === "2025-01-06")?.completed).toBe(true);
    expect(occurrences.find(({ originalDate }) => originalDate === "2025-01-08")?.completed).toBe(false);
  });
});
