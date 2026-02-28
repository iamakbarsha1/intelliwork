# Architecture Constraints — IntelliWork

> Hard constraints on the system architecture. These are non-negotiable rules that preserve system integrity.

---

## Layer Boundaries

```
LAYER                      CAN DEPEND ON              CANNOT DEPEND ON
─────────────────────────────────────────────────────────────────────────
UI (React components)      Hooks, Lib, Tauri IPC       Rust code directly
Hooks (useXxx)             Lib (types, utils), IPC     Components, Rust
IPC Commands (commands.rs) Services, Storage            React, UI
Services (tracker/, ai/)   Storage, Platform traits     IPC handlers, UI
Storage (database.rs)      Models, SQLite               Services, IPC, UI
Platform (macos/win/linux) OS APIs only                 Services, Storage, UI
```

### Rule 1: No Layer Skipping

```
✅ Component → Hook → IPC → Service → Storage
❌ Component → Storage (skips IPC and service layer)
❌ IPC Handler → Platform API (skips service layer)
```

### Rule 2: Dependencies Flow Downward Only

```
UI → Business Logic → Data Layer → OS Layer

Never: Data Layer → UI
Never: OS Layer → Business Logic
```

---

## Module Constraints

### IPC Command Handlers (`commands.rs`)

```rust
// ✅ CORRECT: Thin handler that delegates to service
#[tauri::command]
async fn get_todays_activities(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<ActivityLog>, String> {
    state.tracker
        .get_todays_activities()
        .map_err(|e| e.to_string())
}

// ❌ WRONG: Business logic in handler
#[tauri::command]
async fn get_todays_activities(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<ActivityLog>, String> {
    let db = state.database.lock().unwrap();
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let activities = db.query("SELECT * FROM activity_logs WHERE date(start_time) = ?", &[&today]);
    // ... more logic ...
}
```

### Services (`tracker/`, `ai/`)

- Services contain business logic
- Services depend on Storage and Platform abstractions (traits, not concrete types)
- Services must NOT depend on Tauri-specific types
- Services must be testable without Tauri runtime

### Storage (`storage/`)

- Only module allowed to execute SQL
- Must expose typed methods, never raw queries
- All methods return `Result<T, StorageError>`
- Database struct is the single entry point

### Platform (`platform/`)

- Contains OS-specific implementations only
- Must implement `PlatformTracker` trait
- Must NOT contain business logic
- Conditional compilation via `#[cfg(target_os = "...")]`

---

## Data Flow Constraints

### Activity Data

```
OS Event → PlatformTracker.get_foreground_app()
        → ActivityTracker.on_app_change()
        → RuleBasedClassifier.classify()
        → Database.insert_activity()
        → [IPC Event] activity_changed → UI update
```

**Rules:**

- Raw OS data must be normalized in the Platform layer before passing to services
- Classification happens immediately after logging (rule-based only)
- LLM classification only runs during summary generation (batch, not real-time)
- Database writes are batched (buffer → flush every 30s)

### Summary Generation

```
User action or schedule trigger
→ Database.get_activities_for_date()
→ HybridClassifier.classify_batch() (re-classify uncategorized)
→ SummaryGenerator.generate_summary()
→ Database.upsert_summary()
→ [IPC Event] summary_ready → UI display
```

**Rules:**

- Summary generation is asynchronous — must not block UI
- Progress events must be emitted during generation
- User must be able to cancel summary generation

---

## State Management Constraints

### Rust Backend State

```rust
// ✅ CORRECT: Use Tauri managed state with Arc<Mutex<T>> for mutable state
pub struct AppState {
    pub tracker: Arc<ActivityTracker>,
    pub database: Arc<Database>,
    pub config: Arc<Mutex<AppConfig>>,
}

// ❌ WRONG: Global mutable static
static mut TRACKER: Option<ActivityTracker> = None;

// ❌ WRONG: Thread-unsafe shared state
pub struct AppState {
    pub config: RefCell<AppConfig>,  // Not Send + Sync!
}
```

### React Frontend State

```
✅ Local component state: useState (for UI-only state)
✅ Derived data: useMemo (for computed values)
✅ Shared data: Tauri IPC (backend is source of truth)

❌ No global state libraries (Redux, Zustand, etc.)
❌ No Context for frequently changing data
❌ Frontend must NOT cache authoritative data — always query backend
```

**Rationale:** Backend (Rust) is the single source of truth. Frontend always fetches current state via IPC.

---

## API Design Constraints

### IPC Commands

- All commands must return `Result<T, String>` (Tauri limitation)
- All commands must validate input parameters
- All commands must be async
- Command names must be `snake_case` verbs: `get_`, `set_`, `toggle_`, `delete_`, `export_`, `generate_`

### Events (Backend → Frontend)

- Event names must be `snake_case`: `activity_changed`, `meeting_started`
- Event payloads must be serializable (Serde)
- Events must NOT carry large data — use IPC command to fetch details

---

## Database Constraints

- One SQLite database file per user
- All tables must have a UUID primary key
- All timestamps stored as ISO 8601 strings in UTC
- All schema changes must be migrations (not inline DDL)
- Foreign keys must have ON DELETE CASCADE where appropriate
- Indexes required on columns used in WHERE clauses

---

## Security Constraints

- No plaintext secrets anywhere (code, config, logs, database)
- All config files must be excluded from git (`.gitignore`)
- API keys stored exclusively in OS Keychain / Credential Vault
- Database encrypted with key derived from OS secure storage
- All cloud API calls use HTTPS only
- User data anonymized before cloud AI processing
- No analytics/telemetry without explicit opt-in

---

## Dependency Constraints

- Rust dependencies: minimize count, prefer well-maintained crates
- Audit all new dependencies: `cargo audit` before adding
- Pin major versions in `Cargo.toml`
- No duplicate functionality (e.g., don't add `reqwest` if `ureq` is already used)
- TypeScript: no CSS frameworks (vanilla CSS only)
- TypeScript: no state management libraries
- TypeScript: no UI component libraries — build custom components
