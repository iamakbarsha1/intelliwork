#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(unused_variables)]
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

/// Get activities for a date range (inclusive).
#[tauri::command]
pub fn get_activities_range(
    state: State<'_, AppState>,
    start_date: String,
    end_date: String,
) -> Result<Vec<crate::storage::ActivityLog>, String> {
    state
        .db
        .get_activities_for_date_range(&start_date, &end_date)
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

/// Generate AI Weekly Insight from a date range
#[tauri::command]
pub async fn generate_weekly_insights(
    state: State<'_, AppState>,
    start_date: String,
    end_date: String,
) -> Result<String, String> {
    let activities = state
        .db
        .get_activities_for_date_range(&start_date, &end_date)
        .map_err(|e| format!("DB error: {}", e))?;

    let config = {
        let ai_provider_str = state
            .db
            .get_config("ai_provider")
            .unwrap_or(None)
            .unwrap_or_else(|| "rule_based".to_string());
        
        let api_key = state.db.get_config("ai_api_key").unwrap_or(None);

        crate::ai::llm::LlmConfig {
            provider: crate::ai::llm::AiProvider::from_str_safe(&ai_provider_str),
            api_key,
            model: "gpt-4o-mini".to_string(), // we can customize this later
            ..Default::default()
        }
    };

    let llm = crate::ai::llm::LlmClient::new(config);

    crate::ai::summarizer::SummaryGenerator::generate_weekly_insights(&activities, &llm)
        .await
        .map_err(|e| format!("AI error: {}", e))
}

/// Upsert a daily summary (used for editing).
#[tauri::command]
pub fn upsert_summary(
    state: State<'_, AppState>,
    summary: crate::storage::DailySummaryRecord,
) -> Result<(), String> {
    state
        .db
        .upsert_summary(&summary)
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
        .map_err(|e| format!("DB error: {}", e))?;

    if key.starts_with("office_hours_") || key == "idle_threshold" || key == "idle_threshold_seconds" {
        let mut tracker = state.tracker.lock().map_err(|e| format!("Lock error: {}", e))?;
        tracker.reload_config()?;
    }

    Ok(())
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

/// Export activities for a given date to CSV.
#[tauri::command]
pub fn export_csv(
    state: State<'_, AppState>,
    date: String,
    path: String,
) -> Result<(), String> {
    // Force a flush before exporting to ensure we have the latest data
    if let Ok(mut tracker) = state.tracker.lock() {
        let _ = tracker.flush();
    }

    let activities = state
        .db
        .get_activities_for_date(&date)
        .map_err(|e| format!("DB error: {}", e))?;

    let mut wtr = csv::Writer::from_path(&path)
        .map_err(|e| format!("Failed to create CSV writer: {}", e))?;

    // Write header
    wtr.write_record([
        "Date",
        "Category",
        "App Name",
        "Window Title",
        "Start Time",
        "End Time",
        "Duration (s)",
        "Meeting",
    ])
    .map_err(|e| format!("Failed to write CSV header: {}", e))?;

    // Write data
    for act in activities {
        let duration_str = act.duration_seconds.to_string();
        wtr.write_record([
            date.as_str(),
            act.category.as_str(),
            act.app_name.as_str(),
            act.window_title.as_deref().unwrap_or(""),
            act.start_time.as_str(),
            act.end_time.as_deref().unwrap_or(""),
            duration_str.as_str(),
            if act.is_meeting { "Yes" } else { "No" },
        ])
        .map_err(|e| format!("Failed to write CSV record: {}", e))?;
    }

    wtr.flush().map_err(|e| format!("Failed to flush CSV: {}", e))?;

    Ok(())
}

/// Get all project tags
#[tauri::command]
pub fn get_all_project_tags(
    state: State<'_, AppState>,
) -> Result<Vec<crate::storage::ProjectTag>, String> {
    state
        .db
        .get_all_project_tags()
        .map_err(|e| format!("DB error: {}", e))
}

/// Delete a project tag
#[tauri::command]
pub fn delete_project_tag(
    state: State<'_, AppState>,
    id: String,
) -> Result<usize, String> {
    state
        .db
        .delete_project_tag(&id)
        .map_err(|e| format!("DB error: {}", e))
}

/// Insert a project tag and optionally retroactively update past activities
#[tauri::command]
pub fn insert_project_tag(
    state: State<'_, AppState>,
    tag: crate::storage::ProjectTag,
) -> Result<(), String> {
    state
        .db
        .insert_project_tag(&tag)
        .map_err(|e| format!("DB error: {}", e))?;

    // Retroactively update past activities to accurately reflect the tag
    // We can do this in the database directly
    state.db.apply_project_tag(&tag).map_err(|e| format!("DB update error: {}", e))?;
    
    // Also, we must reload the rules in tracker!
    let mut tracker = state.tracker.lock().map_err(|e| format!("Lock error: {}", e))?;
    tracker.reload_project_tags()?;

    Ok(())
}

