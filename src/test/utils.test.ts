import { describe, it, expect } from "vitest";
import {
  formatDuration,
  formatTime,
  formatDate,
  getTodayDate,
  calculatePercentage,
} from "../lib/utils";

describe("formatDuration", () => {
  it("formats hours and minutes", () => {
    expect(formatDuration(5400)).toBe("1h 30m");
  });

  it("formats 2 hours 30 minutes", () => {
    expect(formatDuration(9000)).toBe("2h 30m");
  });

  it("formats hours only", () => {
    expect(formatDuration(7200)).toBe("2h");
  });

  it("formats minutes only", () => {
    expect(formatDuration(2700)).toBe("45m");
  });

  it("formats zero", () => {
    expect(formatDuration(0)).toBe("0m");
  });

  it("handles negative values", () => {
    expect(formatDuration(-100)).toBe("0m");
  });

  it("formats single minute", () => {
    expect(formatDuration(60)).toBe("1m");
  });

  it("formats one hour", () => {
    expect(formatDuration(3600)).toBe("1h");
  });
});

describe("formatTime", () => {
  it("formats a time and returns a non-empty string", () => {
    const result = formatTime("2026-03-01T09:30:00Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    // Note: exact output depends on local timezone, so we just verify it's valid
  });

  it("returns a string for a valid ISO timestamp", () => {
    const result = formatTime("2026-03-01T14:00:00Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("formatDate", () => {
  it("formats date string", () => {
    const result = formatDate("2026-03-01");
    expect(result).toContain("March");
    expect(result).toContain("2026");
  });
});

describe("getTodayDate", () => {
  it("returns a YYYY-MM-DD string", () => {
    const result = getTodayDate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("calculatePercentage", () => {
  it("calculates correct percentage", () => {
    expect(calculatePercentage(25, 100)).toBe(25);
  });

  it("rounds to nearest integer", () => {
    expect(calculatePercentage(1, 3)).toBe(33);
  });

  it("returns 0 for zero total", () => {
    expect(calculatePercentage(10, 0)).toBe(0);
  });

  it("returns 0 for negative total", () => {
    expect(calculatePercentage(10, -5)).toBe(0);
  });

  it("handles 100%", () => {
    expect(calculatePercentage(100, 100)).toBe(100);
  });
});
