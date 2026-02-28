<p align="center">
  <img src="docs/assets/logo-placeholder.png" alt="IntelliWork Logo" width="120" />
</p>

<h1 align="center">IntelliWork</h1>

<p align="center">
  <strong>AI-Powered Work Intelligence Assistant</strong><br/>
  Automate timesheets. Amplify productivity. Respect privacy.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#privacy">Privacy</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## 🎯 What is IntelliWork?

**IntelliWork** is a cross-platform desktop application (macOS, Windows, Linux) that runs silently in the background and uses AI to automatically track, classify, and summarize your daily work activities — generating structured, timesheet-ready productivity reports at the end of each day.

> **The Problem:** Employees spend 10–20 minutes daily manually updating timesheets. Reports are inaccurate, meetings get missed, and context switching causes memory gaps.
>
> **The Solution:** IntelliWork reduces manual timesheet effort by **80%** while improving reporting accuracy by **15–20%** — saving **6+ hours per employee per month**.

### Why IntelliWork?

| Pain Point                         | IntelliWork Solution                         |
| ---------------------------------- | -------------------------------------------- |
| Manual timesheets waste 20 min/day | Auto-generated summaries in 2 min            |
| Missed meeting logs                | Automatic meeting detection & classification |
| Inaccurate billing reports         | AI-verified activity categorization          |
| No productivity insights           | Category-level time breakdowns               |
| Privacy concerns with trackers     | Local-first, opt-in, zero surveillance       |

---

## ✨ Features

### Core Capabilities

- **🔍 Smart Activity Tracking** — Monitors foreground applications, window titles, and active duration with minimal CPU overhead (<2%)
- **📅 Automatic Meeting Detection** — Detects Microsoft Teams, Zoom, Google Meet calls/meetings with classification (scheduled vs. ad-hoc)
- **🤖 AI-Powered Classification** — Hybrid engine (rule-based + LLM) categorizes activities into: Development, Research, Communication, Meetings, Administration, Documentation, Design
- **📊 End-of-Day Summaries** — Structured timesheet reports generated automatically with editable AI summaries
- **⏰ Office Hours Control** — Configurable tracking window with automatic enable/disable
- **🔐 Privacy-First Architecture** — All data encrypted locally, no central server, full user control

### User Controls

- **Toggle Tracking** — One-click enable/disable from system tray
- **Office Hours** — Define custom tracking windows (e.g., 9:00 AM – 6:00 PM)
- **Export Timesheets** — CSV and PDF export for timesheet submission
- **Edit Summaries** — Manually refine AI-generated activity descriptions
- **Delete Data** — Full control over stored activity logs
- **Consent Dashboard** — Transparent view of all tracked data categories

---

## 🏗 Architecture

IntelliWork follows a **layered local-first architecture** with four core components:

