/**
 * ActivityTimeline — Scrollable list of today's tracked activities.
 */

import { type ActivityLog } from "../hooks/useTauri";
import { formatDuration, formatTime, getCategoryColor } from "../lib/utils";

interface ActivityTimelineProps {
  activities: ActivityLog[];
  loading: boolean;
}

export function ActivityTimeline({ activities, loading }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="timeline card animate-pulse" data-testid="timeline-loading">
        <h3>📋 Activity Timeline</h3>
        <p className="text-secondary">Loading activities...</p>
      </div>
    );
  }

  return (
    <div className="timeline card" data-testid="activity-timeline">
      <div className="timeline__header">
        <h3>📋 Activity Timeline</h3>
        <span className="badge badge--neutral">{activities.length} activities</span>
      </div>

      {activities.length === 0 ? (
        <div className="timeline__empty">
          <p className="text-secondary">No activities recorded today.</p>
          <p className="text-tertiary">Start tracking to see your activity here.</p>
        </div>
      ) : (
        <div className="timeline__list">
          {activities.map((activity, index) => (
            <ActivityCard key={activity.id} activity={activity} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ActivityCardProps {
  activity: ActivityLog;
  index: number;
}

function ActivityCard({ activity, index }: ActivityCardProps) {
  const categoryColor = getCategoryColor(activity.category);

  return (
    <div
      className="activity-card animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
      data-testid={`activity-card-${activity.id}`}
    >
      <div
        className="activity-card__category-bar"
        style={{ backgroundColor: categoryColor }}
      />
      <div className="activity-card__content">
        <div className="activity-card__header">
          <span className="activity-card__app">{activity.app_name}</span>
          <span className="activity-card__duration text-secondary">
            {formatDuration(activity.duration_seconds)}
          </span>
        </div>
        {activity.window_title && (
          <span className="activity-card__title text-tertiary">
            {activity.window_title}
          </span>
        )}
        <div className="activity-card__meta">
          <span
            className="badge"
            style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
          >
            {activity.category}
          </span>
          {activity.is_meeting && (
            <span className="badge badge--meeting">🤝 Meeting</span>
          )}
          {activity.is_idle && (
            <span className="badge badge--idle">💤 Idle</span>
          )}
          <span className="activity-card__time text-tertiary">
            {formatTime(activity.start_time)}
          </span>
        </div>
      </div>
    </div>
  );
}
