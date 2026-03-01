#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(unused_variables)]
// Storage layer for IntelliWork.
//
// This module is the ONLY place that executes SQL queries.
// All other modules interact with storage through the Database struct.

pub mod database;
pub mod errors;
pub mod migrations;
pub mod models;

pub use database::Database;
pub use models::{ActivityLog, DailySummaryRecord, MeetingLog};
