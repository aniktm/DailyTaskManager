# Daily Activity Planner — Product Design

**Status:** Approved for planning  
**Date:** 2026-10-10

## Intent

Build a simple personal planner that makes it easy to create and update activities, see what is coming up, and receive reminders at useful times. The motivating problem is missing an important deadline—such as renewing vehicle insurance—even after receiving an email alert several days beforehand.

The first version is a responsive web app for one person. Activities are separated into **Personal** and **Official** categories. This is not a shared work or family planner.

## Goals

- Make creating, reviewing, updating, completing, and rescheduling activities straightforward.
- Give the user an evening preview of the next day at a time they choose.
- Alert for activities according to whether they have a scheduled time.
- Support one-off activities and recurring activities, such as gym sessions three days a week.
- Keep the first version local to one device, without accounts or cross-device sync.

Success means the user can easily create and update activities and receives in-app alerts according to the configured rules.

## Non-goals for version one

- Native mobile apps.
- Alerts while the web app is closed or operating-system push notifications.
- Email alerts or email summaries.
- Automatic 15-minute follow-up alerts.
- Shared activities, collaboration, or multi-user workspaces.
- Cloud accounts, synchronization, or a server-side scheduler.

The future native app may add mobile notifications and repeat an app notification every 15 minutes until the user snoozes, completes, or reschedules the activity. Email in a future version has not been decided.

## Main experience

### Activities

An activity has a title, a category (Personal or Official), a due date, an optional scheduled time, and an optional repeating schedule. It can be marked complete or updated later.

The builder should keep entry lightweight: require only the information needed to put an activity on the plan, and make the time optional. Version one supports weekly recurrence on one or more selected weekdays; monthly and every-N-days patterns are out of scope. Completing or moving one occurrence must not complete or change later occurrences in the repeating series.

### Tomorrow’s plan

At a user-configured evening time, show the next day’s activities in the web app, grouped into Personal and Official. Provide an All view and category filters. Each activity can be rescheduled directly from this plan.

If the app is closed at the selected summary time, show the missed next-day summary the next time the app opens. This is a catch-up view, not a background notification.

### Day-of reminders

- An activity with no scheduled time is due for its first alert at **6:00 AM** on its due date.
- An activity with a scheduled time alerts **one hour before** that time.
- Alerts are in-app only and can be delivered only while the web app is open.
- The alert offers **Mark complete**, **Snooze**, and **Change date** actions.
- An activity can remain visible as due or overdue until it is completed or rescheduled.
- Version one does not send automatic 15-minute follow-ups. Those are deferred to the future native app.

### Snooze

Setup includes one app-wide default snooze window with these choices:

- 15 minutes
- 1 hour
- 3 hours
- 6 hours
- 1 day

The reminder button displays the configured duration (for example, **Snooze 1 hour**) and applies it with one tap. The user does not have to choose a duration each time.

## Data, privacy, and platform

- Responsive web app, intended to work on desktop and mobile browser sizes.
- Store activities and preferences only in the browser on the current device.
- Do not add accounts, a backend, email delivery, browser push, or cross-device synchronization in version one.
- If local data is cleared or the device/browser is lost, version-one data may be lost; cloud backup is not part of this design.
- Scheduling is best-effort while the app is open. Browser and operating-system throttling can delay in-app timers, so the app should check for due and overdue activities when it becomes active again.

## Implementation direction

The project folder is empty. Recommended starting stack, as a builder choice: **React, TypeScript, and Vite**, with responsive CSS and browser `localStorage` for persistence. Keep date, recurrence, due-alert, and snooze calculations in a small isolated module so the rules can be reused when building a native app later.

Product implementation has not started. The browser mockup created during brainstorming is a throwaway visual aid, not production code.

## Builder decisions

The following details are left to the implementer because they do not change the agreed product direction:

- Use the device’s local time zone for the summary, due dates, and alert times.
- Use a simple weekday selector for weekly recurrence.
- When a snoozed activity is due again, show the same in-app actions; snoozing does not mark it complete or alter its repeating schedule.
- On returning to the app, surface missed summaries and any due or overdue activities instead of silently discarding them.
- Keep local persistence simple, with no cloud backup or account flow in version one.

## Open risk

Local-only storage and alerts while the app is open intentionally trade away cloud backup and background delivery. The UI should make this limitation clear during setup so the user does not mistake an in-app reminder for a notification that will arrive while the app is closed.
