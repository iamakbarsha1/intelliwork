# First Launch & Setup Flow

## Overview

The First Launch flow orchestrates the onboarding experience for a new IntelliWork user. Since IntelliWork collects sensitive application usage data, explicit user consent and clear local-storage privacy guarantees are paramount prior to tracking activation.

## Architecture

The onboarding flow intercepts the main React component (`App.tsx`) lifecycle if the configuration value `onboarding_completed` is missing or false.

1. **Gatekeeping**: `App.tsx` conditionally routes the app to the `ConsentScreen` on startup.
2. **Consent Screen**: A tailored view highlighting:
   - **Local Storage Only**: Raw tracking data never leaves the device.
   - **AI Anonymization**: Window titles are stripped before hitting LLMs.
   - **Permissions**: Explains macOS/Windows OS-level requirements (Screen Recording / Accessibility).
3. **Setup Wizard**: Guides the user through initial application state configuration, particularly Office Hours auto-tracking.
4. **Completion**: Persists `"onboarding_completed": "true"` to the local SQLite configurations table, unblocking the Dashboard.

## Core Components

- `ConsentScreen.tsx`: Requires explicit user checkbox interaction before enabling the "Continue" CTA. Handles the `onDecline` path by issuing a native command to exit the process.
- `SetupWizard.tsx`: A multi-step flow mapping user settings securely into local config (`onUpdateConfig` hook mapping to the setup IPC bridge).
- `consent.css`: Specialized styling for the overlay, stepped dots progress bar, and card-based prompts ensuring high-contrast readability.
