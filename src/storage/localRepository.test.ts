import { describe, expect, it } from "vitest";
import type { PlannerData } from "../domain/activity";
import { loadPlannerData, savePlannerData } from "./localRepository";

const emptyData = (): PlannerData => ({
  activities: [],
  overrides: {},
  reminderState: {
    presentedOccurrenceKeys: [],
    snoozedUntilByOccurrence: {},
  },
  preferences: {
    summaryTime: "21:00",
    defaultSnoozeMinutes: 60,
  },
});

function failingStorage(operation: "get" | "set"): Storage {
  return {
    get length() {
      return 0;
    },
    clear() {},
    key() {
      return null;
    },
    getItem() {
      if (operation === "get") {
        throw new Error("storage read denied");
      }
      return null;
    },
    removeItem() {},
    setItem() {
      if (operation === "set") {
        throw new Error("storage write denied");
      }
    },
  };
}

describe("local planner repository", () => {
  it("uses the configured defaults when no planner data exists", () => {
    expect(loadPlannerData(localStorage)).toEqual(emptyData());
  });

  it("round-trips planner data", () => {
    const data = emptyData();
    data.activities.push({
      id: "renewal",
      title: "Renew insurance",
      category: "personal",
      dueDate: "2025-01-06",
    });

    savePlannerData(data, localStorage);

    expect(loadPlannerData(localStorage)).toEqual(data);
  });

  it("throws explicitly when stored JSON is corrupt", () => {
    localStorage.setItem("daily-activity-planner:v1", "{");

    expect(() => loadPlannerData(localStorage)).toThrow(
      "Saved planner data is invalid. Clear browser storage only if you no longer need it.",
    );
  });

  it("throws explicitly when stored data has an invalid shape", () => {
    localStorage.setItem(
      "daily-activity-planner:v1",
      JSON.stringify({ activities: "not-an-array" }),
    );

    expect(() => loadPlannerData(localStorage)).toThrow(
      "Saved planner data is invalid. Clear browser storage only if you no longer need it.",
    );
  });

  it("does not mask a storage read failure as an empty planner", () => {
    expect(() => loadPlannerData(failingStorage("get"))).toThrow(
      "Could not read saved planner data.",
    );
  });

  it("does not report success when a storage write fails", () => {
    expect(() => savePlannerData(emptyData(), failingStorage("set"))).toThrow(
      "Could not save planner data on this device.",
    );
  });
});
