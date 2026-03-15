#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(unused_variables)]
// Data models for IntelliWork storage layer.
//
// These types map directly to database tables and are used
// throughout the Rust backend. All types derive Serde for
// IPC serialization to the React frontend.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fmt;

/// Work activity categories.
///
/// Matches the CHECK constraint in the `activity_logs` table.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum Category {
    Development,
    Research,
    Communication,
    Meetings,
    Administration,
    Documentation,
    Design,
    #[serde(rename = "Project Management")]
    ProjectManagement,
    Uncategorized,
}

impl fmt::Display for Category {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Category::Development => write!(f, "Development"),
            Category::Research => write!(f, "Research"),
            Category::Communication => write!(f, "Communication"),
            Category::Meetings => write!(f, "Meetings"),
            Category::Administration => write!(f, "Administration"),
            Category::Documentation => write!(f, "Documentation"),
            Category::Design => write!(f, "Design"),
            Category::ProjectManagement => write!(f, "Project Management"),
            Category::Uncategorized => write!(f, "Uncategorized"),
        }
    }
}

impl Category {
    /// Parse a category string from the database.
    pub fn from_str_safe(s: &str) -> Self {
        match s {
            "Development" => Category::Development,
            "Research" => Category::Research,
            "Communication" => Category::Communication,
            "Meetings" => Category::Meetings,
            "Administration" => Category::Administration,
            "Documentation" => Category::Documentation,
            "Design" => Category::Design,
            "Project Management" => Category::ProjectManagement,
            _ => Category::Uncategorized,
        }
    }
}

/// A single tracked activity log entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityLog {
    pub id: String,
    pub app_name: String,
    pub window_title: Option<String>,
    pub start_time: String,
    pub end_time: Option<String>,
    pub duration_seconds: i64,
    pub category: String,
    pub confidence: f64,
    pub is_meeting: bool,
    pub is_idle: bool,
    pub browser_url: Option<String>,
    pub project: Option<String>,
    pub created_at: Option<String>,
}

impl Default for ActivityLog {
    fn default() -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            app_name: String::new(),
            window_title: None,
            start_time: Utc::now().to_rfc3339(),
            end_time: None,
            duration_seconds: 0,
            category: Category::Uncategorized.to_string(),
            confidence: 0.0,
            is_meeting: false,
            is_idle: false,
            browser_url: None,
            project: None,
            created_at: Some(Utc::now().to_rfc3339()),
        }
    }
}

impl ActivityLog {
    /// Create a new activity log entry.
    pub fn new(
        app_name: &str,
        window_title: Option<&str>,
        start_time: DateTime<Utc>,
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            app_name: app_name.to_string(),
            window_title: window_title.map(|s| s.to_string()),
            start_time: start_time.to_rfc3339(),
            end_time: None,
            duration_seconds: 0,
            category: Category::Uncategorized.to_string(),
            confidence: 0.0,
            is_meeting: false,
            is_idle: false,
            browser_url: None,
            project: None,
            created_at: Some(Utc::now().to_rfc3339()),
        }
    }

    /// Finalize the activity with an end time, calculating duration.
    pub fn finalize(&mut self, end_time: DateTime<Utc>) {
        let start = DateTime::parse_from_rfc3339(&self.start_time)
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or(end_time);
        self.end_time = Some(end_time.to_rfc3339());
        self.duration_seconds = (end_time - start).num_seconds().max(0);
    }
}

/// Meeting-specific metadata linked to an activity log.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MeetingLog {
    pub id: String,
    pub activity_id: String,
    pub meeting_title: Option<String>,
    pub participants: Option<String>,
    pub meeting_type: String,
    pub source_app: String,
    pub calendar_event_id: Option<String>,
    pub created_at: Option<String>,
}

impl MeetingLog {
    /// Create a new meeting log entry.
    pub fn new(
        activity_id: &str,
        source_app: &str,
        meeting_title: Option<&str>,
        meeting_type: &str,
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            activity_id: activity_id.to_string(),
            meeting_title: meeting_title.map(|s| s.to_string()),
            participants: None,
            meeting_type: meeting_type.to_string(),
            source_app: source_app.to_string(),
            calendar_event_id: None,
            created_at: Some(Utc::now().to_rfc3339()),
        }
    }
}

/// AI-generated daily summary record.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailySummaryRecord {
    pub id: String,
    pub summary_date: String,
    pub raw_summary: String,
    pub edited_summary: Option<String>,
    pub total_productive_seconds: i64,
    pub category_breakdown: Option<String>,
    pub ai_provider: Option<String>,
    pub is_approved: bool,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

impl DailySummaryRecord {
    /// Create a new daily summary record.
    pub fn new(
        summary_date: &str,
        raw_summary: &str,
        total_productive_seconds: i64,
        ai_provider: &str,
    ) -> Self {
        let now = Utc::now().to_rfc3339();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            summary_date: summary_date.to_string(),
            raw_summary: raw_summary.to_string(),
            edited_summary: None,
            total_productive_seconds,
            category_breakdown: None,
            ai_provider: Some(ai_provider.to_string()),
            is_approved: false,
            created_at: Some(now.clone()),
            updated_at: Some(now),
        }
    }
}

/// A manual project tag rule for auto-learning.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectTag {
    pub id: String,
    pub title_pattern: String,
    pub project_name: String,
    pub created_at: Option<String>,
}

impl ProjectTag {
    pub fn new(title_pattern: &str, project_name: &str) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title_pattern: title_pattern.to_string(),
            project_name: project_name.to_string(),
            created_at: Some(Utc::now().to_rfc3339()),
        }
    }
}