```
┌─────────────────────────────────────────────────┐
│              System Tray / Dashboard UI          │
│          (React + TypeScript + Vanilla CSS)       │
├─────────────────────────────────────────────────┤
│                 Tauri Bridge (IPC)                │
├─────────────────────────────────────────────────┤
│              Rust Backend (Tauri Core)            │
│                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │  Activity    │  │   Meeting    │  │  Idle   │ │
│  │  Tracker     │  │  Detector    │  │ Monitor │ │
│  └──────┬──────┘  └──────┬───────┘  └────┬────┘ │
│         │                │                │       │
│         ▼                ▼                ▼       │
│  ┌─────────────────────────────────────────────┐ │
│  │         Platform Abstraction Layer           │ │
│  │   macOS (NSWorkspace/CGWindow/Accessibility) │ │
│  │   Windows (Win32/UI Automation/WMI)          │ │
│  │   Linux (X11/Wayland/D-Bus)                  │ │
│  └──────────────────┬──────────────────────────┘ │
├─────────────────────┼───────────────────────────┤
│  ┌──────────────────▼──────────────────────────┐ │
│  │        AI Processing Engine (Hybrid)         │ │
│  │   Phase 1: Rule-based classification         │ │
│  │   Phase 2: LLM contextual classification     │ │
│  │   Phase 3: End-of-day summarization          │ │
│  └──────────────────┬──────────────────────────┘ │
├─────────────────────┼───────────────────────────┤
│  ┌──────────────────▼──────────────────────────┐ │
│  │     Local Encrypted Storage (SQLite)         │ │
│  │   SQLCipher + OS Keychain / Credential Vault │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

> For detailed architecture documentation, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 🛠 Tech Stack

| Layer                    | Technology                                | Justification                                                           |
| ------------------------ | ----------------------------------------- | ----------------------------------------------------------------------- |
| **Desktop Framework**    | Tauri 2.x                                 | Lightweight (~5MB), Rust performance, native OS integration, secure IPC |
| **Frontend**             | React 18 + TypeScript                     | Component-based UI, strong typing, rich ecosystem                       |
| **Backend**              | Rust (Tauri Core)                         | Zero-cost abstractions, memory safety, native OS API access             |
| **Styling**              | Vanilla CSS                               | Maximum control, no framework dependencies, dark mode support           |
| **Database**             | SQLite + SQLCipher                        | Local-first, encrypted at rest, zero configuration                      |
| **AI — Classification**  | Rule-based engine (local)                 | Fast, offline-capable, zero latency for known patterns                  |
| **AI — Summarization**   | OpenAI GPT / Google Gemini                | Superior natural language summarization quality                         |
| **AI — Fallback**        | Ollama (local LLM)                        | Fully offline mode, privacy-maximum option                              |
| **Calendar Integration** | Microsoft Graph API / Google Calendar API | Official APIs for meeting metadata enrichment                           |
| **Build & Package**      | Tauri bundler                             | Native installers: DMG (macOS), MSI/EXE (Windows), AppImage/deb (Linux) |
| **Testing**              | Vitest + Playwright + cargo test          | Unit (Rust/TS), Integration, E2E testing                                |
| **CI/CD**                | GitHub Actions                            | Cross-platform builds, automated testing, release management            |

---

## 🚀 Quick Start

### Prerequisites

| Tool        | Version | Installation                                                      |
| ----------- | ------- | ----------------------------------------------------------------- |
| **Node.js** | ≥ 18.x  | [nodejs.org](https://nodejs.org)                                  |
| **Rust**    | ≥ 1.70  | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| **pnpm**    | ≥ 8.x   | `npm install -g pnpm`                                             |

### Platform-Specific Requirements

<details>
<summary><strong>🍎 macOS</strong></summary>

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Grant required permissions (prompted on first run):
# - Accessibility (System Preferences → Security & Privacy → Accessibility)
# - Screen Recording (for window title access)
```

</details>

<details>
<summary><strong>🪟 Windows</strong></summary>

```powershell
# Install Visual Studio Build Tools (C++ workload)
winget install Microsoft.VisualStudio.2022.BuildTools

# Install WebView2 Runtime (usually pre-installed on Windows 10/11)
winget install Microsoft.EdgeWebView2Runtime
```

</details>

<details>
<summary><strong>🐧 Linux</strong></summary>

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libssl-dev libayatana-appindicator3-dev librsvg2-dev

# Fedora
sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget file \
  libappindicator-gtk3-devel librsvg2-devel
```

</details>

### Installation & Running

```bash
# Clone the repository
git clone https://github.com/your-org/intelliwork.git
cd intelliwork

# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

### Configuration

On first launch, IntelliWork will prompt you to:

1. **Accept the privacy agreement** — transparent disclosure of tracked data
2. **Set office hours** — define your working hours (default: 9:00 AM – 6:00 PM)
3. **Configure AI provider** — choose between cloud AI (OpenAI/Gemini) or local AI (Ollama)
4. **Grant OS permissions** — guided setup for accessibility/screen recording permissions

---

## 📁 Project Structure

