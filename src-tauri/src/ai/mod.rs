#![allow(dead_code, unused_imports, unused_variables, clippy::duplicated_attributes)]
#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(unused_variables)]
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
pub mod coach;

