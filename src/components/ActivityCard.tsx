import { useState, type FormEvent } from "react";
import type { ActivityOccurrence } from "../domain/activity";

type ActivityCardProps = {
  occurrence: ActivityOccurrence;
  onComplete(): void;
  onReschedule(newDate: string): void;
  onEdit(): void;
};

export default function ActivityCard({
  occurrence,
  onComplete,
  onReschedule,
  onEdit,
}: ActivityCardProps) {
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState(occurrence.date);

  function saveDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newDate) {
      return;
    }
    onReschedule(newDate);
    setRescheduling(false);
  }

  return (
    <article className={`activity-card${occurrence.completed ? " completed" : ""}`}>
      <button
        className="complete-toggle"
        type="button"
        aria-label={`${occurrence.completed ? "Mark incomplete" : "Mark complete"}: ${occurrence.title}`}
        aria-pressed={occurrence.completed}
        onClick={onComplete}
      >
        {occurrence.completed ? "✓" : ""}
      </button>
      <div className="activity-details">
        <h3>{occurrence.title}</h3>
        <p>
          {occurrence.scheduledTime
            ? `Reminder 1 hour before · ${occurrence.scheduledTime}`
            : "Due today · Reminder at 6:00 AM"}
        </p>
        {rescheduling ? (
          <form
            className="reschedule-form"
            role="dialog"
            aria-label="Change activity date"
            onSubmit={saveDate}
          >
            <label className="field">
              <span>New date</span>
              <input
                autoFocus
                aria-label="New date"
                type="date"
                required
                value={newDate}
                onChange={(event) => setNewDate(event.target.value)}
              />
            </label>
            <button className="text-button" type="submit">Save date</button>
            <button className="text-button" type="button" onClick={() => setRescheduling(false)}>Cancel</button>
          </form>
        ) : (
          <div className="activity-actions">
            <button className="text-button" type="button" onClick={onEdit}>Edit</button>
            <button
              className="text-button"
              type="button"
              aria-label={`Change date for ${occurrence.title}`}
              onClick={() => setRescheduling(true)}
            >
              Change date
            </button>
          </div>
        )}
      </div>
      <time className="activity-time">
        {occurrence.scheduledTime ?? "All day"}
      </time>
    </article>
  );
}
