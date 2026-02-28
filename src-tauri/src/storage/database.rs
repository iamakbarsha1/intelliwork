// Database operations for IntelliWork storage layer.
//
// This is the ONLY module that executes SQL queries.
// All methods return `Result<T, StorageError>`.
// Database struct is the single entry point for all storage operations.

use std::collections::HashMap;
use std::path::Path;

use rusqlite::{params, Connection};

use super::errors::StorageError;
use super::migrations;
use super::models::{ActivityLog, DailySummaryRecord, MeetingLog};

/// Main database interface for IntelliWork.
///
/// Wraps a SQLite connection and provides typed CRUD methods.
/// All operations go through this struct — no raw SQL elsewhere.
pub struct Database {
    conn: Connection,
}

impl Database {
    /// Open an unencrypted database at the given path.
    ///
    /// Creates the file if it doesn't exist.
    /// Runs migrations automatically.
    pub fn open(path: &Path) -> Result<Self, StorageError> {
        let conn = Connection::open(path)?;
        let db = Self { conn };
        db.initialize()?;
        Ok(db)
    }

    /// Open an in-memory database (for testing).
    ///
    /// Runs migrations automatically.
    pub fn open_in_memory() -> Result<Self, StorageError> {
        let conn = Connection::open_in_memory()?;
        let db = Self { conn };
        db.initialize()?;
        Ok(db)
    }

    /// Run migrations and set pragmas.
    fn initialize(&self) -> Result<(), StorageError> {
        migrations::run_migrations(&self.conn)?;
        Ok(())
    }

    // ─── Activity CRUD ─────────────────────────────────────────

