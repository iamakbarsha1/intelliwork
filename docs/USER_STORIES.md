# IntelliWork — User Stories

> Complete user stories organized as Epics → Features → Stories with Given/When/Then acceptance criteria and MoSCoW prioritization.

---

## Epic 1: Activity Tracking

> _As a knowledge worker, I want my daily application usage automatically tracked so I don't have to manually remember and log what I worked on._

### Feature 1.1: Foreground Application Monitoring

---

#### US-1.1.1: Track Active Application

**Priority:** Must Have

> As a user, I want IntelliWork to detect which application I'm currently using so my work activities are automatically logged.

**Acceptance Criteria:**

```
GIVEN IntelliWork is running and tracking is enabled
WHEN I switch to a different application (e.g., from VS Code to Chrome)
THEN the system logs the previous application session with:
  - Application name
  - Window title
  - Start time
  - End time
  - Duration in seconds
AND the system begins tracking the new application
```

```
GIVEN tracking is disabled via the toggle
WHEN I switch between applications
THEN no activity is logged
```

---

#### US-1.1.2: Window Title Capture

**Priority:** Must Have

> As a user, I want the window title of my active application captured so the AI can understand the context of my work.

**Acceptance Criteria:**

```
GIVEN IntelliWork has screen recording permission (macOS) or standard access (Windows/Linux)
WHEN I am working in an application
THEN the system captures the window title (e.g., "auth-service/index.ts — VS Code")
AND updates the title if it changes within the same application session
```

```
GIVEN IntelliWork does NOT have screen recording permission (macOS)
WHEN I am working in an application
THEN the system logs the app name without the window title
AND displays a notification suggesting the user grant permission for better classification
```

---

#### US-1.1.3: Activity Duration Calculation

**Priority:** Must Have

> As a user, I want accurate duration tracking per application so my timesheet reflects actual time spent.

**Acceptance Criteria:**

```
GIVEN I am using Visual Studio Code starting at 09:00
WHEN I switch to Chrome at 10:30
THEN the VS Code session is logged with duration = 5400 seconds (90 minutes)
AND a new Chrome session begins at 10:30
```

---

### Feature 1.2: Idle Detection

---

#### US-1.2.1: Detect User Idle

**Priority:** Must Have

> As a user, I want idle time excluded from my activity logs so my timesheet only reflects active work.

**Acceptance Criteria:**

```
GIVEN the idle threshold is set to 3 minutes (default)
WHEN I stop interacting with my computer for 3+ minutes
THEN the current activity session is paused
AND the idle period is NOT counted as productive time
```

```
GIVEN I have been idle for 10 minutes
WHEN I resume interacting with my computer
THEN a new activity session begins from the time I resume
AND the 10-minute idle gap is logged as idle time
```

---

#### US-1.2.2: Configurable Idle Threshold

**Priority:** Should Have

> As a user, I want to configure the idle detection threshold so it matches my work style.

**Acceptance Criteria:**

```
GIVEN I navigate to Settings → Tracking → Idle Threshold
WHEN I change the threshold from 3 minutes to 5 minutes
THEN idle detection uses the new 5-minute threshold immediately
AND the setting persists across app restarts
```

---

### Feature 1.3: Office Hours Restriction

---

#### US-1.3.1: Define Office Hours

**Priority:** Must Have

> As a user, I want to define my office hours so tracking only occurs during my work time.

**Acceptance Criteria:**

```
GIVEN I set office hours as 09:00 to 18:00
WHEN the current time is 08:55
THEN tracking is NOT active (outside office hours)
```

```
GIVEN I set office hours as 09:00 to 18:00
WHEN the current time reaches 09:00
THEN tracking automatically activates
AND a system tray notification appears: "Tracking started (office hours)"
```

```
GIVEN office hours end at 18:00
WHEN the current time reaches 18:00
THEN tracking automatically pauses
AND active sessions are closed with end_time = 18:00
```

---

#### US-1.3.2: Toggle Office Hours Restriction

**Priority:** Must Have

> As a user, I want to disable the office hours restriction so I can track work outside normal hours if needed.

**Acceptance Criteria:**

```
GIVEN office hours restriction is enabled
WHEN I toggle "Restrict to office hours" OFF
THEN tracking operates 24/7 (when manually enabled)
```

---

## Epic 2: Meeting Detection

> _As a user, I want my meetings and calls automatically detected and classified so they appear in my timesheet without manual entry._

### Feature 2.1: Application-Based Meeting Detection

