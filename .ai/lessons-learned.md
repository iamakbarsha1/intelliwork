# Lessons Learned — IntelliWork

> This file serves as persistent AI memory. Every time a correction is made to AI-generated code, add the lesson here. AI agents MUST read this file before generating code.

---

## How to Use This File

1. After correcting AI-generated code, add a lesson below
2. Format: `- [DATE] LESSON_DESCRIPTION`
3. Before generating code, AI agent reads this file and avoids past mistakes
4. Review periodically to promote patterns into `coding-standards.md`

---

## Active Lessons

### Architecture

- [2026-03-01] Always use the `PlatformTracker` trait for OS-specific operations — never call OS APIs directly from services
- [2026-03-01] IPC command handlers must be thin wrappers — all logic belongs in services
- [2026-03-01] React frontend must NOT cache authoritative data — always fetch from backend via IPC

### Rust

- [2026-03-01] Never use `unwrap()` or `expect()` — always propagate errors with `?`
- [2026-03-01] Use `thiserror` for all custom error types — not manual `impl Display`
- [2026-03-01] Database operations always through the `Database` struct — no raw SQL outside `storage/`
- [2026-03-01] Use `Arc<Mutex<T>>` for shared mutable state — never global statics

### TypeScript

- [2026-03-01] Never use `any` — use `unknown` with type guards or proper interfaces
- [2026-03-01] Always use `import type` for type-only imports
- [2026-03-01] Custom hooks must return typed objects, not tuples
- [2026-03-01] All Tauri `invoke()` calls must have explicit type parameter: `invoke<TrackingStatus>('...')`

### Security

- [2026-03-01] Window titles contain sensitive data — only log at DEBUG level
- [2026-03-01] Always anonymize data before sending to cloud AI — use `DataAnonymizer`
- [2026-03-01] API keys go in OS Keychain — NEVER in config files or environment variables
- [2026-03-01] Always validate IPC inputs — don't trust frontend data

### Testing

- [2026-03-01] Use in-memory SQLite for database tests — never touch real database
- [2026-03-01] Mock all external APIs in tests — no real network calls
- [2026-03-01] Each test must be independent — no shared state between tests

### Performance

- [2026-03-01] Batch database writes — don't write on every 5-second poll
- [2026-03-01] Use `React.memo` for list items in activity timeline
- [2026-03-01] LLM calls only during summary generation — not during real-time tracking

---

## Resolved Lessons (Promoted to Standards)

_Move lessons here once they've been formalized in `coding-standards.md` or `architecture-constraints.md`._

_(none yet)_
