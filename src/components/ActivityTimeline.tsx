/**
 * ActivityTimeline — Scrollable list of today's tracked activities.
 */

import { useState, useMemo } from "react";
import { type ActivityLog } from "../hooks/useTauri";
import { formatDuration, formatTime, getCategoryColor } from "../lib/utils";
import { List, Trash2, Users, Moon, ChevronDown, ChevronRight, Layers, LayoutList } from "lucide-react";

export interface GroupedActivity {
  id: string; // Artificial ID based on start time
  isGroup: true;
  app_name: string;
  category: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number;
  activities: ActivityLog[]; // Inner flat activities
}

type TimelineItem = ActivityLog | GroupedActivity;

interface HourlyGroup {
  hourLabel: string; // e.g., "10:00 AM"
  items: TimelineItem[];
}

interface ActivityTimelineProps {
  activities: ActivityLog[];
  loading: boolean;
  onDelete?: (id: string) => void;
  onDeleteAll?: () => void;
}

export function ActivityTimeline({ activities, loading, onDelete, onDeleteAll }: ActivityTimelineProps) {
  const [viewMode, setViewMode] = useState<"smart" | "raw">("smart");
  
  // Extract unique categories available today for filter pills
  const availableCategories = useMemo(() => {
    const cats = new Set(activities.map(a => a.category));
    return Array.from(cats).sort();
  }, [activities]);

  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());

  // Toggle a category in the filter
  const toggleCategory = (cat: string) => {
    const next = new Set(activeCategories);
    if (next.has(cat)) {
      next.delete(cat);
    } else {
      next.add(cat);
    }
    setActiveCategories(next);
  };

  // 1. Filter activities
  const filteredActivities = useMemo(() => {
    if (activeCategories.size === 0) return activities;
    return activities.filter(a => activeCategories.has(a.category));
  }, [activities, activeCategories]);

  // 2. Process data based on ViewMode
  const hourlyGroups = useMemo<HourlyGroup[]>(() => {
    let itemsToGroup: TimelineItem[] = [];

    // If Smart mode, first compress consecutive identical apps
    if (viewMode === "smart") {
      let currentGroup: GroupedActivity | null = null;

      for (const act of filteredActivities) {
        if (!currentGroup) {
          // Initialize first string
          currentGroup = {
            id: `group-${act.id}`,
            isGroup: true,
            app_name: act.app_name,
            category: act.category,
            start_time: act.start_time,
            end_time: act.end_time,
            duration_seconds: act.duration_seconds,
            activities: [act]
          };
        } else if (currentGroup.app_name === act.app_name && currentGroup.category === act.category) {
          // Keep grouping if app is the same
          currentGroup.activities.push(act);
          currentGroup.duration_seconds += act.duration_seconds;
          currentGroup.end_time = act.end_time;
        } else {
          // App changed, seal current group and start new
          // If group only has 1 item, flatten it back to just the ActivityLog to save clicks
          if (currentGroup.activities.length === 1) {
            itemsToGroup.push(currentGroup.activities[0]);
          } else {
            itemsToGroup.push(currentGroup);
          }

          currentGroup = {
            id: `group-${act.id}`,
            isGroup: true,
            app_name: act.app_name,
            category: act.category,
            start_time: act.start_time,
            end_time: act.end_time,
            duration_seconds: act.duration_seconds,
            activities: [act]
          };
        }
      }
      
      if (currentGroup) {
         if (currentGroup.activities.length === 1) {
            itemsToGroup.push(currentGroup.activities[0]);
          } else {
            itemsToGroup.push(currentGroup);
          }
      }
    } else {
      // Raw mode just uses identical items
      itemsToGroup = [...filteredActivities];
    }

    // 3. Bucket into Hours
    const map = new Map<string, TimelineItem[]>();
    for (const item of itemsToGroup) {
      const d = new Date(item.start_time);
      // Format to "10:00 AM" mapping
      d.setMinutes(0);
      d.setSeconds(0);
      d.setMilliseconds(0);
      const hourLabel = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

      if (!map.has(hourLabel)) map.set(hourLabel, []);
      map.get(hourLabel)!.push(item);
    }

    // Convert map back to array maintaining chronological order 
    return Array.from(map.entries()).map(([hourLabel, items]) => ({
      hourLabel,
      items
    }));
  }, [filteredActivities, viewMode]);

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
      <div className="timeline__header" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
            <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "var(--space-2)" }}><List size={20} /> Activity Timeline</h3>
            <span className="badge badge--neutral">{filteredActivities.length} logs</span>
          </div>
          
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
            <div className="toggle-group" style={{ display: "flex", background: "var(--color-surface)", padding: "2px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
               <button 
                  className={`btn ${viewMode === "smart" ? "btn--primary" : "btn--secondary"}`} 
                  style={{ padding: "var(--space-1) var(--space-2)", fontSize: "var(--font-size-sm)", border: "none", display: "flex", alignItems: "center", gap: "2px" }}
                  onClick={() => setViewMode("smart")}
                  title="Smart Grouped View"
                >
                  <Layers size={14} /> Smart
               </button>
               <button 
                  className={`btn ${viewMode === "raw" ? "btn--primary" : "btn--secondary"}`} 
                  style={{ padding: "var(--space-1) var(--space-2)", fontSize: "var(--font-size-sm)", border: "none", display: "flex", alignItems: "center", gap: "2px" }}
                  onClick={() => setViewMode("raw")}
                  title="Raw Timeline Display"
                >
                  <LayoutList size={14} /> Raw
               </button>
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
        </div>

        {/* Filter Pills */}
        {availableCategories.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            {availableCategories.map(cat => {
              const isActive = activeCategories.has(cat);
              const color = getCategoryColor(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className="badge"
                  style={{
                    cursor: "pointer",
                    border: `1px solid ${isActive ? color : "var(--color-border)"}`,
                    backgroundColor: isActive ? `${color}20` : "transparent",
                    color: isActive ? color : "var(--text-secondary)",
                    opacity: activeCategories.size === 0 || isActive ? 1 : 0.5,
                    transition: "all 0.2s"
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {filteredActivities.length === 0 ? (
        <div className="timeline__empty">
          <p className="text-secondary">No activities found matching filters.</p>
        </div>
      ) : (
        <div className="timeline__list" style={{ position: "relative", maxHeight: "calc(100vh - 280px)", overflowY: "auto", paddingRight: "var(--space-2)" }}>
          {viewMode === "smart" ? (
            hourlyGroups.map((group) => (
              <div key={group.hourLabel} className="timeline__hour-block">
                 {/* Sticky Hourly Header */}
                 <div style={{ 
                   position: "sticky", 
                   top: 0, 
                   zIndex: 10, 
                   background: "var(--color-background)",
                   padding: "var(--space-2) 0",
                   borderBottom: "1px solid var(--color-border)",
                   marginBottom: "var(--space-2)",
                   backdropFilter: "blur(4px)"
                 }}>
                   <span className="text-secondary" style={{ fontSize: "var(--font-size-sm)", fontWeight: "bold" }}>
                      {group.hourLabel} 
                      <span style={{ fontWeight: "normal", marginLeft: "1rem", opacity: 0.6 }}>
                        {formatDuration(group.items.reduce((acc, i) => acc + i.duration_seconds, 0))}
                      </span>
                   </span>
                 </div>

                 {/* Render Items */}
                 {group.items.map((item) => {
                   if ("isGroup" in item) {
                     return <AccordionCard key={item.id} group={item} onDelete={onDelete} />;
                   } else {
                     return <ActivityCard key={item.id} activity={item} onDelete={onDelete ? () => onDelete(item.id) : undefined} />;
                   }
                 })}
              </div>
            ))
          ) : (
            filteredActivities.map((activity) => (
              <ActivityCard 
                key={activity.id} 
                activity={activity} 
                onDelete={onDelete ? () => onDelete(activity.id) : undefined}
              />
            ))
          )}
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

interface AccordionCardProps {
  group: GroupedActivity;
  onDelete?: (id: string) => void;
}

function AccordionCard({ group, onDelete }: AccordionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const categoryColor = getCategoryColor(group.category);

  return (
    <div
      className="activity-card accordion-card"
      style={{ display: "flex", flexDirection: "column", padding: 0 }}
    >
      {/* Parent Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          display: "flex", 
          padding: "var(--space-3)", 
          cursor: "pointer",
          position: "relative"
        }}
      >
        <div
          className="activity-card__category-bar"
          style={{ backgroundColor: categoryColor }}
        />
        
        <div style={{ marginRight: "var(--space-3)", display: "flex", alignItems: "center", color: "var(--text-tertiary)" }}>
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
        
        <div className="activity-card__content" style={{ flex: 1 }}>
          <div className="activity-card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="activity-card__app">{group.app_name}</span>
              <span className="activity-card__duration text-secondary">
                {formatDuration(group.duration_seconds)} <span style={{ opacity: 0.5, fontSize: "0.85em" }}>({group.activities.length} logs)</span>
              </span>
            </div>
            
             <span className="activity-card__time text-tertiary">
                {formatTime(group.start_time)}
            </span>
          </div>
          
          <div className="activity-card__meta" style={{ marginTop: "var(--space-2)" }}>
            <span
              className="badge"
              style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
            >
              {group.category}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Children */}
      {isExpanded && (
        <div style={{ 
          borderTop: "1px dashed var(--color-border)", 
          padding: "var(--space-2) var(--space-4) var(--space-2) 3rem",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
          backgroundColor: "var(--color-surface)"
        }}>
          {group.activities.map((act) => (
             <div key={act.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-size-sm)" }}>
                <div style={{ display: "flex", flexDirection: "column", maxWidth: "80%" }}>
                  <span className="text-secondary" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {act.window_title || "Unknown Window"}
                  </span>
                   <div style={{ display: "flex", gap: "var(--space-2)" }}>
                     {act.is_meeting && <span className="text-tertiary"><Users size={12} /></span>}
                     {act.is_idle && <span className="text-tertiary"><Moon size={12} /></span>}
                   </div>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <span className="text-tertiary">{formatDuration(act.duration_seconds)}</span>
                  {onDelete && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Delete this specific log?")) onDelete(act.id);
                      }}
                      style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", opacity: 0.5 }}
                      title="Delete entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
