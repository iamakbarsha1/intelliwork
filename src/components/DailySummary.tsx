import { useState, useEffect } from "react";
import { type ActivityLog, useAISummary, type DailySummaryRecord } from "../hooks/useTauri";
import { formatDuration } from "../lib/utils";
import { Calendar, Edit2, Clock, Target, Users, Monitor } from "lucide-react";

interface DailySummaryProps {
  activities: ActivityLog[];
  date: string;
}

export function DailySummary({ activities, date }: DailySummaryProps) {
  const { summary, loading: summaryLoading, saveSummary } = useAISummary(date);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

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

  useEffect(() => {
    if (summary) {
      setEditValue(summary.edited_summary || summary.raw_summary);
    }
  }, [summary]);

  const handleSave = async () => {
    if (!summary) return;
    
    try {
      const updated: DailySummaryRecord = {
        ...summary,
        edited_summary: editValue,
        is_approved: true
      };
      await saveSummary(updated);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save summary:", err);
      alert("Failed to save summary");
    }
  };

  return (
    <div className="daily-summary card" data-testid="daily-summary">
      <div className="daily-summary__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "var(--space-2)" }}><Calendar size={20} /> Daily Summary</h3>
          <span className="text-secondary">{date}</span>
        </div>
        
        {summary && !isEditing && (
          <button 
            className="btn btn--secondary" 
            style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-size-sm)" }}
            onClick={() => setIsEditing(true)}
          >
            <Edit2 size={14} /> Edit
          </button>
        )}
      </div>

      {summary && (
        <div className="daily-summary__ai-content" style={{ margin: "var(--space-4) 0", padding: "var(--space-3)", background: "var(--color-surface-elevated)", borderRadius: "var(--radius-md)" }}>
          {isEditing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <textarea 
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                style={{ 
                  width: "100%", 
                  minHeight: "150px", 
                  padding: "var(--space-2)",
                  background: "var(--color-bg)",
                  color: "var(--color-text)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-family-mono)",
                  fontSize: "var(--font-size-sm)"
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                <button 
                  className="btn btn--secondary" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditValue(summary.edited_summary || summary.raw_summary);
                  }}
                >
                  Cancel
                </button>
                <button className="btn btn--primary" onClick={handleSave}>
                  Save Summary
                </button>
              </div>
            </div>
          ) : (
            <div style={{ whiteSpace: "pre-wrap", fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
              {summary.edited_summary || summary.raw_summary}
            </div>
          )}
        </div>
      )}

      {!summary && !summaryLoading && (
         <div style={{ margin: "var(--space-4) 0", color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)", fontStyle: "italic" }}>
           AI Summary hasn't been generated for this date yet.
         </div>
      )}

      <div className="daily-summary__stats">
        <StatCard
          icon={<Clock size={20} />}
          label="Total Tracked"
          value={formatDuration(totalSeconds)}
        />
        <StatCard
          icon={<Target size={20} />}
          label="Productive"
          value={formatDuration(productiveSeconds)}
          accent={productivityRate >= 70 ? "success" : productivityRate >= 40 ? "warning" : "danger"}
        />
        <StatCard
          icon={<Users size={20} />}
          label="Meetings"
          value={`${meetingCount} (${formatDuration(meetingSeconds)})`}
        />
        <StatCard
          icon={<Monitor size={20} />}
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
  icon: React.ReactNode;
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
