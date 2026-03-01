#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(unused_variables)]
// Idle detection for IntelliWork.
//
// Wraps the platform layer's idle time API with a configurable
// threshold to determine if the user is idle or active.

use crate::platform::{PlatformError, PlatformTracker};
use serde::{Deserialize, Serialize};

/// Idle detection state.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum IdleState {
    Active,
    Idle,
}

/// Configurable idle detector.
///
/// Polls the platform layer for seconds since last input
/// and compares against a threshold to determine idle state.
pub struct IdleDetector {
    /// Seconds before the user is considered idle (default: 180s = 3 min)
    threshold_seconds: f64,
    /// Current idle state
    state: IdleState,
}

impl IdleDetector {
    /// Create a new idle detector with the given threshold.
    pub fn new(threshold_seconds: f64) -> Self {
        Self {
            threshold_seconds,
            state: IdleState::Active,
        }
    }

    /// Check if the user is idle using the platform tracker.
    ///
    /// Returns the updated idle state and the idle duration in seconds.
    pub fn check(
        &mut self,
        tracker: &dyn PlatformTracker,
    ) -> Result<(IdleState, f64), PlatformError> {
        let idle_seconds = tracker.get_idle_seconds()?;

        let new_state = if idle_seconds >= self.threshold_seconds {
            IdleState::Idle
        } else {
            IdleState::Active
        };

        let previous = self.state.clone();
        self.state = new_state.clone();

        // Log state transitions
        if previous != new_state {
            log::info!(
                "Idle state changed: {:?} → {:?} (idle: {:.1}s, threshold: {:.0}s)",
                previous,
                new_state,
                idle_seconds,
                self.threshold_seconds,
            );
        }

        Ok((new_state, idle_seconds))
    }

    /// Get the current idle state without polling.
    pub fn current_state(&self) -> &IdleState {
        &self.state
    }

    /// Update the idle threshold.
    pub fn set_threshold(&mut self, seconds: f64) {
        self.threshold_seconds = seconds;
        log::info!("Idle threshold updated to {:.0}s", seconds);
    }

    /// Get the current threshold.
    pub fn threshold(&self) -> f64 {
        self.threshold_seconds
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::platform::{AppInfo, PermissionStatus};

    /// Mock tracker that returns a fixed idle time.
    struct MockTracker {
        idle_seconds: f64,
    }

    impl PlatformTracker for MockTracker {
        fn get_foreground_app(&self) -> Result<AppInfo, PlatformError> {
            Ok(AppInfo::new("MockApp"))
        }

        fn get_idle_seconds(&self) -> Result<f64, PlatformError> {
            Ok(self.idle_seconds)
        }

        fn check_permissions(&self) -> PermissionStatus {
            PermissionStatus::Granted
        }
    }

    #[test]
    fn test_active_when_below_threshold() {
        let mut detector = IdleDetector::new(180.0);
        let tracker = MockTracker { idle_seconds: 10.0 };

        let (state, _) = detector.check(&tracker).unwrap();
        assert_eq!(state, IdleState::Active);
    }

    #[test]
    fn test_idle_when_above_threshold() {
        let mut detector = IdleDetector::new(180.0);
        let tracker = MockTracker { idle_seconds: 200.0 };

        let (state, _) = detector.check(&tracker).unwrap();
        assert_eq!(state, IdleState::Idle);
    }

    #[test]
    fn test_idle_at_exact_threshold() {
        let mut detector = IdleDetector::new(180.0);
        let tracker = MockTracker { idle_seconds: 180.0 };

        let (state, _) = detector.check(&tracker).unwrap();
        assert_eq!(state, IdleState::Idle);
    }

    #[test]
    fn test_state_transition_active_to_idle() {
        let mut detector = IdleDetector::new(60.0);

        let active_tracker = MockTracker { idle_seconds: 10.0 };
        detector.check(&active_tracker).unwrap();
        assert_eq!(*detector.current_state(), IdleState::Active);

        let idle_tracker = MockTracker { idle_seconds: 120.0 };
        detector.check(&idle_tracker).unwrap();
        assert_eq!(*detector.current_state(), IdleState::Idle);
    }

    #[test]
    fn test_set_threshold() {
        let mut detector = IdleDetector::new(180.0);
        detector.set_threshold(300.0);
        assert_eq!(detector.threshold(), 300.0);
    }
}
