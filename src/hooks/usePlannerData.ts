import { useCallback, useEffect, useState } from "react";
import type {
  Activity,
  ActivityOccurrence,
  PlannerData,
  PlannerPreferences,
  ReminderState,
} from "../domain/activity";
import {
  completeOccurrence,
  rescheduleOccurrence,
} from "../domain/activitySchedule";
import {
  loadPlannerData,
  savePlannerData,
} from "../storage/localRepository";

type PlannerState = {
  data: PlannerData | null;
  error: string | null;
};

const initialState = (): PlannerState => {
  try {
    return { data: loadPlannerData(window.localStorage), error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Could not read saved planner data.",
    };
  }
};

export default function usePlannerData() {
  const [state, setState] = useState<PlannerState>(initialState);

  useEffect(() => {
    if (!state.data) {
      return;
    }
    try {
      savePlannerData(state.data, window.localStorage);
    } catch (error) {
      setState((previous) => ({
        ...previous,
        error: error instanceof Error ? error.message : "Could not save planner data on this device.",
      }));
    }
  }, [state.data]);

  const update = useCallback((transform: (data: PlannerData) => PlannerData) => {
    setState((previous) =>
      previous.data ? { data: transform(previous.data), error: null } : previous,
    );
  }, []);

  const addActivity = useCallback((activity: Omit<Activity, "id">) => {
    update((data) => ({
      ...data,
      activities: [
        ...data.activities,
        { ...activity, id: crypto.randomUUID() },
      ],
    }));
  }, [update]);

  const updateActivity = useCallback((id: string, activity: Omit<Activity, "id">) => {
    update((data) => ({
      ...data,
      activities: data.activities.map((current) =>
        current.id === id ? { ...activity, id } : current,
      ),
    }));
  }, [update]);

  const complete = useCallback((activityId: string, originalDate: string) => {
    update((data) => ({
      ...data,
      overrides: completeOccurrence(data.overrides, activityId, originalDate),
    }));
  }, [update]);

  const reschedule = useCallback(
    (activityId: string, originalDate: string, newDate: string) => {
      update((data) => ({
        ...data,
        overrides: rescheduleOccurrence(
          data.overrides,
          activityId,
          originalDate,
          newDate,
        ),
      }));
    },
    [update],
  );

  const updatePreferences = useCallback((preferences: PlannerPreferences) => {
    update((data) => ({ ...data, preferences }));
  }, [update]);

  const updateReminderData = useCallback((data: PlannerData) => {
    setState((previous) => previous.data ? { data, error: null } : previous);
  }, []);

  const updateReminderState = useCallback((reminderState: ReminderState) => {
    update((data) => ({ ...data, reminderState }));
  }, [update]);

  const editOccurrence = useCallback(
    (occurrence: ActivityOccurrence) => {
      const activity = state.data?.activities.find(
        ({ id }) => id === occurrence.activityId,
      );
      return activity;
    },
    [state.data],
  );

  return {
    data: state.data,
    error: state.error,
    addActivity,
    updateActivity,
    complete,
    reschedule,
    updatePreferences,
    updateReminderData,
    updateReminderState,
    editOccurrence,
  };
}
