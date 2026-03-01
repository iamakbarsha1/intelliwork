# Export & Polish Module

## Overview

The Export module facilitates data portability for timesheets and billing directly from the IntelliWork dashboard.

## Architecture

1. **CSV Export**: `export_csv` command in `src-tauri/src/commands.rs`. Uses the `csv` crate to stream activity records efficiently, taking advantage of the robust Database query layer. Triggered via `@tauri-apps/plugin-dialog` to show native "Save As" prompts safely from the frontend.
2. **PDF/Print Export**: Takes advantage of web standards by hooking into `window.print()` — allowing the OS's native print spooler to handle PDF generation of the tracked activities dashboard and summary.

## UI Polish

1. **Micro-animations**: Staggered fade-ins (`animate-fade-in`), pulse effects (`animate-pulse`), and sliding transitions make the app feel alive and maintain spatial context during data state changes.
2. **Dark Mode Ecosystem**: Configured entirely via CSS Custom Properties matching system preferences (`prefers-color-scheme`), with an explicit toggle syncing across the webview.
3. **Summary Editing**: Inline React Markdown editor allowing human-in-the-loop intervention over AI-generated timesheet summaries. State flows securely back to the SQLite layer via the `upsert_summary` Tauri Command.
4. **Data Management**: Deep UX consideration applied via `window.confirm` dialogues and `onDelete` hook pipelines allowing activity deletion — critical for privacy if a user inadvertently tracks a personal application during office hours.
