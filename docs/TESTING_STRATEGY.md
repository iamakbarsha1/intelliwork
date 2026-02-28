# IntelliWork — Testing Strategy

> Industry-standard testing plan covering the testing pyramid, test cases for critical flows, performance testing, security testing, UAT process, and automation strategy.

---

## Table of Contents

- [1. Testing Philosophy](#1-testing-philosophy)
- [2. Testing Pyramid](#2-testing-pyramid)
- [3. Unit Testing](#3-unit-testing)
- [4. Integration Testing](#4-integration-testing)
- [5. End-to-End Testing](#5-end-to-end-testing)
- [6. Performance Testing](#6-performance-testing)
- [7. Security Testing](#7-security-testing)
- [8. User Acceptance Testing](#8-user-acceptance-testing)
- [9. Automation Strategy](#9-automation-strategy)
- [10. CI/CD Integration](#10-cicd-integration)

---

## 1. Testing Philosophy

IntelliWork follows a **shift-left testing** approach:

- Tests are written alongside code (TDD where practical)
- Quality gates enforced at every stage of the CI pipeline
- Each PR must maintain or improve code coverage
- Critical paths have redundant testing (unit + integration + E2E)

---

## 2. Testing Pyramid

```
                    ┌─────────┐
                    │  E2E    │   ~10% of tests
                    │  Tests  │   Playwright
                    ├─────────┤
                    │         │
                ┌───┤ Integr. ├───┐   ~20% of tests
                │   │  Tests  │   │   cargo test + Vitest
                ├───┤         ├───┤
                │   │         │   │
            ┌───┤   ├─────────┤   ├───┐   ~70% of tests
            │   │   │  Unit   │   │   │   cargo test + Vitest
            │   │   │  Tests  │   │   │
            └───┴───┴─────────┴───┴───┘
```

| Layer           | Percentage | Tools                | Scope                                     |
| --------------- | ---------- | -------------------- | ----------------------------------------- |
| **Unit**        | ~70%       | `cargo test`, Vitest | Individual functions, modules, components |
| **Integration** | ~20%       | `cargo test`, Vitest | Module interactions, IPC, database        |
| **E2E**         | ~10%       | Playwright           | Complete user flows through the UI        |

### Coverage Targets

| Layer                      | Target               |
| -------------------------- | -------------------- |
| Rust backend (unit)        | ≥ 80%                |
| TypeScript frontend (unit) | ≥ 80%                |
| Integration                | Critical paths 100%  |
| E2E                        | Core user flows 100% |

---

## 3. Unit Testing

### 3.1 Rust Backend Unit Tests

**Framework:** Built-in `#[test]` + `cargo test`

#### Activity Tracker Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_activity_duration_calculation() {
        let start = "2026-03-01T09:00:00Z".parse().unwrap();
        let end = "2026-03-01T10:30:00Z".parse().unwrap();
        let activity = ActivityLog::new("VS Code", "index.ts", start, end);
        assert_eq!(activity.duration_seconds, 5400);
    }

    #[test]
    fn test_activity_with_zero_duration() {
        let time = "2026-03-01T09:00:00Z".parse().unwrap();
        let activity = ActivityLog::new("VS Code", "index.ts", time, time);
        assert_eq!(activity.duration_seconds, 0);
    }

    #[test]
    fn test_idle_detection_threshold() {
        let detector = IdleDetector::new(Duration::from_secs(180));
        assert!(!detector.is_idle_at(Duration::from_secs(120)));  // 2 min < 3 min threshold
        assert!(detector.is_idle_at(Duration::from_secs(200)));   // 3.3 min > 3 min threshold
    }
}
```

#### Rule-Based Classifier Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_classify_vscode_as_development() {
        let classifier = RuleBasedClassifier::new();
        let result = classifier.classify("Visual Studio Code", "auth-service/index.ts");
        assert_eq!(result.category, Category::Development);
        assert!(result.confidence >= 0.90);
    }

    #[test]
    fn test_classify_stackoverflow_as_research() {
        let classifier = RuleBasedClassifier::new();
        let result = classifier.classify("Chrome", "StackOverflow - MongoDB indexing");
        assert_eq!(result.category, Category::Research);
        assert!(result.confidence >= 0.80);
    }

    #[test]
    fn test_classify_unknown_app_as_uncategorized() {
        let classifier = RuleBasedClassifier::new();
        let result = classifier.classify("UnknownApp", "Some Window");
        assert_eq!(result.category, Category::Uncategorized);
        assert_eq!(result.confidence, 0.0);
    }

    #[test]
    fn test_classify_teams_meeting() {
        let classifier = RuleBasedClassifier::new();
        let result = classifier.classify("Microsoft Teams", "Sprint Planning | Meeting");
        assert_eq!(result.category, Category::Meetings);
    }

    #[test]
    fn test_classify_jira_as_project_management() {
        let classifier = RuleBasedClassifier::new();
        let result = classifier.classify("Chrome", "Sprint Board - Jira");
        assert_eq!(result.category, Category::ProjectManagement);
    }
}
```

#### Meeting Detector Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_teams_meeting_from_window_title() {
        let detector = MeetingDetector::new();
        let result = detector.check("Microsoft Teams", "Sprint Planning | Meeting");
        assert!(result.is_meeting);
        assert_eq!(result.source_app, "Microsoft Teams");
        assert_eq!(result.meeting_title, Some("Sprint Planning".to_string()));
    }

    #[test]
    fn test_detect_zoom_call() {
        let detector = MeetingDetector::new();
        let result = detector.check("zoom.us", "Zoom Meeting");
        assert!(result.is_meeting);
    }

    #[test]
    fn test_non_meeting_teams_usage() {
        let detector = MeetingDetector::new();
        let result = detector.check("Microsoft Teams", "Chat — General");
        assert!(!result.is_meeting);  // Chat is not a meeting
    }
}
```

### 3.2 TypeScript Frontend Unit Tests

**Framework:** Vitest + React Testing Library

#### Component Tests

```typescript
// DailySummary.test.tsx
import { render, screen } from '@testing-library/react';
import { DailySummary } from './DailySummary';

describe('DailySummary', () => {
  const mockSummary = {
    date: '2026-03-01',
    meetings: [{ title: 'Sprint Planning', duration: '45m' }],
    development: [{ description: 'Auth middleware', duration: '2h 30m' }],
    total_productive_time: '7h 20m',
  };

  it('renders the summary date', () => {
    render(<DailySummary summary={mockSummary} />);
    expect(screen.getByText('March 1, 2026')).toBeInTheDocument();
  });

  it('displays meeting count', () => {
    render(<DailySummary summary={mockSummary} />);
    expect(screen.getByText('1 Meeting')).toBeInTheDocument();
  });

  it('shows total productive time', () => {
    render(<DailySummary summary={mockSummary} />);
    expect(screen.getByText('7h 20m')).toBeInTheDocument();
  });

  it('renders empty state when no summary exists', () => {
    render(<DailySummary summary={null} />);
    expect(screen.getByText('No summary generated yet')).toBeInTheDocument();
  });
});
```

#### Hook Tests

```typescript
// useTracking.test.ts
import { renderHook, act } from "@testing-library/react-hooks";
import { useTracking } from "./useTracking";

describe("useTracking", () => {
  it("starts with tracking disabled", () => {
    const { result } = renderHook(() => useTracking());
    expect(result.current.isTracking).toBe(false);
  });

  it("toggles tracking state", () => {
    const { result } = renderHook(() => useTracking());
    act(() => {
      result.current.toggleTracking();
    });
    expect(result.current.isTracking).toBe(true);
  });
});
```

---

## 4. Integration Testing

### 4.1 Database Integration Tests

```rust
#[cfg(test)]
mod integration_tests {
    use super::*;
    use tempfile::NamedTempFile;

    #[test]
    fn test_insert_and_retrieve_activity() {
        let db = Database::open_in_memory().unwrap();
        db.run_migrations().unwrap();

        let activity = ActivityLog {
            app_name: "VS Code".to_string(),
            window_title: Some("index.ts".to_string()),
            start_time: "2026-03-01T09:00:00Z".to_string(),
            end_time: Some("2026-03-01T10:30:00Z".to_string()),
            duration_seconds: 5400,
            category: "Development".to_string(),
            ..Default::default()
        };

        db.insert_activity(&activity).unwrap();
        let retrieved = db.get_activities_for_date("2026-03-01").unwrap();

        assert_eq!(retrieved.len(), 1);
        assert_eq!(retrieved[0].app_name, "VS Code");
        assert_eq!(retrieved[0].duration_seconds, 5400);
    }

    #[test]
    fn test_encrypted_database_round_trip() {
        let temp = NamedTempFile::new().unwrap();
        let key = "test-encryption-key-256-bit-long!";

        // Write data
        {
            let db = Database::open_encrypted(temp.path(), key).unwrap();
            db.run_migrations().unwrap();
            db.insert_config("test_key", "test_value").unwrap();
        }

        // Read data with correct key
        {
            let db = Database::open_encrypted(temp.path(), key).unwrap();
            let value = db.get_config("test_key").unwrap();
            assert_eq!(value, Some("test_value".to_string()));
        }

        // Fail with wrong key
        {
            let result = Database::open_encrypted(temp.path(), "wrong-key");
            assert!(result.is_err());
        }
    }
}
```

### 4.2 IPC Integration Tests

```rust
#[cfg(test)]
mod ipc_tests {
    use super::*;

    #[test]
    fn test_toggle_tracking_command() {
        let app_state = AppState::new_test();

        // Initially disabled
        let status = get_tracking_status(&app_state);
        assert!(!status.is_tracking);

        // Toggle on
        toggle_tracking(&app_state).unwrap();
        let status = get_tracking_status(&app_state);
        assert!(status.is_tracking);

        // Toggle off
        toggle_tracking(&app_state).unwrap();
        let status = get_tracking_status(&app_state);
        assert!(!status.is_tracking);
    }
}
```

---

## 5. End-to-End Testing

**Framework:** Playwright

### 5.1 Core User Flows

#### Flow 1: First Launch & Consent

```typescript
test("first launch shows consent screen", async ({ page }) => {
  await page.goto("/");

  // Consent screen visible
  await expect(page.getByText("Welcome to IntelliWork")).toBeVisible();
  await expect(page.getByText("What we track")).toBeVisible();
  await expect(page.getByText("What we NEVER track")).toBeVisible();

  // Cannot proceed without consent
  const acceptButton = page.getByRole("button", { name: "Accept & Setup" });
  await expect(acceptButton).toBeDisabled();

  // Check consent box
  await page.getByLabel("I understand and consent").check();
  await expect(acceptButton).toBeEnabled();

  // Accept
  await acceptButton.click();
  await expect(page.getByText("Dashboard")).toBeVisible();
});
```

#### Flow 2: Enable Tracking & View Activities

```typescript
test("toggle tracking and view activities", async ({ page }) => {
  await page.goto("/dashboard");

  // Enable tracking
  const toggle = page.getByTestId("tracking-toggle");
  await toggle.click();
  await expect(page.getByText("Tracking Active")).toBeVisible();

  // Wait for activities to populate
  await page.waitForTimeout(10000);

  // Check activities appear
  const activityList = page.getByTestId("activity-timeline");
  await expect(activityList).toBeVisible();
  const activities = activityList.getByRole("listitem");
  expect(await activities.count()).toBeGreaterThan(0);
});
```

#### Flow 3: Generate & Export Summary

```typescript
test("generate summary and export CSV", async ({ page }) => {
  await page.goto("/dashboard");

  // Generate summary
  await page.getByRole("button", { name: "Generate Summary" }).click();
  await page.waitForSelector('[data-testid="daily-summary"]');

  // Verify summary sections
  await expect(page.getByText("Meetings")).toBeVisible();
  await expect(page.getByText("Total Productive Time")).toBeVisible();

  // Export CSV
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export as CSV" }).click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/intelliwork.*\.csv$/);
});
```

---

## 6. Performance Testing

### 6.1 Resource Usage Tests

| Test                        | Target           | Tool                                   |
| --------------------------- | ---------------- | -------------------------------------- |
| CPU usage during tracking   | < 2% average     | OS Activity Monitor + custom benchmark |
| Memory usage (steady state) | < 100MB          | OS Activity Monitor                    |
| Memory growth over 8 hours  | < 10MB increase  | Long-running benchmark                 |
| Polling latency             | < 100ms per poll | Rust benchmarks (`criterion`)          |
| Database write throughput   | > 100 writes/sec | Rust benchmarks                        |
| Summary generation time     | < 10 seconds     | Integration test timing                |

### 6.2 Benchmark Suite

```rust
// benches/tracking_benchmark.rs
use criterion::{criterion_group, criterion_main, Criterion};

fn bench_foreground_app_detection(c: &mut Criterion) {
    let tracker = PlatformTracker::new().unwrap();
    c.bench_function("get_foreground_app", |b| {
        b.iter(|| tracker.get_foreground_app())
    });
}

fn bench_rule_classification(c: &mut Criterion) {
    let classifier = RuleBasedClassifier::new();
    c.bench_function("rule_classify", |b| {
        b.iter(|| classifier.classify("Visual Studio Code", "index.ts — VS Code"))
    });
}

fn bench_database_insert(c: &mut Criterion) {
    let db = Database::open_in_memory().unwrap();
    db.run_migrations().unwrap();

    c.bench_function("insert_activity", |b| {
        b.iter(|| {
            db.insert_activity(&ActivityLog::test_default()).unwrap()
        })
    });
}

criterion_group!(benches,
    bench_foreground_app_detection,
    bench_rule_classification,
    bench_database_insert
);
criterion_main!(benches);
```

### 6.3 Long-Running Stability Test

A dedicated test simulates 8 hours of continuous tracking:

```bash
# Run stability test (takes ~10 minutes with accelerated time)
cargo test --test stability_test -- --ignored
```

Validates:

- No memory leaks
- No file handle leaks
- Database size growth is linear
- No CPU spikes

---

## 7. Security Testing

### 7.1 OWASP-Based Security Tests

| Test                           | Category              | Tool                                     |
| ------------------------------ | --------------------- | ---------------------------------------- |
| Database encryption validation | Data at Rest          | Custom Rust test                         |
| Key storage verification       | Credential Management | Manual + automated                       |
| API key exposure scan          | Secrets Management    | `trufflehog`, `gitleaks`                 |
| Dependency vulnerability scan  | Supply Chain          | `cargo audit`, `npm audit`               |
| TLS verification               | Data in Transit       | `curl` + certificate inspection          |
| Input validation fuzzing       | IPC Security          | `cargo-fuzz`                             |
| Binary signature verification  | Code Integrity        | `codesign` (macOS), `signtool` (Windows) |

### 7.2 Security Test Examples

```rust
#[test]
fn test_database_unreadable_without_key() {
    let temp = tempfile::NamedTempFile::new().unwrap();

    // Create encrypted DB
    let db = Database::open_encrypted(temp.path(), "correct-key").unwrap();
    db.insert_config("secret", "sensitive-data").unwrap();
    drop(db);

    // Try reading raw file
    let raw_bytes = std::fs::read(temp.path()).unwrap();
    let raw_string = String::from_utf8_lossy(&raw_bytes);
    assert!(!raw_string.contains("sensitive-data"));  // Not readable as plaintext
    assert!(!raw_string.contains("secret"));
}

#[test]
fn test_anonymization_removes_personal_data() {
    let anonymizer = DataAnonymizer::new();

    let input = "Meeting with John Smith — Project Atlas Review";
    let output = anonymizer.anonymize(input);

    assert!(!output.contains("John Smith"));
    assert!(!output.contains("Project Atlas"));
    assert!(output.contains("[PERSON]"));
    assert!(output.contains("[PROJECT]"));
}
```

### 7.3 CI Security Pipeline

```yaml
# .github/workflows/security.yml
security-scan:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Rust dependency audit
      run: cargo install cargo-audit && cargo audit
    - name: NPM dependency audit
      run: pnpm audit --audit-level=high
    - name: Secret scanning
      uses: trufflesecurity/trufflehog@main
    - name: SAST scan
      uses: github/codeql-action/analyze@v3
```

---

## 8. User Acceptance Testing

### 8.1 UAT Process

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Prepare    │ ──▶ │   Execute    │ ──▶ │   Report     │ ──▶ │   Sign-off   │
│  Test Plan   │     │  Test Cases  │     │   Results    │     │  (Go/No-Go)  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### 8.2 UAT Scenarios

| #      | Scenario                | Steps                                               | Expected Result                                     |
| ------ | ----------------------- | --------------------------------------------------- | --------------------------------------------------- |
| UAT-01 | First launch experience | Install → Launch → Consent → Setup                  | Guided onboarding completes in < 2 minutes          |
| UAT-02 | Track a work session    | Enable tracking → Work for 1 hour → View activities | All foreground apps logged with correct durations   |
| UAT-03 | Meeting detection       | Join Teams meeting → End meeting → View logs        | Meeting logged with title, duration, classification |
| UAT-04 | Generate AI summary     | Work for 4+ hours → Generate summary                | Accurate, well-structured summary appears           |
| UAT-05 | Export timesheet        | Generate summary → Export CSV                       | Valid CSV with all expected columns                 |
| UAT-06 | Privacy controls        | Toggle tracking off → Work → Check logs             | No activities logged while tracking is off          |
| UAT-07 | Office hours            | Set hours 9-6 → Check at 7 PM                       | Tracking auto-disabled outside office hours         |
| UAT-08 | Delete data             | Delete single activity → Delete all data            | Data permanently removed, verified in DB            |
| UAT-09 | Performance             | Track for 8 hours → Check resource usage            | CPU < 2%, Memory < 100MB                            |
| UAT-10 | Cross-platform          | Repeat UAT-01 to UAT-08 on macOS + Windows + Linux  | Same behavior on all platforms                      |

### 8.3 UAT Sign-off Criteria

- ✅ All critical scenarios (UAT-01 to UAT-06) pass
- ✅ No P1 or P2 bugs remaining
- ✅ Performance targets met
- ✅ Privacy controls verified
- ✅ Cross-platform consistency confirmed

---

## 9. Automation Strategy

### 9.1 Test Automation Tools

| Tool                  | Purpose                           | Layer             |
| --------------------- | --------------------------------- | ----------------- |
| `cargo test`          | Rust unit + integration tests     | Unit, Integration |
| Vitest                | TypeScript unit tests             | Unit              |
| React Testing Library | Component tests                   | Unit              |
| Playwright            | E2E browser tests                 | E2E               |
| `criterion`           | Rust performance benchmarks       | Performance       |
| `cargo-fuzz`          | Fuzz testing                      | Security          |
| `cargo audit`         | Dependency vulnerability scanning | Security          |
| `pnpm audit`          | NPM dependency scanning           | Security          |

### 9.2 Test Commands

```bash
# Run all tests
pnpm test:all

# Individual test suites
pnpm test:unit           # Vitest unit tests
pnpm test:rust           # cargo test
pnpm test:e2e            # Playwright E2E
pnpm test:bench          # Rust benchmarks
pnpm test:security       # Security scans

# Coverage
pnpm test:coverage       # Combined coverage report
```

---

## 10. CI/CD Integration

### 10.1 CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test-rust:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cd src-tauri && cargo test
      - run: cd src-tauri && cargo clippy -- -D warnings

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:unit --coverage
      - run: pnpm lint

  test-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm tauri build
      - run: pnpm test:e2e

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd src-tauri && cargo audit
      - run: pnpm audit --audit-level=high
```

### 10.2 Quality Gates

| Gate                 | Requirement                      | Blocks PR? |
| -------------------- | -------------------------------- | ---------- |
| Rust tests pass      | All platforms                    | ✅ Yes     |
| Frontend tests pass  | Coverage ≥ 80%                   | ✅ Yes     |
| Linting passes       | Zero warnings                    | ✅ Yes     |
| Security scan passes | No high/critical vulnerabilities | ✅ Yes     |
| E2E tests pass       | Core flows                       | ✅ Yes     |
| Code review approved | ≥ 1 reviewer                     | ✅ Yes     |
