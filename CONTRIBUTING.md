# Contributing to IntelliWork

Thank you for your interest in contributing to IntelliWork! This guide will help you set up your development environment and understand our workflows.

---

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Project Architecture](#project-architecture)
- [Coding Standards](#coding-standards)
- [Git Workflow](#git-workflow)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Release Process](#release-process)

---

## Development Environment Setup

### Prerequisites

| Tool        | Version | Purpose                |
| ----------- | ------- | ---------------------- |
| **Node.js** | ≥ 18.x  | Frontend build tooling |
| **pnpm**    | ≥ 8.x   | Package management     |
| **Rust**    | ≥ 1.70  | Tauri backend          |
| **Git**     | ≥ 2.30  | Version control        |

### macOS Setup

```bash
# 1. Install Xcode Command Line Tools
xcode-select --install

# 2. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 3. Install Node.js (via nvm recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# 4. Install pnpm
npm install -g pnpm

# 5. Clone and setup
git clone https://github.com/your-org/intelliwork.git
cd intelliwork
pnpm install

# 6. Run in development
pnpm tauri dev
```

### Windows Setup

```powershell
# 1. Install Visual Studio Build Tools (C++ workload)
winget install Microsoft.VisualStudio.2022.BuildTools

# 2. Install Rust
winget install Rustlang.Rust.GNU

# 3. Install Node.js
winget install OpenJS.NodeJS.LTS

# 4. Install pnpm
npm install -g pnpm

# 5. Install WebView2 (usually pre-installed on Win 10/11)
winget install Microsoft.EdgeWebView2Runtime

# 6. Clone and setup
git clone https://github.com/your-org/intelliwork.git
cd intelliwork
pnpm install

# 7. Run in development
pnpm tauri dev
```

### Linux Setup (Ubuntu/Debian)

```bash
# 1. Install system dependencies
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
  libssl-dev libayatana-appindicator3-dev librsvg2-dev pkg-config

# 2. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 3. Install Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18

# 4. Install pnpm
npm install -g pnpm

# 5. Clone and setup
git clone https://github.com/your-org/intelliwork.git
cd intelliwork
pnpm install

# 6. Run in development
pnpm tauri dev
```

---

## Project Architecture

```
now-you-see-me/
├── src/                 # React frontend (TypeScript)
│   ├── components/      # UI components
│   ├── hooks/           # Custom React hooks
│   ├── styles/          # Vanilla CSS
│   └── lib/             # Utilities & types
├── src-tauri/           # Rust backend (Tauri)
│   └── src/
│       ├── platform/    # OS-specific code
│       ├── tracker/     # Activity tracking engine
│       ├── ai/          # AI processing engine
│       └── storage/     # Database & encryption
├── tests/               # Test suites
└── docs/                # Extended documentation
```

### Key Directories

| Directory                 | Language         | Responsibility                                     |
| ------------------------- | ---------------- | -------------------------------------------------- |
| `src/`                    | TypeScript/React | Dashboard UI, user controls, data display          |
| `src-tauri/src/platform/` | Rust             | OS-specific activity tracking APIs                 |
| `src-tauri/src/tracker/`  | Rust             | Core tracking, meeting detection, idle monitoring  |
| `src-tauri/src/ai/`       | Rust             | Rule-based classifier, LLM integration, summarizer |
| `src-tauri/src/storage/`  | Rust             | SQLite/SQLCipher database operations               |

---

## Coding Standards

### TypeScript / React

- **Style:** Functional components with hooks
- **Formatting:** Prettier (config in `.prettierrc`)
- **Linting:** ESLint with TypeScript rules
- **Naming:**
  - Components: `PascalCase` (e.g., `DailySummary.tsx`)
  - Hooks: `camelCase` with `use` prefix (e.g., `useTracking.ts`)
  - Utilities: `camelCase` (e.g., `formatDuration.ts`)
  - CSS files: `kebab-case` (e.g., `daily-summary.css`)
- **Styling:** Vanilla CSS only — no CSS frameworks
- **State:** React hooks + Tauri IPC — no external state management library

### Rust

- **Formatting:** `rustfmt` (default configuration)
- **Linting:** `clippy` with warnings as errors
- **Error Handling:** Use `Result<T, E>` and `thiserror` — no `unwrap()` in production code
- **Naming:**
  - Modules: `snake_case`
  - Types: `PascalCase`
  - Functions: `snake_case`
  - Constants: `SCREAMING_SNAKE_CASE`
- **Documentation:** All public functions must have `///` doc comments
- **Testing:** All modules must have `#[cfg(test)]` test modules

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**

| Type       | Description                         |
| ---------- | ----------------------------------- |
| `feat`     | New feature                         |
| `fix`      | Bug fix                             |
| `docs`     | Documentation only                  |
| `style`    | Code formatting (no logic change)   |
| `refactor` | Code restructuring (no feature/fix) |
| `perf`     | Performance improvement             |
| `test`     | Adding/updating tests               |
| `build`    | Build system or dependencies        |
| `ci`       | CI/CD configuration                 |
| `chore`    | Maintenance tasks                   |

**Examples:**

```
feat(tracker): add idle detection for macOS
fix(ai): handle empty activity list in summarizer
docs(readme): update quick start guide for Linux
test(storage): add encryption key rotation tests
```

---

## Git Workflow

### Branching Strategy (GitFlow)

```
main          ─────────────────────────────────────▶  (production releases)
                 │                    ▲
                 ▼                    │
develop       ──────────────────────────────────────▶  (integration branch)
                 │         │         ▲
                 ▼         ▼         │
feature/*     ──────    ──────    merge
              (work)    (work)
```

| Branch      | Purpose                   | Base      | Merges Into          |
| ----------- | ------------------------- | --------- | -------------------- |
| `main`      | Production releases       | —         | —                    |
| `develop`   | Integration branch        | `main`    | `main` (via release) |
| `feature/*` | New features              | `develop` | `develop`            |
| `bugfix/*`  | Bug fixes                 | `develop` | `develop`            |
| `hotfix/*`  | Critical production fixes | `main`    | `main` + `develop`   |
| `release/*` | Release preparation       | `develop` | `main` + `develop`   |

### Branch Naming

```
feature/INTL-123-add-meeting-detection
bugfix/INTL-456-fix-idle-threshold
hotfix/INTL-789-fix-db-encryption
release/v1.0.0
```

---

## Pull Request Process

### Before Submitting

1. ✅ Code compiles without warnings: `pnpm tauri build`
2. ✅ All tests pass: `pnpm test && cd src-tauri && cargo test`
3. ✅ Linting passes: `pnpm lint && cd src-tauri && cargo clippy`
4. ✅ Formatting is correct: `pnpm format:check && cd src-tauri && cargo fmt --check`
5. ✅ No new `TODO` or `FIXME` without an associated issue
6. ✅ Documentation updated if public API changed

### PR Template

```markdown
## Description

Brief description of the change.

## Type of Change

- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactoring
- [ ] Performance improvement

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed on: [ ] macOS [ ] Windows [ ] Linux

## Screenshots/Recordings

(if UI changes)

## Checklist

- [ ] Code follows project coding standards
- [ ] Self-review completed
- [ ] AI-assisted code review report attached
- [ ] No sensitive data or API keys in code
```

### Review Process

1. All PRs require **at least 1 approval**
2. CI must pass (build + test on all platforms)
3. Reviewer checks: code quality, security, performance, testing
4. Author resolves all review comments before merge
5. Squash merge into `develop`

---

## Testing Requirements

### Test Coverage Targets

| Layer                 | Target          | Framework                         |
| --------------------- | --------------- | --------------------------------- |
| Rust unit tests       | ≥ 80%           | Built-in `#[test]` + `cargo test` |
| TypeScript unit tests | ≥ 80%           | Vitest                            |
| Integration tests     | Critical paths  | cargo test + Vitest               |
| E2E tests             | Core user flows | Playwright                        |

### Running Tests

```bash
# All tests
pnpm test

# Frontend unit tests
pnpm test:unit

# Rust backend tests
cd src-tauri && cargo test

# E2E tests
pnpm test:e2e

# Coverage report
pnpm test:coverage
```

### What Must Be Tested

- ✅ All Tauri IPC commands (unit + integration)
- ✅ Activity classification rules (unit)
- ✅ Database CRUD operations (integration)
- ✅ Encryption/decryption round-trips (unit)
- ✅ Platform abstraction implementations (unit, per-platform)
- ✅ AI prompt construction (unit)
- ✅ UI components render correctly (unit)
- ✅ Core user flows: enable tracking → view summary → export (E2E)

---

## Release Process

### Version Scheme

Follows [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes or major features
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Release Checklist

1. Create `release/vX.Y.Z` branch from `develop`
2. Update version in `package.json` and `Cargo.toml`
3. Update `CHANGELOG.md`
4. Run full test suite on all platforms
5. Create PR to `main`
6. After merge: tag `vX.Y.Z` on `main`
7. GitHub Actions builds and publishes:
   - macOS: `.dmg` (signed + notarized)
   - Windows: `.msi` + `.exe` (signed)
   - Linux: `.AppImage` + `.deb` + `.rpm`
8. Create GitHub Release with changelog and binaries
9. Merge `main` back into `develop`

---

## Questions?

If you have questions about contributing:

1. Check existing [GitHub Issues](https://github.com/your-org/intelliwork/issues)
2. Check the [documentation](docs/)
3. Open a new Discussion on GitHub
