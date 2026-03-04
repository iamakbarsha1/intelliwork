import { useState, useEffect } from "react";
import { type ActivityLog, type TrackingState } from "../hooks/useTauri";
import { formatDuration, getCategoryColor } from "../lib/utils";
import { Activity, Clock } from "lucide-react";
import { FocusScore } from "./FocusScore";

interface LiveViewProps {
  activities: ActivityLog[];
  tracking: TrackingState;
}

export function LiveView({ activities, tracking }: LiveViewProps) {
  const [liveDuration, setLiveDuration] = useState(tracking.session_duration_seconds);

  // Tick the live timer for the current session
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (tracking.is_tracking && tracking.current_app && !tracking.is_idle) {
      setLiveDuration(tracking.session_duration_seconds);
      interval = setInterval(() => {
        setLiveDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setLiveDuration(tracking.session_duration_seconds);
    }
    return () => clearInterval(interval);
  }, [tracking]);

  // Aggregate past activities by app_name
  const appAggregations: Record<string, { duration: number, category: string, isMeeting: boolean, windowTitles: Set<string> }> = {};

  activities.forEach(act => {
    if (!appAggregations[act.app_name]) {
      appAggregations[act.app_name] = {
        duration: 0,
        category: act.category,
        isMeeting: act.is_meeting,
        windowTitles: new Set<string>()
      };
    }
    appAggregations[act.app_name].duration += act.duration_seconds;
    if (act.window_title) {
        appAggregations[act.app_name].windowTitles.add(act.window_title);
    }
  });

  // Convert to array and sort by duration
  const aggregatedList = Object.entries(appAggregations)
    .map(([appName, data]) => ({ appName, ...data }))
    .sort((a, b) => b.duration - a.duration);

  // Total recorded daily time (from finished activities)
  const totalRecordedSeconds = activities.reduce((sum, a) => sum + a.duration_seconds, 0);
  
  // Total overall tracking time = recorded + current running session
  const totalDailySeconds = totalRecordedSeconds + (tracking.is_tracking && tracking.current_app ? liveDuration : 0);

  return (
    <div className="live-view card animate-fade-in" data-testid="live-view" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div className="live-view__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Activity size={20} /> Live Tracking Activity
          </h3>
          <span className="badge badge--neutral" style={{ fontSize: "var(--font-size-md)", padding: "var(--space-2) var(--space-4)" }}>
            Total Today: {formatDuration(totalDailySeconds)}
          </span>
        </div>
        <FocusScore activities={activities} compact={true} />
      </div>

      <div className="live-view__current" style={{ padding: "var(--space-4)", background: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
        <h4 style={{ marginBottom: "var(--space-2)", color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", textTransform: "uppercase" }}>Current Active Window</h4>
        {tracking.is_tracking && tracking.current_app ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                   <div style={{ fontWeight: "bold", fontSize: "var(--font-size-lg)" }}>{tracking.current_app}</div>
                   {tracking.current_window && <div className="text-tertiary" style={{ fontSize: "var(--font-size-sm)" }}>{tracking.current_window}</div>}
                   {!tracking.is_idle && <span className="badge" style={{ marginTop: "var(--space-2)", backgroundColor: `${getCategoryColor(tracking.current_category)}20`, color: getCategoryColor(tracking.current_category) }}>{tracking.current_category}</span>}
                   {tracking.is_idle && <span className="badge badge--idle" style={{ marginTop: "var(--space-2)" }}>System Idle</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "1.5rem", fontWeight: "bold", color: tracking.is_idle ? "var(--color-warning)" : "var(--color-success)", fontVariantNumeric: "tabular-nums" }}>
                   <Clock size={24} className={!tracking.is_idle ? "animate-pulse" : ""} /> {formatDuration(liveDuration)}
                </div>
            </div>
        ) : (
            <div className="text-secondary" style={{ fontStyle: "italic" }}>No active tracking session. Target a window to begin.</div>
        )}
      </div>

      <div className="live-view__table-container styled-scroll" style={{ flex: 1 }}>
        <h4 style={{ marginBottom: "var(--space-4)", color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", textTransform: "uppercase" }}>Today's App Usage ({aggregatedList.length} Apps)</h4>
        
        {aggregatedList.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border-subtle)", color: "var(--color-text-secondary)" }}>
                        <th style={{ padding: "var(--space-2) 0" }}>Application</th>
                        <th style={{ padding: "var(--space-2) 0" }}>Category</th>
                        <th style={{ padding: "var(--space-2) 0", textAlign: "right" }}>Total Time</th>
                    </tr>
                </thead>
                <tbody>
                    {aggregatedList.map((app) => (
                        <tr key={app.appName} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                            <td style={{ padding: "var(--space-3) 0" }}>
                                <div style={{ fontWeight: "var(--font-weight-medium)" }}>{app.appName}</div>
                            </td>
                            <td style={{ padding: "var(--space-3) 0" }}>
                                <span className="badge" style={{ backgroundColor: `${getCategoryColor(app.category)}20`, color: getCategoryColor(app.category) }}>
                                    {app.category}
                                </span>
                            </td>
                            <td style={{ padding: "var(--space-3) 0", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                                {formatDuration(app.duration)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        ) : (
            <div className="text-secondary" style={{ textAlign: "center", padding: "var(--space-8) 0" }}>No apps tracked yet today.</div>
        )}
      </div>
    </div>
  );
}
