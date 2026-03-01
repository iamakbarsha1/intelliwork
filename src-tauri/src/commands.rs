// Tauri IPC command handlers for IntelliWork.
//
// These are thin wrappers that delegate to the tracker and database.
// Each command accesses shared state via `tauri::State<AppState>`.

use tauri::State;

use crate::state::AppState;
use crate::tracker::TrackingState;

/// Start activity tracking.
#[tauri::command]
pub fn start_tracking(state: State<'_, AppState>) -> Result<TrackingState, String> {
    let mut tracker = state
        .tracker
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    tracker.start();
    Ok(tracker.get_state())
}

/// Stop activity tracking.
#[tauri::command]
pub fn stop_tracking(state: State<'_, AppState>) -> Result<TrackingState, String> {
    let mut tracker = state
        .tracker
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    tracker.stop();
    Ok(tracker.get_state())
}

/// Get current tracking state.
#[tauri::command]
pub fn get_tracking_state(state: State<'_, AppState>) -> Result<TrackingState, String> {
    let tracker = state
        .tracker
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    Ok(tracker.get_state())
}

/// Poll for the current foreground app (called by frontend timer).
#[tauri::command]
pub fn poll_tracker(state: State<'_, AppState>) -> Result<TrackingState, String> {
    let mut tracker = state
        .tracker
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    tracker.poll()
}

/// Get activities for a specific date.
#[tauri::command]
pub fn get_activities(
    state: State<'_, AppState>,
    date: String,
) -> Result<Vec<crate::storage::ActivityLog>, String> {
    state
        .db
        .get_activities_for_date(&date)
        .map_err(|e| format!("DB error: {}", e))
}

/// Get a daily summary for a specific date.
#[tauri::command]
pub fn get_summary(
    state: State<'_, AppState>,
    date: String,
) -> Result<Option<crate::storage::DailySummaryRecord>, String> {
    state
        .db
        .get_summary(&date)
        .map_err(|e| format!("DB error: {}", e))
}

/// Get a configuration value.
#[tauri::command]
pub fn get_config(
    state: State<'_, AppState>,
    key: String,
) -> Result<Option<String>, String> {
    state
        .db
        .get_config(&key)
        .map_err(|e| format!("DB error: {}", e))
}

/// Set a configuration value.
#[tauri::command]
pub fn set_config(
    state: State<'_, AppState>,
    key: String,
    value: String,
) -> Result<(), String> {
    state
        .db
        .set_config(&key, &value)
        .map_err(|e| format!("DB error: {}", e))
}

/// Get all configuration values.
#[tauri::command]
pub fn get_all_config(
    state: State<'_, AppState>,
) -> Result<std::collections::HashMap<String, String>, String> {
    state
        .db
        .get_all_config()
        .map_err(|e| format!("DB error: {}", e))
}

/// Delete activities by IDs.
#[tauri::command]
pub fn delete_activities(
    state: State<'_, AppState>,
    ids: Vec<String>,
) -> Result<usize, String> {
    state
        .db
        .delete_activities(&ids)
        .map_err(|e| format!("DB error: {}", e))
}

/// Flush pending activities to database.
#[tauri::command]
pub fn flush_tracker(state: State<'_, AppState>) -> Result<usize, String> {
    let mut tracker = state
        .tracker
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    tracker.flush()
}
