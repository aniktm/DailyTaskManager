export type ActivityCategory = "personal" | "official";

export type Activity = {
  id: string;
  title: string;
  category: ActivityCategory;
  dueDate: string;
  scheduledTime?: string;
  weekdays?: number[];
};

export type ActivityOccurrence = {
  activityId: string;
  originalDate: string;
  date: string;
  title: string;
  category: ActivityCategory;
  scheduledTime?: string;
  completed: boolean;
};

export type OccurrenceOverride = {
  completed?: boolean;
  rescheduledDate?: string;
};

export type OccurrenceOverrides = Record<string, OccurrenceOverride>;

export type ReminderState = {
  presentedOccurrenceKeys: string[];
  snoozedUntilByOccurrence: Record<string, string>;
  activeOccurrenceKey?: string;
  lastSummaryDate?: string;
};

export type PlannerPreferences = {
  summaryTime: string;
  defaultSnoozeMinutes: 15 | 60 | 180 | 360 | 1440;
};

export type PlannerData = {
  activities: Activity[];
  overrides: OccurrenceOverrides;
  reminderState: ReminderState;
  preferences: PlannerPreferences;
};
