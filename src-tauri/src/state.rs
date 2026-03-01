// Application state for IntelliWork.
//
// Holds shared state managed by Tauri, accessible from
// IPC command handlers via `tauri::State`.

use std::sync::{Arc, Mutex};

use crate::storage::Database;
use crate::tracker::ActivityTracker;

/// Shared application state managed by Tauri.
///
/// All fields wrapped in `Arc<Mutex<_>>` for thread-safe access
/// from IPC command handlers.
pub struct AppState {
    /// Activity tracker with polling + DB writes
    pub tracker: Arc<Mutex<ActivityTracker>>,
    /// Direct database access for queries
    pub db: Arc<Database>,
}
