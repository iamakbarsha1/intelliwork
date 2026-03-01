// AI engine error types.

use thiserror::Error;

/// Errors from AI classification and summarization.
#[derive(Debug, Error)]
pub enum AiError {
    /// No matching classification rule found
    #[error("No classification rule matched for: {0}")]
    NoMatch(String),

    /// LLM API request failed
    #[error("LLM API error: {0}")]
    LlmApiError(String),

    /// LLM returned an unparseable response
    #[error("Invalid LLM response: {0}")]
    InvalidResponse(String),

    /// LLM API timed out
    #[error("LLM request timed out after {0}s")]
    Timeout(u64),

    /// AI provider not configured
    #[error("AI provider not configured: {0}")]
    NotConfigured(String),

    /// Serialization error
    #[error("Serialization error: {0}")]
    Serialization(String),
}
