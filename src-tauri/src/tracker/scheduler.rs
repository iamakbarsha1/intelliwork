#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(unused_variables)]
// Office hours scheduling for IntelliWork.
//
// Controls whether tracking is active based on configurable
// office hours (start/end times per day).

use chrono::{Local, NaiveTime};
use serde::{Deserialize, Serialize};

/// Office hours configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OfficeHoursConfig {
    pub enabled: bool,
    pub start_time: String, // "HH:MM" format
    pub end_time: String,   // "HH:MM" format
}

impl Default for OfficeHoursConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            start_time: "09:00".to_string(),
            end_time: "18:00".to_string(),
        }
    }
}

/// Office hours manager — determines if tracking should be active.
pub struct OfficeHoursManager {
    config: OfficeHoursConfig,
}

impl OfficeHoursManager {
    /// Create a new office hours manager.
    pub fn new(config: OfficeHoursConfig) -> Self {
        Self { config }
    }

    /// Check if the current time is within office hours.
    ///
    /// If office hours are disabled, always returns `true`.
    pub fn is_within_hours(&self) -> bool {
        if !self.config.enabled {
            return true;
        }

        let now = Local::now().time();
        self.is_time_within_hours(now)
    }

    /// Check if a specific time is within office hours.
    ///
    /// Handles overnight ranges (e.g., 22:00 → 06:00).
    fn is_time_within_hours(&self, time: NaiveTime) -> bool {
        let start = match NaiveTime::parse_from_str(&self.config.start_time, "%H:%M") {
            Ok(t) => t,
            Err(_) => {
                log::warn!(
                    "Invalid start_time '{}', defaulting to 09:00",
                    self.config.start_time
                );
                NaiveTime::from_hms_opt(9, 0, 0).unwrap()
            }
        };

        let end = match NaiveTime::parse_from_str(&self.config.end_time, "%H:%M") {
            Ok(t) => t,
            Err(_) => {
                log::warn!(
                    "Invalid end_time '{}', defaulting to 18:00",
                    self.config.end_time
                );
                NaiveTime::from_hms_opt(18, 0, 0).unwrap()
            }
        };

        if start <= end {
            // Normal range: 09:00 → 18:00
            time >= start && time < end
        } else {
            // Overnight range: 22:00 → 06:00
            time >= start || time < end
        }
    }

    /// Update the office hours configuration.
    pub fn update_config(&mut self, config: OfficeHoursConfig) {
        log::info!(
            "Office hours updated: enabled={}, {}–{}",
            config.enabled,
            config.start_time,
            config.end_time,
        );
        self.config = config;
    }

    /// Get the current configuration.
    pub fn config(&self) -> &OfficeHoursConfig {
        &self.config
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::NaiveTime;

    fn make_manager(start: &str, end: &str, enabled: bool) -> OfficeHoursManager {
        OfficeHoursManager::new(OfficeHoursConfig {
            enabled,
            start_time: start.to_string(),
            end_time: end.to_string(),
        })
    }

    #[test]
    fn test_within_normal_hours() {
        let mgr = make_manager("09:00", "18:00", true);
        let time = NaiveTime::from_hms_opt(12, 0, 0).unwrap();
        assert!(mgr.is_time_within_hours(time));
    }

    #[test]
    fn test_before_office_hours() {
        let mgr = make_manager("09:00", "18:00", true);
        let time = NaiveTime::from_hms_opt(7, 0, 0).unwrap();
        assert!(!mgr.is_time_within_hours(time));
    }

    #[test]
    fn test_after_office_hours() {
        let mgr = make_manager("09:00", "18:00", true);
        let time = NaiveTime::from_hms_opt(20, 0, 0).unwrap();
        assert!(!mgr.is_time_within_hours(time));
    }

    #[test]
    fn test_at_start_time() {
        let mgr = make_manager("09:00", "18:00", true);
        let time = NaiveTime::from_hms_opt(9, 0, 0).unwrap();
        assert!(mgr.is_time_within_hours(time));
    }

    #[test]
    fn test_at_end_time_exclusive() {
        let mgr = make_manager("09:00", "18:00", true);
        let time = NaiveTime::from_hms_opt(18, 0, 0).unwrap();
        assert!(!mgr.is_time_within_hours(time));
    }

    #[test]
    fn test_disabled_always_returns_true() {
        let mgr = make_manager("09:00", "18:00", false);
        assert!(mgr.is_within_hours());
    }

    #[test]
    fn test_overnight_range() {
        let mgr = make_manager("22:00", "06:00", true);

        let late_night = NaiveTime::from_hms_opt(23, 0, 0).unwrap();
        assert!(mgr.is_time_within_hours(late_night));

        let early_morning = NaiveTime::from_hms_opt(3, 0, 0).unwrap();
        assert!(mgr.is_time_within_hours(early_morning));

        let midday = NaiveTime::from_hms_opt(12, 0, 0).unwrap();
        assert!(!mgr.is_time_within_hours(midday));
    }

    #[test]
    fn test_default_config() {
        let config = OfficeHoursConfig::default();
        assert!(!config.enabled);
        assert_eq!(config.start_time, "09:00");
        assert_eq!(config.end_time, "18:00");
    }
}
