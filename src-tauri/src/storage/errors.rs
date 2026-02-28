// Storage layer error types for IntelliWork.
//
// Uses `thiserror` for ergonomic error definitions.
// All storage operations return `Result<T, StorageError>`.

use thiserror::Error;

/// Errors that can occur in the storage layer.
#[derive(Debug, Error)]
pub enum StorageError {
    /// SQLite database error
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    /// Record not found
    #[error("Record not found: {0}")]
    NotFound(String),

    /// Migration failure
    #[error("Migration error: {0}")]
    Migration(String),

    /// Invalid data format
    #[error("Invalid data: {0}")]
    InvalidData(String),

    /// Serialization/deserialization error
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}
