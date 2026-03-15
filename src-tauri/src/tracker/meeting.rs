#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(unused_variables)]
// Meeting detection for IntelliWork.
//
// Detects whether the user is in a meeting based on:
// 1. The foreground app being a known meeting application
// 2. Window title keywords indicating an active call

use crate::platform::AppInfo;
use serde::{Deserialize, Serialize};

/// Result of meeting detection check.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MeetingInfo {
    /// Whether a meeting is currently detected
    pub is_in_meeting: bool,
    /// Detected meeting title (from window title)
    pub meeting_title: Option<String>,
    /// Type: "scheduled" or "ad_hoc"
    pub meeting_type: String,
    /// Source application name
    pub source_app: String,
}

/// Meeting detector using app name and window title analysis.
pub struct MeetingDetector {
    /// Keywords in window titles that indicate an active meeting/call
    call_keywords: Vec<String>,
}

impl MeetingDetector {
    /// Create a new meeting detector with default keywords.
    pub fn new() -> Self {
        Self {
            call_keywords: vec![
                "meeting".to_string(),
                "call".to_string(),
                "conference".to_string(),
                "huddle".to_string(),
                "standup".to_string(),
                "stand-up".to_string(),
                "sync".to_string(),
                "1:1".to_string(),
                "one-on-one".to_string(),
                "retrospective".to_string(),
                "retro".to_string(),
                "sprint".to_string(),
                "planning".to_string(),
                "demo".to_string(),
                "review".to_string(),
                "interview".to_string(),
                "webinar".to_string(),
                "presentation".to_string(),
                "screen share".to_string(),
                "screen sharing".to_string(),
            ],
        }
    }

    /// Check if the current foreground app indicates a meeting.
    ///
    /// Returns meeting info including whether a meeting is detected,
    /// the inferred title, and the meeting type.
    pub fn check(&self, app_info: &AppInfo) -> MeetingInfo {
        if !app_info.is_meeting_app {
            return MeetingInfo {
                is_in_meeting: false,
                meeting_title: None,
                meeting_type: "ad_hoc".to_string(),
                source_app: app_info.app_name.clone(),
            };
        }

        // Meeting app is in foreground — check window title for meeting indicators
        let (has_call_keyword, meeting_title) = self.analyze_window_title(
            app_info.window_title.as_deref(),
        );

        let meeting_type = if has_call_keyword {
            "scheduled".to_string()
        } else {
            "ad_hoc".to_string()
        };

        MeetingInfo {
            is_in_meeting: true,
            meeting_title: meeting_title.or_else(|| {
                Some(format!("{} call", app_info.app_name))
            }),
            meeting_type,
            source_app: app_info.app_name.clone(),
        }
    }

    /// Analyze a window title for meeting-related keywords.
    ///
    /// Returns (has_keyword, extracted_title).
    fn analyze_window_title(
        &self,
        window_title: Option<&str>,
    ) -> (bool, Option<String>) {
        let title = match window_title {
            Some(t) if !t.is_empty() => t,
            _ => return (false, None),
        };

        let title_lower = title.to_lowercase();
        let has_keyword = self
            .call_keywords
            .iter()
            .any(|kw| title_lower.contains(kw));

        (has_keyword, Some(title.to_string()))
    }
}

impl Default for MeetingDetector {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_app(name: &str, title: Option<&str>, is_meeting: bool) -> AppInfo {
        AppInfo {
            app_name: name.to_string(),
            window_title: title.map(|t| t.to_string()),
            bundle_id: None,
            is_meeting_app: is_meeting,
            browser_url: None,
        }
    }

    #[test]
    fn test_non_meeting_app_returns_false() {
        let detector = MeetingDetector::new();
        let app = make_app("VS Code", Some("main.rs"), false);
        let result = detector.check(&app);

        assert!(!result.is_in_meeting);
        assert!(result.meeting_title.is_none());
    }

    #[test]
    fn test_meeting_app_detected() {
        let detector = MeetingDetector::new();
        let app = make_app("Zoom", Some("Team Standup"), true);
        let result = detector.check(&app);

        assert!(result.is_in_meeting);
        assert_eq!(result.meeting_title, Some("Team Standup".to_string()));
        assert_eq!(result.meeting_type, "scheduled");
    }

    #[test]
    fn test_meeting_app_without_keyword_is_ad_hoc() {
        let detector = MeetingDetector::new();
        let app = make_app("Teams", Some("General"), true);
        let result = detector.check(&app);

        assert!(result.is_in_meeting);
        assert_eq!(result.meeting_type, "ad_hoc");
    }

    #[test]
    fn test_meeting_app_no_window_title() {
        let detector = MeetingDetector::new();
        let app = make_app("Zoom", None, true);
        let result = detector.check(&app);

        assert!(result.is_in_meeting);
        assert_eq!(result.meeting_title, Some("Zoom call".to_string()));
    }

    #[test]
    fn test_multiple_keywords_detected() {
        let detector = MeetingDetector::new();

        let keywords = vec![
            "Sprint Planning",
            "Daily Standup",
            "1:1 with Manager",
            "Demo Session",
            "Tech Review",
        ];

        for title in keywords {
            let app = make_app("Teams", Some(title), true);
            let result = detector.check(&app);
            assert!(result.is_in_meeting, "Should detect meeting for: {}", title);
            assert_eq!(result.meeting_type, "scheduled");
        }
    }

    #[test]
    fn test_case_insensitive_keyword_match() {
        let detector = MeetingDetector::new();
        let app = make_app("Zoom", Some("TEAM MEETING"), true);
        let result = detector.check(&app);

        assert!(result.is_in_meeting);
        assert_eq!(result.meeting_type, "scheduled");
    }
}
