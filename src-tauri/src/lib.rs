#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(unused_variables)]
// IntelliWork — AI-Powered Work Intelligence Assistant
// Module declarations and Tauri app initialization

// Core modules
mod storage;      // Phase 2: Encrypted SQLite storage layer
mod platform;     // Phase 3: Platform abstraction (macOS/Windows/Linux)
mod tracker;      // Phase 4: Activity tracking engine
mod commands;     // Phase 4: Tauri IPC command handlers
mod state;        // Phase 4: Application state management
mod ai;           // Phase 5: AI classification & summarization
mod tray;         // Phase 7: System tray integration

use std::sync::{Arc, Mutex};

/// Tauri IPC command: Get application version info
#[tauri::command]
fn get_app_info() -> serde_json::Value {
    serde_json::json!({
        "name": "IntelliWork",
        "version": env!("CARGO_PKG_VERSION"),
        "description": "AI-Powered Work Intelligence Assistant",
    })
}

/// Initialize and run the Tauri application
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    // Initialize database
    let app_dir = dirs::data_local_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("com.intelliwork.app");

    std::fs::create_dir_all(&app_dir).ok();
    let db_path = app_dir.join("intelliwork.db");

    let db = Arc::new(
        storage::Database::open(&db_path)
            .expect("Failed to open database"),
    );

    // Read config for tracker setup
    let idle_threshold: f64 = db
        .get_config("idle_threshold_seconds")
        .ok()
        .flatten()
        .and_then(|v| v.parse().ok())
        .unwrap_or(180.0);

    let office_hours_enabled: bool = db
        .get_config("office_hours_enabled")
        .ok()
        .flatten()
        .map(|v| v == "true")
        .unwrap_or(false);

    let office_start = db
        .get_config("office_hours_start")
        .ok()
        .flatten()
        .unwrap_or_else(|| "09:00".to_string());

    let office_end = db
        .get_config("office_hours_end")
        .ok()
        .flatten()
        .unwrap_or_else(|| "18:00".to_string());

    // Create scheduler
    let scheduler = tracker::OfficeHoursManager::new(tracker::OfficeHoursConfig {
        enabled: office_hours_enabled,
        start_time: office_start,
        end_time: office_end,
    });

    // Create platform tracker
    let platform = platform::create_platform_tracker();

    // Create activity tracker
    let activity_tracker = tracker::ActivityTracker::new(
        Arc::clone(&db),
        platform,
        idle_threshold,
        scheduler,
    );

    // Build app state
    let app_state = state::AppState {
        tracker: Arc::new(Mutex::new(activity_tracker)),
        db: Arc::clone(&db),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(app_state)
        .setup(|app| {
            tray::setup_tray(app)?;
            
            // Pass app handle to tracker for event emissions
            use tauri::Manager;
            let state = app.state::<state::AppState>();
            let mut tracker = state.tracker.lock().unwrap();
            tracker.set_app_handle(app.handle().clone());
            
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Prevent window from closing, just hide it so background tracking continues
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_app_info,
            commands::start_tracking,
            commands::stop_tracking,
            commands::get_tracking_state,
            commands::poll_tracker,
            commands::get_activities,
            commands::get_activities_range,
            commands::get_summary,
            commands::generate_weekly_insights,
            commands::upsert_summary,
            commands::get_config,
            commands::set_config,
            commands::get_all_config,
            commands::delete_activities,
            commands::flush_tracker,
            commands::export_csv,
            commands::get_all_project_tags,
            commands::delete_project_tag,
            commands::insert_project_tag,
            commands::get_gamification_data,
            commands::get_weekly_insight,
            commands::insert_achievement,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
