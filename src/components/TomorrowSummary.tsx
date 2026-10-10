import { useState } from "react";
import type { ActivityOccurrence } from "../domain/activity";
import useDialogFocus from "../hooks/useDialogFocus";

type TomorrowSummaryProps = {
  summaryDate: string;
  occurrences: ActivityOccurrence[];
};

export default function TomorrowSummary({
  summaryDate,
  occurrences,
}: TomorrowSummaryProps) {
  const [open, setOpen] = useState(true);
  const dialogRef = useDialogFocus<HTMLElement>();
  if (!open) return null;

  const today = new Date();
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const isCatchUp = summaryDate === localToday;
  const personal = occurrences.filter((item) => item.category === "personal");
  const official = occurrences.filter((item) => item.category === "official");

  return (
    <div className="form-overlay summary-overlay">
      <section
        ref={dialogRef}
        className="tomorrow-summary"
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-title"
      >
        <div className="summary-heading">
          <div>
            <p className="eyebrow">
              {isCatchUp ? "Your morning catch-up" : "Your evening preview"}
            </p>
            <h2 id="summary-title">
              {isCatchUp ? "Today, at a glance" : "Tomorrow, at a glance"}
            </h2>
            <p className="subtitle">{summaryDate}</p>
          </div>
          <button
            className="text-button"
            type="button"
            aria-label="Close tomorrow summary"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
        {occurrences.length === 0 ? (
          <p className="summary-empty">Nothing planned yet. Enjoy the open space.</p>
        ) : (
          <div className="summary-groups">
            {([
              ["Personal", personal],
              ["Official", official],
            ] as const).map(([label, group]) => {
              return group.length ? (
                <section key={label} aria-label={`${label} activities`}>
                  <h3>{label}</h3>
                  {group.map((item) => (
                    <div
                      className="summary-activity"
                      key={`${item.activityId}::${item.originalDate}`}
                    >
                      <span>{item.title}</span>
                      <span>{item.scheduledTime ?? "All day"}</span>
                    </div>
                  ))}
                </section>
              ) : null;
            })}
          </div>
        )}
        <button className="primary-button summary-done" type="button" onClick={() => setOpen(false)}>
          Got it
        </button>
      </section>
    </div>
  );
}
