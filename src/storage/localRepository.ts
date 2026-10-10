import type {
  Activity,
  ActivityCategory,
  PlannerData,
  PlannerPreferences,
  ReminderState,
} from "../domain/activity";

const PLANNER_DATA_KEY = "daily-activity-planner:v1";
const SNOOZE_OPTIONS = [15, 60, 180, 360, 1440];

const DEFAULT_DATA: PlannerData = {
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
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isActivity(value: unknown): value is Activity {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !value.id ||
    typeof value.title !== "string" ||
    !value.title.trim() ||
    !["personal", "official"].includes(String(value.category)) ||
    !isDate(value.dueDate)
  ) {
    return false;
  }
  if ("scheduledTime" in value && !isTime(value.scheduledTime)) {
    return false;
  }
  if (
    "weekdays" in value &&
    (!Array.isArray(value.weekdays) ||
      value.weekdays.length === 0 ||
      value.weekdays.some(
        (weekday) =>
          !Number.isInteger(weekday) || weekday < 0 || weekday > 6,
      ))
  ) {
    return false;
  }
  return true;
}

function isPreferences(value: unknown): value is PlannerPreferences {
  return (
    isRecord(value) &&
    isTime(value.summaryTime) &&
    SNOOZE_OPTIONS.includes(value.defaultSnoozeMinutes as number)
  );
}

function isReminderState(value: unknown): value is ReminderState {
  return (
    isRecord(value) &&
    Array.isArray(value.presentedOccurrenceKeys) &&
    value.presentedOccurrenceKeys.every((key) => typeof key === "string") &&
    isRecord(value.snoozedUntilByOccurrence) &&
    Object.values(value.snoozedUntilByOccurrence).every(
      (date) => typeof date === "string" && !Number.isNaN(Date.parse(date)),
    ) &&
    (!("activeOccurrenceKey" in value) ||
      typeof value.activeOccurrenceKey === "string") &&
    (!("lastSummaryDate" in value) || isDate(value.lastSummaryDate))
  );
}

function isPlannerData(value: unknown): value is PlannerData {
  return (
    isRecord(value) &&
    Array.isArray(value.activities) &&
    value.activities.every(isActivity) &&
    isRecord(value.overrides) &&
    Object.values(value.overrides).every(
      (override) =>
        isRecord(override) &&
        (override.completed === undefined ||
          typeof override.completed === "boolean") &&
        (override.rescheduledDate === undefined ||
          isDate(override.rescheduledDate)),
    ) &&
    isReminderState(value.reminderState) &&
    isPreferences(value.preferences)
  );
}

export function loadPlannerData(storage: Storage): PlannerData {
  let serialized: string | null;
  try {
    serialized = storage.getItem(PLANNER_DATA_KEY);
  } catch (error) {
    throw new Error("Could not read saved planner data.", { cause: error });
  }

  if (serialized === null) {
    return structuredClone(DEFAULT_DATA);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch (error) {
    throw new Error(
      "Saved planner data is invalid. Clear browser storage only if you no longer need it.",
      { cause: error },
    );
  }

  if (!isPlannerData(parsed)) {
    throw new Error(
      "Saved planner data is invalid. Clear browser storage only if you no longer need it.",
    );
  }

  return parsed;
}

export function savePlannerData(data: PlannerData, storage: Storage): void {
  try {
    storage.setItem(PLANNER_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    throw new Error("Could not save planner data on this device.", {
      cause: error,
    });
  }
}

export function isActivityCategory(value: unknown): value is ActivityCategory {
  return value === "personal" || value === "official";
}
