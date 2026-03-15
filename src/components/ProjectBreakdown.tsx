/**
 * ProjectBreakdown — Visual breakdown of tracked time by project.
 *
 * Mirrors CategoryChart but aggregates by the `project` field on each
 * ActivityLog. Activities without a project are grouped as "Untagged".
 */

import { type ActivityLog } from "../hooks/useTauri";
import { formatDuration } from "../lib/utils";
import { Tag } from "lucide-react";

interface ProjectBreakdownProps {
  activities: ActivityLog[];
}

// Distinct palette for project colours (cycles if > 8 projects)
const PROJECT_COLORS = [
  "hsl(175,60%,50%)",
  "hsl(250,65%,65%)",
  "hsl(35,90%,58%)",
  "hsl(330,65%,60%)",
  "hsl(200,70%,55%)",
  "hsl(130,55%,48%)",
  "hsl(10,70%,56%)",
  "hsl(285,55%,60%)",
];

function projectColor(name: string, index: number) {
  // Stable colour per project name
  const hash = Array.from(name).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
  return PROJECT_COLORS[hash % PROJECT_COLORS.length] ?? PROJECT_COLORS[index % PROJECT_COLORS.length];
}

export function ProjectBreakdown({ activities }: ProjectBreakdownProps) {
  const tagged = activities.filter((a) => a.project);

  if (tagged.length === 0) {
    return (
      <div className="category-chart card" data-testid="project-breakdown">
        <div className="category-chart__header">
          <h3 style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Tag size={20} /> Project Breakdown
          </h3>
        </div>
        <p className="text-secondary" style={{ margin: 0, fontSize: "var(--font-size-sm)" }}>
          No project tags yet. Click the <Tag size={12} style={{ display: "inline", verticalAlign: "middle" }} /> icon
          on any activity to tag it.
        </p>
      </div>
    );
  }

  const totalSeconds = tagged.reduce((sum, a) => sum + a.duration_seconds, 0);

  // Aggregate by project name
  const projectMap = new Map<string, number>();
  for (const activity of tagged) {
    const name = activity.project!;
    projectMap.set(name, (projectMap.get(name) ?? 0) + activity.duration_seconds);
  }

  const projects = Array.from(projectMap.entries())
    .map(([name, seconds], i) => ({
      name,
      seconds,
      percentage: totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0,
      color: projectColor(name, i),
    }))
    .sort((a, b) => b.seconds - a.seconds);

  return (
    <div className="category-chart card" data-testid="project-breakdown">
      <div className="category-chart__header">
        <h3 style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Tag size={20} /> Project Breakdown
        </h3>
        <span className="text-secondary">{formatDuration(totalSeconds)} tagged</span>
      </div>

      {/* Stacked bar */}
      <div className="category-chart__bar">
        {projects.map((p) => (
          <div
            key={p.name}
            className="category-chart__segment"
            style={{
              width: `${Math.max(p.percentage, 2)}%`,
              backgroundColor: p.color,
            }}
            title={`${p.name}: ${p.percentage.toFixed(0)}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="category-chart__legend">
        {projects.map((p) => (
          <div key={p.name} className="category-chart__item">
            <div className="category-chart__dot" style={{ backgroundColor: p.color }} />
            <span className="category-chart__label">{p.name}</span>
            <span className="category-chart__value text-secondary">
              {formatDuration(p.seconds)} ({p.percentage.toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
