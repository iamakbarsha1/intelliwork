/**
 * DailySummary — Overview card with today's stats.
 */

import { type ActivityLog } from "../hooks/useTauri";
import { formatDuration } from "../lib/utils";

interface DailySummaryProps {
  activities: ActivityLog[];
  date: string;
}

export function DailySummary({ activities, date }: DailySummaryProps) {
  const totalSeconds = activities.reduce((sum, a) => sum + a.duration_seconds, 0);
  const productiveSeconds = activities
    .filter((a) => !a.is_idle && a.category !== "Entertainment")
    .reduce((sum, a) => sum + a.duration_seconds, 0);
  const meetingCount = activities.filter((a) => a.is_meeting).length;
  const meetingSeconds = activities
    .filter((a) => a.is_meeting)
    .reduce((sum, a) => sum + a.duration_seconds, 0);
  const uniqueApps = new Set(activities.map((a) => a.app_name)).size;

  const productivityRate =
    totalSeconds > 0 ? Math.round((productiveSeconds / totalSeconds) * 100) : 0;

  return (
    <div className="daily-summary card" data-testid="daily-summary">
      <div className="daily-summary__header">
        <h3>📅 Daily Summary</h3>
        <span className="text-secondary">{date}</span>
      </div>

      <div className="daily-summary__stats">
        <StatCard
          icon="⏱"
          label="Total Tracked"
          value={formatDuration(totalSeconds)}
        />
        <StatCard
          icon="🎯"
          label="Productive"
          value={formatDuration(productiveSeconds)}
          accent={productivityRate >= 70 ? "success" : productivityRate >= 40 ? "warning" : "danger"}
        />
        <StatCard
          icon="🤝"
          label="Meetings"
          value={`${meetingCount} (${formatDuration(meetingSeconds)})`}
        />
        <StatCard
          icon="💻"
          label="Apps Used"
          value={String(uniqueApps)}
        />
      </div>

      {/* Productivity bar */}
      <div className="daily-summary__productivity">
        <div className="daily-summary__productivity-header">
          <span className="text-secondary">Productivity</span>
          <span className="daily-summary__rate">{productivityRate}%</span>
        </div>
        <div className="daily-summary__bar">
          <div
            className="daily-summary__bar-fill"
            style={{
              width: `${productivityRate}%`,
              backgroundColor:
                productivityRate >= 70
                  ? "var(--color-success)"
                  : productivityRate >= 40
                  ? "var(--color-warning)"
                  : "var(--color-danger)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  accent?: "success" | "warning" | "danger";
}

function StatCard({ icon, label, value, accent }: StatCardProps) {
  return (
    <div className="stat-card">
      <span className="stat-card__icon">{icon}</span>
      <div className="stat-card__content">
        <span className="stat-card__value" data-accent={accent}>
          {value}
        </span>
        <span className="stat-card__label text-tertiary">{label}</span>
      </div>
    </div>
  );
}
