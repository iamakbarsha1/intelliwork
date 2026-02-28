# Prompt Template: Refactoring

> Use this template when asking an AI agent to refactor existing code.

---

## Refactoring Request

**Scope:** [Module/file/function to refactor]

**Motivation:** [Why this refactoring is needed — readability, performance, maintainability, etc.]

**Desired Outcome:** [What the code should look like after refactoring]

---

## Constraints

Before writing any code, read and follow these files:

1. `.ai/agent-rules.md` — Engineering contract
2. `.ai/architecture-constraints.md` — Layer boundaries
3. `.ai/coding-standards.md` — Code conventions
4. `.ai/lessons-learned.md` — Past corrections

---

## Rules for Refactoring

### Must Follow

- [ ] **Behavior-preserving** — External behavior must not change
- [ ] **All existing tests must pass** without modification
- [ ] **Small, incremental changes** — One concern at a time
- [ ] **Improved readability** — Code should be clearer, not just different
- [ ] **No new dependencies** — Unless explicitly approved

### Must NOT Do

- [ ] Change public APIs without discussion
- [ ] Add new features during refactoring
- [ ] Remove or weaken tests
- [ ] Break backward compatibility

---

## Deliverables

1. **Refactored Code** — Clean, well-structured implementation
2. **Before/After Comparison** — Summary of what changed and why
3. **Test Verification** — Proof that all existing tests still pass
4. **New Tests** — If refactoring exposed untested code paths

---

## Self-Review

After refactoring, verify:

- [ ] All existing tests pass without changes
- [ ] Code follows `coding-standards.md`
- [ ] Architecture follows `architecture-constraints.md`
- [ ] No unintended side effects
