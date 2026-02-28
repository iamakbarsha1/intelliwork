# Platform Layer — IntelliWork

> OS-specific abstraction for foreground app detection, idle time, and permissions.

---

## Architecture

```
src-tauri/src/platform/
├── mod.rs       # PlatformTracker trait, AppInfo, PermissionStatus, factory
├── errors.rs    # PlatformError enum
├── macos.rs     # macOS implementation (NSWorkspace + CoreGraphics)
├── windows.rs   # Windows stub (NotSupported)
└── linux.rs     # Linux stub (NotSupported)
```

### Design Principles

- **Trait-based**: `PlatformTracker` trait enables OS-specific implementations and mocking
- **Conditional compilation**: `#[cfg(target_os = "...")]` ensures only the correct platform compiles
- **Factory function**: `create_platform_tracker()` returns the right impl for the current OS

---

## API Reference

### `PlatformTracker` Trait

| Method                 | Returns            | Description                                         |
| ---------------------- | ------------------ | --------------------------------------------------- |
| `get_foreground_app()` | `Result<AppInfo>`  | Frontmost application name, window title, bundle ID |
| `get_idle_seconds()`   | `Result<f64>`      | Seconds since last user input (mouse/keyboard)      |
| `check_permissions()`  | `PermissionStatus` | Whether required OS permissions are granted         |

### `AppInfo` Struct

| Field            | Type             | Description                                              |
| ---------------- | ---------------- | -------------------------------------------------------- |
| `app_name`       | `String`         | Application display name                                 |
| `window_title`   | `Option<String>` | Current window title (requires Accessibility permission) |
| `bundle_id`      | `Option<String>` | Bundle identifier (macOS only)                           |
| `is_meeting_app` | `bool`           | Whether this is a known meeting app                      |

### Meeting App Detection

Detects by name (case-insensitive): Zoom, Teams, Meet, Webex, Slack, Discord, Skype, FaceTime, GoToMeeting, BlueJeans, RingCentral, Chime.

Also matches by macOS bundle ID for precise detection.

---

## macOS Implementation

| Feature        | API Used                                                                   |
| -------------- | -------------------------------------------------------------------------- |
| Foreground app | `NSWorkspace.sharedWorkspace().frontmostApplication()` via `objc2-app-kit` |
| Window title   | AppleScript via `osascript` (requires Accessibility permission)            |
| Idle time      | `CGEventSourceSecondsSinceLastEventType` via C FFI                         |
| Permissions    | Checks if NSWorkspace APIs are accessible                                  |

### Required Permissions

| Permission    | Why                         | macOS Setting                                |
| ------------- | --------------------------- | -------------------------------------------- |
| Accessibility | Window titles, app tracking | System Preferences → Privacy → Accessibility |

---

## Testing

```bash
cargo test -p intelliwork -- platform
```

**10 tests**: meeting app detection (name, bundle ID, case-insensitive, negative cases), tracker construction, live idle time, permissions check.