    /// Insert a new activity log.
    ///
    /// Returns the generated ID.
    pub fn insert_activity(
        &self,
        activity: &ActivityLog,
    ) -> Result<String, StorageError> {
        self.conn.execute(
            "INSERT INTO activity_logs \
             (id, app_name, window_title, start_time, end_time, \
              duration_seconds, category, confidence, is_meeting, is_idle) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                activity.id,
                activity.app_name,
                activity.window_title,
                activity.start_time,
                activity.end_time,
                activity.duration_seconds,
                activity.category,
                activity.confidence,
                activity.is_meeting as i32,
                activity.is_idle as i32,
            ],
        )?;
        Ok(activity.id.clone())
    }

    /// Get all activities for a specific date (YYYY-MM-DD).
    pub fn get_activities_for_date(
        &self,
        date: &str,
    ) -> Result<Vec<ActivityLog>, StorageError> {
        let mut stmt = self.conn.prepare(
            "SELECT id, app_name, window_title, start_time, end_time, \
             duration_seconds, category, confidence, is_meeting, is_idle, created_at \
             FROM activity_logs \
             WHERE date(start_time) = ?1 \
             ORDER BY start_time ASC",
        )?;

        let activities = stmt
            .query_map(params![date], |row| {
                Ok(ActivityLog {
                    id: row.get(0)?,
                    app_name: row.get(1)?,
                    window_title: row.get(2)?,
                    start_time: row.get(3)?,
                    end_time: row.get(4)?,
                    duration_seconds: row.get(5)?,
                    category: row.get(6)?,
                    confidence: row.get(7)?,
                    is_meeting: row.get::<_, i32>(8)? != 0,
                    is_idle: row.get::<_, i32>(9)? != 0,
                    created_at: row.get(10)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(activities)
    }

    /// Update the category and confidence of an activity.
    pub fn update_activity_category(
        &self,
        id: &str,
        category: &str,
        confidence: f64,
    ) -> Result<(), StorageError> {
        let rows = self.conn.execute(
            "UPDATE activity_logs SET category = ?1, confidence = ?2 WHERE id = ?3",
            params![category, confidence, id],
        )?;

        if rows == 0 {
            return Err(StorageError::NotFound(format!(
                "Activity with id '{}'",
                id
            )));
        }
        Ok(())
    }

    /// Delete specific activities by their IDs.
    ///
    /// Returns the number of deleted records.
    pub fn delete_activities(
        &self,
        ids: &[String],
    ) -> Result<usize, StorageError> {
        if ids.is_empty() {
            return Ok(0);
        }

        let placeholders: String = ids
            .iter()
            .enumerate()
            .map(|(i, _)| format!("?{}", i + 1))
            .collect::<Vec<_>>()
            .join(", ");

        let sql = format!(
            "DELETE FROM activity_logs WHERE id IN ({})",
            placeholders
        );

        let params: Vec<&dyn rusqlite::types::ToSql> = ids
            .iter()
            .map(|id| id as &dyn rusqlite::types::ToSql)
            .collect();

        let count = self.conn.execute(&sql, params.as_slice())?;
        Ok(count)
    }

    /// Delete ALL activity logs.
    ///
    /// Returns the number of deleted records.
    pub fn delete_all_activities(&self) -> Result<usize, StorageError> {
        let count = self
            .conn
            .execute("DELETE FROM activity_logs", [])?;
        Ok(count)
    }

    // ─── Meeting CRUD ──────────────────────────────────────────

    /// Insert a new meeting log.
    pub fn insert_meeting(
        &self,
        meeting: &MeetingLog,
    ) -> Result<String, StorageError> {
        self.conn.execute(
            "INSERT INTO meeting_logs \
             (id, activity_id, meeting_title, participants, \
              meeting_type, source_app, calendar_event_id) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                meeting.id,
                meeting.activity_id,
                meeting.meeting_title,
                meeting.participants,
                meeting.meeting_type,
                meeting.source_app,
                meeting.calendar_event_id,
            ],
        )?;
        Ok(meeting.id.clone())
    }

    /// Get all meetings for a specific date.
    pub fn get_meetings_for_date(
        &self,
        date: &str,
    ) -> Result<Vec<MeetingLog>, StorageError> {
        let mut stmt = self.conn.prepare(
            "SELECT m.id, m.activity_id, m.meeting_title, m.participants, \
             m.meeting_type, m.source_app, m.calendar_event_id, m.created_at \
             FROM meeting_logs m \
             JOIN activity_logs a ON m.activity_id = a.id \
             WHERE date(a.start_time) = ?1 \
             ORDER BY a.start_time ASC",
        )?;

        let meetings = stmt
            .query_map(params![date], |row| {
                Ok(MeetingLog {
                    id: row.get(0)?,
                    activity_id: row.get(1)?,
                    meeting_title: row.get(2)?,
                    participants: row.get(3)?,
                    meeting_type: row.get(4)?,
                    source_app: row.get(5)?,
                    calendar_event_id: row.get(6)?,
                    created_at: row.get(7)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(meetings)
    }

    // ─── Summary CRUD ──────────────────────────────────────────

    /// Insert or update a daily summary (upsert by date).
    pub fn upsert_summary(
        &self,
        summary: &DailySummaryRecord,
    ) -> Result<(), StorageError> {
        self.conn.execute(
            "INSERT INTO daily_summaries \
             (id, summary_date, raw_summary, edited_summary, \
              total_productive_seconds, category_breakdown, \
              ai_provider, is_approved) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8) \
             ON CONFLICT(summary_date) DO UPDATE SET \
             raw_summary = excluded.raw_summary, \
             edited_summary = excluded.edited_summary, \
             total_productive_seconds = excluded.total_productive_seconds, \
             category_breakdown = excluded.category_breakdown, \
             ai_provider = excluded.ai_provider, \
             is_approved = excluded.is_approved, \
             updated_at = datetime('now')",
            params![
                summary.id,
                summary.summary_date,
                summary.raw_summary,
                summary.edited_summary,
                summary.total_productive_seconds,
                summary.category_breakdown,
                summary.ai_provider,
                summary.is_approved as i32,
            ],
        )?;
        Ok(())
    }

    /// Get the daily summary for a specific date.
    pub fn get_summary(
        &self,
        date: &str,
    ) -> Result<Option<DailySummaryRecord>, StorageError> {
        let mut stmt = self.conn.prepare(
            "SELECT id, summary_date, raw_summary, edited_summary, \
             total_productive_seconds, category_breakdown, \
             ai_provider, is_approved, created_at, updated_at \
             FROM daily_summaries WHERE summary_date = ?1",
        )?;

        let mut rows = stmt.query_map(params![date], |row| {
            Ok(DailySummaryRecord {
                id: row.get(0)?,
                summary_date: row.get(1)?,
                raw_summary: row.get(2)?,
                edited_summary: row.get(3)?,
                total_productive_seconds: row.get(4)?,
                category_breakdown: row.get(5)?,
                ai_provider: row.get(6)?,
                is_approved: row.get::<_, i32>(7)? != 0,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?;

        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    // ─── Config CRUD ───────────────────────────────────────────

    /// Get a configuration value by key.
    pub fn get_config(
        &self,
        key: &str,
    ) -> Result<Option<String>, StorageError> {
        let mut stmt = self
            .conn
            .prepare("SELECT value FROM config WHERE key = ?1")?;

        let mut rows = stmt.query_map(params![key], |row| row.get(0))?;

        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    /// Set a configuration value (insert or update).
    pub fn set_config(
        &self,
        key: &str,
        value: &str,
    ) -> Result<(), StorageError> {
        self.conn.execute(
            "INSERT INTO config (key, value, updated_at) \
             VALUES (?1, ?2, datetime('now')) \
             ON CONFLICT(key) DO UPDATE SET \
             value = excluded.value, \
             updated_at = datetime('now')",
            params![key, value],
        )?;
        Ok(())
    }

    /// Get all configuration values.
    pub fn get_all_config(
        &self,
    ) -> Result<HashMap<String, String>, StorageError> {
        let mut stmt = self
            .conn
            .prepare("SELECT key, value FROM config")?;

        let config = stmt
            .query_map([], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            })?
            .collect::<Result<HashMap<_, _>, _>>()?;

        Ok(config)
    }

    // ─── Maintenance ───────────────────────────────────────────

    /// Delete activity data older than the specified retention period.
    ///
    /// Returns the number of deleted records.
    pub fn cleanup_old_data(
        &self,
        retention_days: u32,
    ) -> Result<usize, StorageError> {
        let count = self.conn.execute(
            "DELETE FROM activity_logs \
             WHERE date(start_time) < date('now', ?1)",
            params![format!("-{} days", retention_days)],
        )?;
        Ok(count)
    }

    /// Run an integrity check on the database.
    pub fn integrity_check(&self) -> Result<bool, StorageError> {
        let result: String = self.conn.query_row(
            "PRAGMA integrity_check",
            [],
            |row| row.get(0),
        )?;
        Ok(result == "ok")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::storage::models::{
        ActivityLog, DailySummaryRecord, MeetingLog,
    };

    fn create_test_db() -> Database {
        Database::open_in_memory().unwrap()
    }

    fn create_test_activity(
        app_name: &str,
        category: &str,
    ) -> ActivityLog {
        ActivityLog {
            id: uuid::Uuid::new_v4().to_string(),
            app_name: app_name.to_string(),
            window_title: Some("test window".to_string()),
            start_time: "2026-03-01T09:00:00+00:00".to_string(),
            end_time: Some("2026-03-01T10:00:00+00:00".to_string()),
            duration_seconds: 3600,
            category: category.to_string(),
            confidence: 0.95,
            is_meeting: false,
            is_idle: false,
            created_at: None,
        }
    }

    // ─── Activity Tests ────────────────────────────────────────

    #[test]
    fn test_insert_and_retrieve_activity() {
        let db = create_test_db();
        let activity = create_test_activity("VS Code", "Development");
        let id = activity.id.clone();

        db.insert_activity(&activity).unwrap();

        let activities = db.get_activities_for_date("2026-03-01").unwrap();
        assert_eq!(activities.len(), 1);
        assert_eq!(activities[0].id, id);
        assert_eq!(activities[0].app_name, "VS Code");
        assert_eq!(activities[0].category, "Development");
        assert_eq!(activities[0].duration_seconds, 3600);
    }

    #[test]
    fn test_get_activities_empty_date() {
        let db = create_test_db();
        let activities = db.get_activities_for_date("2025-01-01").unwrap();
        assert!(activities.is_empty());
    }

    #[test]
    fn test_update_activity_category() {
        let db = create_test_db();
        let activity = create_test_activity("Chrome", "Uncategorized");
        let id = activity.id.clone();

        db.insert_activity(&activity).unwrap();
        db.update_activity_category(&id, "Research", 0.85).unwrap();

        let activities = db.get_activities_for_date("2026-03-01").unwrap();
        assert_eq!(activities[0].category, "Research");
        assert!((activities[0].confidence - 0.85).abs() < f64::EPSILON);
    }

    #[test]
    fn test_update_activity_not_found() {
        let db = create_test_db();
        let result = db.update_activity_category(
            "nonexistent-id",
            "Development",
            0.9,
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_delete_specific_activities() {
        let db = create_test_db();
        let a1 = create_test_activity("VS Code", "Development");
        let a2 = create_test_activity("Chrome", "Research");
        let a3 = create_test_activity("Teams", "Communication");

        let id1 = a1.id.clone();
        let id2 = a2.id.clone();

        db.insert_activity(&a1).unwrap();
        db.insert_activity(&a2).unwrap();
        db.insert_activity(&a3).unwrap();

        let deleted = db
            .delete_activities(&[id1, id2])
            .unwrap();
        assert_eq!(deleted, 2);

        let remaining = db.get_activities_for_date("2026-03-01").unwrap();
        assert_eq!(remaining.len(), 1);
        assert_eq!(remaining[0].app_name, "Teams");
    }

    #[test]
    fn test_delete_empty_ids() {
        let db = create_test_db();
        let deleted = db.delete_activities(&[]).unwrap();
        assert_eq!(deleted, 0);
    }

    #[test]
    fn test_delete_all_activities() {
        let db = create_test_db();
        db.insert_activity(
            &create_test_activity("VS Code", "Development"),
        )
        .unwrap();
        db.insert_activity(
            &create_test_activity("Chrome", "Research"),
        )
        .unwrap();

        let deleted = db.delete_all_activities().unwrap();
        assert_eq!(deleted, 2);

        let remaining = db.get_activities_for_date("2026-03-01").unwrap();
        assert!(remaining.is_empty());
    }

    // ─── Meeting Tests ─────────────────────────────────────────

    #[test]
    fn test_insert_and_retrieve_meeting() {
        let db = create_test_db();

        let activity = create_test_activity("Teams", "Meetings");
        let activity_id = activity.id.clone();
        db.insert_activity(&activity).unwrap();

        let meeting = MeetingLog::new(
            &activity_id,
            "Microsoft Teams",
            Some("Sprint Planning"),
            "scheduled",
        );
        db.insert_meeting(&meeting).unwrap();

        let meetings = db.get_meetings_for_date("2026-03-01").unwrap();
        assert_eq!(meetings.len(), 1);
        assert_eq!(meetings[0].meeting_title, Some("Sprint Planning".to_string()));
        assert_eq!(meetings[0].meeting_type, "scheduled");
    }

    // ─── Summary Tests ─────────────────────────────────────────

    #[test]
    fn test_upsert_and_retrieve_summary() {
        let db = create_test_db();

        let summary = DailySummaryRecord::new(
            "2026-03-01",
            "{\"meetings\": []}",
            26400,
            "rule_based",
        );
        db.upsert_summary(&summary).unwrap();

        let retrieved = db.get_summary("2026-03-01").unwrap();
        assert!(retrieved.is_some());
        let s = retrieved.unwrap();
        assert_eq!(s.summary_date, "2026-03-01");
        assert_eq!(s.total_productive_seconds, 26400);
        assert!(!s.is_approved);
    }

    #[test]
    fn test_upsert_updates_existing_summary() {
        let db = create_test_db();

        let summary1 = DailySummaryRecord::new(
            "2026-03-01",
            "{\"v1\": true}",
            1000,
            "rule_based",
        );
        db.upsert_summary(&summary1).unwrap();

        let summary2 = DailySummaryRecord::new(
            "2026-03-01",
            "{\"v2\": true}",
            2000,
            "openai",
        );
        db.upsert_summary(&summary2).unwrap();

        let retrieved = db.get_summary("2026-03-01").unwrap().unwrap();
        assert_eq!(retrieved.raw_summary, "{\"v2\": true}");
        assert_eq!(retrieved.total_productive_seconds, 2000);
    }

    #[test]
    fn test_get_summary_not_found() {
        let db = create_test_db();
        let result = db.get_summary("2099-01-01").unwrap();
        assert!(result.is_none());
    }

    // ─── Config Tests ──────────────────────────────────────────

    #[test]
    fn test_get_default_config() {
        let db = create_test_db();
        let value = db.get_config("office_hours_start").unwrap();
        assert_eq!(value, Some("09:00".to_string()));
    }

    #[test]
    fn test_set_and_get_config() {
        let db = create_test_db();
        db.set_config("ai_provider", "openai").unwrap();

        let value = db.get_config("ai_provider").unwrap();
        assert_eq!(value, Some("openai".to_string()));
    }

    #[test]
    fn test_set_config_creates_new_key() {
        let db = create_test_db();
        db.set_config("custom_key", "custom_value").unwrap();

        let value = db.get_config("custom_key").unwrap();
        assert_eq!(value, Some("custom_value".to_string()));
    }

    #[test]
    fn test_get_all_config() {
        let db = create_test_db();
        let config = db.get_all_config().unwrap();

        assert!(config.contains_key("tracking_enabled"));
        assert!(config.contains_key("office_hours_start"));
        assert!(config.contains_key("ai_provider"));
        assert!(config.len() >= 8); // 8 default values
    }

    #[test]
    fn test_get_nonexistent_config() {
        let db = create_test_db();
        let value = db.get_config("nonexistent_key").unwrap();
        assert!(value.is_none());
    }

    // ─── Maintenance Tests ─────────────────────────────────────

    #[test]
    fn test_integrity_check() {
        let db = create_test_db();
        assert!(db.integrity_check().unwrap());
    }

    #[test]
    fn test_multiple_activities_same_date() {
        let db = create_test_db();

        db.insert_activity(
            &create_test_activity("VS Code", "Development"),
        )
        .unwrap();
        db.insert_activity(
            &create_test_activity("Chrome", "Research"),
        )
        .unwrap();
        db.insert_activity(
            &create_test_activity("Teams", "Communication"),
        )
        .unwrap();

        let activities = db.get_activities_for_date("2026-03-01").unwrap();
        assert_eq!(activities.len(), 3);
    }
}
