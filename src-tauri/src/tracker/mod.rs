// Tracker module for IntelliWork.
//
// Orchestrates activity tracking, meeting detection,
// idle detection, and office hours scheduling.

pub mod activity;
pub mod idle;
pub mod meeting;
pub mod scheduler;

pub use activity::{ActivityTracker, TrackingState};
pub use idle::IdleState;
pub use meeting::MeetingInfo;
pub use scheduler::{OfficeHoursConfig, OfficeHoursManager};
