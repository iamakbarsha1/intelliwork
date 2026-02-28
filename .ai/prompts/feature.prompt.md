# Prompt Template: New Feature

> Use this template when asking an AI agent to implement a new feature.

---

## Task

**Feature Name:** [FEATURE_NAME]

**Description:**
[Describe the feature in detail]

**User Story:**
As a [user type], I want [action] so that [benefit].

---

## Constraints

Before writing any code, read and follow these files:

1. `.ai/agent-rules.md` — Engineering contract
2. `.ai/architecture-constraints.md` — Layer boundaries and module rules
3. `.ai/coding-standards.md` — Naming, patterns, style
4. `.ai/security-rules.md` — Security patterns
5. `.ai/lessons-learned.md` — Past corrections to avoid

---

## Requirements

### Must Include

- [ ] Implementation code following architecture constraints
- [ ] Unit tests for all new functions/modules
- [ ] Component tests for new React components
- [ ] Error handling for all failure paths
- [ ] Type safety (no `any` in TypeScript, no `unwrap()` in Rust)
- [ ] Documentation (doc comments on public APIs)

### Must NOT Include

- [ ] Business logic in IPC handlers
- [ ] Direct OS API calls outside platform layer
- [ ] Hardcoded strings or magic numbers
- [ ] `console.log` statements (use structured logging)
- [ ] Breaking changes to existing APIs

---

## Deliverables

1. **Code** — Implementation files
2. **Tests** — Unit + integration tests
3. **Documentation** — Updated API docs if public interface changed
4. **Explanation** — Brief description of design decisions made

---

## Self-Review

After generating, review against `.ai/review-checklist.md` and list any violations found.
