# 🚀 IntelliWork — AI Idea-thon Enhancement Plan

> [!IMPORTANT]
> **Deadline: April 6, 2026** — App concept finalization + competition registration.
> **Workflow:** Each feature → local branch → implement → PR via `gh` CLI → user reviews & merges → next feature.

## Context

**IntelliWork** is a Tauri 2.x (React 19 + Rust) AI-powered desktop app that auto-tracks work activities and generates timesheet summaries. Built for the **ConcertIDC AI Idea-thon 2026** (app concept + registration deadline: **April 6, 2026**).

### Current State (What Exists)

- ✅ Tauri scaffold with React frontend & Rust backend
- ✅ Activity Tracker (foreground app + window title monitoring)
- ✅ Meeting Detector (Teams/Zoom/Meet/Slack)
- ✅ Idle Detection Monitor
- ✅ AI Engine: Rule-based classifier + LLM (OpenAI/Gemini/Ollama)
- ✅ End-of-Day Summary Generator
- ✅ Encrypted SQLite storage (SQLCipher)
- ✅ 9 React components: Dashboard, LiveView, ActivityTimeline, DailySummary, etc.
- ✅ System tray, dark mode, export (CSV/PDF), consent flow

### What's Missing (Innovation Gap for Winning the AI Idea-thon)

The current app is a **solid timesheet automation tool**, but to **win an AI Idea-thon**, it needs features that make judges say _"wow, this is truly AI-powered innovation."_

---

## 🎯 Proposed Enhancements (6 New AI-Powered Features)

> [!IMPORTANT]
> These enhancements are ordered by **impact on judges** (most impressive first) and **development effort** (feasible within the timeline).

---

### Enhancement 1: 🧠 AI Focus Coach (Real-time Productivity Insights)

**Why it wins:** Transforms IntelliWork from a passive logger into an **active AI productivity coach**.

**Feature Description:**

- AI analyzes activity patterns in real-time and delivers contextual nudges:
  - _"You've been in meetings for 3 hours straight. Consider blocking focus time."_
  - _"Your deep work session on VS Code is your longest today — great flow!"_
  - _"Context switching is high today (12 switches in 30 min). Try batching tasks."_
- Shows a **Focus Score** (0–100) on the dashboard based on deep work vs. fragmented time.
- Displays an **Interruption Heatmap** showing when context-switching peaks occur.

**Skills Used:** `@ai-product`, `@prompt-engineering`, `@react-patterns`

#### User Stories

**US-NEW-1.1: Display Real-time Focus Score**

> As a user, I want to see a Focus Score on my dashboard so I can understand my daily productivity at a glance.

```
GIVEN tracking is active and activities exist for today
WHEN the dashboard loads or activities update
THEN a Focus Score (0–100) is displayed
  - Score based on: deep work ratio, context switch count, meeting load
  - Updates every 5 minutes while tracking is active
```

**US-NEW-1.2: AI Productivity Nudges**

> As a user, I want AI-generated nudges so I receive actionable insights about my work patterns.

```
GIVEN I have been in meetings for 2+ consecutive hours
WHEN the AI coach evaluates my activity pattern
THEN a non-intrusive notification appears: "Heavy meeting day — consider blocking focus time this afternoon"
```

**US-NEW-1.3: Context Switch Detection**

> As a user, I want to know when I'm context-switching too frequently so I can adjust my workflow.

```
GIVEN I switch applications more than 10 times in 15 minutes
WHEN the AI coach detects this pattern
THEN a nudge appears: "High context switching detected. Try batching similar tasks."
AND the context switch count is visible in the Live View
```

---

### Enhancement 2: 📊 Weekly Trends & AI Insights Dashboard

**Why it wins:** Shows the AI isn't just logging — it's **learning patterns over time**.

**Feature Description:**

- Weekly productivity trends chart (Mon–Fri) comparing focus time, meetings, etc.
- AI-generated weekly insight: _"You're most productive on Tuesdays between 10 AM–12 PM. Your meeting load increased 40% this week."_
- Category comparison bar chart across the week.

**Skills Used:** `@claude-d3js-skill`, `@data-storytelling`, `@kpi-dashboard-design`

#### User Stories

**US-NEW-2.1: Weekly Trends View**

> As a user, I want to see weekly productivity trends so I can identify patterns over time.