```
now-you-see-me/
├── README.md                    # This file
├── ARCHITECTURE.md              # System architecture deep-dive
├── SECURITY.md                  # Privacy & compliance framework
├── CONTRIBUTING.md              # Developer contribution guide
├── LICENSE                      # MIT License
├── .gitignore                   # Git ignore rules
│
├── docs/                        # Extended documentation
│   ├── USER_STORIES.md          # Epics → Features → User Stories
│   ├── TESTING_STRATEGY.md      # Testing pyramid & plans
│   ├── PRODUCTION_READINESS.md  # Monitoring, DR, support
│   ├── DEPLOYMENT.md            # Build & deployment guide
│   ├── API_REFERENCE.md         # Internal API documentation
│   ├── PROJECT_PLAN.md          # Roadmap, milestones, risks
│   └── assets/                  # Images, diagrams
│
├── src-tauri/                   # Rust backend (Tauri)
│   ├── Cargo.toml
│   ├── src/
│   │   ├── main.rs              # Entry point
│   │   ├── tray.rs              # System tray management
│   │   ├── commands.rs          # IPC command handlers
│   │   ├── platform/            # OS-specific implementations
│   │   │   ├── mod.rs
│   │   │   ├── macos.rs
│   │   │   ├── windows.rs
│   │   │   └── linux.rs
│   │   ├── tracker/             # Activity tracking engine
│   │   │   ├── mod.rs
│   │   │   ├── activity.rs
│   │   │   ├── meeting.rs
│   │   │   └── idle.rs
│   │   ├── ai/                  # AI processing engine
│   │   │   ├── mod.rs
│   │   │   ├── classifier.rs    # Rule-based classifier
│   │   │   ├── llm.rs           # LLM integration
│   │   │   └── summarizer.rs    # Summary generator
│   │   └── storage/             # Data persistence
│   │       ├── mod.rs
│   │       ├── database.rs
│   │       ├── encryption.rs
│   │       └── models.rs
│   └── tauri.conf.json
│
├── src/                         # React frontend
│   ├── index.html
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── DailySummary.tsx
│   │   ├── TrackingToggle.tsx
│   │   ├── OfficeHoursConfig.tsx
│   │   ├── ActivityTimeline.tsx
│   │   ├── ExportPanel.tsx
│   │   └── ConsentScreen.tsx
│   ├── hooks/
│   │   ├── useTracking.ts
│   │   ├── useActivities.ts
│   │   └── useAISummary.ts
│   ├── styles/
│   │   ├── globals.css
│   │   ├── dashboard.css
│   │   └── components.css
│   └── lib/
│       ├── tauri-bridge.ts
│       ├── constants.ts
│       └── types.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .github/
    └── workflows/
        ├── ci.yml
        └── release.yml
```

---

## 📖 Documentation

| Document                                                     | Description                                             |
| ------------------------------------------------------------ | ------------------------------------------------------- |
| [ARCHITECTURE.md](ARCHITECTURE.md)                           | System architecture, component interactions, data flows |
| [SECURITY.md](SECURITY.md)                                   | Privacy framework, encryption, compliance               |
| [CONTRIBUTING.md](CONTRIBUTING.md)                           | Development setup, coding standards, PR process         |
| [docs/USER_STORIES.md](docs/USER_STORIES.md)                 | Epics, features, user stories with acceptance criteria  |
| [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)         | Testing pyramid, test plans, automation strategy        |
| [docs/PRODUCTION_READINESS.md](docs/PRODUCTION_READINESS.md) | Monitoring, incident management, DR plan                |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)                     | Build, sign, package, and distribute for all platforms  |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md)               | IPC channels, AI engine API, storage layer API          |
| [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md)                 | Agile roadmap, milestones, team structure, risks        |

---

## 🔐 Privacy

IntelliWork is built with a **privacy-first, zero-surveillance** philosophy:

- ✅ **Opt-in only** — tracking never starts without explicit consent
- ✅ **Local-first** — all data stored encrypted on your machine (SQLCipher + AES-256)
- ✅ **No keystroke logging** — only foreground app name and window title
- ✅ **No screenshots** — zero screen capture functionality
- ✅ **No central server** — your data never leaves your device (unless you choose cloud AI)
- ✅ **Full deletion** — delete any or all activity logs at any time
- ✅ **Office hours only** — automatic tracking restriction to defined work hours
- ✅ **Transparent indicator** — always-visible system tray icon shows tracking status

> **Your data. Your device. Your control.**

For full details, see [SECURITY.md](SECURITY.md).

---

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development environment setup
- Coding standards & conventions
- Git branching strategy
- Pull request process

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🏆 Acknowledgements

Built for the **ConcertIDC AI Idea-thon 2026** — showcasing AI-first innovation for enterprise productivity.

---

<p align="center">
  <strong>IntelliWork</strong> — Stop filling timesheets. Start doing real work.
</p>
