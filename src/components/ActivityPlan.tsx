import { useState } from "react";
import type {
  ActivityCategory,
  ActivityOccurrence,
} from "../domain/activity";
import ActivityCard from "./ActivityCard";

export type ActivityPlanProps = {
  occurrences: ActivityOccurrence[];
  filter: ActivityCategory | "all";
  onComplete(activityId: string, originalDate: string): void;
  onReschedule(activityId: string, originalDate: string, newDate: string): void;
  onEdit(occurrence: ActivityOccurrence): void;
};

const categories: { value: ActivityCategory | "all"; label: string }[] = [
  { value: "all", label: "All activities" },
  { value: "personal", label: "Personal" },
  { value: "official", label: "Official" },
];

export default function ActivityPlan({
  occurrences,
  filter: initialFilter,
  onComplete,
  onReschedule,
  onEdit,
}: ActivityPlanProps) {
  const [filter, setFilter] = useState<ActivityCategory | "all">(initialFilter);
  const visible = filter === "all"
    ? occurrences
    : occurrences.filter(({ category }) => category === filter);
  const groups: { category: ActivityCategory; label: string }[] = [
    { category: "personal", label: "Personal" },
    { category: "official", label: "Official" },
  ];

  return (
    <div className="activity-plan">
      <nav className="category-filters" aria-label="Activity categories">
        {categories.map(({ value, label }) => (
          <button
            className={`filter-button${filter === value ? " active" : ""}`}
            type="button"
            key={value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </nav>

      {visible.length === 0 ? (
        <div className="empty-state compact">
          <span className="empty-icon" aria-hidden="true">✦</span>
          <h2>No activities planned yet</h2>
          <p>Add an activity to make tomorrow easier.</p>
        </div>
      ) : groups
        .filter(({ category }) => filter === "all" || category === filter)
        .map(({ category, label }) => {
          const groupOccurrences = visible.filter((item) => item.category === category);
          if (!groupOccurrences.length) {
            return null;
          }
          return (
            <section className="activity-group" key={category}>
              <h2 className="group-title">
                <span className={`group-dot ${category}`} aria-hidden="true" />
                {label}
              </h2>
              {groupOccurrences.map((occurrence) => (
                <ActivityCard
                  key={`${occurrence.activityId}:${occurrence.originalDate}`}
                  occurrence={occurrence}
                  onComplete={() => onComplete(occurrence.activityId, occurrence.originalDate)}
                  onReschedule={(date) =>
                    onReschedule(occurrence.activityId, occurrence.originalDate, date)
                  }
                  onEdit={() => onEdit(occurrence)}
                />
              ))}
            </section>
          );
        })}
    </div>
  );
}
