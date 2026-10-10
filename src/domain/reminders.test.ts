import { describe, expect, it } from "vitest";
import type { ActivityOccurrence } from "./activity";
import { getFirstAlertAt, getSnoozeUntil } from "./reminders";

const occurrence = (
  date: string,
  scheduledTime?: string,
): ActivityOccurrence => ({
  activityId: "renewal",
  originalDate: date,
  date,
  title: "Renew insurance",
  category: "personal",
  scheduledTime,
  completed: false,
});

const localTime = (date: Date) => [
  date.getFullYear(),
  date.getMonth() + 1,
  date.getDate(),
  date.getHours(),
  date.getMinutes(),
];

describe("getFirstAlertAt", () => {
  it("alerts untimed activities at 6:00 AM on their due date", () => {
    expect(localTime(getFirstAlertAt(occurrence("2025-01-06")))).toEqual([
      2025, 1, 6, 6, 0,
    ]);
  });

  it("alerts timed activities one hour before their scheduled time", () => {
    expect(localTime(getFirstAlertAt(occurrence("2025-01-06", "10:30")))).toEqual([
      2025, 1, 6, 9, 30,
    ]);
  });

  it("places a lead alert on the prior date when the activity is shortly after midnight", () => {
    expect(localTime(getFirstAlertAt(occurrence("2025-01-06", "00:30")))).toEqual([
      2025, 1, 5, 23, 30,
    ]);
  });

  it("calculates one hour before spring-forward time in local time", () => {
    expect(localTime(getFirstAlertAt(occurrence("2025-03-09", "03:30")))).toEqual([
      2025, 3, 9, 1, 30,
    ]);
  });

  it("calculates one hour before fall-back time in local time", () => {
    expect(localTime(getFirstAlertAt(occurrence("2025-11-02", "03:30")))).toEqual([
      2025, 11, 2, 2, 30,
    ]);
  });
});

describe("getSnoozeUntil", () => {
  it.each([15, 60, 180, 360, 1440] as const)(
    "adds the selected %i-minute snooze duration",
    (minutes) => {
      const now = new Date(2025, 0, 6, 8, 0);
      const expected = new Date(now.getTime() + minutes * 60_000);

      expect(getSnoozeUntil(now, minutes)).toEqual(expected);
    },
  );
});
