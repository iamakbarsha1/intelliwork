# IntelliWork — Production Readiness

> Monitoring, logging, incident management, disaster recovery, and post-launch support strategy.

---

## Table of Contents

- [1. Monitoring & Logging](#1-monitoring--logging)
- [2. Incident Management](#2-incident-management)
- [3. Backup & Disaster Recovery](#3-backup--disaster-recovery)
- [4. Post-Launch Support](#4-post-launch-support)
- [5. Production Checklist](#5-production-checklist)

---

## 1. Monitoring & Logging

### 1.1 Application Logging

Since IntelliWork is a **local desktop application** (no central server), logging is local-first.

**Log Levels:**

| Level   | When                    | Example                                                 |
| ------- | ----------------------- | ------------------------------------------------------- |
| `ERROR` | Unrecoverable failures  | Database open failed, AI API unreachable                |
| `WARN`  | Recoverable issues      | Permission denied for window title, API rate limited    |
| `INFO`  | Normal operations       | Tracking started, summary generated, export completed   |
| `DEBUG` | Development diagnostics | App switch detected, classification result, IPC message |

**Log Storage:**

```
~/.intelliwork/logs/
├── intelliwork-2026-03-01.log     # Daily rotation
├── intelliwork-2026-03-02.log
└── intelliwork-2026-03-03.log
```

**Log Retention:** 30 days (auto-pruned)

**Log Format:**

```
[2026-03-01T09:15:32.145Z] [INFO] [tracker::activity] App switch detected: VS Code → Chrome
[2026-03-01T09:15:32.147Z] [DEBUG] [ai::classifier] Rule match: Chrome + StackOverflow → Research (0.85)
[2026-03-01T09:15:32.150Z] [INFO] [storage::database] Activity saved: id=abc123, duration=5400s
```

### 1.2 Health Monitoring

IntelliWork self-monitors its own health:

| Metric             | Check Interval | Threshold                   | Action                                |
| ------------------ | -------------- | --------------------------- | ------------------------------------- |
| CPU usage          | Every 60s      | > 5% sustained              | Increase polling interval             |
| Memory usage       | Every 60s      | > 150MB                     | Trigger garbage collection, warn user |
| Database size      | Every hour     | > 500MB                     | Prompt cleanup of old data            |
| Database integrity | On startup     | PRAGMA integrity_check fail | Attempt recovery, notify user         |
| AI API latency     | Per request    | > 30 seconds                | Fallback to rule-based only           |
| Crash count        | On startup     | > 3 in 24h                  | Disable tracking, show diagnostic     |

### 1.3 Crash Reporting

**Strategy:** Local crash reports with optional anonymous telemetry.

```
On crash:
  1. Write crash dump to ~/.intelliwork/crashes/
  2. On next launch: detect crash, show dialog
  3. User can OPTIONALLY submit anonymous crash report
  4. Crash report contains: OS version, app version, stack trace
  5. No activity data included in crash reports
```

### 1.4 Analytics (Optional, Opt-In)

If user opts into anonymous usage analytics:

| Metric                   | Purpose                     | Data                  |
| ------------------------ | --------------------------- | --------------------- |
| App launch count         | Measure adoption            | Count only            |
| Feature usage            | Prioritize development      | Feature name + count  |
| AI provider distribution | Optimize AI strategy        | Provider name + count |
| Platform distribution    | Prioritize platform support | OS name + version     |

**Absolutely NO activity content, window titles, or personal data.**

---

## 2. Incident Management

### 2.1 Incident Severity Levels

| Level             | Definition                              | Example                                     | Response Time |
| ----------------- | --------------------------------------- | ------------------------------------------- | ------------- |
| **P1 — Critical** | App crashes, data loss, security breach | Database corruption, encryption failure     | < 4 hours     |
| **P2 — High**     | Core feature broken                     | Tracking stops working, AI fails completely | < 24 hours    |
| **P3 — Medium**   | Feature degraded                        | Meeting detection misses some meetings      | < 3 days      |
| **P4 — Low**      | Minor bug, cosmetic                     | UI alignment issue, typo in summary         | Next release  |

### 2.2 Incident Response Process

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Detect     │ ──▶ │  Triage      │ ──▶ │   Resolve    │ ──▶ │   Review     │
│              │     │              │     │              │     │              │
│ • Crash log  │     │ • Classify   │     │ • Develop    │     │ • Root cause │
│ • User report│     │   severity   │     │   fix        │     │ • Improve    │
│ • Health     │     │ • Assign     │     │ • Test fix   │     │   detection  │
│   monitor    │     │ • Comm.      │     │ • Release    │     │ • Update     │
│              │     │   plan       │     │   hotfix     │     │   runbook    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### 2.3 Known Issue Runbook

| Issue                      | Symptoms                 | Resolution                                    |
| -------------------------- | ------------------------ | --------------------------------------------- |
| Database locked            | Activities not saving    | Restart app; check for zombie process         |
| Permission revoked (macOS) | Window titles empty      | Guide user to re-grant permissions            |
| AI API key expired         | Summary generation fails | Prompt user to update API key in settings     |
| High CPU                   | System slowdown          | Check polling interval, restart tracking      |
| Disk full                  | Database write errors    | Prompt user to free space or reduce retention |

---

## 3. Backup & Disaster Recovery

### 3.1 Data Backup Strategy

Since all data is local, the user is responsible for backups. IntelliWork provides tools to facilitate:

| Feature              | Description                                      |
| -------------------- | ------------------------------------------------ |
| **Manual export**    | Export all data as JSON/CSV from Settings        |
| **Auto-backup**      | Daily SQLite backup to `~/.intelliwork/backups/` |
| **Backup retention** | Keep last 7 daily backups (auto-pruned)          |
| **Restore**          | Import from backup via Settings → Data → Restore |

### 3.2 Backup File Structure

```
~/.intelliwork/
├── data.db              # Active encrypted database
├── backups/
│   ├── data-2026-03-01.db.bak
│   ├── data-2026-03-02.db.bak
│   └── ...              # Last 7 days
├── config.json          # App configuration
├── logs/                # Application logs
└── crashes/             # Crash dumps
```

### 3.3 Recovery Procedures

| Scenario                      | Recovery Steps                                                                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Database corruption**       | 1. Detect via PRAGMA integrity check. 2. Attempt repair via `.recover`. 3. If fail: restore from latest backup. 4. If no backup: reset with empty database. |
| **Encryption key lost**       | 1. OS Keychain/Credential Vault should persist. 2. If genuinely lost: factory reset (data unrecoverable).                                                   |
| **App uninstall + reinstall** | 1. Data folder (`~/.intelliwork/`) persists unless manually deleted. 2. Reinstall detects existing data.                                                    |
| **OS upgrade**                | 1. Data and configs preserved in `~/` directory. 2. Permissions may need re-granting on macOS.                                                              |

### 3.4 RTO/RPO

| Metric                             | Target      | Rationale                          |
| ---------------------------------- | ----------- | ---------------------------------- |
| **RPO** (Recovery Point Objective) | 24 hours    | Daily auto-backups                 |
| **RTO** (Recovery Time Objective)  | < 5 minutes | Restore from backup or fresh start |

---

## 4. Post-Launch Support

### 4.1 Release Cadence

| Release Type      | Frequency | Contents                         |
| ----------------- | --------- | -------------------------------- |
| **Patch** (x.x.X) | As needed | Bug fixes, security patches      |
| **Minor** (x.X.0) | Monthly   | New features, improvements       |
| **Major** (X.0.0) | Quarterly | Breaking changes, major features |

### 4.2 Auto-Update Strategy

```
On app launch:
  1. Check update server for new version (signed manifest)
  2. If update available:
     a. Download in background
     b. Show "Update Available" notification
     c. User clicks "Install" → restart with new version
  3. Rollback: previous version kept; revert option available
```

### 4.3 User Support Channels

| Channel            | Purpose                       | Response Time     |
| ------------------ | ----------------------------- | ----------------- |
| GitHub Issues      | Bug reports, feature requests | < 48 hours        |
| GitHub Discussions | Questions, ideas              | < 72 hours        |
| In-app feedback    | Quick feedback from settings  | Aggregated weekly |
| Release notes      | Changelog per version         | Every release     |

### 4.4 Iteration Strategy

**Feedback Loop:**

```
User Feedback → Triage → Prioritize → Implement → Release → Monitor
      ▲                                                        │
      └────────────────────────────────────────────────────────┘
```

**Feature Prioritization:**

- User requests tracked in GitHub Issues
- Prioritized by: impact × frequency × effort
- Reviewed every release cycle

---

## 5. Production Checklist

### Pre-Release Checklist

| Category     | Item                                    | Status |
| ------------ | --------------------------------------- | ------ |
| **Build**    | ☐ Compiles on macOS, Windows, Linux     |        |
| **Build**    | ☐ Binary size < 15MB                    |        |
| **Build**    | ☐ Code signed (macOS + Windows)         |        |
| **Build**    | ☐ macOS notarized                       |        |
| **Testing**  | ☐ All unit tests pass                   |        |
| **Testing**  | ☐ All integration tests pass            |        |
| **Testing**  | ☐ All E2E tests pass                    |        |
| **Testing**  | ☐ Performance benchmarks within targets |        |
| **Testing**  | ☐ Security scan clean                   |        |
| **Security** | ☐ Database encryption verified          |        |
| **Security** | ☐ No hardcoded secrets in code          |        |
| **Security** | ☐ Dependency audit clean                |        |
| **Privacy**  | ☐ Consent screen works correctly        |        |
| **Privacy**  | ☐ Tracking toggle works                 |        |
| **Privacy**  | ☐ Office hours restriction works        |        |
| **Privacy**  | ☐ Data deletion works                   |        |
| **Privacy**  | ☐ AI anonymization verified             |        |
| **UX**       | ☐ First-launch onboarding works         |        |
| **UX**       | ☐ System tray indicator accurate        |        |
| **UX**       | ☐ Export (CSV/PDF) works                |        |
| **Docs**     | ☐ README up to date                     |        |
| **Docs**     | ☐ CHANGELOG updated                     |        |
| **Docs**     | ☐ Version numbers bumped                |        |

### Post-Release Monitoring (First 48 Hours)

| Check                                       | Frequency      | Action if Failed               |
| ------------------------------------------- | -------------- | ------------------------------ |
| Crash report volume                         | Every 4 hours  | Hotfix if > 5% crash rate      |
| User feedback                               | Every 8 hours  | Triage new issues              |
| Auto-update success rate                    | After 24 hours | Fix update manifest if < 95%   |
| Performance metrics (from opt-in analytics) | After 48 hours | Performance hotfix if degraded |
