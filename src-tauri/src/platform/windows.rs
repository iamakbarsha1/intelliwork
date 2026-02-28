// Windows platform tracker stub.
//
// Returns `NotSupported` errors for all operations.
// Full implementation planned for a future release.

use super::errors::PlatformError;
use super::{AppInfo, PermissionStatus, PlatformTracker};

/// Windows platform tracker (stub).
pub struct WindowsTracker;

impl WindowsTracker {
    /// Create a new Windows tracker.
    pub fn new() -> Self {
        Self
    }
}

impl PlatformTracker for WindowsTracker {
    fn get_foreground_app(&self) -> Result<AppInfo, PlatformError> {
        Err(PlatformError::NotSupported)
    }

    fn get_idle_seconds(&self) -> Result<f64, PlatformError> {
        Err(PlatformError::NotSupported)
    }

    fn check_permissions(&self) -> PermissionStatus {
        PermissionStatus::Unsupported
    }
}
