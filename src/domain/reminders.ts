import type {
  ActivityOccurrence,
  PlannerPreferences,
} from "./activity";

export function getFirstAlertAt(occurrence: ActivityOccurrence): Date {
  const localDateTime = occurrence.scheduledTime
    ? new Date(`${occurrence.date}T${occurrence.scheduledTime}:00`)
    : new Date(`${occurrence.date}T06:00:00`);

  if (Number.isNaN(localDateTime.getTime())) {
    throw new RangeError("The activity date or time is invalid.");
  }

  if (occurrence.scheduledTime) {
    localDateTime.setTime(localDateTime.getTime() - 60 * 60 * 1000);
  }

  return localDateTime;
}

export function getSnoozeUntil(
  now: Date,
  defaultSnoozeMinutes: PlannerPreferences["defaultSnoozeMinutes"],
): Date {
  return new Date(now.getTime() + defaultSnoozeMinutes * 60 * 1000);
}
