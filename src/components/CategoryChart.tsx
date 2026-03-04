/**
 * CategoryChart — Visual breakdown of time by category.
 */

import { type ActivityLog } from "../hooks/useTauri";
import { formatDuration, getCategoryColor } from "../lib/utils";
import { PieChart } from "lucide-react";

interface CategoryChartProps {
  activities: ActivityLog[];
}

interface CategoryData {
  category: string;
  seconds: number;
  percentage: number;
  color: string;
}

export function CategoryChart({ activities }: CategoryChartProps) {
  const totalSeconds = activities.reduce((sum, a) => sum + a.duration_seconds, 0);

  // Aggregate by category
  const categoryMap = new Map<string, number>();
  for (const activity of activities) {
    const current = categoryMap.get(activity.category) ?? 0;
    categoryMap.set(activity.category, current + activity.duration_seconds);
  }

  const categories: CategoryData[] = Array.from(categoryMap.entries())
    .map(([category, seconds]) => ({
      category,
      seconds,
      percentage: totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0,
      color: getCategoryColor(category),
    }))
    .sort((a, b) => b.seconds - a.seconds);

  return (
    <div className="category-chart card" data-testid="category-chart">
      <div className="category-chart__header">
        <h3 style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}><PieChart size={20} /> Category Breakdown</h3>
        <span className="text-secondary">{formatDuration(totalSeconds)} total</span>
      </div>

      {categories.length === 0 ? (
        <p className="text-secondary">No data yet.</p>
      ) : (
        <>
          {/* Horizontal stacked bar */}
          <div className="category-chart__bar">
            {categories.map((cat) => (
              <div
                key={cat.category}
                className="category-chart__segment"
                style={{
                  width: `${Math.max(cat.percentage, 2)}%`,
                  backgroundColor: cat.color,
                }}
                title={`${cat.category}: ${cat.percentage.toFixed(0)}%`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="category-chart__legend">
            {categories.map((cat) => (
              <div key={cat.category} className="category-chart__item">
                <div className="category-chart__dot" style={{ backgroundColor: cat.color }} />
                <span className="category-chart__label">{cat.category}</span>
                <span className="category-chart__value text-secondary">
                  {formatDuration(cat.seconds)} ({cat.percentage.toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