```
GIVEN I have tracked activities for multiple days
WHEN I open the "Trends" view
THEN I see a stacked bar chart showing hours per category for each day of the week
AND total productive time per day is displayed
```

**US-NEW-2.2: AI Weekly Insight**

> As a user, I want an AI-generated weekly summary with actionable insights.

```
GIVEN it's Friday or I request a weekly summary
WHEN I click "Generate Weekly Insight"
THEN the AI produces a natural language summary including:
  - Most productive day and time window
  - Meeting load trend (increasing/decreasing)
  - Top project areas worked on
  - Specific recommendations for next week
```

---

### Enhancement 3: 🏷️ Smart Project Tagging (AI Auto-Tags by Project)

**Why it wins:** Bridges the gap between "what app I used" and "what project I worked on" — the #1 timesheet pain point.

**Feature Description:**

- AI learns to associate window titles with projects: `"auth-service/index.ts — VS Code"` → **Project: Auth Service**
- Users can teach the AI by manually tagging once; it learns for future.
- Project breakdown in dashboard and export: time per project, not just per category.

**Skills Used:** `@ai-agents-architect`, `@prompt-engineering-patterns`, `@react-state-management`

#### User Stories

**US-NEW-3.1: AI Auto-Tag Projects**

> As a user, I want activities automatically tagged with project names so my timesheet shows time per project.

```
GIVEN I work in "VS Code" with window title "auth-service/login.ts"
WHEN the AI processes the activity
THEN it auto-tags with project: "Auth Service" (extracted from path/title)
AND this tag is visible in the Activity Timeline and Daily Summary
```

**US-NEW-3.2: Teach the AI (Manual Tag → Auto-Learn)**

> As a user, I want to manually tag an activity with a project name so the AI learns for future activities.

```
GIVEN I see an untagged activity "Chrome — Jira Board — Sprint 42"
WHEN I manually tag it as "Project: Platform Migration"
THEN all future activities with similar window titles are auto-tagged with "Platform Migration"
AND the rule is persisted in the database
```

---

### Enhancement 4: 🎤 Voice-to-Timesheet (Meeting Notes Summarizer)

**Why it wins:** Demonstrates multi-modal AI capability — a crowd-pleaser at demos.

**Feature Description:**

- After a meeting ends, the user can optionally add voice notes describing what was discussed.
- AI transcribes and summarizes the note into a structured meeting entry.
- Integrated into the Daily Summary as a rich meeting description.

**Skills Used:** `@voice-ai-development`, `@prompt-engineering`, `@audio-transcriber`

#### User Stories

**US-NEW-4.1: Add Voice Note to Meeting**

> As a user, I want to record a quick voice note after a meeting so I can capture key outcomes without typing.

```
GIVEN a meeting has just ended and is visible in the Activity Timeline
WHEN I click "Add Voice Note" on the meeting entry
THEN the microphone activates and I can record up to 5-7 minutes of audio
AND the recording is transcribed using an AI model
AND the transcription is summarized into a concise meeting description
AND the description is attached to the meeting entry
```

---

### Enhancement 5: 🔮 AI-Powered Predictive Scheduling

**Why it wins:** Forward-looking AI — not just analyzing the past but **predicting the future**.

**Feature Description:**

- Based on historical patterns, AI suggests optimal time blocks for the next day:
  - _"Based on your patterns, schedule deep work 10 AM–12 PM (your peak focus hours) and meetings after 2 PM."_
- Displays as a "Recommended Schedule" card on the dashboard.

**Skills Used:** `@ai-product`, `@data-scientist`, `@prompt-engineering-patterns`

#### User Stories

**US-NEW-5.1: Generate Recommended Schedule**

> As a user, I want AI to suggest an optimal schedule for tomorrow based on my productivity patterns.

```
GIVEN I have at least 5 days of tracked data
WHEN I click "Suggest Tomorrow's Schedule" on the dashboard
THEN the AI generates a recommended time-blocked schedule including:
  - Predicted peak focus hours (based on historical deep work blocks)
  - Suggested meeting windows (based on typical meeting distribution)
  - Recommended break times
AND the schedule is displayed as a visual timeline card
```

---

### Enhancement 6: 🏆 Gamification — Daily Streak & Achievements

**Why it wins:** Makes the app addictive and engaging — judges love UX polish.

**Feature Description:**

