// IntelliWork — AI-Powered Work Intelligence Assistant
// Module declarations and Tauri app initialization

// Core modules
mod storage;      // Phase 2: Encrypted SQLite storage layer
mod platform;     // Phase 3: Platform abstraction (macOS/Windows/Linux)
// mod tracker;    // Phase 4: Activity tracking engine
// mod ai;         // Phase 5: AI classification & summarization
// mod commands;   // Phase 4: Tauri IPC command handlers
// mod state;      // Phase 4: Application state management
// mod tray;       // Phase 7: System tray integration

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

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_app_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
