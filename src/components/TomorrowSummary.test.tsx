import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TomorrowSummary from "./TomorrowSummary";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2025, 0, 7, 8, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("TomorrowSummary", () => {
  it("labels a missed morning catch-up as today's plan", () => {
    render(<TomorrowSummary summaryDate="2025-01-07" occurrences={[]} />);

    expect(
      screen.getByRole("heading", { name: "Today, at a glance" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Your morning catch-up")).toBeInTheDocument();
  });

  it("labels an evening preview as tomorrow's plan", () => {
    render(<TomorrowSummary summaryDate="2025-01-08" occurrences={[]} />);

    expect(
      screen.getByRole("heading", { name: "Tomorrow, at a glance" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Your evening preview")).toBeInTheDocument();
  });
});
