# Tracking Engine — IntelliWork

> Core activity tracking loop: polling, app switch detection, idle handling, batched DB writes.

## Architecture

```
src-tauri/src/tracker/
├── mod.rs           # Module exports
├── activity.rs      # ActivityTracker — main polling loop
├── meeting.rs       # MeetingDetector — app + keyword matching
├── idle.rs          # IdleDetector — threshold-based
└── scheduler.rs     # OfficeHoursManager — office hours control

src-tauri/src/
├── commands.rs      # 10 Tauri IPC command handlers
├── state.rs         # AppState (Arc<Mutex<ActivityTracker>> + Arc<Database>)
└── lib.rs           # App initialization + wiring
```

## Data Flow

```
Platform (NSWorkspace) → poll() every 5s
         ↓
   App switch detected? → finalize old → start new ActivityLog
         ↓
   Check idle (CGEventSource) → mark activity.is_idle
         ↓
   Check meeting (MeetingDetector) → mark activity.is_meeting
         ↓
   Batch pending → flush() every 30s → Database
```

## Components

### ActivityTracker

- Polls platform every 5 seconds for foreground app
- Detects app switches → finalizes old activity, starts new
- Integrates idle state, meeting detection, office hours
- Batches activities → flushes to DB periodically

### MeetingDetector

- 20 keywords: meeting, call, standup, sprint, 1:1, demo, etc.
- Classifies as `scheduled` (keyword match) or `ad_hoc` (meeting app without keyword)
- Case-insensitive matching

### IdleDetector

- Configurable threshold (default: 180s)
- State machine: Active ↔ Idle with logging
- Wraps `PlatformTracker.get_idle_seconds()`

### OfficeHoursManager

- Configurable start/end times (HH:MM)
- Supports overnight ranges (22:00 → 06:00)
- Can be disabled (always returns true)

## IPC Commands

| Command                     | Description              |
| --------------------------- | ------------------------ |
| `start_tracking`            | Enable tracking          |
| `stop_tracking`             | Disable + flush          |
| `get_tracking_state`        | Current state for UI     |
| `poll_tracker`              | Trigger one poll cycle   |
| `get_activities`            | Activities for a date    |
| `get_summary`               | Daily summary for a date |
| `get_config` / `set_config` | Config CRUD              |
| `get_all_config`            | All config values        |
| `delete_activities`         | Delete by IDs            |
| `flush_tracker`             | Force flush to DB        |

## Testing

```bash
cargo test -p intelliwork -- tracker
```

**19 tracker tests**: 5 idle, 7 meeting, 7 scheduler.