- **Daily Focus Streak**: Consecutive days with Focus Score > 60 → streak counter.
- **Achievements/Badges**: "3-Hour Deep Work", "Meeting-Free Morning", "Zero Context Switch Hour".
- Subtle animations and confetti on milestone achievements.

**Skills Used:** `@ui-ux-pro-max`, `@frontend-design`, `@scroll-experience`

#### User Stories

**US-NEW-6.1: Daily Streak Counter**

> As a user, I want to see my daily focus streak so I'm motivated to maintain productive habits.

```
GIVEN I've maintained a Focus Score > 60 for 3 consecutive days
WHEN I open the dashboard
THEN a "🔥 3-Day Focus Streak" badge is displayed prominently
AND a streak counter increments each qualifying day
```

**US-NEW-6.2: Progressive Deep Work Achievement Rings (Apple Fitness-Style)**

> As a user, I want to earn **progressive** achievement rings for productivity milestones, styled like Apple Fitness rings.

```
GIVEN I complete uninterrupted deep work (single category, no idle)
WHEN the session reaches a milestone duration
THEN I earn a progressive achievement ring:
  - 15 min → "Getting Started 🌱"
  - 30 min → "Warming Up 🔥"
  - 1 hour → "In the Zone ⚡"
  - 1.5 hours → "Flow State 🌊"
  - 2 hours → "Deep Dive 🏊"
  - 3 hours → "Deep Work Champion 🏅"
  - 4+ hours → "Legendary Focus 🏆"
AND each ring fills progressively (like Apple Fitness activity rings)
AND a celebration animation plays when a ring completes
AND earned rings are displayed on the Dashboard as circular progress indicators
```

> [!NOTE]
> Badge design follows Apple Fitness ring aesthetics — circular progress rings that fill up as you progress through milestones. Each tier has a distinct color gradient.

---

## 📋 Implementation Priority & Effort Estimate

| #   | Enhancement             | Impact on Judges | Effort | Priority              |
| --- | ----------------------- | ---------------- | ------ | --------------------- |
| 1   | AI Focus Coach          | ⭐⭐⭐⭐⭐       | Medium | **P0 — Must Have**    |
| 2   | Weekly Trends Dashboard | ⭐⭐⭐⭐         | Medium | **P0 — Must Have**    |
| 3   | Smart Project Tagging   | ⭐⭐⭐⭐⭐       | Medium | **P1 — Should Have**  |
| 6   | Gamification            | ⭐⭐⭐⭐         | Low    | **P1 — Should Have**  |
| 4   | Voice-to-Timesheet      | ⭐⭐⭐⭐⭐       | High   | **P2 — Nice to Have** |
| 5   | Predictive Scheduling   | ⭐⭐⭐⭐         | Medium | **P2 — Nice to Have** |

---

## 🗂️ Proposed Changes (File-level)

### Frontend (React)

#### [NEW] `src/components/FocusScore.tsx`

New component displaying real-time Focus Score (0–100) with circular progress ring and AI nudges.

#### [NEW] `src/components/WeeklyTrends.tsx`

Weekly productivity trends chart with stacked bar chart and AI weekly insight text.

#### [NEW] `src/components/ProjectTags.tsx`

Project tagging UI — auto-tag display, manual tag input, and learn-from-user flow.

#### [NEW] `src/components/Achievements.tsx`

Gamification badges, streak counter, and celebration animations.

#### [MODIFY] [App.tsx](file:///Users/akbarsha/Documents/code/now-you-see-me/intelliwork/src/App.tsx)

Add "Trends" nav tab, integrate FocusScore into Live View, add Achievements to Dashboard.

#### [NEW] `src/hooks/useFocusScore.ts`

Hook to calculate focus score from activities (deep work ratio, context switches, idle time).

#### [NEW] `src/hooks/useWeeklyData.ts`

Hook to fetch and aggregate activity data across the current week.

#### [NEW] `src/styles/enhancements.css`

Styles for all new components — focus score ring, trend charts, achievement badges.

---

### Backend (Rust)

#### [NEW] `src-tauri/src/ai/coach.rs`

Focus Coach AI logic — pattern detection, nudge generation, focus score calculation.

#### [NEW] `src-tauri/src/ai/project_tagger.rs`

Smart project tagging — window title → project inference, user tag learning.

#### [MODIFY] [commands.rs](file:///Users/akbarsha/Documents/code/now-you-see-me/intelliwork/src-tauri/src/commands.rs)

