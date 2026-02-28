# Storage Layer — IntelliWork

> SQLite-based encrypted storage layer providing full CRUD operations for activities, meetings, summaries, and configuration.

---

## Architecture

```
src-tauri/src/storage/
├── mod.rs          # Module declaration + re-exports
├── errors.rs       # StorageError enum (thiserror)
├── models.rs       # ActivityLog, MeetingLog, DailySummaryRecord, Category
├── migrations.rs   # Versioned schema creation
└── database.rs     # Database struct — all CRUD methods
```

### Design Principles

- **Single entry point**: All SQL goes through `Database` struct
- **No raw SQL outside storage/**: Other modules use typed methods
- **In-memory testing**: All tests use `Database::open_in_memory()`
- **Versioned migrations**: Schema changes via numbered migrations
- **WAL mode**: Non-blocking concurrent reads/writes

---

## Database Schema (v1)

| Table             | Purpose                   | Key Fields                                                       |
| ----------------- | ------------------------- | ---------------------------------------------------------------- |
| `activity_logs`   | Tracked application usage | app_name, window_title, start_time, end_time, duration, category |
| `meeting_logs`    | Meeting-specific metadata | activity_id (FK), meeting_title, participants, meeting_type      |
| `daily_summaries` | AI-generated summaries    | summary_date (unique), raw/edited summary, category_breakdown    |
| `config`          | User preferences          | key-value pairs with defaults                                    |

### Indexes

- `idx_activity_start` — Fast date range queries
- `idx_activity_category` — Category filtering
- `idx_activity_date` — Date-based lookups
- `idx_meeting_activity` — Meeting-to-activity joins
- `idx_summary_date` — Summary date lookups

---

## API Reference

### Activity Operations

| Method                     | Signature                                           | Description                |
| -------------------------- | --------------------------------------------------- | -------------------------- |
| `insert_activity`          | `(&self, activity: &ActivityLog) -> Result<String>` | Insert and return ID       |
| `get_activities_for_date`  | `(&self, date: &str) -> Result<Vec<ActivityLog>>`   | Query by date (YYYY-MM-DD) |
| `update_activity_category` | `(&self, id, category, confidence) -> Result<()>`   | Update classification      |
| `delete_activities`        | `(&self, ids: &[String]) -> Result<usize>`          | Delete by IDs              |
| `delete_all_activities`    | `(&self) -> Result<usize>`                          | Delete all records         |

### Meeting Operations

| Method                  | Signature                                         | Description    |
| ----------------------- | ------------------------------------------------- | -------------- |
| `insert_meeting`        | `(&self, meeting: &MeetingLog) -> Result<String>` | Insert meeting |
| `get_meetings_for_date` | `(&self, date: &str) -> Result<Vec<MeetingLog>>`  | Query by date  |

### Summary Operations

| Method           | Signature                                                   | Description      |
| ---------------- | ----------------------------------------------------------- | ---------------- |
| `upsert_summary` | `(&self, summary: &DailySummaryRecord) -> Result<()>`       | Insert or update |
| `get_summary`    | `(&self, date: &str) -> Result<Option<DailySummaryRecord>>` | Query by date    |

### Config Operations

| Method           | Signature                                      | Description        |
| ---------------- | ---------------------------------------------- | ------------------ |
| `get_config`     | `(&self, key: &str) -> Result<Option<String>>` | Get value          |
| `set_config`     | `(&self, key, value) -> Result<()>`            | Set value (upsert) |
| `get_all_config` | `(&self) -> Result<HashMap<String, String>>`   | Get all config     |

---

## Default Configuration

| Key                      | Default Value | Description                             |
| ------------------------ | ------------- | --------------------------------------- |
| `tracking_enabled`       | `false`       | Whether tracking is active              |
| `consent_granted`        | `false`       | Whether user has accepted privacy terms |
| `office_hours_enabled`   | `true`        | Restrict tracking to office hours       |
| `office_hours_start`     | `09:00`       | Start of tracking window                |
| `office_hours_end`       | `18:00`       | End of tracking window                  |
| `idle_threshold_seconds` | `180`         | Idle detection threshold (3 min)        |
| `ai_provider`            | `rule_based`  | AI classification provider              |
| `theme`                  | `system`      | UI theme preference                     |

---

## Testing

Run storage tests:

```bash
cargo test -p intelliwork -- storage
```

**23 tests** covering:

- Activity CRUD (insert, query, update category, delete specific, delete all)
- Meeting CRUD (insert, query with join)
- Summary CRUD (upsert, retrieve, update existing)
- Config (defaults, get/set, new keys, get all)
- Migrations (table creation, indexes, defaults, idempotency, versioning)
- Maintenance (integrity check, empty queries, not-found errors)
