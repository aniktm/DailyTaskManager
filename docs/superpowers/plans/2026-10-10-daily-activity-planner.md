# Daily Activity Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive, local-only daily activity planner with Personal and Official tasks, weekly repeats, an evening preview, and in-app reminders while open.

**Architecture:** A React/TypeScript/Vite single-page app separates activity and reminder rules from React components and browser persistence. Activities, occurrence exceptions, reminder state, and preferences live in localStorage; a foreground scheduler checks due events and reconciles overdue items when the app becomes active.

**Tech Stack:** React, TypeScript, Vite, CSS, browser localStorage, Vitest, React Testing Library, jsdom.

**Spec:** `docs/superpowers/specs/2026-10-10-daily-activity-planner-design.md`

## Global Constraints

- “The first version is a responsive web app for one person.”
- “Version one supports weekly recurrence on one or more selected weekdays; monthly and every-N-days patterns are out of scope.”
- “An activity with no scheduled time is due for its first alert at **6:00 AM** on its due date.”
- “An activity with a scheduled time alerts **one hour before** that time.”
- “Alerts are in-app only and can be delivered only while the web app is open.”
- “The reminder button displays the configured duration (for example, **Snooze 1 hour**) and applies it with one tap.”
- “Store activities and preferences only in the browser on the current device.”
- “Do not add accounts, a backend, email delivery, browser push, or cross-device synchronization in version one.”
- “Version one does not send automatic 15-minute follow-ups. Those are deferred to the future native app.”

## Review Focus

- Local-calendar arithmetic across a daylight-saving transition; the alert must retain the intended local wall-clock time. Test in Task 2 with the test process pinned to a DST-observing time zone.
- A repeating occurrence is completed or moved without changing other occurrences in the series. Test in Tasks 2 and 4.
- A scheduled activity whose one-hour lead crosses midnight still alerts at the correct local time. Test in Task 2.
- Missing, corrupt, or unavailable localStorage must not silently erase or replace user data. Test in Task 3 and verify visible error handling in Task 4.
- The app is closed at summary time or suspended when a reminder becomes due; on return, show the missed summary and due/overdue activities without fabricating a background notification. Test in Task 5.

---

## File Structure

- `src/domain/activity.ts` — activity, occurrence, override, reminder-state, and preference types.
- `src/domain/activitySchedule.ts` — local-date arithmetic, weekly occurrence expansion, and occurrence completion/rescheduling.
- `src/domain/reminders.ts` — first-alert and snooze time calculations.
- `src/storage/localRepository.ts` — version-one localStorage read/write boundary and storage error handling.
- `src/hooks/usePlannerData.ts` — React state backed by the repository.
- `src/hooks/useReminderEngine.ts` — foreground timer and visibility/focus reconciliation.
- `src/components/ActivityForm.tsx` — create/edit form for one-off and weekly activities.
- `src/components/ActivityPlan.tsx` — grouped next-day/current-day task views and filters.
- `src/components/ActivityCard.tsx` — activity details and complete/reschedule actions.
- `src/components/SettingsPanel.tsx` — evening summary time and app-wide default snooze setting.
- `src/components/TomorrowSummary.tsx` — next-day summary and missed-summary catch-up.
- `src/components/ReminderCard.tsx` — in-app alert and its three actions.
- `src/App.tsx`, `src/main.tsx`, `src/styles.css` — app composition, entry point, and responsive presentation.
- Corresponding `*.test.ts` and `*.test.tsx` files beside domain, storage, hooks, and components.

The workspace is not currently a Git repository. Do not add Git commit steps; if implementation moves to a version-controlled repository, commit each independently verified task there.

### Task 1: Scaffold the React app and test harness

**Files:**
- Create: `package.json`, `index.html`, `tsconfig.json`, `vite.config.ts`
- Create: `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `src/test/setup.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: a Vite React/TypeScript app, `npm run dev`, `npm run build`, and `npm test -- --run`.

- [ ] **Step 1: Add the test and build toolchain**

Configure React, TypeScript, Vite, Vitest, jsdom, React Testing Library, `user-event`, and `jest-dom`. Add `test` and `build` scripts. Avoid a UI component framework and a date library.

- [ ] **Step 2: Write the failing app smoke test**

