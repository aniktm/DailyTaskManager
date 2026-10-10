import { useEffect, useRef } from "react";
import type {
  ActivityOccurrence,
  PlannerData,
} from "../domain/activity";
import { listOccurrences, occurrenceKey } from "../domain/activitySchedule";
import { getFirstAlertAt } from "../domain/reminders";

type ReminderEngineInput = {
  plannerData: PlannerData;
  enabled?: boolean;
  onPlannerDataChange(next: PlannerData): void;
  onAlert(occurrence: ActivityOccurrence): void;
  onSummary(date: string, occurrences: ActivityOccurrence[]): void;
};

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, count: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  result.setDate(result.getDate() + count);
  return result;
}

function timeHasPassed(now: Date, time: string): boolean {
  const [hours, minutes] = time.split(":").map(Number);
  return now.getHours() * 60 + now.getMinutes() >= hours * 60 + minutes;
}

export default function useReminderEngine({
  plannerData,
  enabled = true,
  onPlannerDataChange,
  onAlert,
  onSummary,
}: ReminderEngineInput): void {
  const latestInput = useRef({
    plannerData,
    enabled,
    onPlannerDataChange,
    onAlert,
    onSummary,
  });
  latestInput.current = {
    plannerData,
    enabled,
    onPlannerDataChange,
    onAlert,
    onSummary,
  };

  const processedKeys = useRef(new Set<string>());
  const processedSummaries = useRef(new Set<string>());
  const restoredActiveKey = useRef<string | undefined>(undefined);

  useEffect(() => {
    const check = () => {
      const {
        plannerData: data,
        enabled: isEnabled,
        onPlannerDataChange: update,
        onAlert: alert,
        onSummary: summary,
      } = latestInput.current;
      if (!isEnabled) return;
      const now = new Date();
      const today = formatDate(now);
      const tomorrow = formatDate(addDays(now, 1));
      const summaryDate = formatDate(
        addDays(now, timeHasPassed(now, data.preferences.summaryTime) ? 1 : 0),
      );
      const reminderState = data.reminderState;

      for (const key of processedKeys.current) {
        if (
          key !== reminderState.activeOccurrenceKey &&
          !reminderState.presentedOccurrenceKeys.includes(key) &&
          !reminderState.snoozedUntilByOccurrence[key]
        ) {
          processedKeys.current.delete(key);
        }
      }

      if (
        reminderState.activeOccurrenceKey &&
        restoredActiveKey.current !== reminderState.activeOccurrenceKey
      ) {
        const [activityId, originalDate] = reminderState.activeOccurrenceKey.split("::");
        const startDate = data.activities.reduce(
          (start, activity) => activity.dueDate < start ? activity.dueDate : start,
          today,
        );
        const occurrence = listOccurrences(
          data.activities,
          data.overrides,
          startDate,
          tomorrow,
        ).find(
          (item) =>
            item.activityId === activityId &&
            item.originalDate === originalDate &&
            !item.completed,
        );
        restoredActiveKey.current = reminderState.activeOccurrenceKey;
        if (occurrence) alert(occurrence);
      }

      const startDate = data.activities.reduce(
        (start, activity) => activity.dueDate < start ? activity.dueDate : start,
        today,
      );
      const dueOccurrences = listOccurrences(
        data.activities,
        data.overrides,
        startDate,
        tomorrow,
      ).filter((occurrence) => !occurrence.completed);
      let nextState = reminderState;
      let changed = false;

      for (const occurrence of dueOccurrences) {
        const key = occurrenceKey(occurrence.activityId, occurrence.originalDate);
        const snoozedUntil = nextState.snoozedUntilByOccurrence[key];
        if (snoozedUntil && Date.parse(snoozedUntil) > now.getTime()) continue;
        if (snoozedUntil) {
          const snoozedUntilByOccurrence = { ...nextState.snoozedUntilByOccurrence };
          delete snoozedUntilByOccurrence[key];
          nextState = { ...nextState, snoozedUntilByOccurrence };
          changed = true;
          processedKeys.current.delete(key);
        }

        const firstAlertDue = getFirstAlertAt(occurrence) <= now;
        const alreadyPresented = nextState.presentedOccurrenceKeys.includes(key);
        if (
          !firstAlertDue ||
          (nextState.activeOccurrenceKey && nextState.activeOccurrenceKey !== key) ||
          (alreadyPresented && !snoozedUntil) ||
          processedKeys.current.has(key)
        ) {
          continue;
        }

        processedKeys.current.add(key);
        const presentedOccurrenceKeys = alreadyPresented
          ? nextState.presentedOccurrenceKeys
          : [...nextState.presentedOccurrenceKeys, key];
        nextState = {
          ...nextState,
          presentedOccurrenceKeys,
          activeOccurrenceKey: key,
        };
        changed = true;
        restoredActiveKey.current = key;
        alert(occurrence);
      }

      if (changed) {
        update({ ...data, reminderState: nextState });
      }

      if (
        timeHasPassed(now, data.preferences.summaryTime) &&
        reminderState.lastSummaryDate !== summaryDate &&
        !processedSummaries.current.has(summaryDate)
      ) {
        processedSummaries.current.add(summaryDate);
        const occurrences = listOccurrences(
          data.activities,
          data.overrides,
          summaryDate,
          summaryDate,
        ).filter((occurrence) => !occurrence.completed);
        summary(summaryDate, occurrences);
        update({
          ...data,
          reminderState: {
            ...data.reminderState,
            ...(changed ? nextState : {}),
            lastSummaryDate: summaryDate,
          },
        });
      } else if (
        reminderState.lastSummaryDate &&
        reminderState.lastSummaryDate !== summaryDate &&
        !timeHasPassed(now, data.preferences.summaryTime) &&
        !processedSummaries.current.has(summaryDate)
      ) {
        processedSummaries.current.add(summaryDate);
        const occurrences = listOccurrences(
          data.activities,
          data.overrides,
          summaryDate,
          summaryDate,
        ).filter((occurrence) => !occurrence.completed);
        summary(summaryDate, occurrences);
        update({
          ...data,
          reminderState: {
            ...data.reminderState,
            ...(changed ? nextState : {}),
            lastSummaryDate: summaryDate,
          },
        });
      }
    };

    check();
    const timer = window.setInterval(check, 15_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") check();
    };
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);
}
