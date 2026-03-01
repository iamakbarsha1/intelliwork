// AI engine module for IntelliWork.
//
// Provides activity classification (rule-based + LLM hybrid),
// data anonymization, and daily summary generation.

#![allow(dead_code)]

pub mod anonymizer;
pub mod classifier;
pub mod errors;
pub mod llm;
pub mod rules;
pub mod summarizer;

pub use anonymizer::DataAnonymizer;
pub use classifier::{ClassificationResult, ClassificationSource, HybridClassifier, RuleBasedClassifier};
pub use errors::AiError;
pub use llm::{AiProvider, LlmClient, LlmConfig};
pub use rules::ClassificationRule;
pub use summarizer::{DailySummary, SummaryGenerator};
