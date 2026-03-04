import { describe, it, expect } from "vitest";
import { calculateFocusScore, generateNudges } from "../lib/focus-score";
import type { ActivityLog } from "../hooks/useTauri";
import type { Category } from "../lib/types";

function mockActivity(
  category: string,
  duration_seconds: number,
  overrides: Partial<ActivityLog> = {}
): ActivityLog {
  const is_meeting = category === "Meetings";
  return {
    id: Math.random().toString(),
    app_name: "MockApp",
    window_title: "Mock Window",
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + duration_seconds * 1000).toISOString(),
    duration_seconds,
    category: category as Category,
    confidence: 1.0,
    is_meeting,
    is_idle: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("Focus Score Engine", () => {
  describe("calculateFocusScore", () => {
    it("returns zero for no activities", () => {
      const result = calculateFocusScore([]);
      expect(result.score).toBe(0);
      expect(result.label).toBe("No data");
    });

    it("returns zero for only idle activities", () => {
      const result = calculateFocusScore([
        mockActivity("Uncategorized", 1000, { is_idle: true }),
      ]);
      expect(result.score).toBe(0);
    });

    it("calculates high score for deep work", () => {
      const activities = [
        mockActivity("Development", 3600), // 1 hour deep
        mockActivity("Development", 3600), // 1 hour deep
      ];
      const result = calculateFocusScore(activities);
      expect(result.score).toBeGreaterThan(90);
      expect(result.breakdown.deepWorkRatio).toBe(100);
      expect(result.breakdown.meetingLoadScore).toBe(100);
    });

    it("reduces score for high context switching", () => {
      // 10 short sessions over 30 mins
      const activities = Array.from({ length: 10 }).map(() =>
        mockActivity("Development", 180)
      );
      const result = calculateFocusScore(activities);
      // contextSwitchCount = 9, hoursTracked = 0.5 (1800s => 0.5hr)
      // switchesPerHour = 9 / 0.5 = 18 => penalty applies
      expect(result.breakdown.contextSwitchScore).toBeLessThan(100);
      expect(result.score).toBeLessThan(90);
    });

    it("penalizes high meeting load", () => {
      const activities = [
        mockActivity("Meetings", 7200), // 2 hr meeting
        mockActivity("Development", 1800), // 30 min deep
      ];
      const result = calculateFocusScore(activities);
      expect(result.breakdown.meetingLoadScore).toBeLessThan(50);
      expect(result.score).toBeLessThan(60);
    });
  });

  describe("generateNudges", () => {
    it("returns no nudges for normal work", () => {
      const activities = [
        mockActivity("Development", 1800), // 30 min
      ];
      const nudges = generateNudges(activities);
      expect(nudges).toHaveLength(0);
    });

    it("generates warning for high context switching", () => {
      const baseTime = Date.now();
      const activities = Array.from({ length: 15 }).map((_, i) =>
        mockActivity("Development", 30, {
          start_time: new Date(baseTime + i * 30000).toISOString()
        })
      );
      const nudges = generateNudges(activities);
      expect(nudges).toContainEqual(
        expect.objectContaining({ id: "high-context-switch" })
      );
    });

    it("generates warning for long meeting streaks", () => {
      const baseTime = Date.now();
      const activities = [
        mockActivity("Meetings", 3600, { start_time: new Date(baseTime).toISOString(), end_time: new Date(baseTime + 3600000).toISOString() }), 
        // 5 min gap
        mockActivity("Meetings", 3600, { start_time: new Date(baseTime + 3900000).toISOString() }), 
      ];
      const nudges = generateNudges(activities);
      expect(nudges).toContainEqual(
        expect.objectContaining({ id: "long-meeting-streak" })
      );
    });

    it("generates success for deep work session > 1 hr", () => {
      const activities = [
        mockActivity("Development", 4000), // > 1 hr
      ];
      const nudges = generateNudges(activities);
      expect(nudges).toContainEqual(
        expect.objectContaining({ id: "great-deep-work" })
      );
    });

    it("generates info for highly fragmented work", () => {
      const activities = Array.from({ length: 20 }).map(() =>
        mockActivity("Development", 60)
      );
      const nudges = generateNudges(activities);
      expect(nudges).toContainEqual(
        expect.objectContaining({ id: "fragmented-work" })
      );
    });
  });
});
