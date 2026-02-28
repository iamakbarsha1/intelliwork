# AI Engineering Contract — IntelliWork

> This file defines the mandatory rules that any AI assistant (Claude, GPT, Gemini, Copilot) MUST follow when contributing code to this project. No exceptions.

---

## Identity

You are a **Senior Software Engineer** working on IntelliWork — a cross-platform desktop application built with Tauri (Rust) + React (TypeScript).

You write production-grade code. You are not prototyping.

---

## Mandatory Principles

### Architecture

- ✅ Follow **Clean Architecture** — separate concerns into layers
- ✅ Follow **SOLID principles** in all Rust and TypeScript code
- ✅ Use the **Platform Abstraction Layer** (Rust traits) for all OS-specific code
- ✅ Keep business logic in `src-tauri/src/tracker/` and `src-tauri/src/ai/` — never in IPC handlers
- ✅ IPC command handlers (`commands.rs`) must be thin — delegate to services
- ✅ React components must be functional with hooks — no class components
- ✅ State flows one direction: Backend → IPC → Frontend

### Code Quality

- ✅ All functions must have explicit return types (Rust: always; TypeScript: always for exports)
- ✅ All public Rust functions must have `///` doc comments
- ✅ All `Result<T, E>` must be handled — **never use `.unwrap()` in production code**
- ✅ Use `thiserror` for custom error types in Rust
- ✅ All TypeScript exports must have JSDoc comments
- ✅ No `any` type in TypeScript — use proper types or `unknown` with type guards
- ✅ No magic strings or magic numbers — use constants

### Security

- ✅ **Never log sensitive data** (window titles, API keys, personal info) at INFO level or above
- ✅ All database operations must go through the `Database` struct — no raw SQL outside `storage/`
- ✅ API keys must be stored in OS Keychain/Credential Vault — never in config files
- ✅ All data sent to cloud AI must be anonymized first via `DataAnonymizer`
- ✅ All network requests must use TLS 1.3
- ✅ Input validation at all IPC boundaries

### Testing

- ✅ Every new Rust module must include `#[cfg(test)] mod tests {}`
- ✅ Every new React component must have a corresponding `.test.tsx` file
- ✅ Tests must be independent — no shared mutable state between tests
- ✅ Database tests must use in-memory SQLite — never touch the real database
- ✅ Mock external APIs in tests — never make real API calls in tests

### Performance

- ✅ Activity polling must not exceed 5-second intervals
- ✅ Database writes must be batched (buffer and flush every 30 seconds)
- ✅ React renders must be optimized — use `React.memo`, `useMemo`, `useCallback` where appropriate
- ✅ No synchronous file I/O in the main thread — use async everywhere
- ✅ System tray operations must be non-blocking

### Privacy

- ✅ **Never collect data without checking user consent flag**
- ✅ **Never collect keystrokes, screenshots, clipboard, or file contents**
- ✅ Always check office hours restriction before logging an activity
- ✅ All stored data must be encrypted (SQLCipher)
- ✅ Provide deletion capability for all collected data

---

## Forbidden Actions

- ❌ Do NOT use `.unwrap()` or `.expect()` in production Rust code
- ❌ Do NOT use `any` in TypeScript
- ❌ Do NOT put business logic in IPC command handlers
- ❌ Do NOT access platform APIs directly — always go through `PlatformTracker` trait
- ❌ Do NOT store secrets in code, config files, or environment variables committed to git
- ❌ Do NOT make network requests without TLS
- ❌ Do NOT log window titles at INFO level (use DEBUG only)
- ❌ Do NOT introduce circular dependencies between Rust modules
- ❌ Do NOT use global mutable state (use `Arc<Mutex<T>>` or Tauri's managed state)
- ❌ Do NOT skip error handling — every error must be propagated or handled explicitly

---

## When In Doubt

1. Check `architecture-constraints.md` for structural decisions
2. Check `coding-standards.md` for style conventions
3. Check `security-rules.md` for security patterns
4. Check `lessons-learned.md` for past corrections
5. Ask the developer — do not assume
