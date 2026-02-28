# Code Review Checklist — IntelliWork

> Use this checklist to review every code change before merging. AI agents should self-review against this list. Human reviewers should verify compliance.

---

## Architecture

- [ ] **Layer separation preserved?** — No layer skipping (UI → Hook → IPC → Service → Storage)
- [ ] **IPC handlers are thin?** — Only validation + delegation to services
- [ ] **Business logic in services only?** — Not in handlers, not in UI, not in storage
- [ ] **Platform abstraction used?** — OS-specific code behind `PlatformTracker` trait
- [ ] **No circular dependencies?** — Module A → B does not create B → A

## Code Quality

- [ ] **No `unwrap()` or `expect()` in Rust?** — All errors handled with `?` or `match`
- [ ] **No `any` in TypeScript?** — Use proper types or `unknown` with guards
- [ ] **Functions ≤ 40 lines?** — Split larger functions into smaller ones
- [ ] **Files ≤ 300 lines?** — Split into modules if larger
- [ ] **No magic strings/numbers?** — All defined as named constants
- [ ] **Proper naming conventions?** — Per coding-standards.md
- [ ] **Documentation present?** — Public Rust functions have `///`, exports have JSDoc

## Error Handling

- [ ] **All errors propagated or handled?** — No swallowed errors
- [ ] **Custom error types used?** — `thiserror` for Rust, typed errors for TypeScript
- [ ] **User-facing error messages are helpful?** — Not raw stack traces
- [ ] **Graceful degradation on failure?** — App doesn't crash on non-critical errors

## Security

- [ ] **No sensitive data in logs?** — Window titles at DEBUG only, never API keys
- [ ] **Inputs validated at IPC boundary?** — All command parameters checked
- [ ] **SQL parameterized?** — No string interpolation in queries
- [ ] **Secrets in OS Keychain only?** — Not in config files, env vars, or code
- [ ] **Cloud data anonymized?** — Personal/project names replaced before AI API calls
- [ ] **HTTPS only?** — No HTTP URLs anywhere
- [ ] **No hardcoded credentials?** — `grep -r "password\|secret\|api.key" src/`

## Privacy

- [ ] **Consent checked before data collection?** — Every tracking path checks consent flag
- [ ] **Office hours restriction applied?** — Tracking respects configured hours
- [ ] **No prohibited data types collected?** — No keystrokes, screenshots, clipboard, files
- [ ] **Data deletion works?** — Deleted data is truly removed, not soft-deleted

## Testing

- [ ] **Unit tests included?** — New Rust module has `#[cfg(test)]` tests
- [ ] **Component tests included?** — New React component has `.test.tsx`
- [ ] **Edge cases covered?** — Empty inputs, nulls, boundary values
- [ ] **Tests are independent?** — No shared mutable state between tests
- [ ] **Mocks used for external dependencies?** — No real API calls in tests
- [ ] **Existing tests still pass?** — `cargo test && pnpm test`

## Performance

- [ ] **No blocking operations on main thread?** — Async everywhere
- [ ] **Database writes batched?** — Not writing on every poll
- [ ] **React renders optimized?** — `memo`, `useMemo`, `useCallback` where needed
- [ ] **No memory leaks?** — Event listeners cleaned up, subscriptions cancelled

## Completeness

- [ ] **Feature works end-to-end?** — From user action to data persistence to UI display
- [ ] **Error states handled in UI?** — Loading, error, empty states all covered
- [ ] **Cross-platform considered?** — macOS, Windows, Linux paths all addressed
- [ ] **Documentation updated?** — README, API_REFERENCE if public API changed
