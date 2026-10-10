import { useState } from "react";
import type { PlannerPreferences } from "../domain/activity";

type SettingsPanelProps = {
  preferences: PlannerPreferences;
  onSave(preferences: PlannerPreferences): void;
};

const snoozeOptions: {
  value: PlannerPreferences["defaultSnoozeMinutes"];
  label: string;
}[] = [
  { value: 15, label: "15 minutes" },
  { value: 60, label: "1 hour" },
  { value: 180, label: "3 hours" },
  { value: 360, label: "6 hours" },
  { value: 1440, label: "1 day" },
];

function snoozeLabel(minutes: PlannerPreferences["defaultSnoozeMinutes"]): string {
  return minutes === 60
    ? "Snooze 1 hour"
    : minutes === 1440
      ? "Snooze 1 day"
      : `Snooze ${minutes} minutes`;
}

export default function SettingsPanel({
  preferences,
  onSave,
}: SettingsPanelProps) {
  const [summaryTime, setSummaryTime] = useState(preferences.summaryTime);
  const [snoozeMinutes, setSnoozeMinutes] = useState(
    preferences.defaultSnoozeMinutes,
  );

  return (
    <section className="settings-panel" aria-labelledby="settings-title">
      <div className="section-title">
        <div>
          <p className="eyebrow">Make it yours</p>
          <h2 id="settings-title">Reminder preferences</h2>
        </div>
        <span aria-hidden="true">⚙</span>
      </div>
      <label className="field setting-field">
        <span>Evening summary time</span>
        <input
          type="time"
          value={summaryTime}
          onChange={(event) => setSummaryTime(event.target.value)}
        />
      </label>
      <label className="field setting-field">
        <span>Default snooze window</span>
        <select
          value={snoozeMinutes}
          onChange={(event) =>
            setSnoozeMinutes(
              Number(event.target.value) as PlannerPreferences["defaultSnoozeMinutes"],
            )
          }
        >
          {snoozeOptions.map(({ value, label }) => (
            <option value={value} key={value}>{label}</option>
          ))}
        </select>
      </label>
      <div className="setting-preview">
        <span>Reminder button preview</span>
        <button className="secondary-button" type="button" disabled>
          {snoozeLabel(snoozeMinutes)}
        </button>
      </div>
      <p className="local-note">
        In-app alerts are available while the planner is open. If you miss the evening summary,
        you’ll see it the next time you return.
      </p>
      <button
        className="primary-button save-settings"
        type="button"
        onClick={() => onSave({ summaryTime, defaultSnoozeMinutes: snoozeMinutes })}
      >
        Save preferences
      </button>
    </section>
  );
}
