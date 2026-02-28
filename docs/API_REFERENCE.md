# IntelliWork — API Reference

> Internal API documentation for IPC commands, AI engine interface, storage layer, and platform abstraction.

---

## Table of Contents

- [1. Tauri IPC Commands](#1-tauri-ipc-commands)
- [2. Event System](#2-event-system)
- [3. AI Engine API](#3-ai-engine-api)
- [4. Storage Layer API](#4-storage-layer-api)
- [5. Platform Abstraction API](#5-platform-abstraction-api)
- [6. Data Types](#6-data-types)

---

## 1. Tauri IPC Commands

Commands invoked from the React frontend to the Rust backend via Tauri's IPC system.

### Tracking Commands

#### `get_tracking_status`

Returns the current tracking state.

```typescript
// Frontend usage
import { invoke } from "@tauri-apps/api/core";

const status: TrackingStatus = await invoke("get_tracking_status");
```

**Response:**

```typescript
interface TrackingStatus {
  is_tracking: boolean;
  is_within_office_hours: boolean;
  office_hours_enabled: boolean;
  office_hours_start: string; // "09:00"
  office_hours_end: string; // "18:00"
  tracking_since: string | null; // ISO 8601 timestamp
}
```

---

#### `toggle_tracking`

Enables or disables activity tracking.

```typescript
await invoke("toggle_tracking");
```

**Response:** `TrackingStatus` (updated state)

**Side Effects:**

- If enabling: starts activity polling loop
- If disabling: stops polling, closes active session

---

#### `set_office_hours`

Configures the office hours tracking window.

```typescript
await invoke("set_office_hours", {
  enabled: true,
  startTime: "09:00",
  endTime: "18:00",
});
```

**Parameters:**

| Parameter   | Type      | Required   | Description                             |
| ----------- | --------- | ---------- | --------------------------------------- |
| `enabled`   | `boolean` | Yes        | Enable/disable office hours restriction |
| `startTime` | `string`  | If enabled | Start time in HH:MM format              |
| `endTime`   | `string`  | If enabled | End time in HH:MM format                |

**Response:** `TrackingStatus`

---

### Activity Commands

#### `get_todays_activities`

Returns all activity logs for today.

```typescript
const activities: ActivityLog[] = await invoke("get_todays_activities");
```

**Response:** `ActivityLog[]`

---

#### `get_activities_by_date`

Returns activity logs for a specific date.

```typescript
const activities: ActivityLog[] = await invoke("get_activities_by_date", {
  date: "2026-03-01", // YYYY-MM-DD
});
```

**Parameters:**

| Parameter | Type     | Required | Description               |
| --------- | -------- | -------- | ------------------------- |
| `date`    | `string` | Yes      | Date in YYYY-MM-DD format |

**Response:** `ActivityLog[]`

---

#### `delete_activities`

Deletes specified activity logs.

```typescript
await invoke("delete_activities", {
  ids: ["abc123", "def456"],
});
```

**Parameters:**

| Parameter | Type       | Required | Description                |
| --------- | ---------- | -------- | -------------------------- |
| `ids`     | `string[]` | Yes      | Activity log IDs to delete |

**Response:** `{ deleted_count: number }`

---

#### `delete_all_activities`

Deletes ALL activity logs. Requires confirmation token.

```typescript
await invoke("delete_all_activities", {
  confirmToken: "DELETE_ALL_DATA",
});
```

**Response:** `{ deleted_count: number }`

---

### Summary Commands

#### `generate_daily_summary`

Generates an AI-powered summary for the specified date.

```typescript
const summary: DailySummary = await invoke("generate_daily_summary", {
  date: "2026-03-01",
});
```

**Parameters:**

| Parameter | Type     | Required | Description               |
| --------- | -------- | -------- | ------------------------- |
| `date`    | `string` | Yes      | Date in YYYY-MM-DD format |

**Response:** `DailySummary`

**Notes:**

- Triggers AI classification for uncategorized activities
- Generates natural language summary via configured AI provider
- May take 5-30 seconds depending on AI provider

---

#### `get_daily_summary`

Retrieves a previously generated summary.

```typescript
const summary: DailySummary | null = await invoke("get_daily_summary", {
  date: "2026-03-01",
});
```

**Response:** `DailySummary | null`

---

#### `update_summary`

Saves user edits to a daily summary.

```typescript
await invoke("update_summary", {
  date: "2026-03-01",
  editedSummary: "{ ... edited JSON ... }",
});
```

**Response:** `DailySummary`

---

### Export Commands

#### `export_timesheet`

Exports the daily summary as CSV or PDF.

```typescript
const filePath: string = await invoke("export_timesheet", {
  date: "2026-03-01",
  format: "csv", // 'csv' | 'pdf'
});
```

**Parameters:**

| Parameter | Type             | Required | Description    |
| --------- | ---------------- | -------- | -------------- |
| `date`    | `string`         | Yes      | Date to export |
| `format`  | `'csv' \| 'pdf'` | Yes      | Export format  |

**Response:** `string` — Absolute path to the exported file

---

### Configuration Commands

#### `get_config`

Retrieves a configuration value.

```typescript
const value: string | null = await invoke("get_config", {
  key: "ai_provider",
});
```

---

#### `set_config`

Sets a configuration value.

```typescript
await invoke("set_config", {
  key: "ai_provider",
  value: "openai",
});
```

---

#### `get_all_config`

Returns all configuration as a key-value map.

```typescript
const config: Record<string, string> = await invoke("get_all_config");
```

---

## 2. Event System

Events emitted from the Rust backend to the React frontend.

### Listening to Events

```typescript
import { listen } from "@tauri-apps/api/event";

// Listen for activity changes
const unlisten = await listen<ActivityChangedPayload>(
  "activity_changed",
  (event) => {
    console.log("New activity:", event.payload);
  },
);

// Cleanup
unlisten();
```

### Event Definitions

#### `activity_changed`

Emitted when the foreground application changes.

```typescript
interface ActivityChangedPayload {
  app_name: string;
  window_title: string | null;
  timestamp: string; // ISO 8601
}
```

---

#### `meeting_started`

Emitted when a meeting/call is detected.

```typescript
interface MeetingStartedPayload {
  app_name: string;
  meeting_title: string | null;
  meeting_type: "scheduled" | "ad_hoc";
  start_time: string;
}
```

---

#### `meeting_ended`

Emitted when a meeting/call ends.

```typescript
interface MeetingEndedPayload {
  activity_id: string;
  duration_seconds: number;
}
```

---

#### `idle_started`

Emitted when user goes idle (exceeds threshold).

```typescript
interface IdlePayload {
  idle_since: string; // ISO 8601
  threshold_seconds: number;
}
```

---

#### `idle_ended`

Emitted when user resumes activity after being idle.

```typescript
interface IdleEndedPayload {
  idle_duration_seconds: number;
  resumed_at: string; // ISO 8601
}
```

---

#### `summary_progress`

Emitted during AI summary generation to show progress.

```typescript
interface SummaryProgressPayload {
  step: "classifying" | "summarizing" | "formatting";
  progress: number; // 0-100
  message: string;
}
```

---

#### `tracking_state_changed`

Emitted when tracking is enabled/disabled (from any source).

```typescript
interface TrackingStatePayload {
  is_tracking: boolean;
  reason:
    | "user_toggle"
    | "office_hours_start"
    | "office_hours_end"
    | "system_resume";
}
```

---

## 3. AI Engine API

Internal Rust API for the AI processing engine.

### Trait: `ActivityClassifier`

```rust
pub trait ActivityClassifier: Send + Sync {
    /// Classify a single activity into a work category
    fn classify(&self, app_name: &str, window_title: &str) -> ClassificationResult;

    /// Classify a batch of activities
    fn classify_batch(&self, activities: &[ActivityLog]) -> Vec<ClassificationResult>;
}

pub struct ClassificationResult {
    pub category: Category,
    pub confidence: f64,
    pub reasoning: Option<String>,
    pub source: ClassificationSource,  // Rule | LLM
}
```

### Trait: `SummaryGenerator`

```rust
pub trait SummaryGenerator: Send + Sync {
    /// Generate a daily summary from classified activities
    async fn generate_summary(
        &self,
        activities: &[ClassifiedActivity],
        date: &str,
    ) -> Result<DailySummaryData, AiError>;
}
```

### Implementations

| Implementation        | Trait                | Description                         |
| --------------------- | -------------------- | ----------------------------------- |
| `RuleBasedClassifier` | `ActivityClassifier` | Fast, local, pattern-matching       |
| `LlmClassifier`       | `ActivityClassifier` | Cloud/local LLM for ambiguous cases |
| `HybridClassifier`    | `ActivityClassifier` | Rules first, LLM fallback           |
| `OpenAiSummarizer`    | `SummaryGenerator`   | OpenAI GPT → summary                |
| `GeminiSummarizer`    | `SummaryGenerator`   | Google Gemini → summary             |
| `OllamaSummarizer`    | `SummaryGenerator`   | Local Ollama → summary              |

---

## 4. Storage Layer API

Internal Rust API for database operations.

### `Database`

```rust
impl Database {
    // Connection
    pub fn open(path: &Path) -> Result<Self, StorageError>;
    pub fn open_encrypted(path: &Path, key: &str) -> Result<Self, StorageError>;
    pub fn run_migrations(&self) -> Result<(), StorageError>;

    // Activity CRUD
    pub fn insert_activity(&self, activity: &ActivityLog) -> Result<String, StorageError>;
    pub fn get_activities_for_date(&self, date: &str) -> Result<Vec<ActivityLog>, StorageError>;
    pub fn update_activity_category(&self, id: &str, category: &str, confidence: f64) -> Result<(), StorageError>;
    pub fn delete_activities(&self, ids: &[String]) -> Result<usize, StorageError>;
    pub fn delete_all_activities(&self) -> Result<usize, StorageError>;

    // Meeting CRUD
    pub fn insert_meeting(&self, meeting: &MeetingLog) -> Result<String, StorageError>;
    pub fn get_meetings_for_date(&self, date: &str) -> Result<Vec<MeetingLog>, StorageError>;

    // Summary CRUD
    pub fn upsert_summary(&self, summary: &DailySummaryRecord) -> Result<(), StorageError>;
    pub fn get_summary(&self, date: &str) -> Result<Option<DailySummaryRecord>, StorageError>;

    // Config
    pub fn get_config(&self, key: &str) -> Result<Option<String>, StorageError>;
    pub fn set_config(&self, key: &str, value: &str) -> Result<(), StorageError>;
    pub fn get_all_config(&self) -> Result<HashMap<String, String>, StorageError>;

    // Maintenance
    pub fn cleanup_old_data(&self, retention_days: u32) -> Result<usize, StorageError>;
    pub fn integrity_check(&self) -> Result<bool, StorageError>;
    pub fn backup(&self, dest: &Path) -> Result<(), StorageError>;
}
```

---

## 5. Platform Abstraction API

### Trait: `PlatformTracker`

```rust
pub trait PlatformTracker: Send + Sync {
    /// Get info about the currently focused application
    fn get_foreground_app(&self) -> Result<AppInfo, PlatformError>;

    /// Get seconds since last user input (mouse/keyboard)
    fn get_idle_seconds(&self) -> Result<u64, PlatformError>;

    /// Check if a specific process is running
    fn is_app_running(&self, process_name: &str) -> Result<bool, PlatformError>;

    /// Request required OS permissions
    fn request_permissions(&self) -> Result<PermissionStatus, PlatformError>;

    /// Check if required permissions are granted
    fn check_permissions(&self) -> Result<PermissionStatus, PlatformError>;
}

pub struct AppInfo {
    pub name: String,
    pub window_title: Option<String>,
    pub process_id: u32,
    pub bundle_id: Option<String>,   // macOS only
    pub executable_path: Option<String>,
}

pub struct PermissionStatus {
    pub accessibility: bool,
    pub screen_recording: bool,  // macOS only
    pub all_granted: bool,
}
```

### Implementations

| Struct           | Platform | Key APIs                                             |
| ---------------- | -------- | ---------------------------------------------------- |
| `MacOSTracker`   | macOS    | NSWorkspace, CGWindowList, AXUIElement               |
| `WindowsTracker` | Windows  | GetForegroundWindow, GetWindowText, GetLastInputInfo |
| `LinuxTracker`   | Linux    | X11 (XGetInputFocus), D-Bus, XScreenSaver            |

### Factory

```rust
pub fn create_platform_tracker() -> Box<dyn PlatformTracker> {
    #[cfg(target_os = "macos")]
    return Box::new(MacOSTracker::new());

    #[cfg(target_os = "windows")]
    return Box::new(WindowsTracker::new());

    #[cfg(target_os = "linux")]
    return Box::new(LinuxTracker::new());
}
```

---

## 6. Data Types

### Core Types

```typescript
// Frontend TypeScript types

interface ActivityLog {
  id: string;
  app_name: string;
  window_title: string | null;
  start_time: string; // ISO 8601
  end_time: string | null;
  duration_seconds: number;
  category: Category;
  confidence: number; // 0.0 - 1.0
  is_meeting: boolean;
  is_idle: boolean;
}

type Category =
  | "Development"
  | "Research"
  | "Communication"
  | "Meetings"
  | "Administration"
  | "Documentation"
  | "Design"
  | "Project Management"
  | "Uncategorized";

interface MeetingLog {
  id: string;
  activity_id: string;
  meeting_title: string | null;
  participants: string[] | null;
  meeting_type: "scheduled" | "ad_hoc";
  source_app: string;
  calendar_event_id: string | null;
}

interface DailySummary {
  id: string;
  summary_date: string; // YYYY-MM-DD
  raw_summary: SummaryData; // AI-generated
  edited_summary: SummaryData | null; // User-edited
  total_productive_seconds: number;
  category_breakdown: Record<Category, number>; // seconds per category
  ai_provider: string;
  is_approved: boolean;
}

interface SummaryData {
  meetings: MeetingSummaryItem[];
  development: WorkSummaryItem[];
  research: WorkSummaryItem[];
  communication: WorkSummaryItem[];
  administration: WorkSummaryItem[];
  documentation: WorkSummaryItem[];
  design: WorkSummaryItem[];
  total_productive_time: string; // "7h 20m"
}

interface MeetingSummaryItem {
  title: string;
  duration: string;
  type: "scheduled" | "ad_hoc";
}

interface WorkSummaryItem {
  description: string;
  duration: string;
}

interface TrackingStatus {
  is_tracking: boolean;
  is_within_office_hours: boolean;
  office_hours_enabled: boolean;
  office_hours_start: string;
  office_hours_end: string;
  tracking_since: string | null;
}
```
