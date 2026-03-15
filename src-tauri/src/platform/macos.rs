#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(unused_variables)]
// macOS platform tracker implementation.
//
// Uses NSWorkspace (via objc2-app-kit) for foreground app detection
// and CoreGraphics FFI for idle time detection.
// Window title retrieval requires Screen Recording permission.

use super::errors::PlatformError;
use super::{AppInfo, PermissionStatus, PlatformTracker};

// CoreGraphics idle time FFI
extern "C" {
    fn CGEventSourceSecondsSinceLastEventType(
        source_state_id: i32,
        event_type: u64,
    ) -> f64;
}

/// Combined event source state ID
const K_CG_EVENT_SOURCE_STATE_COMBINED_SESSION_STATE: i32 = 0;
/// All input events (mouse + keyboard)
const K_CG_ANY_INPUT_EVENT_TYPE: u64 = u64::MAX;

/// macOS-specific platform tracker.
///
/// Uses NSWorkspace for foreground app detection and
/// CoreGraphics for idle time.
pub struct MacOSTracker;

impl MacOSTracker {
    /// Create a new macOS tracker.
    pub fn new() -> Self {
        Self
    }

    /// Get the frontmost application via NSWorkspace.
    fn get_frontmost_app_info(&self) -> Result<(String, Option<String>), PlatformError> {
        use objc2_app_kit::NSWorkspace;

        let workspace = NSWorkspace::sharedWorkspace();
        let front_app = workspace.frontmostApplication();

        match front_app {
            Some(app) => {
                let name = app
                    .localizedName()
                    .map(|n| n.to_string())
                    .unwrap_or_else(|| "Unknown".to_string());

                let bundle_id = app.bundleIdentifier().map(|b| b.to_string());

                Ok((name, bundle_id))
            }
            None => Err(PlatformError::ApiError(
                "No frontmost application found".to_string(),
            )),
        }
    }

    /// Get the window title of the frontmost window via AppleScript.
    ///
    /// CGWindowListCopyWindowInfo requires Screen Recording permission
    /// and has complex FFI. AppleScript is more reliable for window titles
    /// and requires only Accessibility permission.
    fn get_frontmost_window_title(&self) -> Option<String> {
        let output = std::process::Command::new("osascript")
            .args([
                "-e",
                "try\n\
                    tell application \"System Events\"\n\
                        set frontApp to first application process whose frontmost is true\n\
                        set windowTitle to name of front window of frontApp\n\
                        return windowTitle\n\
                    end tell\n\
                on error\n\
                    return \"\"\n\
                end try",
            ])
            .output();

        match output {
            Ok(out) if out.status.success() => {
                let title = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if title.is_empty() {
                    None
                } else {
                    Some(title)
                }
            }
            _ => None,
        }
    }

    fn get_browser_url(&self, app_name: &str) -> Option<String> {
        let script = match app_name {
            "Google Chrome" => "try\n tell application \"Google Chrome\" to get URL of active tab of front window\n on error\n return \"\"\n end try",
            "Brave Browser" => "try\n tell application \"Brave Browser\" to get URL of active tab of front window\n on error\n return \"\"\n end try",
            "Safari" => "try\n tell application \"Safari\" to get URL of front document\n on error\n return \"\"\n end try",
            "Arc" => "try\n tell application \"Arc\" to get URL of active tab of front window\n on error\n return \"\"\n end try",
            _ => return None,
        };

        let output = std::process::Command::new("osascript")
            .args(["-e", script])
            .output();

        match output {
            Ok(out) if out.status.success() => {
                let url = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if url.is_empty() || url == "missing value" {
                    None
                } else {
                    Some(url)
                }
            }
            _ => None,
        }
    }
}