In `src/App.test.tsx`, assert that rendering `App` shows the heading “Tomorrow’s plan” and the Personal and Official category controls.

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- --run src/App.test.tsx`  
Expected: FAIL because the application shell is not implemented.

- [ ] **Step 4: Implement the minimal app shell**

Create `main.tsx`, `App.tsx`, and `styles.css`; render the heading, category controls, and a responsive empty-plan state.

- [ ] **Step 5: Run the test and build**

Run: `npm test -- --run src/App.test.tsx && npm run build`  
Expected: PASS and a successful Vite production build.

### Task 2: Implement activity, recurrence, and reminder-time rules

**Files:**
- Create: `src/domain/activity.ts`, `src/domain/activitySchedule.ts`, `src/domain/reminders.ts`
- Test: `src/domain/activitySchedule.test.ts`, `src/domain/reminders.test.ts`

**Interfaces:**
- Produces:
  - `ActivityCategory = "personal" | "official"`.
  - `Activity = { id: string; title: string; category: ActivityCategory; dueDate: string; scheduledTime?: string; weekdays?: number[] }`.
  - `ActivityOccurrence = { activityId: string; originalDate: string; date: string; title: string; category: ActivityCategory; scheduledTime?: string; completed: boolean }`.
  - `OccurrenceOverride = { completed?: boolean; rescheduledDate?: string }`.
  - `OccurrenceOverrides = Record<string, OccurrenceOverride>`, keyed by `occurrenceKey(activityId, originalDate)`.
  - `occurrenceKey(activityId: string, originalDate: string): string`.
  - `ReminderState = { presentedOccurrenceKeys: string[]; snoozedUntilByOccurrence: Record<string, string>; lastSummaryDate?: string }`.
  - `PlannerPreferences` with local `summaryTime` and `defaultSnoozeMinutes: 15 | 60 | 180 | 360 | 1440`.
  - `PlannerData = { activities: Activity[]; overrides: OccurrenceOverrides; reminderState: ReminderState; preferences: PlannerPreferences }`.
  - `listOccurrences(activities: Activity[], overrides: OccurrenceOverrides, startDate: string, endDate: string): ActivityOccurrence[]`.
  - `completeOccurrence(overrides: OccurrenceOverrides, activityId: string, originalDate: string): OccurrenceOverrides`.
  - `rescheduleOccurrence(overrides: OccurrenceOverrides, activityId: string, originalDate: string, newDate: string): OccurrenceOverrides`.
  - `getFirstAlertAt(occurrence: ActivityOccurrence): Date` and `getSnoozeUntil(now: Date, defaultSnoozeMinutes: PlannerPreferences["defaultSnoozeMinutes"]): Date`.
- Consumes: none.

- [ ] **Step 1: Write failing activity-schedule tests**

Test one-off date inclusion, weekly recurrence on multiple selected weekdays, exclusion of weekdays before the series start date, and occurrence overrides. Assert that a rescheduled occurrence appears on its new display date and not its original date, while completing or moving it leaves later occurrences unchanged.

- [ ] **Step 2: Run schedule tests to verify they fail**

Run: `npm test -- --run src/domain/activitySchedule.test.ts`  
Expected: FAIL because the domain types and functions are not implemented.

- [ ] **Step 3: Implement typed activity and occurrence functions**

Use local date strings (`YYYY-MM-DD`) and weekday numbers where Sunday is `0`. Keep occurrence identity tied to the original scheduled date so rescheduling does not rewrite the weekly rule.

- [ ] **Step 4: Run schedule tests to verify they pass**

Run: `npm test -- --run src/domain/activitySchedule.test.ts`  
Expected: PASS, including the single-occurrence completion and reschedule assertions.

- [ ] **Step 5: Write failing reminder-time tests**

Assert that an untimed activity alerts at 6:00 AM local time on its due date; a timed activity alerts exactly 60 minutes before its scheduled local time; and a scheduled time shortly after midnight can produce a lead alert on the prior local date. In `America/New_York`, assert that `2025-03-09 03:30` alerts at `2025-03-09 01:30`, and `2025-11-02 03:30` alerts at `2025-11-02 02:30`. Assert all five snooze durations: 15, 60, 180, 360, and 1440 minutes.

- [ ] **Step 6: Run reminder tests to verify they fail**

Run: `npm test -- --run src/domain/reminders.test.ts`  
Expected: FAIL because reminder calculation functions are not implemented.

- [ ] **Step 7: Implement local-calendar reminder calculations**

Calculate using local date/time components rather than assuming every local day is exactly 24 hours. Do not add background notifications or a repeat-alert policy.

- [ ] **Step 8: Verify reminder tests, including daylight-saving behavior**

Run: `TZ=America/New_York npm test -- --run src/domain/reminders.test.ts`  
Expected: PASS for the stated alert times on both sides of a daylight-saving transition.

### Task 3: Persist planner data and preferences on-device

**Files:**
- Create: `src/storage/localRepository.ts`, `src/storage/localRepository.test.ts`

**Interfaces:**
- Consumes: `PlannerData` and `PlannerPreferences` from Task 2.
- Produces:
  - `loadPlannerData(storage: Storage): PlannerData`
  - `savePlannerData(data: PlannerData, storage: Storage): void`

- [ ] **Step 1: Write failing repository tests**

Test absent keys returning an empty planner with documented defaults, round-trip persistence, invalid JSON, invalid stored shapes, and storage read/write failures. Invalid or inaccessible storage must surface an error rather than silently replacing user data with empty data.

- [ ] **Step 2: Run repository tests to verify they fail**

Run: `npm test -- --run src/storage/localRepository.test.ts`  
Expected: FAIL because the repository does not exist.

- [ ] **Step 3: Implement the localStorage repository**

Use one versioned planner-data key. The initial configurable defaults are a **9:00 PM** evening summary and a **1-hour** snooze. Inject the `Storage` dependency so tests can simulate failures without changing production behavior.

- [ ] **Step 4: Run repository tests to verify they pass**

Run: `npm test -- --run src/storage/localRepository.test.ts`  
Expected: PASS, including explicit errors for corrupt and unavailable storage.

### Task 4: Build task creation, editing, planning, and settings

**Files:**
- Create: `src/hooks/usePlannerData.ts`
- Create: `src/components/ActivityForm.tsx`, `src/components/ActivityPlan.tsx`, `src/components/ActivityCard.tsx`, `src/components/SettingsPanel.tsx`
- Modify: `src/App.tsx`, `src/App.test.tsx`, `src/styles.css`
- Test: `src/components/ActivityForm.test.tsx`, `src/components/ActivityPlan.test.tsx`, `src/components/SettingsPanel.test.tsx`

**Interfaces:**
- Consumes: Task 2 domain functions and Task 3 repository functions.
- Produces:
  - `ActivityInput = { title: string; category: ActivityCategory; dueDate: string; scheduledTime?: string; weekdays?: number[] }`.
  - `ActivityFormProps = { initialActivity?: Activity; onSave(activity: ActivityInput): void; onCancel(): void }`.
  - `ActivityPlanProps = { occurrences: ActivityOccurrence[]; filter: ActivityCategory | "all"; onComplete(activityId: string, originalDate: string): void; onReschedule(activityId: string, originalDate: string, newDate: string): void }`.
  - `SettingsPanelProps = { preferences: PlannerPreferences; onSave(preferences: PlannerPreferences): void }`.

- [ ] **Step 1: Write failing form and plan tests**

Test creating and editing a Personal or Official one-off activity; creating a weekly activity by selecting multiple weekdays; showing the next-day list grouped by category; filtering to Personal and Official; and rescheduling one recurring occurrence without moving its future occurrences. Test invalid blank titles and missing due dates with visible validation.

- [ ] **Step 2: Run component tests to verify they fail**

Run: `npm test -- --run src/components/ActivityForm.test.tsx src/components/ActivityPlan.test.tsx`  
Expected: FAIL because the task-management components are not implemented.

- [ ] **Step 3: Implement form, plan, and card components**

Use the domain model for all date and occurrence changes. Persist activity edits through `usePlannerData`; keep each form focused on activity fields and leave reminder preferences in `SettingsPanel`.

- [ ] **Step 4: Write failing settings tests**

Test changing and saving the evening summary time and each of the five app-wide snooze values. Verify the selected snooze duration is presented as the reminder button label. Add an app test that inaccessible storage shows a visible error instead of displaying a successful empty plan.

- [ ] **Step 5: Run settings tests to verify they fail**

Run: `npm test -- --run src/components/SettingsPanel.test.tsx`  
Expected: FAIL because the settings UI is not implemented.

- [ ] **Step 6: Implement settings and storage-error feedback**

Render the selected time and snooze option; show storage errors in the app rather than claiming a save succeeded.

- [ ] **Step 7: Verify task and settings components**

Run: `npm test -- --run src/components/ActivityForm.test.tsx src/components/ActivityPlan.test.tsx src/components/SettingsPanel.test.tsx src/App.test.tsx`  
Expected: PASS, including form validation, category filtering, per-occurrence rescheduling, and saved preferences.

### Task 5: Add evening summaries, in-app alerts, and catch-up behavior

**Files:**
- Create: `src/hooks/useReminderEngine.ts`, `src/hooks/useReminderEngine.test.tsx`
- Create: `src/components/TomorrowSummary.tsx`, `src/components/ReminderCard.tsx`
- Modify: `src/App.tsx`, `src/styles.css`
- Test: `src/components/ReminderCard.test.tsx`, `src/App.integration.test.tsx`

**Interfaces:**
- Consumes: Task 2 occurrence and reminder functions, Task 3 repository, and Task 4 planner components.
- Produces:
  - `useReminderEngine(input: { plannerData: PlannerData; onPlannerDataChange(next: PlannerData): void; onAlert(occurrence: ActivityOccurrence): void; onSummary(date: string, occurrences: ActivityOccurrence[]): void }): void`; the hook owns its clock and timer lifecycle.
  - `ReminderCardProps = { occurrence: ActivityOccurrence; snoozeMinutes: PlannerPreferences["defaultSnoozeMinutes"]; onComplete(): void; onSnooze(): void; onReschedule(newDate: string): void }`.
  - `TomorrowSummaryProps = { summaryDate: string; occurrences: ActivityOccurrence[] }`.

- [ ] **Step 1: Write failing reminder-engine tests**

Use fake timers and a controlled clock to test that the first alert appears at 6:00 AM for an untimed activity and 60 minutes before a timed activity; the summary appears at the configured local evening time; and a closed-app summary is shown once on the next app open. Test that visibility/focus return rechecks due and overdue activities without sending a fabricated background notification or repeating an already-presented first alert.

- [ ] **Step 2: Run reminder-engine tests to verify they fail**

Run: `npm test -- --run src/hooks/useReminderEngine.test.tsx`  
Expected: FAIL because the reminder engine is not implemented.

- [ ] **Step 3: Implement the foreground reminder engine**

Schedule only while the app is open. Reconcile due work when the document becomes visible or the window regains focus. Persist alert presentation and snooze state locally so a refresh does not silently duplicate or lose a pending action. Do not implement email, service workers, browser push, or 15-minute automatic follow-ups.

- [ ] **Step 4: Run reminder-engine tests to verify they pass**

Run: `npm test -- --run src/hooks/useReminderEngine.test.tsx`  
Expected: PASS for first-alert timing, snooze timing, summary catch-up, and foreground reconciliation.

- [ ] **Step 5: Write failing alert and end-to-end flow tests**

Test that the alert shows “Mark complete”, “Snooze {configured duration}”, and “Change date”; that snoozing schedules the next in-app alert using the one app-wide default; and that completing or rescheduling removes the current occurrence from due alerts while preserving later occurrences. If the app opens after an alert time, test that an unpresented due alert is shown once, but an already-presented alert is not automatically repeated. Test a user creating an activity, seeing it in the next-day plan, and acting on its alert.

- [ ] **Step 6: Run integration tests to verify they fail**

Run: `npm test -- --run src/App.integration.test.tsx`  
Expected: FAIL because the app is not yet wired to the reminder engine and alert actions.

- [ ] **Step 7: Implement summary, alert card, and app wiring**

Show the next-day summary at the configured time while open. If that time was missed while closed, show the missed summary on the next open. Keep due and overdue occurrences visible until completed or rescheduled.

- [ ] **Step 8: Verify the complete app behavior and production build**

Run: `npm test -- --run && npm run build`  
Expected: PASS for all domain, storage, component, reminder, and integration tests; production build succeeds.

### Task 6: Verify responsive behavior and accessibility

**Files:**
- Modify: `src/styles.css`, relevant component markup
- Test: `src/components/ActivityPlan.test.tsx`, `src/components/ReminderCard.test.tsx`

- [ ] **Step 1: Add accessible interaction tests**

Assert that filters, task actions, snooze selection, validation messages, and alert content have accessible names and remain operable by keyboard.

- [ ] **Step 2: Run the focused tests to verify gaps**

Run: `npm test -- --run src/components/ActivityPlan.test.tsx src/components/ReminderCard.test.tsx`  
Expected: Any missing labels or controls fail explicitly.

- [ ] **Step 3: Implement responsive and accessible refinements**

Use CSS media queries and semantic HTML; do not introduce a component framework.

- [ ] **Step 4: Run the full verification**

Run: `npm test -- --run && npm run build`  
Expected: PASS with no accessibility regressions and a successful production build.

- [ ] **Step 5: Manually inspect narrow and wide layouts**

Run `npm run dev`, then inspect the plan, settings, and reminder at 390px and 1280px viewport widths. Expected: task actions remain reachable without horizontal scrolling, and category groups remain visually distinct.
