import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PlannerPreferences } from "../domain/activity";
import SettingsPanel from "./SettingsPanel";

const preferences: PlannerPreferences = {
  summaryTime: "21:00",
  defaultSnoozeMinutes: 60,
};

describe("SettingsPanel", () => {
  it("saves the selected summary time and app-wide snooze duration", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<SettingsPanel preferences={preferences} onSave={onSave} />);

    await user.clear(screen.getByLabelText("Evening summary time"));
    await user.type(screen.getByLabelText("Evening summary time"), "20:45");
    await user.selectOptions(screen.getByLabelText("Default snooze window"), "180");
    await user.click(screen.getByRole("button", { name: "Save preferences" }));

    expect(onSave).toHaveBeenCalledWith({
      summaryTime: "20:45",
      defaultSnoozeMinutes: 180,
    });
  });

  it.each([15, 60, 180, 360, 1440] as const)(
    "labels the one-tap snooze button with the %i-minute default",
    (minutes) => {
      render(
        <SettingsPanel
          preferences={{ ...preferences, defaultSnoozeMinutes: minutes }}
          onSave={vi.fn()}
        />,
      );

      const label =
        minutes === 60
          ? "Snooze 1 hour"
          : minutes === 1440
            ? "Snooze 1 day"
            : `Snooze ${minutes} minutes`;
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    },
  );
});
