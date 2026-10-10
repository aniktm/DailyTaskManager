import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Activity, PlannerData } from "../domain/activity";
import useReminderEngine from "./useReminderEngine";

const activity: Activity = {
  id: "renewal",
  title: "Renew insurance",
  category: "personal",
  dueDate: "2025-01-06",
};

const makeData = (
  activities: Activity[] = [activity],
  lastSummaryDate?: string,
): PlannerData => ({
  activities,
  overrides: {},
  reminderState: {
    presentedOccurrenceKeys: [],
    snoozedUntilByOccurrence: {},
    ...(lastSummaryDate ? { lastSummaryDate } : {}),
  },
  preferences: {
    summaryTime: "21:00",
    defaultSnoozeMinutes: 60,
  },
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useReminderEngine", () => {
  it("presents an untimed activity at 6:00 AM while the app is open", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 6, 5, 59));
    const onAlert = vi.fn();
    const onPlannerDataChange = vi.fn();

    renderHook(() =>
      useReminderEngine({
        plannerData: makeData(),
        onPlannerDataChange,
        onAlert,
        onSummary: vi.fn(),
      }),
    );
    expect(onAlert).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(onAlert).toHaveBeenCalledWith(
      expect.objectContaining({ activityId: "renewal", date: "2025-01-06" }),
    );
    expect(onPlannerDataChange).toHaveBeenCalledWith(
      expect.objectContaining({
        reminderState: expect.objectContaining({
          presentedOccurrenceKeys: ["renewal::2025-01-06"],
        }),
      }),
    );
  });

  it("presents timed activities one hour before their scheduled time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 6, 8, 59));
    const timedActivity = { ...activity, scheduledTime: "10:00" };
    const onAlert = vi.fn();

    renderHook(() =>
      useReminderEngine({
        plannerData: makeData([timedActivity]),
        onPlannerDataChange: vi.fn(),
        onAlert,
        onSummary: vi.fn(),
      }),
    );
    expect(onAlert).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(onAlert).toHaveBeenCalledWith(
      expect.objectContaining({ activityId: "renewal", date: "2025-01-06" }),
    );
  });

  it("alerts one hour before a timed activity shortly after midnight", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 6, 23, 30));
    const onAlert = vi.fn();
    const nextDayActivity = { ...activity, dueDate: "2025-01-07", scheduledTime: "00:30" };

    renderHook(() =>
      useReminderEngine({
        plannerData: {
          ...makeData([nextDayActivity]),
          preferences: { summaryTime: "23:59", defaultSnoozeMinutes: 60 },
        },
        onPlannerDataChange: vi.fn(),
        onAlert,
        onSummary: vi.fn(),
      }),
    );

    expect(onAlert).toHaveBeenCalledWith(
      expect.objectContaining({ activityId: "renewal", date: "2025-01-07" }),
    );
  });

  it("does not repeat a presented alert after reopening the app", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 6, 8, 0));
    const data = makeData();
    data.reminderState.presentedOccurrenceKeys = ["renewal::2025-01-06"];
    const onAlert = vi.fn();

    renderHook(() =>
      useReminderEngine({
        plannerData: data,
        onPlannerDataChange: vi.fn(),
        onAlert,
        onSummary: vi.fn(),
      }),
    );

    expect(onAlert).not.toHaveBeenCalled();
  });

  it("re-presents a snoozed alert when its saved snooze expires", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 6, 6, 14));
    const data = makeData();
    data.reminderState.presentedOccurrenceKeys = ["renewal::2025-01-06"];
    data.reminderState.snoozedUntilByOccurrence["renewal::2025-01-06"] =
      new Date(2025, 0, 6, 6, 15).toISOString();
    const onAlert = vi.fn();

    renderHook(() =>
      useReminderEngine({
        plannerData: data,
        onPlannerDataChange: vi.fn(),
        onAlert,
        onSummary: vi.fn(),
      }),
    );
    expect(onAlert).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(onAlert).toHaveBeenCalledOnce();
  });

  it("presents a missed evening summary on next open exactly once", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 7, 8, 0));
    const onSummary = vi.fn();
    const onPlannerDataChange = vi.fn();

    renderHook(() =>
      useReminderEngine({
        plannerData: makeData([], "2025-01-06"),
        onPlannerDataChange,
        onAlert: vi.fn(),
        onSummary,
      }),
    );

    expect(onSummary).toHaveBeenCalledTimes(1);
    expect(onSummary).toHaveBeenCalledWith("2025-01-07", []);
    expect(onPlannerDataChange).toHaveBeenCalledWith(
      expect.objectContaining({
        reminderState: expect.objectContaining({ lastSummaryDate: "2025-01-07" }),
      }),
    );
  });

  it("preserves a due alert while recording a missed summary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 7, 8, 0));
    const updates: PlannerData[] = [];
    const onAlert = vi.fn();

    renderHook(() =>
      useReminderEngine({
        plannerData: makeData([activity], "2025-01-06"),
        onPlannerDataChange: (next) => updates.push(next),
        onAlert,
        onSummary: vi.fn(),
      }),
    );

    expect(onAlert).toHaveBeenCalledOnce();
    expect(updates.at(-1)?.reminderState).toEqual(
      expect.objectContaining({
        activeOccurrenceKey: "renewal::2025-01-06",
        lastSummaryDate: "2025-01-07",
      }),
    );
  });

  it("presents the configured next-day summary at its evening time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 6, 20, 59));
    const onSummary = vi.fn();

    renderHook(() =>
      useReminderEngine({
        plannerData: makeData([], "2025-01-06"),
        onPlannerDataChange: vi.fn(),
        onAlert: vi.fn(),
        onSummary,
      }),
    );
    expect(onSummary).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(onSummary).toHaveBeenCalledWith("2025-01-07", []);
  });
});