---

#### US-2.1.1: Detect Meeting Applications

**Priority:** Must Have

> As a user, I want IntelliWork to recognize when I'm in a meeting application (Teams, Zoom, Meet) so meetings are automatically logged.

**Acceptance Criteria:**

```
GIVEN I open Microsoft Teams and join a meeting
WHEN the Teams window title contains meeting-related keywords (e.g., "Meeting", "Call")
THEN a meeting_log entry is created with:
  - source_app: "Microsoft Teams"
  - meeting_title: extracted from window title
  - meeting_type: determined by calendar match
  - start_time: current timestamp
```

```
GIVEN I end a Teams meeting
WHEN I return to a non-meeting application OR Teams window title changes to non-meeting context
THEN the meeting_log entry is updated with:
  - end_time: current timestamp
  - duration: calculated from start to end
```

---

#### US-2.1.2: Classify Meeting Type

**Priority:** Should Have

> As a user, I want meetings classified as "scheduled" or "ad-hoc" so I can differentiate planned vs. unplanned meetings.

**Acceptance Criteria:**

```
GIVEN a meeting is detected via Teams
AND a matching calendar event exists for this time slot
WHEN the meeting is logged
THEN meeting_type = "scheduled"
```

```
GIVEN a meeting is detected via Teams
AND NO matching calendar event exists
WHEN the meeting is logged
THEN meeting_type = "ad_hoc"
```

---

### Feature 2.2: Calendar Integration (Optional)

---

#### US-2.2.1: Sync Calendar Events

**Priority:** Could Have

> As a user, I want IntelliWork to read my calendar so meeting titles and participants are enriched automatically.

**Acceptance Criteria:**

```
GIVEN I connect my Microsoft 365 account via OAuth
WHEN IntelliWork detects a meeting during a calendar event time slot
THEN the meeting_log is enriched with:
  - meeting_title: from calendar event subject
  - participants: from calendar event attendees (first names only)
```

---

## Epic 3: AI-Powered Classification & Summarization

> _As a user, I want my activities automatically categorized and summarized by AI so I can generate timesheet entries without manual effort._

### Feature 3.1: Rule-Based Activity Classification

---

#### US-3.1.1: Auto-Classify Known Applications

**Priority:** Must Have

> As a user, I want common applications automatically classified into work categories based on predefined rules.

**Acceptance Criteria:**

```
GIVEN I use Visual Studio Code for 2 hours
WHEN the activity is logged
THEN it is classified as "Development" with confidence ≥ 0.90
```

```
GIVEN I browse StackOverflow in Chrome for 45 minutes
WHEN the activity is logged
THEN it is classified as "Research" with confidence ≥ 0.80
```

```
GIVEN I use an unrecognized application
WHEN the activity is logged
THEN it is classified as "Uncategorized" with confidence = 0.0
AND flagged for LLM classification
```

---

### Feature 3.2: LLM Contextual Classification

---

#### US-3.2.1: Classify Ambiguous Activities via LLM

**Priority:** Must Have

> As a user, I want ambiguous activities sent to an LLM for accurate classification.

**Acceptance Criteria:**

```
GIVEN an activity is classified as "Uncategorized" by rules
WHEN end-of-day summary is generated
THEN the activity is sent to the configured AI provider (anonymized)
AND the LLM returns a category with confidence score
AND the activity's category is updated in the database
```

---

### Feature 3.3: End-of-Day Summary Generation

---

#### US-3.3.1: Generate Daily Summary

**Priority:** Must Have

> As a user, I want an AI-generated end-of-day summary that groups and describes my work activities.

**Acceptance Criteria:**

```
GIVEN I click "Generate Summary" in the dashboard
WHEN all today's activities have been classified
THEN an AI-generated summary is displayed containing:
  - List of meetings with titles and durations
  - Development work descriptions
  - Research topics
  - Communication activities
  - Total time per category
  - Total productive time
AND the summary is editable before saving
```

---

#### US-3.3.2: Edit AI Summary

**Priority:** Must Have

> As a user, I want to edit the AI-generated summary before exporting so I can correct any misclassifications.

**Acceptance Criteria:**

```
GIVEN an AI summary is displayed
WHEN I edit a description or change a category
THEN the edited version is saved as "edited_summary"
AND the original AI summary is preserved as "raw_summary"
```

---

#### US-3.3.3: Export Timesheet

**Priority:** Must Have

> As a user, I want to export my daily summary as CSV or PDF for timesheet submission.