Add new IPC commands: `get_focus_score`, `get_weekly_data`, `get_weekly_insight`, `tag_project`, `get_achievements`.

#### [MODIFY] [mod.rs](file:///Users/akbarsha/Documents/code/now-you-see-me/intelliwork/src-tauri/src/ai/mod.rs)

Register new `coach` and `project_tagger` modules.

---

### Database

#### [MODIFY] Storage schema (in `storage/database.rs`)

Add new tables:

- `project_tags` — maps window title patterns to project names
- `achievements` — tracks earned badges and streaks
- `weekly_insights` — caches weekly AI summaries

---

## ✅ Verification Plan

### Unit Tests (Vitest)

**Existing tests** (in `src/test/`):

- [utils.test.ts](file:///Users/akbarsha/Documents/code/now-you-see-me/intelliwork/src/test/utils.test.ts) — utility function tests
- [category-colors.test.ts](file:///Users/akbarsha/Documents/code/now-you-see-me/intelliwork/src/test/category-colors.test.ts) — category color mapping tests

**New unit tests per feature:**

- `src/test/focus-score.test.ts` — Focus score calculation, nudge trigger conditions
- `src/test/achievements.test.ts` — Progressive milestone detection, streak counting
- `src/test/project-tagger.test.ts` — Window title → project inference logic
- `src/test/weekly-data.test.ts` — Weekly aggregation and trend calculations

**Run tests:**

```bash
cd /Users/akbarsha/Documents/code/now-you-see-me/intelliwork && pnpm test
```

### E2E Tests (Playwright)

**Full automated end-to-end testing** using Playwright against the Vite dev server. Test the complete user flow from start to finish.

**Test suites to create:**

- `e2e/onboarding.spec.ts` — Consent screen → Setup wizard → Dashboard redirect
- `e2e/tracking.spec.ts` — Toggle tracking on/off, verify status indicators
- `e2e/dashboard.spec.ts` — Activity timeline renders, category chart displays, daily summary generates
- `e2e/focus-score.spec.ts` — Focus Score widget renders, nudges appear
- `e2e/weekly-trends.spec.ts` — Weekly chart renders, AI insight generates
- `e2e/project-tags.spec.ts` — Manual tag → activity tagged → persists on refresh
- `e2e/achievements.spec.ts` — Badge rings render, streak counter works
- `e2e/export.spec.ts` — CSV/PDF export triggers correctly
- `e2e/settings.spec.ts` — Office hours config, AI provider selection, data deletion

**Run E2E tests:**

```bash
cd /Users/akbarsha/Documents/code/now-you-see-me/intelliwork && npx playwright test
```

> [!IMPORTANT]
> Playwright tests will run against the Vite dev server (frontend) with Tauri IPC calls mocked. This gives full UI coverage without requiring a native build. After each feature PR, E2E tests must pass before merge.

### Manual Smoke Tests (Post-PR)

After each PR is merged, the user should run `pnpm tauri dev` and do a quick smoke test of the new feature in the native app to verify Tauri IPC integration works end-to-end.

## 🔄 Development Workflow (Per Feature)

Each feature follows this workflow:

```
1. Create local branch:  git checkout -b feature/<feature-name>
2. Implement the feature (code + tests)
3. Run tests:            pnpm test && npx playwright test
4. Commit with conventional commits
5. Push branch:          git push -u origin feature/<feature-name>
6. Create PR via gh CLI:  gh pr create --title "..." --body "..." --label "..."
   - PR includes: title, description, user stories covered, test instructions
7. User reviews & merges
8. Move to next feature
```

### Feature Implementation Order

| Order | Branch Name                   | Feature                          | User Stories         |
| ----- | ----------------------------- | -------------------------------- | -------------------- |
| 1     | `feature/focus-coach`         | AI Focus Coach                   | US-NEW-1.1, 1.2, 1.3 |
| 2     | `feature/weekly-trends`       | Weekly Trends & AI Insights      | US-NEW-2.1, 2.2      |
| 3     | `feature/project-tags`        | Smart Project Tagging            | US-NEW-3.1, 3.2      |
| 4     | `feature/gamification`        | Gamification & Achievement Rings | US-NEW-6.1, 6.2      |
| 5     | `feature/voice-timesheet`     | Voice-to-Timesheet               | US-NEW-4.1           |
| 6     | `feature/predictive-schedule` | Predictive Scheduling            | US-NEW-5.1           |
