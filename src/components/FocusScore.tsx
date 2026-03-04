/**
 * FocusScore — Real-time productivity score with circular ring and nudges.
 *
 * Renders an Apple-inspired circular progress ring showing 0–100 focus score,
 * a breakdown of the three dimensions, and any active nudges.
 */

import { useMemo } from "react";
import { Brain, Zap, ArrowRightLeft, Calendar, X } from "lucide-react";

import type { ActivityLog } from "../hooks/useTauri";
import { calculateFocusScore, generateNudges, type FocusScoreResult, type Nudge } from "../lib/focus-score";
import { formatDuration } from "../lib/utils";

interface FocusScoreProps {
  activities: ActivityLog[];
  /** Compact mode for embedding in LiveView header */
  compact?: boolean;
}

/* ─── SVG Ring ─── */

function ScoreRing({
  score,
  color,
  size = 140,
  strokeWidth = 10,
}: {
  score: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="focus-score__ring"
      data-testid="focus-score-ring"
    >
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease" }}
      />
    </svg>
  );
}

/* ─── Nudge Card ─── */

function NudgeCard({ nudge, onDismiss }: { nudge: Nudge; onDismiss: () => void }) {
  const borderColor =
    nudge.type === "warning"
      ? "var(--color-warning)"
      : nudge.type === "success"
        ? "var(--color-success)"
        : "var(--color-info)";

  return (
    <div
      className="focus-score__nudge animate-slide-in"
      style={{ borderLeft: `3px solid ${borderColor}` }}
      data-testid={`nudge-${nudge.id}`}
    >
      <span className="focus-score__nudge-icon">{nudge.icon}</span>
      <span className="focus-score__nudge-text">{nudge.message}</span>
      <button
        className="focus-score__nudge-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss nudge"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/* ─── Breakdown Row ─── */

function BreakdownRow({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="focus-score__breakdown-row">
      <span className="focus-score__breakdown-icon" style={{ color }}>
        {icon}
      </span>
      <span className="focus-score__breakdown-label">{label}</span>
      <div className="focus-score__breakdown-bar-track">
        <div
          className="focus-score__breakdown-bar-fill"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="focus-score__breakdown-value">{value}%</span>
    </div>
  );
}

/* ─── Main Component ─── */

export function FocusScore({ activities, compact = false }: FocusScoreProps) {
  const result: FocusScoreResult = useMemo(() => calculateFocusScore(activities), [activities]);
  const nudges: Nudge[] = useMemo(() => generateNudges(activities), [activities]);

  // --- Compact mode: inline badge for LiveView header ---
  if (compact) {
    return (
      <div className="focus-score--compact" data-testid="focus-score-compact">
        <ScoreRing score={result.score} color={result.color} size={44} strokeWidth={4} />
        <div className="focus-score--compact__inner">
          <span className="focus-score--compact__value" style={{ color: result.color }}>
            {result.score}
          </span>
        </div>
        <span className="focus-score--compact__label">Focus</span>
      </div>
    );
  }

  // --- Full card mode ---
  return (
    <div className="focus-score card animate-fade-in" data-testid="focus-score">
      <div className="focus-score__header">
        <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Brain size={20} /> AI Focus Coach
        </h3>
      </div>

      <div className="focus-score__body">
        {/* Ring + Stats */}
        <div className="focus-score__ring-container">
          <ScoreRing score={result.score} color={result.color} />
          <div className="focus-score__ring-label">
            <span className="focus-score__ring-value" style={{ color: result.color }}>
              {result.score}
            </span>
            <span className="focus-score__ring-sublabel">{result.label}</span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="focus-score__stats">
          <div className="focus-score__stat">
            <span className="focus-score__stat-value">{formatDuration(result.deepWorkSeconds)}</span>
            <span className="focus-score__stat-label">Deep Work</span>
          </div>
          <div className="focus-score__stat">
            <span className="focus-score__stat-value">{result.contextSwitchCount}</span>
            <span className="focus-score__stat-label">Switches</span>
          </div>
          <div className="focus-score__stat">
            <span className="focus-score__stat-value">{formatDuration(result.meetingSeconds)}</span>
            <span className="focus-score__stat-label">Meetings</span>
          </div>
        </div>
      </div>

      {/* Breakdown Bars */}
      <div className="focus-score__breakdown">
        <BreakdownRow
          icon={<Zap size={14} />}
          label="Deep Work"
          value={result.breakdown.deepWorkRatio}
          color="#28bc6f"
        />
        <BreakdownRow
          icon={<ArrowRightLeft size={14} />}
          label="Focus (low switching)"
          value={result.breakdown.contextSwitchScore}
          color="#3370ff"
        />
        <BreakdownRow
          icon={<Calendar size={14} />}
          label="Meeting Balance"
          value={result.breakdown.meetingLoadScore}
          color="#7845f0"
        />
      </div>

      {/* Nudges */}
      {nudges.length > 0 && (
        <div className="focus-score__nudges">
          {nudges.map((n) => (
            <NudgeCard
              key={n.id}
              nudge={n}
              onDismiss={() => {
                /* nudges recalculate on activity change; dismiss is cosmetic via local state if wanted */
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
