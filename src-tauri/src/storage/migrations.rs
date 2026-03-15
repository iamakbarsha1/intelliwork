#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(unused_variables)]
// Database schema migrations for IntelliWork.
//
// All schema changes must go through versioned migrations.
// Never use inline DDL outside this module.

use rusqlite::Connection;

use super::errors::StorageError;

/// Current schema version.
const SCHEMA_VERSION: u32 = 4;

/// Run all pending database migrations.
///
/// Creates tables, indexes, and sets pragmas for optimal performance.
/// Migrations are idempotent — safe to call on every startup.
pub fn run_migrations(conn: &Connection) -> Result<(), StorageError> {
    // Enable WAL mode for concurrent reads/writes
    conn.execute_batch("PRAGMA journal_mode=WAL;")?;
    conn.execute_batch("PRAGMA foreign_keys=ON;")?;

    let current_version = get_schema_version(conn)?;

    if current_version < 1 {
        migrate_v1(conn)?;
    }

    if current_version < 2 {
        migrate_v2(conn)?;
    }

    if current_version < 3 {
        migrate_v3(conn)?;
    }

    if current_version < 4 {
        migrate_v4(conn)?;
    }

    set_schema_version(conn, SCHEMA_VERSION)?;

    log::info!(
        "Database migrations complete (version: {})",
        SCHEMA_VERSION,
    );

    Ok(())
}

/// Get the current schema version from the database.
fn get_schema_version(conn: &Connection) -> Result<u32, StorageError> {
    let version: u32 = conn
        .pragma_query_value(None, "user_version", |row| row.get(0))
        .unwrap_or(0);
    Ok(version)
}

/// Set the schema version in the database.
fn set_schema_version(
    conn: &Connection,
    version: u32,
) -> Result<(), StorageError> {
    conn.pragma_update(None, "user_version", version)?;
    Ok(())
}

/// Migration v1: Initial schema creation.
///
/// Creates all core tables, indexes, and default config values.
fn migrate_v1(conn: &Connection) -> Result<(), StorageError> {
    log::info!("Running migration v1: initial schema");

    conn.execute_batch(
        "
        -- Core activity log
        CREATE TABLE IF NOT EXISTS activity_logs (
            id              TEXT PRIMARY KEY,
            app_name        TEXT NOT NULL,
            window_title    TEXT,
            start_time      TEXT NOT NULL,
            end_time        TEXT,
            duration_seconds INTEGER DEFAULT 0,
            category        TEXT DEFAULT 'Uncategorized',
            confidence      REAL DEFAULT 0.0,
            is_meeting      INTEGER DEFAULT 0,
            is_idle         INTEGER DEFAULT 0,
            created_at      TEXT DEFAULT (datetime('now')),

            CHECK (category IN (
                'Development', 'Research', 'Communication',
                'Meetings', 'Administration', 'Documentation',
                'Design', 'Project Management', 'Uncategorized'
            ))
        );

        -- Meeting-specific metadata
        CREATE TABLE IF NOT EXISTS meeting_logs (
            id              TEXT PRIMARY KEY,
            activity_id     TEXT NOT NULL REFERENCES activity_logs(id) ON DELETE CASCADE,
            meeting_title   TEXT,
            participants    TEXT,
            meeting_type    TEXT DEFAULT 'ad_hoc',
            source_app      TEXT,
            calendar_event_id TEXT,
            created_at      TEXT DEFAULT (datetime('now')),

            CHECK (meeting_type IN ('scheduled', 'ad_hoc'))
        );

        -- AI-generated daily summaries
        CREATE TABLE IF NOT EXISTS daily_summaries (
            id              TEXT PRIMARY KEY,
            summary_date    TEXT NOT NULL UNIQUE,
            raw_summary     TEXT NOT NULL,
            edited_summary  TEXT,
            total_productive_seconds INTEGER DEFAULT 0,
            category_breakdown TEXT,
            ai_provider     TEXT,
            is_approved     INTEGER DEFAULT 0,
            created_at      TEXT DEFAULT (datetime('now')),
            updated_at      TEXT DEFAULT (datetime('now'))
        );

        -- User preferences and configuration
        CREATE TABLE IF NOT EXISTS config (
            key             TEXT PRIMARY KEY,
            value           TEXT NOT NULL,
            updated_at      TEXT DEFAULT (datetime('now'))
        );

        -- Performance indexes
        CREATE INDEX IF NOT EXISTS idx_activity_start
            ON activity_logs(start_time);
        CREATE INDEX IF NOT EXISTS idx_activity_category
            ON activity_logs(category);
        CREATE INDEX IF NOT EXISTS idx_activity_date
            ON activity_logs(date(start_time));
        CREATE INDEX IF NOT EXISTS idx_meeting_activity
            ON meeting_logs(activity_id);
        CREATE INDEX IF NOT EXISTS idx_summary_date
            ON daily_summaries(summary_date);

        -- Default configuration values
        INSERT OR IGNORE INTO config (key, value)
            VALUES ('tracking_enabled', 'false');
        INSERT OR IGNORE INTO config (key, value)
            VALUES ('consent_granted', 'false');
        INSERT OR IGNORE INTO config (key, value)
            VALUES ('office_hours_enabled', 'true');
        INSERT OR IGNORE INTO config (key, value)
            VALUES ('office_hours_start', '09:00');
        INSERT OR IGNORE INTO config (key, value)
            VALUES ('office_hours_end', '18:00');
        INSERT OR IGNORE INTO config (key, value)
            VALUES ('idle_threshold_seconds', '180');
        INSERT OR IGNORE INTO config (key, value)
            VALUES ('ai_provider', 'rule_based');
        INSERT OR IGNORE INTO config (key, value)
            VALUES ('theme', 'system');
        ",
    )?;

    Ok(())
}

