# IntelliWork — Project Plan

> Delivery methodology, roadmap, team structure, risk assessment, and success criteria.

---

## Table of Contents

- [1. Delivery Methodology](#1-delivery-methodology)
- [2. Roadmap & Milestones](#2-roadmap--milestones)
- [3. Team Structure](#3-team-structure)
- [4. Risk Assessment](#4-risk-assessment)
- [5. Success Criteria & KPIs](#5-success-criteria--kpis)
- [6. Communication Plan](#6-communication-plan)

---

## 1. Delivery Methodology

### Approach: Kanban with Timeboxed Sprints

**Why Kanban over Scrum?**

| Factor              | Kanban (Chosen)                       | Scrum                           |
| ------------------- | ------------------------------------- | ------------------------------- |
| Team Size           | Solo developer (Idea-thon)            | 5–9 team members                |
| Planning Overhead   | Minimal                               | Sprint planning, retrospectives |
| Flexibility         | Continuous flow, reprioritize anytime | Fixed sprint scope              |
| Progress Visibility | WIP limits + column flow              | Burndown charts                 |
| Deadline-driven     | Yes — April 10 deadline               | Sprint-based cadence            |

**Kanban Board Columns:**

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ Backlog  │  To Do   │ In Prog  │ Testing  │   Done   │
│          │ (≤5)     │ (≤2)     │ (≤2)     │          │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ All      │ Next up  │ Active   │ QA +     │ Complete │
│ stories  │ items    │ dev work │ review   │ & tested │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

**WIP Limits:**

- **To Do:** ≤ 5 items
- **In Progress:** ≤ 2 items
- **Testing:** ≤ 2 items

---

## 2. Roadmap & Milestones

### Timeline: March 10 → April 10, 2026 (5 Weeks)

```
Week 1 (Mar 10-16)     Week 2 (Mar 17-23)     Week 3 (Mar 24-30)     Week 4 (Mar 31-Apr 6)    Week 5 (Apr 7-10)
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────┐
│  🏗 Foundation    │   │  📡 Tracking     │   │  🤖 AI Engine    │   │  🎨 Dashboard    │   │  🚀 Polish   │
│                  │   │                  │   │                  │   │                  │   │              │
│ • Project setup  │   │ • Meeting detect │   │ • Rule classifier│   │ • Dashboard UI   │   │ • Bug fixes  │
│ • Tauri scaffold │   │ • Idle detection │   │ • LLM integration│   │ • Export CSV/PDF │   │ • Demo prep  │
│ • SQLite + enc.  │   │ • Office hours   │   │ • Summary gen.   │   │ • Consent screen │   │ • Slides     │
│ • Basic tracker  │   │ • System tray    │   │ • Hybrid AI pipe │   │ • Privacy ctrls  │   │ • Recording  │
│ • Platform layer │   │ • Privacy checks │   │ • Prompt engine  │   │ • Dark mode      │   │ • Submission │
└──────────────────┘   └──────────────────┘   └──────────────────┘   └──────────────────┘   └──────────────┘
         │                      │                      │                      │                     │
         ▼                      ▼                      ▼                      ▼                     ▼
    M1: Tracks apps        M2: Full tracking      M3: AI classifies     M4: Full UI +         M5: SUBMITTED
    + stores data          with meetings          & summarizes          export working         ✅ Demo ready
```

### Milestone Details

| Milestone             | Date   | Deliverables                                                 | Exit Criteria                            |
| --------------------- | ------ | ------------------------------------------------------------ | ---------------------------------------- |
| **M1: Foundation**    | Mar 16 | Tauri app tracks foreground apps, stores in encrypted SQLite | App detects & logs app switches          |
| **M2: Full Tracking** | Mar 23 | Meeting detection, idle detection, office hours, system tray | Meetings auto-detected, idle excluded    |
| **M3: AI Engine**     | Mar 30 | Rule-based + LLM classification, end-of-day summaries        | Activities classified, summary generated |
| **M4: Dashboard**     | Apr 6  | Full UI, export, consent screen, privacy controls            | End-to-end user flow works               |
| **M5: Submission**    | Apr 10 | Polished build, demo video, slides, code review report       | Submitted to Idea-thon                   |

---

## 3. Team Structure

### Idea-thon: Solo Developer

Since this is an individual competition, one person fills all roles:

| Role                   | Responsibilities                                            |
| ---------------------- | ----------------------------------------------------------- |
| **Solution Architect** | Architecture decisions, tech stack, privacy framework       |
| **Backend Developer**  | Rust/Tauri backend, platform APIs, database, AI integration |
| **Frontend Developer** | React dashboard, CSS styling, user controls                 |
| **QA Engineer**        | Testing strategy, unit tests, E2E tests                     |
| **DevOps**             | CI/CD pipeline, build & packaging, code signing             |
| **Product Owner**      | Feature prioritization, demo preparation                    |

### Post-Competition / Enterprise Team (Future)

| Role                  | Count | Responsibilities                                           |
| --------------------- | ----- | ---------------------------------------------------------- |
| Engineering Manager   | 1     | Project leadership, sprint management                      |
| Senior Rust Developer | 1     | Core backend, platform layer, performance                  |
| Full-Stack Developer  | 2     | React UI, IPC integration, API connections                 |
| AI/ML Engineer        | 1     | Classification models, prompt engineering, LLM integration |
| QA Engineer           | 1     | Testing automation, E2E tests, performance tests           |
| DevOps Engineer       | 0.5   | CI/CD, build pipelines, code signing                       |
| UX Designer           | 0.5   | Dashboard design, consent flows, onboarding                |
| **Total**             | **7** |                                                            |

---

## 4. Risk Assessment

### Risk Matrix

```
Impact ▲
  5    │                                    ● OS Permission
  4    │              ● AI Quality          Denial
  3    │  ● Calendar  ● Meeting             ● Privacy
  2    │    API Limit   Detection            Concerns
  1    │                         ● CPU
       └────────────────────────────────────▶
       1       2       3       4       5
                              Likelihood
```

### Detailed Risk Register

| #   | Risk                                                                        | Likelihood | Impact | Score | Mitigation                                                            | Contingency                                                                |
| --- | --------------------------------------------------------------------------- | ---------- | ------ | ----- | --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| R1  | **macOS permission denial** — User refuses Accessibility/Screen Recording   | 3          | 5      | 15    | Guided onboarding with clear explanation                              | Graceful degradation: track app names only (no window titles)              |
| R2  | **AI misclassification** — LLM returns wrong categories                     | 4          | 4      | 16    | Rule-based pre-filter handles 70% of cases; user can edit             | Confidence thresholds; flag low-confidence items for user review           |
| R3  | **Meeting detection accuracy** — Can't extract meeting title from Teams     | 3          | 3      | 9     | Window title parsing + calendar enrichment                            | Log as "Communication" with app name if title extraction fails             |
| R4  | **High CPU usage** — Tracking impacts system performance                    | 2          | 4      | 8     | 5-second polling, event-driven architecture, batched writes           | Dynamic polling interval (increase when CPU > 3%)                          |
| R5  | **Privacy concerns from judges** — Perceived as surveillance tool           | 3          | 5      | 15    | Position as "personal productivity assistant", privacy-first branding | Demo emphasis on consent flow, data transparency, deletion controls        |
| R6  | **Calendar API rate limits** — Microsoft Graph / Google Calendar throttling | 3          | 2      | 6     | Cache calendar events locally, sync every 15 minutes                  | Calendar integration is optional; core features work without it            |
| R7  | **Cross-platform inconsistency** — Different behavior on different OS       | 3          | 3      | 9     | Platform abstraction layer + platform-specific tests in CI            | Prioritize macOS (demo platform); document known Windows/Linux differences |
| R8  | **Scope creep** — Too many features, not enough time                        | 4          | 4      | 16    | MoSCoW prioritization; "Must Have" features only for v1               | Cut "Could Have" features first; deliver polished core over broad features |
| R9  | **LLM API availability** — OpenAI/Gemini API downtime                       | 2          | 3      | 6     | Hybrid approach: rule-based + Ollama as fallback                      | App fully functional with rule-based only; LLM enhances quality            |
| R10 | **Build/signing issues** — Code signing delays release                      | 2          | 3      | 6     | Set up signing early in Week 1                                        | Unsigned dev build for demo; sign for distribution later                   |

### Risk Response Priority

- **P1 (Score ≥ 12):** R1, R2, R5, R8 — Actively mitigated from Day 1
- **P2 (Score 6-11):** R3, R4, R6, R7, R9, R10 — Monitored, mitigation planned
- **P3 (Score < 6):** None currently

---

## 5. Success Criteria & KPIs

### Competition Success Criteria

| Criteria             | Target                     | Measurement                                    |
| -------------------- | -------------------------- | ---------------------------------------------- |
| **Demo readiness**   | Fully functional live demo | Can demonstrate complete user flow in < 5 mins |
| **AI integration**   | Core AI functionality      | Activities classified + summary generated live |
| **Cross-platform**   | Works on macOS + Windows   | Built and tested on both                       |
| **Privacy**          | Consent + controls working | Demo privacy flow end-to-end                   |
| **Production grade** | Not a PoC                  | Encrypted DB, error handling, polished UI      |
| **Code quality**     | AI-assisted code review    | Review report included in submission           |

### Business KPIs (Post-Competition)

| KPI                            | Target               | Measurement                      |
| ------------------------------ | -------------------- | -------------------------------- |
| Timesheet effort reduction     | 80% (20 min → 4 min) | User survey                      |
| Reporting accuracy improvement | 15–20%               | Comparison vs. manual timesheets |
| User adoption rate             | 70% of pilot team    | Active users / total users       |
| System uptime                  | 99.9%                | Application crash rate           |
| User satisfaction              | > 4.0 / 5.0          | NPS survey                       |

---

## 6. Communication Plan

### Idea-thon Phase

| Item               | Frequency                | Channel                            |
| ------------------ | ------------------------ | ---------------------------------- |
| Progress update    | Every 3 days             | Idea-thon organizers (if required) |
| Technical blockers | Immediately              | Mentor / organizer                 |
| Demo rehearsal     | 2 days before submission | Self-recorded                      |

### Post-Competition / Enterprise Phase

| Meeting             | Frequency     | Participants        | Purpose                |
| ------------------- | ------------- | ------------------- | ---------------------- |
| Daily standup       | Daily, 15 min | Dev team            | Status, blockers       |
| Sprint review       | Bi-weekly     | Team + stakeholders | Demo progress          |
| Architecture review | Monthly       | Tech leads          | Architecture decisions |
| Stakeholder update  | Monthly       | Leadership          | Business alignment     |
