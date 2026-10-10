import type {
  Activity,
  ActivityOccurrence,
  OccurrenceOverrides,
} from "./activity";

export function occurrenceKey(activityId: string, originalDate: string): string {
  return `${activityId}::${originalDate}`;
}

function parseLocalDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new RangeError(`Invalid local date: ${value}`);
  }

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12);
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    throw new RangeError(`Invalid local date: ${value}`);
  }

  return date;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear().toString().padStart(4, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addLocalDay(value: string): string {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + 1);
  return formatLocalDate(date);
}

function includesWeekday(activity: Activity, date: string): boolean {
  if (!activity.weekdays?.length) {
    return date === activity.dueDate;
  }

  return activity.weekdays.includes(parseLocalDate(date).getDay());
}

function makeOccurrence(
  activity: Activity,
  originalDate: string,
  overrides: OccurrenceOverrides,
): ActivityOccurrence {
  const override = overrides[occurrenceKey(activity.id, originalDate)];
  return {
    activityId: activity.id,
    originalDate,
    date: override?.rescheduledDate ?? originalDate,
    title: activity.title,
    category: activity.category,
    scheduledTime: activity.scheduledTime,
    completed: override?.completed ?? false,
  };
}

export function listOccurrences(
  activities: Activity[],
  overrides: OccurrenceOverrides,
  startDate: string,
  endDate: string,
): ActivityOccurrence[] {
  parseLocalDate(startDate);
  parseLocalDate(endDate);
  if (endDate < startDate) {
    throw new RangeError("The end date must not be before the start date.");
  }

  const byOccurrence = new Map<string, ActivityOccurrence>();

  const addIfInRange = (activity: Activity, originalDate: string) => {
    if (!includesWeekday(activity, originalDate)) {
      return;
    }
    const occurrence = makeOccurrence(activity, originalDate, overrides);
    if (occurrence.date >= startDate && occurrence.date <= endDate) {
      byOccurrence.set(
        occurrenceKey(activity.id, originalDate),
        occurrence,
      );
    }
  };

  for (const activity of activities) {
    parseLocalDate(activity.dueDate);
    if (activity.weekdays?.length) {
      for (
        let date = activity.dueDate > startDate ? activity.dueDate : startDate;
        date <= endDate;
        date = addLocalDay(date)
      ) {
        addIfInRange(activity, date);
      }
    } else {
      addIfInRange(activity, activity.dueDate);
    }

    const overridePrefix = `${activity.id}::`;
    for (const [key, override] of Object.entries(overrides)) {
      if (!override.rescheduledDate || !key.startsWith(overridePrefix)) {
        continue;
      }
      const originalDate = key.slice(overridePrefix.length);
      if (
        originalDate < activity.dueDate ||
        originalDate === "" ||
        !includesWeekday(activity, originalDate)
      ) {
        continue;
      }
      if (
        override.rescheduledDate >= startDate &&
        override.rescheduledDate <= endDate
      ) {
        addIfInRange(activity, originalDate);
      }
    }
  }

  return [...byOccurrence.values()].sort((left, right) => {
    const dateOrder = left.date.localeCompare(right.date);
    if (dateOrder !== 0) {
      return dateOrder;
    }
    return (left.scheduledTime ?? "").localeCompare(right.scheduledTime ?? "");
  });
}

export function completeOccurrence(
  overrides: OccurrenceOverrides,
  activityId: string,
  originalDate: string,
): OccurrenceOverrides {
  const key = occurrenceKey(activityId, originalDate);
  return {
    ...overrides,
    [key]: {
      ...overrides[key],
      completed: true,
    },
  };
}

export function rescheduleOccurrence(
  overrides: OccurrenceOverrides,
  activityId: string,
  originalDate: string,
  newDate: string,
): OccurrenceOverrides {
  parseLocalDate(newDate);
  const key = occurrenceKey(activityId, originalDate);
  return {
    ...overrides,
    [key]: {
      ...overrides[key],
      rescheduledDate: newDate,
    },
  };
}
