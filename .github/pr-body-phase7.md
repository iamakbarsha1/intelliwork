# Phase 7: System Tray & Integration

## Description

This PR implements Phase 7 of the IntelliWork project, establishing the background persistence layer, system tray integration, and the first-launch user onboarding experience.

### Key Features & Changes:

- **System Tray (`src-tauri/src/tray.rs`)**: Added native system tray with dynamic toggle, dashboard quick-access, and app quit functionality using Tauri core `tray-icon`.
- **Background Persistence**: Intercepted the main window `CloseRequested` event in `lib.rs` to hide the window instead of exiting, allowing the React tracking loop to continue in the background.
- **Tauri Event Emissions (`activity.rs`)**: Instrumented the `ActivityTracker` backend to emit native events (`activity_changed`, `idle_started`, `idle_ended`, `meeting_started`, `meeting_ended`, `tracking_state_changed`) to the frontend for reactive UI capabilities.
- **First Launch Experience**: Created `ConsentScreen.tsx` and `SetupWizard.tsx` to handle privacy consent (explicit opt-in via checkbox) and initial office hours setup.
- **App Integrations**: Rewired `App.tsx` onboarding routing utilizing a local config string `onboarding_completed`.

## Testing & Validation

- **Rust Unit Tests**: `cargo test` ran successfully (85 tests passed), confirming unchanged stability in the `storage`, `tracker`, `platform`, and `ai` modules despite integration wiring.
- **UI Logic Checks**: Manual visual confirmation that the `onboarding_completed` config state guards access to the main Dashboard elements.

## Review Checklist

- [x] Code follows the style guidelines of this project
- [x] I have performed a self-review of my own code
- [x] I have commented my code, particularly in hard-to-understand areas
- [x] I have made corresponding changes to the documentation (`SYSTEM_TRAY.md`, `FIRST_LAUNCH.md`)
- [x] My changes generate no new warnings or lint errors
- [x] New and existing unit tests pass locally with my changes

## Next steps after merge

Merge into `develop`, and proceed to Phase 8: Export & Polish.
