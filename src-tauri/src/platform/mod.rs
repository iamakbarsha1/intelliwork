#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(unused_variables)]
// Platform abstraction layer for IntelliWork.
//
// This module defines traits for OS-specific operations and provides
// implementations for macOS, Windows, and Linux.
// Only macOS is fully implemented; others are stubs.

pub mod errors;
#[cfg(target_os = "macos")]
pub mod macos;
#[cfg(target_os = "windows")]
pub mod windows;
#[cfg(target_os = "linux")]
pub mod linux;

pub use errors::PlatformError;

use serde::{Deserialize, Serialize};

/// Information about the currently foreground application.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppInfo {
    /// Application name (e.g., "Visual Studio Code")
    pub app_name: String,
    /// Current window title (may be empty)
    pub window_title: Option<String>,
    /// Application bundle identifier (macOS: e.g., "com.microsoft.VSCode")
    pub bundle_id: Option<String>,
    /// Whether the app is considered a meeting application
    pub is_meeting_app: bool,
    /// The active browser URL if the app is a browser
    pub browser_url: Option<String>,
}

impl AppInfo {
    /// Create a new AppInfo with just an app name.
    pub fn new(app_name: &str) -> Self {
        Self {
            app_name: app_name.to_string(),
            window_title: None,
            bundle_id: None,
            is_meeting_app: false,
            browser_url: None,
        }
    }
}

/// Accessibility / screen recording permission status.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum PermissionStatus {
    /// Permission is granted
    Granted,
    /// Permission has not been requested yet
    NotDetermined,
    /// Permission was denied by the user
    Denied,
    /// Cannot determine (unsupported platform)
    Unsupported,
}

/// Trait for platform-specific tracking operations.
///
/// Each OS provides its own implementation. Tests can use a mock.
pub trait PlatformTracker: Send + Sync {
    /// Get the currently foreground (frontmost) application.
    fn get_foreground_app(&self) -> Result<AppInfo, PlatformError>;

    /// Get seconds since the user last interacted (mouse/keyboard).
    fn get_idle_seconds(&self) -> Result<f64, PlatformError>;

    /// Check whether accessibility/screen recording permissions are granted.
    fn check_permissions(&self) -> PermissionStatus;
}

/// Create the appropriate PlatformTracker for the current OS.
pub fn create_platform_tracker() -> Box<dyn PlatformTracker> {
    #[cfg(target_os = "macos")]
    {
        Box::new(macos::MacOSTracker::new())
    }
    #[cfg(target_os = "windows")]
    {
        Box::new(windows::WindowsTracker::new())
    }
    #[cfg(target_os = "linux")]
    {
        Box::new(linux::LinuxTracker::new())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_info_new() {
        let info = AppInfo::new("VS Code");
        assert_eq!(info.app_name, "VS Code");
        assert!(info.window_title.is_none());
        assert!(info.bundle_id.is_none());
        assert!(!info.is_meeting_app);
    }

    #[test]
    fn test_permission_status_equality() {
        assert_eq!(PermissionStatus::Granted, PermissionStatus::Granted);
        assert_ne!(PermissionStatus::Granted, PermissionStatus::Denied);
    }
}
