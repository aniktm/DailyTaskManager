import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("App", () => {
  it("shows tomorrow's plan and the activity categories", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Tomorrow’s plan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Personal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Official" })).toBeInTheDocument();
  });

  it("shows a visible error when local storage is inaccessible", async () => {
    const storage = window.localStorage;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage read denied");
    });

    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not read saved planner data.",
    );
    vi.restoreAllMocks();
    expect(storage).toBeDefined();
  });

  it("does not show a summary from empty fallback data when storage fails", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 6, 21, 0));
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage read denied");
    });

    render(<App />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not read saved planner data.",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