impl PlatformTracker for MacOSTracker {
    fn get_foreground_app(&self) -> Result<AppInfo, PlatformError> {
        let (app_name, bundle_id) = self.get_frontmost_app_info()?;
        let window_title = self.get_frontmost_window_title();
        let browser_url = self.get_browser_url(&app_name);

        // Check if this is a known meeting app
        let is_meeting_app = is_meeting_application(&app_name, bundle_id.as_deref());

        Ok(AppInfo {
            app_name,
            window_title,
            bundle_id,
            is_meeting_app,
            browser_url,
        })
    }

    fn get_idle_seconds(&self) -> Result<f64, PlatformError> {
        let seconds = unsafe {
            CGEventSourceSecondsSinceLastEventType(
                K_CG_EVENT_SOURCE_STATE_COMBINED_SESSION_STATE,
                K_CG_ANY_INPUT_EVENT_TYPE,
            )
        };

        // Negative values indicate an error
        if seconds < 0.0 {
            return Err(PlatformError::ApiError(
                "Failed to get idle time from CGEventSource".to_string(),
            ));
        }

        Ok(seconds)
    }

    fn check_permissions(&self) -> PermissionStatus {
        // Try to get frontmost app as a permission check.
        // If NSWorkspace works, basic permissions are available.
        match self.get_frontmost_app_info() {
            Ok(_) => PermissionStatus::Granted,
            Err(_) => PermissionStatus::Denied,
        }
    }
}

/// Check if an application is a known meeting/conferencing app.
fn is_meeting_application(app_name: &str, bundle_id: Option<&str>) -> bool {
    let name_lower = app_name.to_lowercase();

    // Check by app name
    let meeting_name_patterns = [
        "zoom",
        "teams",
        "meet",
        "webex",
        "slack",
        "discord",
        "skype",
        "facetime",
        "gotomeeting",
        "bluejeans",
        "ringcentral",
        "chime",
    ];

    for pattern in &meeting_name_patterns {
        if name_lower.contains(pattern) {
            return true;
        }
    }

    // Check by bundle ID for more precise matching
    if let Some(bid) = bundle_id {
        let meeting_bundles = [
            "us.zoom.xos",
            "com.microsoft.teams",
            "com.microsoft.teams2",
            "com.cisco.webexmeetingsapp",
            "com.tinyspeck.slackmacgap",
            "com.hnc.Discord",
            "com.apple.FaceTime",
            "com.skype.skype",
        ];

        for bundle in &meeting_bundles {
            if bid == *bundle {
                return true;
            }
        }
    }

    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_meeting_app_zoom() {
        assert!(is_meeting_application("zoom.us", None));
        assert!(is_meeting_application("Zoom", Some("us.zoom.xos")));
    }

    #[test]
    fn test_is_meeting_app_teams() {
        assert!(is_meeting_application("Microsoft Teams", None));
        assert!(is_meeting_application(
            "Teams",
            Some("com.microsoft.teams2")
        ));
    }

    #[test]
    fn test_is_not_meeting_app() {
        assert!(!is_meeting_application("Visual Studio Code", None));
        assert!(!is_meeting_application(
            "Safari",
            Some("com.apple.Safari")
        ));
    }

    #[test]
    fn test_is_meeting_app_by_bundle_only() {
        assert!(is_meeting_application(
            "SomeApp",
            Some("com.tinyspeck.slackmacgap")
        ));
    }

    #[test]
    fn test_is_meeting_app_case_insensitive() {
        assert!(is_meeting_application("ZOOM Meeting", None));
        assert!(is_meeting_application("Microsoft TEAMS", None));
    }

    #[test]
    fn test_macos_tracker_creates() {
        let _tracker = MacOSTracker::new();
    }

    #[test]
    fn test_idle_seconds_returns_positive() {
        let tracker = MacOSTracker::new();
        let idle = tracker.get_idle_seconds();
        assert!(idle.is_ok());
        assert!(idle.unwrap() >= 0.0);
    }

    #[test]
    fn test_check_permissions() {
        let tracker = MacOSTracker::new();
        let status = tracker.check_permissions();
        // Should be either Granted or Denied, not Unsupported on macOS
        assert_ne!(status, PermissionStatus::Unsupported);
    }
}
