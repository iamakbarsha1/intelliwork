# Prompt Template: Bug Fix

> Use this template when asking an AI agent to fix a bug.

---

## Bug Report

**Bug ID:** [BUG_ID]

**Summary:** [One-line bug description]

**Steps to Reproduce:**

1. [Step 1]
2. [Step 2]
3. [Expected result]
4. [Actual result]

**Severity:** [P1-Critical / P2-High / P3-Medium / P4-Low]

**Platform:** [macOS / Windows / Linux / All]

---

## Constraints

Before writing any code, read and follow these files:

1. `.ai/agent-rules.md` — Engineering contract
2. `.ai/coding-standards.md` — Code conventions
3. `.ai/security-rules.md` — Security patterns
4. `.ai/lessons-learned.md` — Past corrections

---

## Requirements

### Must Include

- [ ] Root cause analysis (explain WHY the bug exists)
- [ ] Minimal fix (don't refactor unrelated code)
- [ ] Regression test (test that reproduces the bug, then verifies the fix)
- [ ] Verification that existing tests still pass

### Must NOT Include

- [ ] Unrelated refactoring
- [ ] New features
- [ ] Breaking changes to APIs

---

## Deliverables

1. **Root Cause** — Explanation of why the bug occurred
2. **Fix** — Code change (as small as possible)
3. **Regression Test** — Test that would fail before fix, passes after
4. **Impact Analysis** — Other areas potentially affected by this fix

---

## Self-Review

After fixing, run `.ai/review-checklist.md` and confirm:

- [ ] Fix is minimal and targeted
- [ ] No new issues introduced
- [ ] All tests pass
- [ ] Lesson added to `lessons-learned.md` if applicable
