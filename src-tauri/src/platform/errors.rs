#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(unused_variables)]
// Platform layer error types.

use thiserror::Error;

/// Errors from platform-specific operations.
#[derive(Debug, Error)]
pub enum PlatformError {
    /// OS API call failed
    #[error("Platform API error: {0}")]
    ApiError(String),

    /// Required permissions not granted
    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    /// Feature not supported on this platform
    #[error("Not supported on this platform")]
    NotSupported,

    /// Timeout waiting for OS response
    #[error("Platform operation timed out")]
    Timeout,
}
