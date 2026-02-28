# IntelliWork — Deployment Guide

> Build, sign, package, and distribute IntelliWork for macOS, Windows, and Linux.

---

## Table of Contents

- [1. Build Prerequisites](#1-build-prerequisites)
- [2. Development Builds](#2-development-builds)
- [3. Production Builds](#3-production-builds)
- [4. macOS Deployment](#4-macos-deployment)
- [5. Windows Deployment](#5-windows-deployment)
- [6. Linux Deployment](#6-linux-deployment)
- [7. CI/CD Pipeline](#7-cicd-pipeline)
- [8. Auto-Update Configuration](#8-auto-update-configuration)
- [9. Environment Management](#9-environment-management)

---

## 1. Build Prerequisites

### All Platforms

```bash
# Node.js ≥ 18
node --version

# pnpm ≥ 8
pnpm --version

# Rust ≥ 1.70
rustc --version
cargo --version

# Tauri CLI
cargo install tauri-cli
```

### macOS Additional

```bash
# Xcode Command Line Tools
xcode-select --install

# For code signing: Apple Developer account
# For notarization: Apple Developer ID certificate
```

### Windows Additional

```powershell
# Visual Studio Build Tools with C++ workload
winget install Microsoft.VisualStudio.2022.BuildTools

# For code signing: Code signing certificate (.pfx)
# For MSI packaging: WiX Toolset (bundled by Tauri)
```

### Linux Additional

```bash
# Ubuntu/Debian
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libssl-dev libayatana-appindicator3-dev librsvg2-dev pkg-config

# For AppImage: appimage-builder
# For .deb: dpkg-deb (pre-installed on Debian)
# For .rpm: rpmbuild
```

---

## 2. Development Builds

```bash
# Install dependencies
pnpm install

# Start development server with hot reload
pnpm tauri dev

# Development features:
# - React hot module replacement (HMR)
# - Rust recompilation on save
# - DevTools enabled
# - Debug logging enabled
# - No code signing required
```

### Environment Variables (Development)

```env
# .env.development
VITE_AI_PROVIDER=openai
VITE_AI_API_URL=https://api.openai.com/v1
VITE_LOG_LEVEL=debug
VITE_ENABLE_DEVTOOLS=true
```

---

## 3. Production Builds

```bash
# Build for current platform
pnpm tauri build

# Build output locations:
# macOS:   src-tauri/target/release/bundle/dmg/
# Windows: src-tauri/target/release/bundle/msi/
# Linux:   src-tauri/target/release/bundle/deb/
#          src-tauri/target/release/bundle/appimage/
```

### Environment Variables (Production)

```env
# .env.production
VITE_AI_PROVIDER=openai
VITE_AI_API_URL=https://api.openai.com/v1
VITE_LOG_LEVEL=info
VITE_ENABLE_DEVTOOLS=false
```

---

## 4. macOS Deployment

### 4.1 Code Signing

**Requirement:** Apple Developer ID Application certificate

```bash
# List available signing identities
security find-identity -v -p codesigning

# Tauri signs automatically when configured in tauri.conf.json:
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)",
      "entitlements": "entitlements.plist"
    }
  }
}
```

### 4.2 Entitlements

```xml
<!-- entitlements.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "...">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <false/>
    <key>com.apple.security.automation.apple-events</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
</dict>
</plist>
```

### 4.3 Notarization

```bash
# Notarize the DMG (automated via Tauri when configured)
# Required environment variables:
export APPLE_ID="your@email.com"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="YOUR_TEAM_ID"

# Build + sign + notarize
pnpm tauri build
```

### 4.4 DMG Output

```
src-tauri/target/release/bundle/dmg/
└── IntelliWork_1.0.0_aarch64.dmg    # Apple Silicon
└── IntelliWork_1.0.0_x64.dmg        # Intel
```

### 4.5 macOS Permissions Guide (for Users)

On first launch, IntelliWork will request:

1. **Accessibility Permission**
   - System Preferences → Privacy & Security → Accessibility → Add IntelliWork
2. **Screen Recording Permission** (for window titles)
   - System Preferences → Privacy & Security → Screen Recording → Add IntelliWork
3. **Network Access** (for AI API calls)
   - Allow when prompted by macOS firewall

---

## 5. Windows Deployment

### 5.1 Code Signing

**Requirement:** Code signing certificate (EV or OV)

```json
// tauri.conf.json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "YOUR_CERT_THUMBPRINT",
      "digestAlgorithm": "sha256"
    }
  }
}
```

```powershell
# Or via environment variable:
$env:TAURI_SIGNING_PRIVATE_KEY = "path/to/certificate.pfx"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "certificate-password"
```

### 5.2 MSI / EXE Output

```
src-tauri/target/release/bundle/
├── msi/
│   └── IntelliWork_1.0.0_x64.msi     # MSI installer
└── nsis/
    └── IntelliWork_1.0.0_x64-setup.exe  # NSIS installer
```

### 5.3 Windows-Specific Configuration

```json
// tauri.conf.json — Windows section
{
  "bundle": {
    "windows": {
      "wix": {
        "language": "en-US"
      },
      "nsis": {
        "installMode": "currentUser",
        "displayLanguageSelector": false
      }
    }
  }
}
```

### 5.4 Startup Registration (Optional)

IntelliWork can optionally register to start with Windows:

```
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
  IntelliWork = "C:\Users\<user>\AppData\Local\IntelliWork\IntelliWork.exe" --minimized
```

---

## 6. Linux Deployment

### 6.1 Supported Formats

| Format      | Distribution         | Tool           |
| ----------- | -------------------- | -------------- |
| `.deb`      | Ubuntu, Debian, Mint | dpkg / apt     |
| `.rpm`      | Fedora, CentOS, RHEL | rpm / dnf      |
| `.AppImage` | Universal            | Self-contained |

### 6.2 Build Output

```
src-tauri/target/release/bundle/
├── deb/
│   └── intelliwork_1.0.0_amd64.deb
├── rpm/
│   └── intelliwork-1.0.0-1.x86_64.rpm
└── appimage/
    └── IntelliWork_1.0.0_amd64.AppImage
```

### 6.3 Desktop Integration

```ini
# intelliwork.desktop (auto-generated by Tauri)
[Desktop Entry]
Name=IntelliWork
Comment=AI-Powered Work Intelligence Assistant
Exec=intelliwork %u
Icon=intelliwork
Terminal=false
Type=Application
Categories=Utility;Office;
StartupNotify=true
```

### 6.4 Autostart (Optional)

```bash
# Copy desktop file to autostart directory
cp /usr/share/applications/intelliwork.desktop \
   ~/.config/autostart/intelliwork.desktop
```

---

## 7. CI/CD Pipeline

### 7.1 GitHub Actions — Build & Release

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags:
      - "v*"

jobs:
  release:
    strategy:
      matrix:
        include:
          - os: macos-latest
            target: aarch64-apple-darwin
            label: macOS-ARM64
          - os: macos-latest
            target: x86_64-apple-darwin
            label: macOS-x64
          - os: windows-latest
            target: x86_64-pc-windows-msvc
            label: Windows-x64
          - os: ubuntu-latest
            target: x86_64-unknown-linux-gnu
            label: Linux-x64

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Install Linux dependencies
        if: runner.os == 'Linux'
        run: |
          sudo apt update
          sudo apt install -y libwebkit2gtk-4.1-dev libayatana-appindicator3-dev

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # macOS signing
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          # Windows signing
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.WINDOWS_CERTIFICATE }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }}
        with:
          tagName: v__VERSION__
          releaseName: "IntelliWork v__VERSION__"
          releaseBody: "See CHANGELOG.md for details."
          releaseDraft: true
```

### 7.2 CI Pipeline (Every Push/PR)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  check:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test:unit
      - run: cd src-tauri && cargo test
      - run: cd src-tauri && cargo clippy -- -D warnings
```

---

## 8. Auto-Update Configuration

### 8.1 Tauri Updater Config

```json
// tauri.conf.json
{
  "plugins": {
    "updater": {
      "active": true,
      "dialog": true,
      "endpoints": [
        "https://github.com/your-org/intelliwork/releases/latest/download/latest.json"
      ],
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

### 8.2 Update Manifest

```json
// latest.json (hosted on GitHub Releases)
{
  "version": "1.1.0",
  "notes": "Bug fixes and performance improvements",
  "pub_date": "2026-04-15T00:00:00Z",
  "platforms": {
    "darwin-aarch64": {
      "signature": "...",
      "url": "https://github.com/.../IntelliWork_1.1.0_aarch64.dmg.tar.gz"
    },
    "darwin-x86_64": {
      "signature": "...",
      "url": "https://github.com/.../IntelliWork_1.1.0_x64.dmg.tar.gz"
    },
    "windows-x86_64": {
      "signature": "...",
      "url": "https://github.com/.../IntelliWork_1.1.0_x64.msi.zip"
    },
    "linux-x86_64": {
      "signature": "...",
      "url": "https://github.com/.../IntelliWork_1.1.0_amd64.AppImage.tar.gz"
    }
  }
}
```

---

## 9. Environment Management

### 9.1 Environment Matrix

| Environment     | Purpose             | AI Provider       | Logging | Auto-Update    |
| --------------- | ------------------- | ----------------- | ------- | -------------- |
| **Development** | Local dev           | Mock/Ollama       | Debug   | Disabled       |
| **Staging**     | Pre-release testing | OpenAI (test key) | Debug   | Test channel   |
| **Production**  | End users           | OpenAI/Gemini     | Info    | Stable channel |

### 9.2 Configuration Hierarchy

```
Priority (highest → lowest):
1. CLI arguments        (--log-level=debug)
2. Environment variables (INTELLIWORK_LOG_LEVEL=debug)
3. User config file     (~/.intelliwork/config.json)
4. Built-in defaults    (defined in constants.rs)
```

### 9.3 Feature Flags

| Flag                   | Default (Dev) | Default (Prod) | Description               |
| ---------------------- | ------------- | -------------- | ------------------------- |
| `ENABLE_DEVTOOLS`      | true          | false          | React DevTools            |
| `ENABLE_TELEMETRY`     | false         | false (opt-in) | Anonymous usage analytics |
| `ENABLE_LOCAL_AI`      | true          | true           | Ollama local AI option    |
| `ENABLE_CLOUD_AI`      | true          | true           | OpenAI/Gemini option      |
| `ENABLE_CALENDAR_SYNC` | false         | false (opt-in) | Calendar integration      |
