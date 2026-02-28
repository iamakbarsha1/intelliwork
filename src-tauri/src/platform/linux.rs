// Linux platform tracker stub.
//
// Returns `NotSupported` errors for all operations.
// Full implementation planned for a future release.

use super::errors::PlatformError;
use super::{AppInfo, PermissionStatus, PlatformTracker};

/// Linux platform tracker (stub).
pub struct LinuxTracker;

impl LinuxTracker {
    /// Create a new Linux tracker.
    pub fn new() -> Self {
        Self
    }
}

impl PlatformTracker for LinuxTracker {
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
