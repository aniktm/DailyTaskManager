import { useEffect, useState } from "react";
import type {
  Activity,
  ActivityOccurrence,
  PlannerData,
} from "./domain/activity";
import { listOccurrences } from "./domain/activitySchedule";
import ActivityForm, { type ActivityInput } from "./components/ActivityForm";
import ActivityPlan from "./components/ActivityPlan";
import ReminderCard from "./components/ReminderCard";
import SettingsPanel from "./components/SettingsPanel";
import TomorrowSummary from "./components/TomorrowSummary";
import useReminderEngine from "./hooks/useReminderEngine";
import usePlannerData from "./hooks/usePlannerData";
import { getSnoozeUntil } from "./domain/reminders";

const emptyPlannerData: PlannerData = {
  activities: [],
  overrides: {},
  reminderState: {
    presentedOccurrenceKeys: [],
    snoozedUntilByOccurrence: {},
  },
  preferences: { summaryTime: "21:00", defaultSnoozeMinutes: 60 },
};

function localDateString(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

function getTomorrow(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return localDateString(tomorrow);
}

function activityInput(activity: Activity): ActivityInput {
  return {
    title: activity.title,
    category: activity.category,
    dueDate: activity.dueDate,
    ...(activity.scheduledTime ? { scheduledTime: activity.scheduledTime } : {}),
    ...(activity.weekdays ? { weekdays: activity.weekdays } : {}),
  };
}

export default function App() {
  const planner = usePlannerData();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | undefined>();
  const [activeAlert, setActiveAlert] = useState<ActivityOccurrence | null>(null);
  const [summary, setSummary] = useState<{
    date: string;
    occurrences: ActivityOccurrence[];
  } | null>(null);
  const plannerData = planner.data ?? emptyPlannerData;

  useReminderEngine({
    plannerData,
    enabled: planner.data !== null,
    onPlannerDataChange: planner.updateReminderData,
    onAlert: setActiveAlert,
    onSummary: (date, occurrences) => setSummary({ date, occurrences }),
  });

  const [tomorrow, setTomorrow] = useState(getTomorrow);
  useEffect(() => {
    const timer = window.setInterval(() => setTomorrow(getTomorrow()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const occurrences = planner.data
    ? listOccurrences(planner.data.activities, planner.data.overrides, tomorrow, tomorrow)
    : [];

  function clearActiveReminder(resetOccurrence = false): void {
    if (!planner.data) return;
    const key = activeAlert
      ? `${activeAlert.activityId}::${activeAlert.originalDate}`
      : undefined;
    const { activeOccurrenceKey: _activeOccurrenceKey, ...reminderState } =
      planner.data.reminderState;
    if (resetOccurrence && key) {
      const snoozedUntilByOccurrence = { ...reminderState.snoozedUntilByOccurrence };
      delete snoozedUntilByOccurrence[key];
      planner.updateReminderState({
        ...reminderState,
        presentedOccurrenceKeys: reminderState.presentedOccurrenceKeys.filter(
          (presentedKey) => presentedKey !== key,
        ),
        snoozedUntilByOccurrence,
      });
    } else {
      planner.updateReminderState(reminderState);
    }
    setActiveAlert(null);
  }

  function snoozeActiveReminder(): void {
    if (!planner.data || !activeAlert) return;
    const key = `${activeAlert.activityId}::${activeAlert.originalDate}`;
    const { activeOccurrenceKey: _activeOccurrenceKey, ...reminderState } =
      planner.data.reminderState;
    planner.updateReminderState({
      ...reminderState,
      snoozedUntilByOccurrence: {
        ...reminderState.snoozedUntilByOccurrence,
        [key]: getSnoozeUntil(
          new Date(),
          planner.data.preferences.defaultSnoozeMinutes,
        ).toISOString(),
      },
    });
    setActiveAlert(null);
  }

  function saveActivity(input: ActivityInput) {
    if (editing) {
      planner.updateActivity(editing.id, input);
    } else {
      planner.addActivity(input);
    }
    setEditing(undefined);
    setFormOpen(false);
  }

  function editOccurrence(occurrence: ActivityOccurrence) {
    const activity = planner.editOccurrence(occurrence);
    if (activity) {
      setEditing(activity);
      setFormOpen(true);
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="brand" href="#" aria-label="Daylight home">
          <span aria-hidden="true">✳</span> Daylight
        </a>
        <p className="date-label">Your day, thoughtfully planned</p>
      </header>

      <section className="plan-section" aria-labelledby="plan-title">
        <div className="plan-heading">
          <div>
            <p className="eyebrow">Daily planner</p>
            <h1 id="plan-title">Tomorrow’s plan</h1>
            <p className="subtitle">A calmer start begins with a clear plan.</p>
          </div>
          <div className="plan-heading-actions">
            <time className="date-pill" dateTime={tomorrow}>{tomorrow}</time>
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
            >
              + Add activity
            </button>
          </div>
        </div>

        {planner.error && <p className="storage-error" role="alert">{planner.error}</p>}
        {formOpen && (
          <div className="form-overlay">
            <ActivityForm
              initialActivity={editing}
              onSave={saveActivity}
              onCancel={() => {
                setFormOpen(false);
                setEditing(undefined);
              }}
            />
          </div>
        )}
        {planner.data && (
          <ActivityPlan
            occurrences={occurrences}
            filter="all"
            onComplete={planner.complete}
            onReschedule={planner.reschedule}
            onEdit={editOccurrence}
          />
        )}
      </section>

      {planner.data && (
        <SettingsPanel
          preferences={planner.data.preferences}
          onSave={planner.updatePreferences}
        />
      )}
      {activeAlert && planner.data && (
        <div className="form-overlay reminder-overlay">
          <ReminderCard
            occurrence={activeAlert}
            snoozeMinutes={planner.data.preferences.defaultSnoozeMinutes}
            onComplete={() => {
              planner.complete(activeAlert.activityId, activeAlert.originalDate);
              clearActiveReminder();
            }}
            onSnooze={snoozeActiveReminder}
            onReschedule={(newDate) => {
              planner.reschedule(activeAlert.activityId, activeAlert.originalDate, newDate);
              clearActiveReminder(true);
            }}
          />
        </div>
      )}
      {summary && (
        <TomorrowSummary
          key={summary.date}
          summaryDate={summary.date}
          occurrences={summary.occurrences}
        />
      )}
    </main>
  );
}
