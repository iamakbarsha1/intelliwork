use core::fmt;
use std::sync::{Arc, Mutex};
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

use crate::state::AppState;

pub fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let toggle_i = MenuItem::with_id(app, "toggle", "Toggle Tracking", true, None::<&str>)?;
    let dashboard_i = MenuItem::with_id(app, "dashboard", "Dashboard", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    // We can also add separators
    let separator = PredefinedMenuItem::separator(app)?;

    let menu = Menu::with_items(
        app,
        &[
            &toggle_i,
            &dashboard_i,
            &separator,
            &quit_i,
        ],
    )?;

    // You can customize icon based on theme or tracking state. By default we use app's default icon.
    // If you have `icons/icon.ico` configured in tauri.conf.json, Tauri loads it automatically.
    
    let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .menu_on_left_click(false)
        .on_menu_event(|app_handle, event| {
            match event.id.as_ref() {
                "toggle" => {
                    let state = app_handle.state::<AppState>();
                    let mut tracker = state.tracker.lock().unwrap();
                    let is_tracking = tracker.get_state().is_tracking;
                    if is_tracking {
                        tracker.stop();
                    } else {
                        tracker.start();
                    }
                    // Optional: emit event or update tray tooltip
                    let new_state = tracker.get_state();
                    let status_text = if new_state.is_tracking { "Tracking Active" } else { "Tracking Stopped" };
                    if let Some(tray_icon) = app_handle.tray_by_id("main") {
                        let _ = tray_icon.set_tooltip(Some(status_text));
                    }
                    let _ = app_handle.emit("tracking_state_changed", new_state);
                }
                "dashboard" => {
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "quit" => {
                    app_handle.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .tooltip("IntelliWork")
        .build(app)?;

    // Set an ID so we can retrieve it later
    // In Tauri v2, tray.set_id seems not available on builder, or rather we use `with_id`,
    // but building without ID assigns a default, or we can use `tauri::tray::TrayIconBuilder::with_id`.
    // Let's rely on standard init.
    
    Ok(())
}
