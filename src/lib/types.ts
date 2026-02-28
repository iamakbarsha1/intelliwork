/**
 * Core TypeScript type definitions for IntelliWork.
 *
 * These types mirror the Rust backend types and are used throughout
 * the React frontend for type-safe IPC communication.
 */

/** Work activity categories */
export type Category =
  | "Development"
  | "Research"
  | "Communication"
  | "Meetings"
  | "Administration"
  | "Documentation"
  | "Design"
  | "Project Management"
  | "Uncategorized";

/** A single tracked activity log entry */
export interface ActivityLog {
  id: string;
  app_name: string;
  window_title: string | null;
  start_time: string;
  end_time: string | null;
  duration_seconds: number;
  category: Category;
  confidence: number;
  is_meeting: boolean;
  is_idle: boolean;
}

/** Meeting-specific metadata */
export interface MeetingLog {
  id: string;
  activity_id: string;
  meeting_title: string | null;
  participants: string[] | null;
  meeting_type: "scheduled" | "ad_hoc";
  source_app: string;
  calendar_event_id: string | null;
}

/** AI-generated daily summary */
export interface DailySummary {
  id: string;
  summary_date: string;
  raw_summary: SummaryData;
  edited_summary: SummaryData | null;
  total_productive_seconds: number;
  category_breakdown: Record<Category, number>;
  ai_provider: string;
  is_approved: boolean;
}

/** Structured summary content */
export interface SummaryData {
  meetings: MeetingSummaryItem[];
  development: WorkSummaryItem[];
  research: WorkSummaryItem[];
  communication: WorkSummaryItem[];
  administration: WorkSummaryItem[];
  documentation: WorkSummaryItem[];
  design: WorkSummaryItem[];
  total_productive_time: string;
}

/** A meeting entry in the summary */
export interface MeetingSummaryItem {
  title: string;
  duration: string;
  type: "scheduled" | "ad_hoc";
}

/** A work item entry in the summary */
export interface WorkSummaryItem {
  description: string;
  duration: string;
}

/** Current tracking state */
export interface TrackingStatus {
  is_tracking: boolean;
  is_within_office_hours: boolean;
  office_hours_enabled: boolean;
  office_hours_start: string;
  office_hours_end: string;
  tracking_since: string | null;
}

/** Application info from backend */
export interface AppInfo {
  name: string;
  version: string;
  description: string;
}
