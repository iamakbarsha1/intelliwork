#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(unused_variables)]
// Activity tracking engine for IntelliWork.
//
// Polls the platform layer every N seconds for the foreground app,
// detects app switches, manages idle state, checks office hours,
// and writes activities to the database in batches.

use std::sync::Arc;

use chrono::Utc;

use crate::platform::{AppInfo, PlatformTracker};
use crate::storage::{ActivityLog, Database, MeetingLog};
use crate::tracker::idle::{IdleDetector, IdleState};
use crate::tracker::meeting::{MeetingDetector, MeetingInfo};
use crate::tracker::scheduler::OfficeHoursManager;

use tauri::Emitter;

use serde::{Deserialize, Serialize};

/// Tracking state visible to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackingState {
    pub is_tracking: bool,
    pub is_idle: bool,
    pub current_app: Option<String>,
    pub current_window: Option<String>,
    pub current_category: String,
    pub session_duration_seconds: i64,
    pub today_total_seconds: i64,
}

impl Default for TrackingState {
    fn default() -> Self {
        Self {
            is_tracking: false,
            is_idle: false,
            current_app: None,
            current_window: None,
            current_category: "Uncategorized".to_string(),
            session_duration_seconds: 0,
            today_total_seconds: 0,
        }
    }
}

/// Core activity tracker that orchestrates all tracking components.
pub struct ActivityTracker {
    /// Database for persisting activities
    db: Arc<Database>,
    /// Platform-specific APIs
    platform: Box<dyn PlatformTracker>,
    /// Meeting detector
    meeting_detector: MeetingDetector,
    /// Idle detector
    idle_detector: IdleDetector,
    /// Office hours scheduler
    scheduler: OfficeHoursManager,
    /// Whether tracking is currently enabled by the user
    tracking_enabled: bool,
    /// Current activity being tracked (not yet written to DB)
    current_activity: Option<ActivityLog>,
    /// Last known foreground app
    last_app_name: Option<String>,
    /// Accumulated activities waiting to be flushed
    pending_activities: Vec<ActivityLog>,
    /// Pending meeting logs waiting to be flushed
    pending_meetings: Vec<MeetingLog>,
    /// Tauri AppHandle for emitting events
    app_handle: Option<tauri::AppHandle>,
}

impl ActivityTracker {
    /// Create a new activity tracker.
    pub fn new(
        db: Arc<Database>,
        platform: Box<dyn PlatformTracker>,
        idle_threshold: f64,
        scheduler: OfficeHoursManager,
    ) -> Self {
        Self {
            db,
            platform,
            meeting_detector: MeetingDetector::new(),
            idle_detector: IdleDetector::new(idle_threshold),
            scheduler,
            tracking_enabled: false,
            current_activity: None,
            last_app_name: None,
            pending_activities: Vec::new(),
            pending_meetings: Vec::new(),
            app_handle: None,
        }
    }

    /// Set the Tauri app handle for emitting events.
    pub fn set_app_handle(&mut self, handle: tauri::AppHandle) {
        self.app_handle = Some(handle);
    }

    /// Start tracking.
    pub fn start(&mut self) {
        self.tracking_enabled = true;
        log::info!("Tracking started");
        if let Some(app) = &self.app_handle {
            let _ = app.emit("tracking_state_changed", self.get_state());
        }
    }

    /// Stop tracking and flush any pending data.
    pub fn stop(&mut self) {
        self.tracking_enabled = false;
        self.finalize_current_activity();
        if let Err(e) = self.flush() {
            log::error!("Error flushing on stop: {}", e);
        }
        log::info!("Tracking stopped");
        if let Some(app) = &self.app_handle {
            let _ = app.emit("tracking_state_changed", self.get_state());
        }
    }

    /// Main poll function — called every 5 seconds by the app loop.
    ///
    /// 1. Checks if tracking should be active (user enabled + office hours)
    /// 2. Gets foreground app from platform
    /// 3. Checks idle state
    /// 4. Detects app switches → finalizes old activity, starts new one
    /// 5. Checks for meetings
    pub fn poll(&mut self) -> Result<TrackingState, String> {
        // Check if we should be tracking
        if !self.tracking_enabled {
            return Ok(self.get_state());
        }

        if !self.scheduler.is_within_hours() {
            return Ok(self.get_state());
        }

        // Get foreground app
        let app_info = self
            .platform
            .get_foreground_app()
            .map_err(|e| format!("Platform error: {}", e))?;

        // Check idle state
        let prev_idle = self.get_state().is_idle;
        
        let (idle_state, _idle_seconds) = self
            .idle_detector
            .check(self.platform.as_ref())
            .map_err(|e| format!("Idle check error: {}", e))?;

        let is_idle = idle_state == IdleState::Idle;

        // Detect app switch
        let app_changed = self
            .last_app_name
            .as_ref()
            .map(|last| last != &app_info.app_name)
            .unwrap_or(true);

        if app_changed {
            self.on_app_switch(&app_info, is_idle);
        }

        // Update idle flag on current activity
        if let Some(ref mut activity) = self.current_activity {
            activity.is_idle = is_idle;
        }

        if prev_idle != is_idle {
            if let Some(app) = &self.app_handle {
                let _ = app.emit(if is_idle { "idle_started" } else { "idle_ended" }, self.get_state());
            }
        }

        let prev_meeting = self.current_activity.as_ref().map(|a| a.is_meeting).unwrap_or(false);

        // Check for meetings
        let meeting_info = self.meeting_detector.check(&app_info);
        if meeting_info.is_in_meeting {
            if let Some(ref mut activity) = self.current_activity {
                activity.is_meeting = true;
            }
        }
        
        let curr_meeting = self.current_activity.as_ref().map(|a| a.is_meeting).unwrap_or(false);
        if prev_meeting != curr_meeting {
            if let Some(app) = &self.app_handle {
                let _ = app.emit(if curr_meeting { "meeting_started" } else { "meeting_ended" }, self.get_state());
            }
        }

        self.last_app_name = Some(app_info.app_name.clone());

        Ok(self.get_state())
    }

