import { useState, type FormEvent } from "react";
import type { Activity, ActivityCategory } from "../domain/activity";

export type ActivityInput = {
  title: string;
  category: ActivityCategory;
  dueDate: string;
  scheduledTime?: string;
  weekdays?: number[];
};

type ActivityFormProps = {
  initialActivity?: Activity;
  onSave(activity: ActivityInput): void;
  onCancel(): void;
};

const weekdays = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

export default function ActivityForm({
  initialActivity,
  onSave,
  onCancel,
}: ActivityFormProps) {
  const [title, setTitle] = useState(initialActivity?.title ?? "");
  const [category, setCategory] = useState<ActivityCategory>(
    initialActivity?.category ?? "personal",
  );
  const [dueDate, setDueDate] = useState(initialActivity?.dueDate ?? "");
  const [scheduledTime, setScheduledTime] = useState(
    initialActivity?.scheduledTime ?? "",
  );
  const [repeatsWeekly, setRepeatsWeekly] = useState(
    Boolean(initialActivity?.weekdays?.length),
  );
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(
    initialActivity?.weekdays ?? [],
  );
  const [errors, setErrors] = useState<{ title?: string; dueDate?: string }>({});

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = {
      ...(title.trim() ? {} : { title: "Enter an activity name." }),
      ...(dueDate ? {} : { dueDate: "Choose a due date." }),
    };
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    onSave({
      title: title.trim(),
      category,
      dueDate,
      ...(scheduledTime ? { scheduledTime } : {}),
      ...(repeatsWeekly ? { weekdays: [...selectedWeekdays].sort() } : {}),
    });
  }

  function toggleWeekday(day: number) {
    setSelectedWeekdays((selected) =>
      selected.includes(day)
        ? selected.filter((value) => value !== day)
        : [...selected, day],
    );
  }

  return (
    <form className="activity-form" onSubmit={submit} noValidate>
      <div className="form-heading">
        <div>
          <p className="eyebrow">{initialActivity ? "Update activity" : "New activity"}</p>
          <h2>{initialActivity ? "Edit activity" : "Add to your plan"}</h2>
        </div>
      </div>
      <label className="field">
        <span>Activity name</span>
        <input
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "title-error" : undefined}
          placeholder="e.g. Renew vehicle insurance"
        />
      </label>
      {errors.title && <p className="field-error" id="title-error">{errors.title}</p>}

      <div className="form-row">
        <label className="field">
          <span>Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as ActivityCategory)}
          >
            <option value="personal">Personal</option>
            <option value="official">Official</option>
          </select>
        </label>
        <label className="field">
          <span>Date</span>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            aria-invalid={Boolean(errors.dueDate)}
            aria-describedby={errors.dueDate ? "date-error" : undefined}
          />
        </label>
      </div>
      {errors.dueDate && <p className="field-error" id="date-error">{errors.dueDate}</p>}

      <label className="field">
        <span>Time <small>Optional</small></span>
        <input
          type="time"
          value={scheduledTime}
          onChange={(event) => setScheduledTime(event.target.value)}
        />
        <small className="field-hint">Without a time, your reminder arrives at 6:00 AM.</small>
      </label>

      <label className="check-field">
        <input
          type="checkbox"
          checked={repeatsWeekly}
          onChange={(event) => setRepeatsWeekly(event.target.checked)}
        />
        <span>Repeat weekly</span>
      </label>
      {repeatsWeekly && (
        <fieldset className="weekday-field">
          <legend>Choose days</legend>
          <div className="weekday-options">
            {weekdays.map(({ label, value }) => (
              <label className="check-field" key={value}>
                <input
                  type="checkbox"
                  checked={selectedWeekdays.includes(value)}
                  onChange={() => toggleWeekday(value)}
                  aria-label={label}
                />
                <span>{label.slice(0, 3)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
        <button className="primary-button" type="submit">
          {initialActivity ? "Save changes" : "Add activity"}
        </button>
      </div>
    </form>
  );
}
