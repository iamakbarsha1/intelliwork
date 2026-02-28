# IntelliWork — Security & Privacy Framework

> This document defines IntelliWork's privacy-first design philosophy, data handling policies, encryption architecture, and compliance posture.

---

## Table of Contents

- [1. Privacy Philosophy](#1-privacy-philosophy)
- [2. Data Collection Policy](#2-data-collection-policy)
- [3. Encryption Architecture](#3-encryption-architecture)
- [4. User Consent Framework](#4-user-consent-framework)
- [5. OS Permissions](#5-os-permissions)
- [6. AI Data Handling](#6-ai-data-handling)
- [7. Data Retention & Deletion](#7-data-retention--deletion)
- [8. OWASP Compliance](#8-owasp-compliance)
- [9. Threat Model](#9-threat-model)
- [10. Security Reporting](#10-security-reporting)

---

## 1. Privacy Philosophy

IntelliWork is **NOT** a surveillance tool. It is a **personal productivity assistant** that the user controls entirely.

### Core Principles

| #   | Principle                | Description                                               |
| --- | ------------------------ | --------------------------------------------------------- |
| 1   | **Opt-In Only**          | Tracking never starts without explicit user consent       |
| 2   | **Local-First**          | All data stored and processed on the user's device        |
| 3   | **Minimal Collection**   | Only collect what's necessary for activity classification |
| 4   | **Transparency**         | User can view all collected data at any time              |
| 5   | **User Ownership**       | User can edit, export, or delete all data                 |
| 6   | **No Surveillance**      | No keystroke logging, no screenshots, no audio recording  |
| 7   | **Office Hours Respect** | Automatic tracking restriction to defined work hours      |
| 8   | **Visible Indicator**    | Always-visible system tray icon shows tracking status     |

### What We DO Collect

| Data                | Purpose                 | Example              |
| ------------------- | ----------------------- | -------------------- |
| Foreground app name | Activity classification | "Visual Studio Code" |
| Window title        | Context classification  | "index.ts — VS Code" |
| Active duration     | Time tracking           | 45 minutes           |
| Idle duration       | Exclude non-work time   | 5 minutes            |

### What We DO NOT Collect

| Data               | Reason                                                 |
| ------------------ | ------------------------------------------------------ |
| ❌ Keystrokes      | Privacy violation — not needed for classification      |
| ❌ Screenshots     | Privacy violation — not needed for classification      |
| ❌ File contents   | Privacy violation — not needed for classification      |
| ❌ Clipboard data  | Privacy violation — not needed for classification      |
| ❌ Audio/video     | Privacy violation — not needed for classification      |
| ❌ Mouse movements | Excessive — only idle/active flag is needed            |
| ❌ Browser history | Privacy violation — only active tab title is tracked   |
| ❌ Email contents  | Privacy violation — only email app presence is tracked |
| ❌ Chat messages   | Privacy violation — only app name is tracked           |

---

## 2. Data Collection Policy

### 2.1 Data Flow

```
User Activity
    │
    ▼
┌─────────────────────────────────┐
│  Is tracking enabled?           │──── No ──▶ STOP
│  Is within office hours?        │──── No ──▶ STOP
│  Has user consented?            │──── No ──▶ STOP
└────────────┬────────────────────┘
             │ Yes (all three)
             ▼
┌─────────────────────────────────┐
│  Collect: app_name,             │
│  window_title, timestamp        │
│  NOTHING ELSE                   │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Encrypt & store locally        │
│  (SQLCipher / AES-256)          │
└─────────────────────────────────┘
```

### 2.2 Data Classification (GDPR-Aligned)

| Data Category | Sensitivity | Handling                                              |
| ------------- | ----------- | ----------------------------------------------------- |
| App name      | Low         | Stored locally, encrypted                             |
| Window title  | Medium      | Stored locally, encrypted, anonymized before cloud AI |
| Timestamps    | Low         | Stored locally, encrypted                             |
| AI summaries  | Medium      | Stored locally, user-editable before export           |
| API keys      | High        | Stored in OS Keychain/Credential Vault, never in DB   |

---

## 3. Encryption Architecture

### 3.1 At-Rest Encryption

All stored data is encrypted using **SQLCipher** with **AES-256-CBC**.

```
┌─────────────────────────────────────────┐
│          Application (Tauri/Rust)        │
│     Reads/writes plaintext via SQLCipher │
├─────────────────────────────────────────┤
│         SQLCipher Engine                 │
│   Algorithm: AES-256-CBC                 │
│   KDF: PBKDF2-HMAC-SHA512               │
│   Iterations: 256,000                    │
│   Page size: 4096 bytes                  │
├─────────────────────────────────────────┤
│         Encryption Key Storage           │
│   macOS: Keychain Services               │
│   Windows: Credential Manager (DPAPI)    │
│   Linux: Secret Service API (GNOME Ring) │
├─────────────────────────────────────────┤
│         File System                      │
│   ~/.intelliwork/data.db (encrypted)     │
└─────────────────────────────────────────┘
```

### 3.2 In-Transit Encryption

| Communication                        | Protocol            |
| ------------------------------------ | ------------------- |
| AI API calls (OpenAI/Gemini)         | TLS 1.3             |
| Calendar API calls (MS Graph/Google) | TLS 1.3 + OAuth 2.0 |
| Auto-update checks                   | TLS 1.3             |

### 3.3 Key Management

| Platform | Key Storage                | Access Control                                 |
| -------- | -------------------------- | ---------------------------------------------- |
| macOS    | Keychain Services          | App-specific access, biometric unlock optional |
| Windows  | Credential Manager (DPAPI) | User-session scoped                            |
| Linux    | Secret Service API         | User-session scoped                            |

**Key Rotation:** Users can trigger re-encryption with a new key via Settings → Security → Rotate Encryption Key.

---

## 4. User Consent Framework

### 4.1 First-Launch Consent Flow

```
┌─────────────────────────────────────────┐
│         Welcome to IntelliWork           │
│                                          │
│  IntelliWork helps you auto-generate     │
│  timesheets by tracking which apps       │
│  you use during work hours.              │
│                                          │
│  What we track:                          │
│  ✓ Foreground app name                   │
│  ✓ Window title                          │
│  ✓ Active/idle time                      │
│                                          │
│  What we NEVER track:                    │
│  ✗ Keystrokes                            │
│  ✗ Screenshots                           │
│  ✗ File contents                         │
│  ✗ Messages or emails                    │
│                                          │
│  All data stays on YOUR device.          │
│                                          │
│  [Read Privacy Policy]                   │
│                                          │
│  ☐ I understand and consent to           │
│    activity tracking as described above   │
│                                          │
│  [Decline]              [Accept & Setup] │
└─────────────────────────────────────────┘
```

### 4.2 Consent Requirements

| Requirement      | Implementation                          |
| ---------------- | --------------------------------------- |
| Informed consent | Clear disclosure before tracking starts |
| Granular control | Toggle tracking on/off at any time      |
| Right to erasure | Delete any/all data from Settings       |
| Right to access  | View all collected data in Dashboard    |
| Right to export  | Export data as CSV/PDF                  |
| Withdrawal       | Disable tracking + delete data          |
| Re-consent       | Prompted on major version updates       |

---

## 5. OS Permissions

### 5.1 macOS

| Permission           | Required For                    | How to Grant                                               |
| -------------------- | ------------------------------- | ---------------------------------------------------------- |
| **Accessibility**    | Detecting foreground app        | System Preferences → Privacy & Security → Accessibility    |
| **Screen Recording** | Reading window titles           | System Preferences → Privacy & Security → Screen Recording |
| **Automation**       | Calendar integration (optional) | System Preferences → Privacy & Security → Automation       |

**Guided Setup:** IntelliWork provides a step-by-step onboarding flow with direct deep-links to System Preferences panes.

**Graceful Degradation:** If Screen Recording permission is denied, IntelliWork still tracks app names (without window titles) and clearly communicates the limitation to the user.

### 5.2 Windows

| Permission             | Required For         | How to Grant                              |
| ---------------------- | -------------------- | ----------------------------------------- |
| **Run at startup**     | Background operation | Enabled via app settings (optional)       |
| **Firewall exception** | Cloud AI API calls   | Automatic or manual Windows Defender rule |

**Note:** Windows Win32 APIs (`GetForegroundWindow`, `GetWindowText`) do not require special permissions by default.

### 5.3 Linux

| Permission             | Required For     | How to Grant                                     |
| ---------------------- | ---------------- | ------------------------------------------------ |
| **X11/Wayland access** | Window detection | Automatic on X11; Wayland requires portal access |
| **D-Bus access**       | App enumeration  | Usually available by default                     |
| **Secret Service**     | Key storage      | Requires GNOME Keyring or KDE Wallet             |

---

## 6. AI Data Handling

### 6.1 Data Anonymization Before Cloud AI

When using cloud AI providers (OpenAI/Gemini), activity data is **anonymized** before transmission:

| Field        | Original                                  | Anonymized                              |
| ------------ | ----------------------------------------- | --------------------------------------- |
| App name     | "Microsoft Teams"                         | "Communication App"                     |
| Window title | "Meeting with John Smith — Client Review" | "Meeting with [PERSON] — Client Review" |
| Window title | "Project Atlas — Sprint Board — Jira"     | "[PROJECT] — Sprint Board — PM Tool"    |

**Anonymization Rules:**

1. Replace person names with `[PERSON]`
2. Replace project names with `[PROJECT]`
3. Replace company names with `[ORGANIZATION]`
4. Replace email addresses with `[EMAIL]`
5. Replace URLs with `[URL]`

### 6.2 Local AI Mode

Users can opt for **fully local AI** using Ollama:

- Zero data leaves the device
- Requires local compute resources
- Slightly lower summarization quality
- Recommended for maximum privacy environments

### 6.3 AI Provider Comparison

| Aspect       | Cloud (OpenAI/Gemini)     | Local (Ollama)                     |
| ------------ | ------------------------- | ---------------------------------- |
| Data privacy | Anonymized before sending | Full privacy — never leaves device |
| Quality      | Highest                   | Good (depends on model)            |
| Speed        | ~2-5 seconds              | ~10-30 seconds                     |
| Cost         | API usage fees            | Free                               |
| Offline      | No                        | Yes                                |
| GPU required | No                        | Recommended                        |

---

## 7. Data Retention & Deletion

### 7.1 Retention Policy

| Data Type           | Default Retention              | Configurable?                 |
| ------------------- | ------------------------------ | ----------------------------- |
| Activity logs       | 90 days                        | Yes (7–365 days or unlimited) |
| Meeting logs        | 90 days                        | Yes                           |
| Daily summaries     | 1 year                         | Yes                           |
| Exported timesheets | Permanent (user's file system) | N/A                           |

### 7.2 Deletion Options

| Action                 | Description                               | Reversible? |
| ---------------------- | ----------------------------------------- | ----------- |
| Delete single activity | Remove one activity log                   | No          |
| Delete day's data      | Remove all logs for a specific date       | No          |
| Delete all data        | Wipe entire database                      | No          |
| Factory reset          | Delete database + configuration + consent | No          |

### 7.3 Automatic Cleanup

A background task runs daily to purge data older than the configured retention period.

---

## 8. OWASP Compliance

### 8.1 OWASP Desktop App Security Checklist

| #   | Control                  | Status | Implementation                  |
| --- | ------------------------ | ------ | ------------------------------- |
| 1   | Secure data storage      | ✅     | SQLCipher AES-256 encryption    |
| 2   | Secure authentication    | ✅     | OS Keychain for secrets         |
| 3   | Input validation         | ✅     | Tauri IPC validation            |
| 4   | Secure communication     | ✅     | TLS 1.3 for all network calls   |
| 5   | Binary protections       | ✅     | Code-signed binaries            |
| 6   | Secure updates           | ✅     | Signed auto-updates via Tauri   |
| 7   | Logging & monitoring     | ✅     | Local-only structured logging   |
| 8   | Error handling           | ✅     | Rust error handling (no panics) |
| 9   | Third-party dependencies | ✅     | Cargo audit + npm audit         |
| 10  | Privacy controls         | ✅     | Full user consent framework     |

### 8.2 OWASP API Security (for Cloud AI calls)

| Control           | Implementation                                  |
| ----------------- | ----------------------------------------------- |
| Authentication    | API key stored in OS Keychain                   |
| Rate limiting     | Client-side rate limiting (max 10 calls/day)    |
| Input validation  | Sanitize data before sending to AI              |
| Data minimization | Only send anonymized activity summaries         |
| Error handling    | Graceful fallback to local rules on API failure |

---

## 9. Threat Model

### 9.1 Identified Threats

| Threat                   | Likelihood | Impact | Mitigation                                     |
| ------------------------ | ---------- | ------ | ---------------------------------------------- |
| Physical device theft    | Medium     | High   | SQLCipher encryption, OS-level disk encryption |
| Malicious app reading DB | Low        | High   | File permissions (600), encrypted DB           |
| API key theft            | Low        | Medium | OS Keychain storage, not in config files       |
| AI provider data leak    | Low        | Medium | Anonymization before sending                   |
| Man-in-the-middle        | Low        | Medium | TLS 1.3 + certificate pinning                  |
| Supply chain attack      | Low        | High   | Dependency auditing (cargo audit, npm audit)   |
| Memory dump              | Very Low   | High   | Rust memory safety, no plaintext key in memory |

### 9.2 Attack Surface

| Surface           | Exposure   | Controls                              |
| ----------------- | ---------- | ------------------------------------- |
| Tauri IPC         | Local only | Command allowlist, input validation   |
| Network (AI APIs) | Internet   | TLS 1.3, anonymization, rate limiting |
| File system (DB)  | Local disk | Encryption, file permissions          |
| Auto-updater      | Internet   | Code signing, signature verification  |

---

## 10. Security Reporting

### Responsible Disclosure

If you discover a security vulnerability in IntelliWork:

1. **DO NOT** open a public GitHub issue
2. **DO** email: security@intelliwork.dev
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
4. We will acknowledge within 48 hours
5. We will provide a fix timeline within 7 days

### Security Updates

- Critical vulnerabilities: Patch within 24 hours
- High vulnerabilities: Patch within 7 days
- Medium/Low: Included in next scheduled release

---

## Appendix A: Privacy Policy Summary (User-Facing)

```
IntelliWork Privacy Policy (Summary)

What we collect:
• Names of applications you use
• Window titles of those applications
• Times you start and stop using each application
• Whether you are active or idle

What we DON'T collect:
• What you type (no keylogging)
• What's on your screen (no screenshots)
• What files you open (no file access)
• Your messages or emails (no content access)
• Your browsing history (only the active tab title)

Where your data goes:
• Stays on YOUR computer
• Encrypted with military-grade AES-256
• If you use cloud AI: anonymized before sending
• Never sold, shared, or transmitted to any third party

Your rights:
• View all collected data anytime
• Delete any or all data anytime
• Export your data anytime
• Disable tracking anytime
• Uninstall and all data is deleted
```
