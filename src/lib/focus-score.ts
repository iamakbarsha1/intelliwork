/**
 * Focus Score Engine — Pure calculation logic (no React/Tauri deps).
 *
 * Computes a 0–100 Focus Score from an array of activity logs and
 * generates contextual productivity nudges.
 *
 * The score is based on three weighted dimensions:
 *   1. Deep Work Ratio  (40%) — long uninterrupted single-category sessions
 *   2. Context Switches (35%) — fewer switches = higher score
 *   3. Meeting Load     (25%) — less meeting time = higher score
 */

import type { ActivityLog } from "../hooks/useTauri";

/* ─── Types ─── */

export interface FocusScoreResult {
  /** Overall focus score 0–100 */
  score: number;
  /** Human-readable label */
  label: string;
  /** Score colour (CSS) */
  color: string;
  /** Breakdown by dimension */
  breakdown: {
    deepWorkRatio: number;
    contextSwitchScore: number;
    meetingLoadScore: number;
  };
  /** Context-switch count for the window */
  contextSwitchCount: number;
  /** Total deep-work seconds (sessions ≥ 15 min, same category) */
  deepWorkSeconds: number;
  /** Total meeting seconds */
  meetingSeconds: number;
  /** Total tracked seconds */
  totalSeconds: number;
}

export interface Nudge {
  id: string;
  type: "info" | "warning" | "success";
  icon: string;
  message: string;
}

/* ─── Constants ─── */

const DEEP_WORK_MIN_SECONDS = 15 * 60; // 15 minutes
const HIGH_CONTEXT_SWITCH_THRESHOLD = 10;
const HIGH_CONTEXT_SWITCH_WINDOW_SECONDS = 15 * 60; // in 15 min
const LONG_MEETING_STREAK_SECONDS = 2 * 60 * 60; // 2 hours

/* ─── Score Computation ─── */

/**
 * Build the Focus Score from a list of today's activities.
 */
export function calculateFocusScore(activities: ActivityLog[]): FocusScoreResult {
  if (activities.length === 0) {
    return {
      score: 0,
      label: "No data",
      color: "var(--color-text-tertiary)",
      breakdown: { deepWorkRatio: 0, contextSwitchScore: 0, meetingLoadScore: 0 },
      contextSwitchCount: 0,
      deepWorkSeconds: 0,
      meetingSeconds: 0,
      totalSeconds: 0,
    };
  }

  const nonIdle = activities.filter((a) => !a.is_idle);
  const totalSeconds = nonIdle.reduce((s, a) => s + a.duration_seconds, 0);

  if (totalSeconds === 0) {
    return {
      score: 0,
      label: "No data",
      color: "var(--color-text-tertiary)",
      breakdown: { deepWorkRatio: 0, contextSwitchScore: 0, meetingLoadScore: 0 },
      contextSwitchCount: 0,
      deepWorkSeconds: 0,
      meetingSeconds: 0,
      totalSeconds: 0,
    };
  }

  // 1. Deep Work Ratio (40%)
  const deepWorkSeconds = nonIdle
    .filter((a) => a.duration_seconds >= DEEP_WORK_MIN_SECONDS && !a.is_meeting)
    .reduce((s, a) => s + a.duration_seconds, 0);
  const deepWorkRatio = Math.min((deepWorkSeconds / totalSeconds) * 100, 100);

  // 2. Context Switch Score (35%)
  const contextSwitchCount = Math.max(0, nonIdle.length - 1);
  const hoursTracked = Math.max(totalSeconds / 3600, 0.5);
  const switchesPerHour = contextSwitchCount / hoursTracked;
  // 0 switches/hr = 100, 30+ = 0
  const contextSwitchScore = Math.max(0, Math.min(100, 100 - (switchesPerHour / 30) * 100));

  // 3. Meeting Load Score (25%)
  const meetingSeconds = nonIdle
    .filter((a) => a.is_meeting || a.category === "Meetings")
    .reduce((s, a) => s + a.duration_seconds, 0);
  const meetingRatio = meetingSeconds / totalSeconds;
  // No meetings = 100, >80% meetings = 0
  const meetingLoadScore = Math.max(0, Math.min(100, (1 - meetingRatio / 0.8) * 100));

  // Weighted total
  const score = Math.round(
    deepWorkRatio * 0.4 + contextSwitchScore * 0.35 + meetingLoadScore * 0.25,
  );

  const clamped = Math.max(0, Math.min(100, score));

  return {
    score: clamped,
    label: scoreLabel(clamped),
    color: scoreColor(clamped),
    breakdown: {
      deepWorkRatio: Math.round(deepWorkRatio),
      contextSwitchScore: Math.round(contextSwitchScore),
      meetingLoadScore: Math.round(meetingLoadScore),
    },
    contextSwitchCount,
    deepWorkSeconds,
    meetingSeconds,
    totalSeconds,
  };
}

