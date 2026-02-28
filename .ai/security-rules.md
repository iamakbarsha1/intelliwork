# Security Rules — IntelliWork

> Security rules that MUST be followed in all code changes. Violations will be caught in code review.

---

## Data Handling

### RULE-SEC-01: Never Log Sensitive Data

```rust
// ❌ WRONG
log::info!("User opened: {}", window_title);
log::info!("API key: {}", api_key);

// ✅ CORRECT
log::debug!("Window title captured (length: {})", window_title.len());
log::info!("API key configured: {}", !api_key.is_empty());
```

Window titles may contain sensitive information (meeting names, project names, personal data). Only log at DEBUG level, and never in production log outputs.

### RULE-SEC-02: Encrypt All Stored Data

```rust
// ❌ WRONG: Opening unencrypted database
let db = Connection::open("data.db")?;

// ✅ CORRECT: Always use encrypted database
let key = keychain::get_encryption_key()?;
let db = Database::open_encrypted(path, &key)?;
```

### RULE-SEC-03: Store Secrets in OS Secure Storage

```rust
// ❌ WRONG: Secrets in config file or environment variable
let api_key = std::env::var("OPENAI_API_KEY")?;
let api_key = config.get("api_key")?;

// ✅ CORRECT: Secrets in OS Keychain/Credential Vault
let api_key = keychain::get_secret("openai_api_key")?;
```

### RULE-SEC-04: Anonymize Before Cloud AI

```rust
// ❌ WRONG: Sending raw data to cloud API
let prompt = format!("Classify: {} - {}", app_name, window_title);
ai_client.complete(&prompt).await?;

// ✅ CORRECT: Anonymize first
let anonymized = anonymizer.anonymize(window_title)?;
let prompt = format!("Classify: {} - {}", app_name, anonymized);
ai_client.complete(&prompt).await?;
```

---

## Input Validation

### RULE-SEC-05: Validate All IPC Inputs

```rust
// ✅ CORRECT: Validate IPC input
#[tauri::command]
async fn set_office_hours(
    state: tauri::State<'_, AppState>,
    start_time: String,
    end_time: String,
) -> Result<(), String> {
    // Validate time format
    let start = NaiveTime::parse_from_str(&start_time, "%H:%M")
        .map_err(|_| "Invalid start time format. Expected HH:MM".to_string())?;
    let end = NaiveTime::parse_from_str(&end_time, "%H:%M")
        .map_err(|_| "Invalid end time format. Expected HH:MM".to_string())?;

    if start >= end {
        return Err("Start time must be before end time".to_string());
    }

    // Proceed with validated data
    state.config.lock().unwrap().set_office_hours(start, end)
        .map_err(|e| e.to_string())
}
```

### RULE-SEC-06: Parameterized SQL Queries Only

```rust
// ❌ WRONG: String interpolation in SQL
let query = format!("SELECT * FROM activity_logs WHERE id = '{}'", id);

// ✅ CORRECT: Parameterized queries
let query = "SELECT * FROM activity_logs WHERE id = ?1";
conn.query_row(query, params![id], |row| { /* ... */ })?;
```

---

## Network Security

### RULE-SEC-07: HTTPS Only

```rust
// ❌ WRONG
let url = "http://api.openai.com/v1/completions";

// ✅ CORRECT
let url = "https://api.openai.com/v1/completions";
```

### RULE-SEC-08: Timeout All Network Requests

```rust
// ✅ CORRECT: Always set timeouts
let client = reqwest::Client::builder()
    .timeout(Duration::from_secs(30))
    .connect_timeout(Duration::from_secs(10))
    .build()?;
```

---

## Privacy Enforcement

### RULE-SEC-09: Check Consent Before Any Data Collection

```rust
// ✅ CORRECT: Always check consent
fn track_activity(&self) -> Result<(), TrackerError> {
    if !self.config.is_consent_granted() {
        return Ok(());  // Silently skip — user hasn't consented
    }
    if !self.config.is_tracking_enabled() {
        return Ok(());
    }
    if self.config.is_office_hours_restricted() && !self.is_within_office_hours() {
        return Ok(());
    }
    // ... proceed with tracking
}
```

### RULE-SEC-10: Never Collect Prohibited Data

The following data must NEVER be collected, regardless of implementation approach:

- ❌ Keystrokes / key events (content)
- ❌ Screenshots / screen captures
- ❌ Clipboard contents
- ❌ File contents or file paths
- ❌ Audio or video streams
- ❌ Email or message body content
- ❌ Browser URLs (only tab title is allowed)
- ❌ Passwords or authentication tokens

Any code that accesses these data types is an automatic rejection.

---

## Dependency Security

### RULE-SEC-11: Audit Dependencies

```bash
# Run before every release and in CI
cargo audit           # Rust dependencies
pnpm audit            # Node dependencies
```

### RULE-SEC-12: No Known Vulnerable Dependencies

CI pipeline must block builds if `cargo audit` or `pnpm audit` reports HIGH or CRITICAL vulnerabilities.

---

## Code Signing

### RULE-SEC-13: All Release Binaries Must Be Signed

| Platform | Signing Requirement               |
| -------- | --------------------------------- |
| macOS    | Developer ID + Notarization       |
| Windows  | EV or OV code signing certificate |
| Linux    | GPG signature on packages         |