/// Migration v2: Add browser_url to activity_logs
fn migrate_v2(conn: &Connection) -> Result<(), StorageError> {
    log::info!("Running migration v2: add browser_url column");
    conn.execute_batch("ALTER TABLE activity_logs ADD COLUMN browser_url TEXT;")?;
    Ok(())
}

/// Migration v3: Add project to activity_logs and create project_tags table
fn migrate_v3(conn: &Connection) -> Result<(), StorageError> {
    log::info!("Running migration v3: add project tags");
    conn.execute_batch(
        "
        ALTER TABLE activity_logs ADD COLUMN project TEXT;

        CREATE TABLE IF NOT EXISTS project_tags (
            id              TEXT PRIMARY KEY,
            title_pattern   TEXT NOT NULL UNIQUE,
            project_name    TEXT NOT NULL,
            created_at      TEXT DEFAULT (datetime('now'))
        );
        ",
    )?;
    Ok(())
}

/// Migration v4: Add achievements, weekly insights, and meeting voice notes
fn migrate_v4(conn: &Connection) -> Result<(), StorageError> {
    log::info!("Running migration v4: achievements and voice notes");
    conn.execute_batch(
        "
        -- Achievement Tracking
        CREATE TABLE IF NOT EXISTS achievements (
            id              TEXT PRIMARY KEY,
            type            TEXT NOT NULL, -- 'milestone', 'streak'
            name            TEXT NOT NULL,
            value           INTEGER DEFAULT 0,
            earned_at       TEXT DEFAULT (datetime('now')),
            metadata        TEXT -- JSON string
        );

        -- Weekly Insights Cache
        CREATE TABLE IF NOT EXISTS weekly_insights (
            id              TEXT PRIMARY KEY,
            week_start_date TEXT NOT NULL UNIQUE,
            raw_insight     TEXT NOT NULL,
            ai_provider     TEXT,
            created_at      TEXT DEFAULT (datetime('now'))
        );

        -- Add voice note columns to meeting_logs
        ALTER TABLE meeting_logs ADD COLUMN voice_note_path TEXT;
        ALTER TABLE meeting_logs ADD COLUMN ai_summary TEXT;
        ",
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_migration_v1_creates_tables() {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();

        // Verify tables exist by querying them
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('activity_logs', 'meeting_logs', 'daily_summaries', 'config')",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 4, "All 4 core tables should exist");
    }

    #[test]
    fn test_migration_v4_creates_tables() {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();

        // Verify achievements and weekly_insights exist
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('achievements', 'weekly_insights')",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 2, "Achievements and Weekly Insights tables should exist");
    }

    #[test]
    fn test_migration_v1_creates_indexes() {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();

        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!(count >= 5, "At least 5 indexes should exist");
    }

    #[test]
    fn test_migration_v1_inserts_default_config() {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();

        let value: String = conn
            .query_row(
                "SELECT value FROM config WHERE key = 'office_hours_start'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(value, "09:00");
    }

    #[test]
    fn test_migration_is_idempotent() {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();
        // Running again should not fail
        run_migrations(&conn).unwrap();

        let version = get_schema_version(&conn).unwrap();
        assert_eq!(version, SCHEMA_VERSION);
    }

    #[test]
    fn test_schema_version_is_set() {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();

        let version = get_schema_version(&conn).unwrap();
        assert_eq!(version, 4);
    }
}