/* ─── Nudge Generation ─── */

/**
 * Generate contextual nudges based on activity patterns.
 */
export function generateNudges(activities: ActivityLog[]): Nudge[] {
  const nudges: Nudge[] = [];
  const nonIdle = activities.filter((a) => !a.is_idle);

  if (nonIdle.length === 0) return nudges;

  // 1. High context switching in recent window
  const recentSwitches = countRecentSwitches(nonIdle, HIGH_CONTEXT_SWITCH_WINDOW_SECONDS);
  if (recentSwitches >= HIGH_CONTEXT_SWITCH_THRESHOLD) {
    nudges.push({
      id: "high-context-switch",
      type: "warning",
      icon: "🔄",
      message: `High context switching detected (${recentSwitches} switches in 15 min). Try batching similar tasks.`,
    });
  }

  // 2. Long meeting streak
  const meetingStreak = getLongestMeetingStreak(nonIdle);
  if (meetingStreak >= LONG_MEETING_STREAK_SECONDS) {
    const hours = Math.round(meetingStreak / 3600 * 10) / 10;
    nudges.push({
      id: "long-meeting-streak",
      type: "warning",
      icon: "📅",
      message: `You've been in meetings for ${hours}h straight. Consider blocking focus time.`,
    });
  }

  // 3. Great deep work session
  const longestDeep = getLongestDeepWorkSession(nonIdle);
  if (longestDeep >= 60 * 60) {
    const hours = Math.round(longestDeep / 3600 * 10) / 10;
    nudges.push({
      id: "great-deep-work",
      type: "success",
      icon: "🎯",
      message: `Your longest deep work session is ${hours}h — great flow! Keep it going.`,
    });
  }

  // 4. Lots of short sessions
  const shortSessions = nonIdle.filter((a) => a.duration_seconds < 120 && !a.is_meeting);
  if (shortSessions.length > 15) {
    nudges.push({
      id: "fragmented-work",
      type: "info",
      icon: "⚡",
      message: `${shortSessions.length} sessions under 2 minutes today. Consider deeper focus blocks.`,
    });
  }

  return nudges;
}

/* ─── Helpers ─── */

function countRecentSwitches(activities: ActivityLog[], windowSeconds: number): number {
  if (activities.length < 2) return 0;

  // Sort by start_time descending
  const sorted = [...activities].sort(
    (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
  );
  const cutoff = Date.now() - windowSeconds * 1000;
  return sorted.filter((a) => new Date(a.start_time).getTime() >= cutoff).length;
}

function getLongestMeetingStreak(activities: ActivityLog[]): number {
  const sorted = [...activities]
    .filter((a) => a.is_meeting || a.category === "Meetings")
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  if (sorted.length === 0) return 0;

  let maxStreak = 0;
  let currentStreak = sorted[0].duration_seconds;

  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = sorted[i - 1].end_time
      ? new Date(sorted[i - 1].end_time!).getTime()
      : Date.now();
    const currStart = new Date(sorted[i].start_time).getTime();
    const gap = (currStart - prevEnd) / 1000;

    if (gap <= 300) {
      // 5 min gap tolerance
      currentStreak += sorted[i].duration_seconds + gap;
    } else {
      maxStreak = Math.max(maxStreak, currentStreak);
      currentStreak = sorted[i].duration_seconds;
    }
  }
  return Math.max(maxStreak, currentStreak);
}

function getLongestDeepWorkSession(activities: ActivityLog[]): number {
  return activities
    .filter((a) => !a.is_meeting && a.category !== "Meetings" && a.duration_seconds >= DEEP_WORK_MIN_SECONDS)
    .reduce((max, a) => Math.max(max, a.duration_seconds), 0);
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Low";
  return "Very Low";
}

function scoreColor(score: number): string {
  if (score >= 80) return "#28bc6f";
  if (score >= 60) return "#3370ff";
  if (score >= 40) return "#f59e1a";
  if (score >= 20) return "#ee5c5c";
  return "#b5bac5";
}
