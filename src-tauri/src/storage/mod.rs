// Storage layer for IntelliWork.
//
// This module is the ONLY place that executes SQL queries.
// All other modules interact with storage through the Database struct.

pub mod database;
pub mod errors;
pub mod migrations;
pub mod models;

pub use database::Database;
pub use errors::StorageError;
pub use models::{ActivityLog, Category, DailySummaryRecord, MeetingLog};