    /// Handle an app switch — finalize old activity, start new one.
    fn on_app_switch(&mut self, app_info: &AppInfo, _is_idle: bool) {
        // Finalize the previous activity
        self.finalize_current_activity();

        // Start new activity
        let activity = ActivityLog::new(
            &app_info.app_name,
            app_info.window_title.as_deref(),
            Utc::now(),
        );

        log::debug!(
            "App switch: {} → {}",
            self.last_app_name.as_deref().unwrap_or("(none)"),
            app_info.app_name,
        );

        self.current_activity = Some(activity);

        if let Some(app) = &self.app_handle {
            let _ = app.emit("activity_changed", self.get_state());
        }

        // If this is a meeting app, also create a meeting log
        let meeting_info = self.meeting_detector.check(app_info);
        if meeting_info.is_in_meeting {
            self.create_meeting_log(&meeting_info);
        }
    }

    /// Finalize the current activity (calculate end time + duration) and add to pending.
    fn finalize_current_activity(&mut self) {
        if let Some(mut activity) = self.current_activity.take() {
            activity.finalize(Utc::now());

            // Only keep activities with > 0 duration
            if activity.duration_seconds > 0 {
                self.pending_activities.push(activity);
            }
        }
    }

    /// Create a meeting log entry for the current activity.
    fn create_meeting_log(&mut self, meeting_info: &MeetingInfo) {
        if let Some(ref activity) = self.current_activity {
            let meeting = MeetingLog::new(
                &activity.id,
                &meeting_info.source_app,
                meeting_info.meeting_title.as_deref(),
                &meeting_info.meeting_type,
            );
            self.pending_meetings.push(meeting);
        }
    }

    /// Flush pending activities and meetings to the database.
    ///
    /// Called periodically (every 30s) and on stop.
    pub fn flush(&mut self) -> Result<usize, String> {
        let mut written = 0;

        for activity in self.pending_activities.drain(..) {
            self.db
                .insert_activity(&activity)
                .map_err(|e| format!("DB error: {}", e))?;
            written += 1;
        }

        for meeting in self.pending_meetings.drain(..) {
            self.db
                .insert_meeting(&meeting)
                .map_err(|e| format!("DB error: {}", e))?;
        }

        if written > 0 {
            log::debug!("Flushed {} activities to database", written);
        }

        Ok(written)
    }

    /// Get the current tracking state for the frontend.
    pub fn get_state(&self) -> TrackingState {
        let (current_app, current_window) = self
            .current_activity
            .as_ref()
            .map(|a| {
                (
                    Some(a.app_name.clone()),
                    a.window_title.clone(),
                )
            })
            .unwrap_or((None, None));

        let is_idle = *self.idle_detector.current_state() == IdleState::Idle;

        TrackingState {
            is_tracking: self.tracking_enabled,
            is_idle,
            current_app,
            current_window,
            current_category: self
                .current_activity
                .as_ref()
                .map(|a| a.category.clone())
                .unwrap_or_else(|| "Uncategorized".to_string()),
            session_duration_seconds: self
                .current_activity
                .as_ref()
                .map(|a| {
                    let start = chrono::DateTime::parse_from_rfc3339(&a.start_time)
                        .map(|dt| dt.with_timezone(&Utc))
                        .unwrap_or_else(|_| Utc::now());
                    (Utc::now() - start).num_seconds().max(0)
                })
                .unwrap_or(0),
            today_total_seconds: 0, // Will be filled from DB query in commands
        }
    }

    /// Check if tracking is currently enabled.
    pub fn is_tracking(&self) -> bool {
        self.tracking_enabled
    }

    /// Reload configurations from the database dynamically
    pub fn reload_config(&mut self) -> Result<(), String> {
        let idle_threshold: f64 = self.db
            .get_config("idle_threshold_seconds")
            .ok()
            .flatten()
            .and_then(|v| v.parse().ok())
            .unwrap_or(180.0);

        self.idle_detector.set_threshold(idle_threshold);

        let enabled: bool = self.db
            .get_config("office_hours_enabled")
            .ok()
            .flatten()
            .map(|v| v == "true")
            .unwrap_or(false);

        let start = self.db
            .get_config("office_hours_start")
            .ok()
            .flatten()
            .unwrap_or_else(|| "09:00".to_string());

        let end = self.db
            .get_config("office_hours_end")
            .ok()
            .flatten()
            .unwrap_or_else(|| "18:00".to_string());

        self.scheduler.update_config(crate::tracker::scheduler::OfficeHoursConfig {
            enabled,
            start_time: start,
            end_time: end,
        });

        Ok(())
    }
}
