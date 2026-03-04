# System Tray & Integration Module

## Overview

The System Tray module (`src-tauri/src/tray.rs`) provides the background-running OS interactions for IntelliWork, allowing the application to persist when the main window is closed. It leverages Tauri's core `tray-icon` feature to render a native system tray menu.

## Architecture

The system tray implementation is designed around Tauri's `AppHandle` and builder pattern.

1. **Initialization**: Configured in `lib.rs` during Tauri builder setup.
2. **Menu Definition**: Defines custom native menu items (Toggle Tracking, Open Dashboard, Quit).
3. **Event Emitting**: Captures tray events (clicks, menu selections) and dispatches them to the Tauri runtime or emits events to the frontend.
4. **App Persistence**: Intercepts the `CloseRequested` window event in `lib.rs`, preventing the application from exiting. Instead, the main webview window is hidden, allowing the React background JS loop to continue polling the tracker indefinitely.

## Key Features

- **Toggle Tracking**: Enables users to start or pause the activity tracker directly from the tray without opening the main window.
- **Dynamic Tooltips**: Translates the active tracking state into tray tooltips (e.g., "Tracking Active" vs. "Tracking Stopped").
- **Tauri Event Integration**: Working in tandem with `ActivityTracker`, the backend emits `activity_changed`, `meeting_started`, `idle_started`, and `tracking_state_changed` native events to the webview using `AppHandle`, providing a foundation for real-time reactive UI updates and notifications.

## Event System

- **`tracking_state_changed`**: Emitted when tracking gets toggled (e.g., via the tray menu).
- **`activity_changed`**: Emitted when the user transitions to a new application.
- **`idle_started` / `idle_ended`**: Emitted when the OS idle detector crosses the configured idle threshold.
- **`meeting_started` / `meeting_ended`**: Emitted when meeting heuristics detect a user entering or leaving a known conference call app.
