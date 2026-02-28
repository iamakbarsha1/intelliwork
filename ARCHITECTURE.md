# IntelliWork — System Architecture

> This document provides a comprehensive technical deep-dive into IntelliWork's system architecture, component interactions, data flows, and platform-specific implementation strategies.

---

## Table of Contents

- [1. Architecture Overview](#1-architecture-overview)
- [2. Component Architecture](#2-component-architecture)
- [3. Data Flow](#3-data-flow)
- [4. Platform Abstraction Layer](#4-platform-abstraction-layer)
- [5. AI Pipeline Architecture](#5-ai-pipeline-architecture)
- [6. Storage Architecture](#6-storage-architecture)
- [7. IPC Communication](#7-ipc-communication)
- [8. Security Architecture](#8-security-architecture)
- [9. Performance Design](#9-performance-design)
- [10. Deployment Architecture](#10-deployment-architecture)

---

## 1. Architecture Overview

IntelliWork uses a **layered local-first architecture** with clear separation of concerns. All processing happens on the user's device — no data leaves the machine unless the user explicitly opts into cloud AI summarization.

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                       │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ System Tray  │  │  Dashboard   │  │  Consent & Settings    │ │
│  │   Widget     │  │    Window    │  │       Window           │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬─────────────┘ │
│         │                 │                      │               │
├─────────┼─────────────────┼──────────────────────┼───────────────┤
│         │        TAURI IPC BRIDGE                │               │
│         └─────────────────┼──────────────────────┘               │
│                           │                                      │
├───────────────────────────┼──────────────────────────────────────┤
│                    APPLICATION LAYER                             │
│                           │                                      │
│  ┌────────────────────────▼─────────────────────────────────┐   │
│  │                  Command Router                           │   │
│  │    (Tauri IPC Commands — Rust)                            │   │
│  └──┬──────────┬──────────┬──────────┬──────────┬───────────┘   │
│     │          │          │          │          │                │
│     ▼          ▼          ▼          ▼          ▼                │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────────┐         │
│  │Track │  │Meet  │  │Idle  │  │Sched │  │  Config  │         │
│  │Engine│  │Detect│  │Mon.  │  │uler  │  │ Manager  │         │
│  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘  └────┬─────┘         │
│     │         │         │         │            │                │
├─────┼─────────┼─────────┼─────────┼────────────┼────────────────┤
│     │    PLATFORM ABSTRACTION LAYER            │                │
│     │         │         │         │            │                │
│  ┌──▼─────────▼─────────▼─────────▼────┐  ┌───▼──────────┐    │
│  │     OS-Specific Implementations      │  │   AI Engine   │    │
│  │                                      │  │              │    │
│  │  macOS: NSWorkspace, CGWindow, AX    │  │ Rule-based   │    │
│  │  Windows: Win32, UI Automation       │  │ + LLM Cloud  │    │
│  │  Linux: X11/Wayland, D-Bus           │  │ + LLM Local  │    │
│  └──────────────┬───────────────────────┘  └───┬──────────┘    │
│                 │                               │               │
├─────────────────┼───────────────────────────────┼───────────────┤
│                 │       DATA LAYER               │               │
│                 │                               │               │
│  ┌──────────────▼───────────────────────────────▼──────────┐    │
│  │              SQLite + SQLCipher (Encrypted)              │    │
│  │                                                          │    │
│  │  activity_logs │ meeting_logs │ daily_summaries │ config │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Local-First** — All data processing and storage happens on-device
2. **Privacy-by-Design** — No data collection without explicit consent
3. **Platform-Agnostic Core** — Business logic separated from OS-specific code via traits
4. **Minimal Footprint** — CPU < 2%, Memory < 100MB, polling every 5 seconds
5. **Graceful Degradation** — Works offline; cloud AI features degrade to local rules

---

## 2. Component Architecture

### 2.1 Activity Tracking Engine

The core monitoring engine tracks foreground application usage.

**Responsibilities:**

- Detect currently active (foreground) application
- Capture window title of active application
- Calculate active duration per application session
- Aggregate activities into time blocks

**Data Collected:**

| Field              | Description                           | Example                           |
| ------------------ | ------------------------------------- | --------------------------------- |
| `app_name`         | Process/application name              | "Visual Studio Code"              |
| `window_title`     | Active window title                   | "auth-service/index.ts — VS Code" |
| `start_time`       | Session start timestamp               | 2026-03-01T09:15:00Z              |
| `end_time`         | Session end timestamp                 | 2026-03-01T10:45:00Z              |
| `duration_seconds` | Duration in seconds                   | 5400                              |
| `is_active`        | Whether user was actively interacting | true                              |

**Architecture:**

```
ActivityTracker
├── start() → Begin tracking loop
├── stop() → Pause tracking
├── get_current_activity() → Poll foreground app
├── on_app_change(callback) → Event: app switched
└── flush() → Write pending activities to storage
```

### 2.2 Meeting Detection Engine

Identifies and classifies meetings and calls.

**Detection Strategies:**

```
                    ┌─────────────────────┐
                    │  Meeting Detector    │
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     ┌────────────┐  ┌──────────────┐  ┌─────────────┐
     │ App Match  │  │ Window Title │  │  Calendar   │
     │ Detection  │  │  Keywords    │  │ Integration │
     └────────────┘  └──────────────┘  └─────────────┘
     Teams, Zoom,     "Meeting",        MS Graph API,
     Meet, Slack      "Call", "Huddle"  Google Cal API
```

**Classification Logic:**

| Detection Source   | Calendar Match? | Classification                 |
| ------------------ | --------------- | ------------------------------ |
| App + Window Title | Yes             | Scheduled Meeting              |
| App + Window Title | No              | Ad-hoc Call                    |
| Calendar Only      | N/A             | Scheduled (not tracked in app) |

### 2.3 Idle Detection Monitor

Detects periods of user inactivity to avoid logging idle time as productive work.

**Strategy:**

- Monitor mouse/keyboard input events (no keystroke content — only activity/idle flag)
- Default idle threshold: 3 minutes
- After idle threshold: pause activity tracking
- On resume: create new activity session

### 2.4 AI Processing Engine (Hybrid)

The AI engine uses a **three-phase hybrid approach**:

```
┌─────────────────────────────────────────────────────────┐
│                    AI Processing Pipeline                │
│                                                          │
│  Phase 1: Rule-Based Classification (LOCAL, INSTANT)     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  App Name → Category Mapping                     │   │
│  │  "VS Code" → Development                         │   │
│  │  "Chrome + StackOverflow" → Research              │   │
│  │  "Teams" → Communication                         │   │
│  │  "Outlook" → Email/Communication                  │   │
│  │  "Figma" → Design                                │   │
│  │  "Word/Notion" → Documentation                   │   │
│  └──────────────────────────────────────────────────┘   │
│                         │                                │
│                         ▼                                │
│  Phase 2: LLM Contextual Classification (CLOUD/LOCAL)    │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Send unclassified/ambiguous activities to LLM    │   │
│  │  "Chrome + Jira Board" → Project Management       │   │
│  │  "Chrome + GitHub PR Review" → Development        │   │
│  │  Uses: OpenAI GPT-4 / Gemini / Ollama local      │   │
│  └──────────────────────────────────────────────────┘   │
│                         │                                │
│                         ▼                                │
│  Phase 3: End-of-Day Summarization (CLOUD/LOCAL)         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Aggregate all classified activities              │   │
│  │  Generate natural language summary                │   │
│  │  Output structured JSON for timesheet export      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**AI Provider Selection (User-Configurable):**

| Mode                 | Provider                    | Pros                             | Cons                         |
| -------------------- | --------------------------- | -------------------------------- | ---------------------------- |
| Cloud (Default)      | OpenAI GPT-4o-mini          | Best quality, fast               | Requires API key, sends data |
| Cloud Alternative    | Google Gemini               | Good quality, generous free tier | Requires API key             |
| Local (Privacy Max)  | Ollama (Llama 3 / Mistral)  | Full privacy, offline            | Requires local GPU, slower   |
| Hybrid (Recommended) | Rule-based + Cloud fallback | Best balance                     | Cloud for complex cases only |

### 2.5 Scheduler & Office Hours Manager

Controls when tracking is active based on user-defined schedules.

**Logic:**

```
on_tick():
  if tracking_enabled == false → skip
  if office_hours_restriction == true:
    if current_time NOT in [start_hour, end_hour] → skip
  → proceed with tracking
```

---

## 3. Data Flow

### 3.1 Activity Tracking Flow

```
User opens app → OS foreground change event
         │
         ▼
  Platform Layer detects new foreground app
         │
         ▼
  Activity Tracker logs: {app, title, start_time}
         │
         ▼
  Previous activity gets: {end_time, duration}
         │
         ▼
  Rule-based classifier assigns category
         │
         ▼
  Activity saved to SQLite (encrypted)
         │
         ▼
  UI notified via IPC (optional real-time view)
```

### 3.2 End-of-Day Summary Flow

```
User clicks "Generate Summary" OR auto-trigger at end_hour
         │
         ▼
  Query all activities for today from SQLite
         │
         ▼
  Group activities by category
         │
         ▼
  Run LLM contextual classification on ambiguous items
         │
         ▼
  Generate structured summary via LLM
         │
         ▼
  Present editable summary in Dashboard
         │
         ▼
  User approves → Save final summary to daily_summaries table
         │
         ▼
  User exports → CSV / PDF
```

---

## 4. Platform Abstraction Layer

To support macOS, Windows, and Linux with a single codebase, we use **Rust traits** for platform abstraction.

### Trait Definition

```rust
pub trait PlatformTracker: Send + Sync {
    /// Get the currently focused application info
    fn get_foreground_app(&self) -> Result<AppInfo, TrackerError>;

    /// Get the idle duration in seconds
    fn get_idle_seconds(&self) -> Result<u64, TrackerError>;

    /// Check if a specific app is currently running
    fn is_app_running(&self, app_name: &str) -> Result<bool, TrackerError>;

    /// Request required OS permissions
    fn request_permissions(&self) -> Result<PermissionStatus, TrackerError>;

    /// Check current permission status
    fn check_permissions(&self) -> Result<PermissionStatus, TrackerError>;
}
```

### Platform Implementations

| API            | macOS                                         | Windows                                                | Linux                         |
| -------------- | --------------------------------------------- | ------------------------------------------------------ | ----------------------------- |
| Foreground App | `NSWorkspace.shared.frontmostApplication`     | `GetForegroundWindow()` + `GetWindowThreadProcessId()` | `XGetInputFocus()` / D-Bus    |
| Window Title   | `CGWindowListCopyWindowInfo` / AXUIElement    | `GetWindowText()`                                      | `XFetchName()` / D-Bus        |
| Idle Detection | `CGEventSourceSecondsSinceLastEventType`      | `GetLastInputInfo()`                                   | `XScreenSaverQueryInfo()`     |
| Permissions    | Accessibility + Screen Recording entitlements | None required (Win32 is unrestricted)                  | X11/Wayland compositor access |

---

## 5. AI Pipeline Architecture

### 5.1 Rule-Based Classifier

Fast, local, zero-latency classification for known application patterns.

**Classification Rules (Configurable):**

```json
{
  "rules": [
    {
      "match": {
        "app_contains": [
          "Visual Studio Code",
          "IntelliJ",
          "Xcode",
          "Android Studio"
        ]
      },
      "category": "Development",
      "confidence": 0.95
    },
    {
      "match": { "app_contains": ["Teams", "Slack", "Discord"] },
      "category": "Communication",
      "confidence": 0.9
    },
    {
      "match": {
        "app_contains": ["Chrome", "Firefox", "Safari"],
        "title_contains": ["StackOverflow", "MDN", "docs."]
      },
      "category": "Research",
      "confidence": 0.85
    },
    {
      "match": {
        "app_contains": ["Chrome", "Firefox"],
        "title_contains": ["GitHub", "GitLab", "Bitbucket"]
      },
      "category": "Development",
      "confidence": 0.88
    },
    {
      "match": { "app_contains": ["Outlook", "Mail", "Gmail"] },
      "category": "Communication",
      "confidence": 0.9
    },
    {
      "match": { "app_contains": ["Figma", "Sketch", "Adobe XD"] },
      "category": "Design",
      "confidence": 0.95
    },
    {
      "match": { "app_contains": ["Word", "Notion", "Confluence"] },
      "category": "Documentation",
      "confidence": 0.85
    },
    {
      "match": { "app_contains": ["Jira", "Asana", "Monday", "Trello"] },
      "category": "Project Management",
      "confidence": 0.9
    }
  ]
}
```

### 5.2 LLM Classification Prompt

For activities that don't match rules or have low confidence:

```
You are a work activity classifier. Given the following activity details,
classify it into exactly ONE of these categories:
- Development
- Research
- Communication
- Meetings
- Administration
- Documentation
- Design
- Project Management

Activity:
- Application: {app_name}
- Window Title: {window_title}
- Duration: {duration}

Respond with JSON: {"category": "...", "confidence": 0.XX, "reasoning": "..."}
```

### 5.3 End-of-Day Summary Prompt

```
You are a professional timesheet assistant. Given the following categorized
work activities from today, generate a structured daily summary suitable
for timesheet submission.

Activities:
{activities_json}

Generate a summary with:
1. Meeting list with titles and durations
2. Development work descriptions (grouped by project if possible)
3. Research topics investigated
4. Communication highlights
5. Total time per category
6. Total productive time

Output format: JSON matching the DailySummary schema.
Keep descriptions professional and concise.
```

---

## 6. Storage Architecture

### 6.1 Database Schema

```sql
-- Core activity log
CREATE TABLE activity_logs (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    app_name        TEXT NOT NULL,
    window_title    TEXT,
    start_time      TEXT NOT NULL,  -- ISO 8601
    end_time        TEXT,
    duration_seconds INTEGER DEFAULT 0,
    category        TEXT DEFAULT 'Uncategorized',
    confidence      REAL DEFAULT 0.0,
    is_meeting      INTEGER DEFAULT 0,
    is_idle         INTEGER DEFAULT 0,
    created_at      TEXT DEFAULT (datetime('now')),

    CHECK (category IN ('Development', 'Research', 'Communication',
           'Meetings', 'Administration', 'Documentation', 'Design',
           'Project Management', 'Uncategorized'))
);

-- Meeting-specific metadata
CREATE TABLE meeting_logs (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    activity_id     TEXT NOT NULL REFERENCES activity_logs(id),
    meeting_title   TEXT,
    participants    TEXT,  -- JSON array
    meeting_type    TEXT DEFAULT 'ad_hoc',  -- 'scheduled' or 'ad_hoc'
    source_app      TEXT,
    calendar_event_id TEXT,
    created_at      TEXT DEFAULT (datetime('now')),

    CHECK (meeting_type IN ('scheduled', 'ad_hoc'))
);

-- AI-generated daily summaries
CREATE TABLE daily_summaries (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    summary_date    TEXT NOT NULL UNIQUE,  -- YYYY-MM-DD
    raw_summary     TEXT NOT NULL,          -- AI-generated JSON
    edited_summary  TEXT,                   -- User-edited version
    total_productive_seconds INTEGER DEFAULT 0,
    category_breakdown TEXT,               -- JSON: {"Development": 3600, ...}
    ai_provider     TEXT,                  -- Which AI generated this
    is_approved     INTEGER DEFAULT 0,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

-- User preferences and configuration
CREATE TABLE config (
    key             TEXT PRIMARY KEY,
    value           TEXT NOT NULL,
    updated_at      TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX idx_activity_start ON activity_logs(start_time);
CREATE INDEX idx_activity_category ON activity_logs(category);
CREATE INDEX idx_activity_date ON activity_logs(date(start_time));
CREATE INDEX idx_meeting_activity ON meeting_logs(activity_id);
CREATE INDEX idx_summary_date ON daily_summaries(summary_date);
```

### 6.2 Encryption Strategy

```
┌──────────────────────────────────┐
│        Application Layer          │
│     (reads/writes plaintext)      │
├──────────────────────────────────┤
│        SQLCipher Layer            │
│   (AES-256-CBC encryption)        │
│   Key derived from:               │
│   - macOS: Keychain               │
│   - Windows: Credential Vault     │
│   - Linux: Secret Service API     │
├──────────────────────────────────┤
│        File System                │
│   (encrypted .db file on disk)    │
└──────────────────────────────────┘
```

---

## 7. IPC Communication

Tauri uses a **command-based IPC** model between the Rust backend and React frontend.

### Command Definitions

| Command                 | Direction          | Description                   |
| ----------------------- | ------------------ | ----------------------------- |
| `get_tracking_status`   | Frontend → Backend | Check if tracking is enabled  |
| `toggle_tracking`       | Frontend → Backend | Enable/disable tracking       |
| `set_office_hours`      | Frontend → Backend | Update office hours config    |
| `get_todays_activities` | Frontend → Backend | Fetch today's activity logs   |
| `get_daily_summary`     | Frontend → Backend | Get/generate AI summary       |
| `export_timesheet`      | Frontend → Backend | Export CSV/PDF                |
| `delete_activities`     | Frontend → Backend | Delete selected activity logs |
| `update_summary`        | Frontend → Backend | Save edited summary           |
| `get_config`            | Frontend → Backend | Read configuration            |
| `set_config`            | Frontend → Backend | Write configuration           |

### Event Streams (Backend → Frontend)

| Event              | Description                    |
| ------------------ | ------------------------------ |
| `activity_changed` | New foreground app detected    |
| `meeting_started`  | Meeting/call detected          |
| `meeting_ended`    | Meeting/call ended             |
| `idle_started`     | User went idle                 |
| `idle_ended`       | User resumed activity          |
| `summary_ready`    | AI summary generation complete |

---

## 8. Security Architecture

### 8.1 Threat Model

| Threat               | Mitigation                              |
| -------------------- | --------------------------------------- |
| Data theft from disk | SQLCipher AES-256 encryption            |
| Key exposure         | OS Keychain / Credential Vault storage  |
| Network interception | TLS 1.3 for all API calls               |
| Unauthorized access  | App requires OS-level authentication    |
| Data over-collection | Strict allowlist of collected fields    |
| AI data leakage      | Anonymize window titles before cloud AI |

### 8.2 Data Anonymization for Cloud AI

Before sending data to cloud LLMs:

```
Original:  "Chrome — Project Atlas — Sprint Board — Jira"
Anonymized: "Browser — [PROJECT] — Sprint Board — Project Management Tool"

Original:  "Teams — Meeting with John Smith — Client Review"
Anonymized: "Communication App — Meeting with [PERSON] — Client Review"
```

---

## 9. Performance Design

### 9.1 Resource Budget

| Metric       | Target       | Strategy                                      |
| ------------ | ------------ | --------------------------------------------- |
| CPU Usage    | < 2% average | 5-second polling, event-driven where possible |
| Memory       | < 100MB      | Rust backend efficiency, React lazy loading   |
| Disk I/O     | < 1 write/5s | Batch writes, WAL mode for SQLite             |
| Binary Size  | < 15MB       | Tauri (vs. ~150MB for Electron)               |
| Startup Time | < 2 seconds  | Lazy initialization, async loading            |

### 9.2 Optimization Strategies

1. **Polling with backoff** — Increase interval when idle
2. **Write batching** — Buffer activities, write every 30 seconds
3. **Lazy AI** — Only invoke LLM when generating end-of-day summary
4. **SQLite WAL mode** — Non-blocking concurrent reads/writes
5. **Tray-only mode** — No UI window open unless requested (zero rendering overhead)

---

## 10. Deployment Architecture

### 10.1 Build Pipeline

```
┌──────────┐     ┌───────────┐     ┌────────────┐     ┌───────────┐
│  Source   │ ──▶ │   Build   │ ──▶ │   Sign &   │ ──▶ │  Release  │
│   Code   │     │  (CI/CD)  │     │  Notarize  │     │ (GitHub)  │
└──────────┘     └───────────┘     └────────────┘     └───────────┘
                       │
           ┌───────────┼───────────┐
           │           │           │
           ▼           ▼           ▼
     ┌──────────┐ ┌─────────┐ ┌────────┐
     │  macOS   │ │ Windows │ │ Linux  │
     │  .dmg    │ │ .msi    │ │ .deb   │
     │  .app    │ │ .exe    │ │ .rpm   │
     └──────────┘ └─────────┘ │.AppImg │
                               └────────┘
```

### 10.2 Auto-Update

Tauri's built-in updater:

- Checks for updates on launch
- Downloads in background
- User-approved install
- Rollback capability

---

## Appendix: Technology Decision Records

### ADR-001: Tauri over Electron

**Decision:** Use Tauri 2.x as the desktop framework.

**Context:** Need cross-platform desktop app with React frontend.

**Rationale:**

- Binary size: ~5MB vs ~150MB (Electron)
- Memory: ~30MB vs ~200MB (Electron)
- Security: Rust memory safety, no Node.js attack surface
- Native: Direct OS API access via Rust FFI
- Performance: Rust backend vs Node.js

**Trade-offs:**

- Smaller community than Electron
- Rust learning curve
- WebView dependency (not bundled — uses system WebView)

### ADR-002: Hybrid AI over Pure Cloud/Pure Local

**Decision:** Use rule-based local classification + cloud LLM for complex tasks.

**Context:** Need activity classification and summary generation.

**Rationale:**

- Rule-based handles ~70% of activities instantly (zero latency)
- Cloud LLM handles edge cases and generates natural language summaries
- Local LLM (Ollama) available as privacy-maximum fallback
- Reduces API costs by ~70% vs sending everything to cloud

**Trade-offs:**

- More complex architecture
- Rules need maintenance as new apps emerge
- Cloud dependency for best summarization quality
