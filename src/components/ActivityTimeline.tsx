/**
 * ActivityTimeline — Scrollable list of today's tracked activities.
 */

import { type ActivityLog } from "../hooks/useTauri";
import { formatDuration, formatTime, getCategoryColor } from "../lib/utils";
import { List, Trash2, Users, Moon } from "lucide-react";

interface ActivityTimelineProps {
  activities: ActivityLog[];
  loading: boolean;
  onDelete?: (id: string) => void;
  onDeleteAll?: () => void;
}

export function ActivityTimeline({ activities, loading, onDelete, onDeleteAll }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="timeline card animate-pulse" data-testid="timeline-loading">
        <h3 style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}><List size={20} /> Activity Timeline</h3>
        <p className="text-secondary">Loading activities...</p>
      </div>
    );
  }

  return (
    <div className="timeline card" data-testid="activity-timeline">
      <div className="timeline__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "var(--space-2)" }}><List size={20} /> Activity Timeline</h3>
          <span className="badge badge--neutral">{activities.length} activities</span>
        </div>
        
        {activities.length > 0 && onDeleteAll && (
          <button 
            className="btn btn--secondary" 
            style={{ padding: "var(--space-1) var(--space-2)", fontSize: "var(--font-size-sm)", color: "var(--color-danger)" }}
            onClick={() => {
              if (window.confirm("Are you sure you want to delete ALL activities for today? This cannot be undone.")) {
                onDeleteAll();
              }
            }}
          >
            Delete All
          </button>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="timeline__empty">
          <p className="text-secondary">No activities recorded today.</p>
          <p className="text-tertiary">Start tracking to see your activity here.</p>
        </div>
      ) : (
        <div className="timeline__list">
          {activities.map((activity, index) => (
            <ActivityCard 
              key={activity.id} 
              activity={activity} 
              onDelete={onDelete ? () => onDelete(activity.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ActivityCardProps {
  activity: ActivityLog;
  onDelete?: () => void;
}

function ActivityCard({ activity, onDelete }: ActivityCardProps) {
  const categoryColor = getCategoryColor(activity.category);

  return (
    <div
      className="activity-card"
      data-testid={`activity-card-${activity.id}`}
    >
      <div
        className="activity-card__category-bar"
        style={{ backgroundColor: categoryColor }}
      />
      <div className="activity-card__content">
        <div className="activity-card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="activity-card__app">{activity.app_name}</span>
            <span className="activity-card__duration text-secondary">
              {formatDuration(activity.duration_seconds)}
            </span>
          </div>
          
          {onDelete && (
              <button 
                className="btn btn--secondary" 
                style={{ padding: "var(--space-1) var(--space-2)", background: "transparent", border: "none", color: "var(--color-danger)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete activity: ${activity.app_name}?`)) {
                    onDelete();
                  }
                }}
                title="Delete activity"
              >
                <Trash2 size={16} />
              </button>
          )}
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
            <span className="badge badge--meeting"><Users size={12} /> Meeting</span>
          )}
          {activity.is_idle && (
            <span className="badge badge--idle"><Moon size={12} /> Idle</span>
          )}
          <span className="activity-card__time text-tertiary">
            {formatTime(activity.start_time)}
          </span>
        </div>
      </div>
    </div>
  );
}
