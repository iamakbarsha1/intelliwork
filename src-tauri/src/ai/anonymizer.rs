#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(unused_variables)]
// Data anonymizer for IntelliWork.
//
// Removes or replaces sensitive information before sending
// data to cloud-based AI providers (OpenAI, Gemini).
// Local providers (Ollama, rule-based) skip anonymization.

use serde::{Deserialize, Serialize};

/// Anonymized activity data safe for cloud AI.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnonymizedActivity {
    pub app_name: String,
    pub window_title: String,
    pub duration_seconds: i64,
    pub category: String,
}

/// Data anonymizer that strips sensitive information.
pub struct DataAnonymizer {
    /// Patterns to redact from window titles
    sensitive_patterns: Vec<String>,
}

impl DataAnonymizer {
    /// Create an anonymizer with default sensitive patterns.
    pub fn new() -> Self {
        Self {
            sensitive_patterns: vec![
                // Email patterns
                "@".to_string(),
                // URLs with paths
                "http://".to_string(),
                "https://".to_string(),
                // File paths
                "/Users/".to_string(),
                "/home/".to_string(),
                "C:\\".to_string(),
                // Common sensitive prefixes
                "password".to_string(),
                "secret".to_string(),
                "token".to_string(),
                "api_key".to_string(),
                "apikey".to_string(),
            ],
        }
    }

    /// Anonymize a window title by redacting sensitive content.
    pub fn anonymize_title(&self, title: &str) -> String {
        let mut result = title.to_string();

        // Replace email addresses
        result = self.redact_emails(&result);

        // Replace URLs
        result = self.redact_urls(&result);

        // Replace file paths
        result = self.redact_file_paths(&result);

        result
    }

    /// Anonymize activity data for cloud AI consumption.
    pub fn anonymize_activity(
        &self,
        app_name: &str,
        window_title: Option<&str>,
        duration_seconds: i64,
        category: &str,
    ) -> AnonymizedActivity {
        let anonymized_title = window_title
            .map(|t| self.anonymize_title(t))
            .unwrap_or_default();

        AnonymizedActivity {
            app_name: app_name.to_string(),
            window_title: anonymized_title,
            duration_seconds,
            category: category.to_string(),
        }
    }

    /// Redact email addresses (user@domain.com → [EMAIL]).
    fn redact_emails(&self, text: &str) -> String {
        let mut result = String::new();
        let mut chars = text.chars().peekable();
        let mut current_word = String::new();

        while let Some(ch) = chars.next() {
            if ch == '@' && !current_word.is_empty() {
                // Found @ in a word — likely an email
                // Consume the rest of the domain
                let mut domain = String::new();
                domain.push(ch);
                while let Some(&next) = chars.peek() {
                    if next.is_whitespace() || next == '>' || next == ')' || next == ']' {
                        break;
                    }
                    domain.push(chars.next().unwrap());
                }
                result.push_str("[EMAIL]");
                current_word.clear();
            } else if ch.is_whitespace() || ch == '<' || ch == '(' || ch == '[' {
                result.push_str(&current_word);
                result.push(ch);
                current_word.clear();
            } else {
                current_word.push(ch);
            }
        }
        result.push_str(&current_word);
        result
    }

    /// Redact URLs (https://example.com/path → [URL]).
    fn redact_urls(&self, text: &str) -> String {
        let mut result = text.to_string();
        // Simple URL replacement
        while let Some(pos) = result.find("https://") {
            if let Some(end) = result[pos..].find(|c: char| c.is_whitespace()) {
                result.replace_range(pos..pos + end, "[URL]");
            } else {
                result.replace_range(pos.., "[URL]");
            }
        }
        while let Some(pos) = result.find("http://") {
            if let Some(end) = result[pos..].find(|c: char| c.is_whitespace()) {
                result.replace_range(pos..pos + end, "[URL]");
            } else {
                result.replace_range(pos.., "[URL]");
            }
        }
        result
    }

    /// Redact file paths (/Users/name/file → [PATH]).
    fn redact_file_paths(&self, text: &str) -> String {
        let mut result = text.to_string();
        let path_prefixes = ["/Users/", "/home/", "C:\\"];
        for prefix in &path_prefixes {
            while let Some(pos) = result.find(prefix) {
                if let Some(end) = result[pos..].find(|c: char| c.is_whitespace()) {
                    result.replace_range(pos..pos + end, "[PATH]");
                } else {
                    result.replace_range(pos.., "[PATH]");
                }
            }
        }
        result
    }
}

impl Default for DataAnonymizer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_redact_email() {
        let anon = DataAnonymizer::new();
        let result = anon.anonymize_title("Email from user@example.com about project");
        assert!(result.contains("[EMAIL]"));
        assert!(!result.contains("user@example.com"));
    }

    #[test]
    fn test_redact_url() {
        let anon = DataAnonymizer::new();
        let result = anon.anonymize_title("Viewing https://secret.internal.com/admin/users");
        assert!(result.contains("[URL]"));
        assert!(!result.contains("https://"));
    }

    #[test]
    fn test_redact_file_path() {
        let anon = DataAnonymizer::new();
        let result = anon.anonymize_title("Editing /Users/john/projects/secret-project/main.rs");
        assert!(result.contains("[PATH]"));
        assert!(!result.contains("/Users/john"));
    }

    #[test]
    fn test_no_redaction_needed() {
        let anon = DataAnonymizer::new();
        let result = anon.anonymize_title("Sprint Planning — IntelliWork");
        assert_eq!(result, "Sprint Planning — IntelliWork");
    }

    #[test]
    fn test_anonymize_activity() {
        let anon = DataAnonymizer::new();
        let activity = anon.anonymize_activity(
            "VS Code",
            Some("main.rs — /Users/dev/project"),
            3600,
            "Development",
        );
        assert_eq!(activity.app_name, "VS Code");
        assert!(activity.window_title.contains("[PATH]"));
        assert_eq!(activity.duration_seconds, 3600);
    }

    #[test]
    fn test_anonymize_empty_title() {
        let anon = DataAnonymizer::new();
        let activity = anon.anonymize_activity("App", None, 100, "Other");
        assert_eq!(activity.window_title, "");
    }
}
