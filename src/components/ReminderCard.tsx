import { useEffect, useState, type FormEvent } from "react";
import type {
  ActivityOccurrence,
  PlannerPreferences,
} from "../domain/activity";
import useDialogFocus from "../hooks/useDialogFocus";

type ReminderCardProps = {
  occurrence: ActivityOccurrence;
  snoozeMinutes: PlannerPreferences["defaultSnoozeMinutes"];
  onComplete(): void;
  onSnooze(): void;
  onReschedule(newDate: string): void;
};

function snoozeLabel(minutes: PlannerPreferences["defaultSnoozeMinutes"]): string {
  if (minutes === 60) return "Snooze 1 hour";
  if (minutes === 180) return "Snooze 3 hours";
  if (minutes === 360) return "Snooze 6 hours";
  if (minutes === 1440) return "Snooze 1 day";
  return "Snooze 15 minutes";
}

export default function ReminderCard({
  occurrence,
  snoozeMinutes,
  onComplete,
  onSnooze,
  onReschedule,
}: ReminderCardProps) {
  const [changingDate, setChangingDate] = useState(false);
  const [date, setDate] = useState(occurrence.date);
  const dialogRef = useDialogFocus<HTMLElement>();

  useEffect(() => {
    setDate(occurrence.date);
    setChangingDate(false);
  }, [occurrence.activityId, occurrence.originalDate, occurrence.date]);

  function saveDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!date) return;
    onReschedule(date);
    setChangingDate(false);
  }

  return (
    <section
      ref={dialogRef}
      className="reminder-card"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="reminder-title"
    >
      <div className="reminder-label">
        Due {occurrence.date} · {occurrence.category === "personal" ? "Personal" : "Official"}
      </div>
      <h2 id="reminder-title">{occurrence.title}</h2>
      <p>
        {occurrence.scheduledTime
          ? `Your activity is at ${occurrence.scheduledTime}. This is your one-hour reminder.`
          : "This activity is due today. Your reminder is at 6:00 AM."}
      </p>
      {changingDate ? (
        <form className="reschedule-form" onSubmit={saveDate}>
          <label className="field">
            <span>New date</span>
            <input
              autoFocus
              aria-label="New date"
              type="date"
              required
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <button className="text-button" type="submit">Save date</button>
          <button className="text-button" type="button" onClick={() => setChangingDate(false)}>Cancel</button>
        </form>
      ) : (
        <div className="reminder-actions">
          <button className="primary-button" type="button" onClick={onComplete}>Mark complete</button>
          <button className="secondary-button" type="button" onClick={onSnooze}>
            {snoozeLabel(snoozeMinutes)}
          </button>
          <button className="secondary-button" type="button" onClick={() => setChangingDate(true)}>
            Change date
          </button>
        </div>
      )}
    </section>
  );
}