**Acceptance Criteria:**

```
GIVEN I have an approved daily summary
WHEN I click "Export as CSV"
THEN a CSV file is downloaded containing:
  - Date, Category, Description, Duration, Start Time, End Time
AND the file is saved to the user's Downloads folder
```

```
GIVEN I have an approved daily summary
WHEN I click "Export as PDF"
THEN a formatted PDF report is generated and saved to Downloads
```

---

## Epic 4: User Controls & Privacy

> _As a user, I want full control over tracking and my data, ensuring my privacy is always respected._

### Feature 4.1: Tracking Controls

---

#### US-4.1.1: Toggle Tracking On/Off

**Priority:** Must Have

> As a user, I want a one-click toggle to enable or disable tracking at any time.

**Acceptance Criteria:**

```
GIVEN tracking is currently active
WHEN I click the tracking toggle in the system tray or dashboard
THEN tracking immediately stops
AND the system tray icon changes to indicate "tracking paused"
AND any active session is closed with current timestamp
```

```
GIVEN tracking is currently paused
WHEN I click the tracking toggle
THEN tracking immediately resumes
AND the system tray icon changes to indicate "tracking active"
```

---

### Feature 4.2: Data Management

---

#### US-4.2.1: View Activity Logs

**Priority:** Must Have

> As a user, I want to view all collected activity data in a transparent dashboard.

**Acceptance Criteria:**

```
GIVEN I open the IntelliWork dashboard
WHEN I navigate to "Today's Activities"
THEN I see a timeline of all tracked activities with:
  - Application name and icon
  - Category badge
  - Duration
  - Start/end times
AND activities are grouped by category with totals
```

---

#### US-4.2.2: Delete Activity Data

**Priority:** Must Have

> As a user, I want to delete any or all of my activity data at any time.

**Acceptance Criteria:**

```
GIVEN I select specific activities in the dashboard
WHEN I click "Delete Selected"
THEN the selected activities are permanently removed from the database
AND a confirmation dialog appears before deletion
```

```
GIVEN I navigate to Settings → Data → Delete All Data
WHEN I confirm deletion
THEN ALL activity logs, meeting logs, and summaries are permanently deleted
AND a confirmation dialog with re-type verification appears before deletion
```

---

### Feature 4.3: First-Launch Consent

---

#### US-4.3.1: Display Consent Screen

**Priority:** Must Have

> As a user, I want to see a clear privacy disclosure before any tracking begins.

**Acceptance Criteria:**

```
GIVEN I launch IntelliWork for the first time
WHEN the consent screen appears
THEN I see:
  - What data is collected (app name, window title, timestamps)
  - What data is NOT collected (keystrokes, screenshots, files)
  - Where data is stored (locally, encrypted)
  - My rights (view, delete, export, disable)
AND I must check "I understand and consent" before proceeding
AND clicking "Decline" closes the app without enabling any tracking
```

---

## Non-Functional Requirements

### Performance

| Requirement        | Target           | Measurement             |
| ------------------ | ---------------- | ----------------------- |
| CPU usage          | < 2% average     | System Activity Monitor |
| Memory usage       | < 100MB          | System Activity Monitor |
| Polling latency    | < 100ms per poll | Profiling               |
| Summary generation | < 10 seconds     | Stopwatch               |
| App startup time   | < 2 seconds      | Profiling               |
| Binary size        | < 15MB           | Build output            |

### Security

| Requirement             | Implementation                              |
| ----------------------- | ------------------------------------------- |
| Data encryption at rest | SQLCipher AES-256                           |
| API key protection      | OS Keychain/Credential Vault                |
| Network encryption      | TLS 1.3 for all API calls                   |
| Code signing            | Signed binaries on macOS + Windows          |
| Dependency security     | Automated `cargo audit` + `npm audit` in CI |

### Reliability

| Requirement        | Target                                                |
| ------------------ | ----------------------------------------------------- |
| Uptime             | 99.9% while system is running                         |
| Crash recovery     | Auto-restart with unsaved activity flush              |
| Data integrity     | WAL mode + periodic integrity checks                  |
| Offline capability | Full functionality without internet (except cloud AI) |

### Usability

| Requirement          | Implementation                              |
| -------------------- | ------------------------------------------- |
| First-use onboarding | Guided 3-step setup wizard                  |
| Platform consistency | Same UI/UX on macOS, Windows, Linux         |
| Accessibility        | Keyboard navigation, screen reader support  |
| Internationalization | English (v1), extensible for more languages |
