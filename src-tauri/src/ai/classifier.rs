// Activity classifier for IntelliWork.
//
// Uses rule-based matching with optional LLM fallback (hybrid).
// Rules are checked first (fast, offline). If no match, the
// hybrid classifier can optionally call an LLM API.

use std::collections::HashMap;
use super::rules::{default_rules, ClassificationRule, MatchTarget};

use serde::{Deserialize, Serialize};

/// Classification result for a single activity.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClassificationResult {
    pub category: String,
    pub confidence: f64,
    pub source: ClassificationSource,
}

/// How the classification was determined.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClassificationSource {
    RuleBased,
    LlmFallback,
    Manual,
}

/// Rule-based classifier using pattern matching.
pub struct RuleBasedClassifier {
    rules: Vec<ClassificationRule>,
}

impl RuleBasedClassifier {
    /// Create a classifier with the default rules.
    pub fn new() -> Self {
        Self {
            rules: default_rules(),
        }
    }

    /// Create a classifier with custom rules.
    pub fn with_rules(rules: Vec<ClassificationRule>) -> Self {
        Self { rules }
    }

    /// Classify an activity based on app name and window title.
    ///
    /// Returns the best matching rule (highest confidence).
    /// Returns `Uncategorized` with confidence 0.0 if no match.
    pub fn classify(
        &self,
        app_name: &str,
        window_title: Option<&str>,
        bundle_id: Option<&str>,
    ) -> ClassificationResult {
        let app_lower = app_name.to_lowercase();
        let title_lower = window_title
            .unwrap_or("")
            .to_lowercase();
        let bundle_lower = bundle_id
            .unwrap_or("")
            .to_lowercase();

        let mut best_match: Option<&ClassificationRule> = None;

        for rule in &self.rules {
            let pattern_lower = rule.pattern.to_lowercase();

            let matched = match rule.match_target {
                MatchTarget::AppName => app_lower.contains(&pattern_lower),
                MatchTarget::WindowTitle => title_lower.contains(&pattern_lower),
                MatchTarget::BundleId => bundle_lower.contains(&pattern_lower),
                MatchTarget::Either => {
                    app_lower.contains(&pattern_lower)
                        || title_lower.contains(&pattern_lower)
                }
            };

            if matched
                && best_match
                    .map(|b| rule.confidence > b.confidence)
                    .unwrap_or(true)
            {
                best_match = Some(rule);
            }
        }

        match best_match {
            Some(rule) => ClassificationResult {
                category: rule.category.clone(),
                confidence: rule.confidence,
                source: ClassificationSource::RuleBased,
            },
            None => ClassificationResult {
                category: "Uncategorized".to_string(),
                confidence: 0.0,
                source: ClassificationSource::RuleBased,
            },
        }
    }
}

impl Default for RuleBasedClassifier {
    fn default() -> Self {
        Self::new()
    }
}

/// Hybrid classifier: rules first, LLM fallback.
pub struct HybridClassifier {
    rule_classifier: RuleBasedClassifier,
    /// Minimum confidence to accept a rule-based result;
    /// below this, LLM fallback is used.
    min_confidence: f64,
}

impl HybridClassifier {
    /// Create a hybrid classifier.
    pub fn new(min_confidence: f64) -> Self {
        Self {
            rule_classifier: RuleBasedClassifier::new(),
            min_confidence,
        }
    }

    /// Classify with rule-based first, then LLM fallback if low confidence.
    ///
    /// Currently only uses rule-based. LLM integration is added in the
    /// llm.rs module and wired in Phase 5 completion.
    pub fn classify(
        &self,
        app_name: &str,
        window_title: Option<&str>,
        bundle_id: Option<&str>,
    ) -> ClassificationResult {
        let result = self.rule_classifier.classify(app_name, window_title, bundle_id);

        if result.confidence >= self.min_confidence {
            return result;
        }

        // TODO: LLM fallback when confidence is low
        // For now, return the rule-based result even if low confidence
        log::debug!(
            "Low confidence ({:.2}) for '{}' — LLM fallback pending",
            result.confidence,
            app_name
        );

        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vs_code_is_development() {
        let c = RuleBasedClassifier::new();
        let result = c.classify("Visual Studio Code", Some("main.rs — intelliwork"), None);
        assert_eq!(result.category, "Development");
        assert!(result.confidence >= 0.90);
    }

    #[test]
    fn test_chrome_stackoverflow_is_research() {
        let c = RuleBasedClassifier::new();
        let result = c.classify(
            "Google Chrome",
            Some("rust - How to use Mutex - Stack Overflow"),
            None,
        );
        assert_eq!(result.category, "Research");
        assert!(result.confidence >= 0.80);
    }

    #[test]
    fn test_zoom_is_meetings() {
        let c = RuleBasedClassifier::new();
        let result = c.classify("Zoom", Some("Team Standup"), None);
        assert_eq!(result.category, "Meetings");
        assert!(result.confidence >= 0.90);
    }

    #[test]
    fn test_slack_is_communication() {
        let c = RuleBasedClassifier::new();
        let result = c.classify("Slack", Some("#general"), None);
        assert_eq!(result.category, "Communication");
        assert!(result.confidence >= 0.85);
    }

    #[test]
    fn test_figma_is_design() {
        let c = RuleBasedClassifier::new();
        let result = c.classify("Figma", Some("Dashboard Mockup"), None);
        assert_eq!(result.category, "Design");
        assert!(result.confidence >= 0.90);
    }

    #[test]
    fn test_notion_is_productivity() {
        let c = RuleBasedClassifier::new();
        let result = c.classify("Notion", Some("Sprint Planning Notes"), None);
        assert_eq!(result.category, "Productivity");
        assert!(result.confidence >= 0.80);
    }

    #[test]
    fn test_youtube_is_entertainment() {
        let c = RuleBasedClassifier::new();
        let result = c.classify("Safari", Some("YouTube - Music Video"), None);
        assert_eq!(result.category, "Entertainment");
        assert!(result.confidence >= 0.70);
    }

    #[test]
    fn test_unknown_app_is_uncategorized() {
        let c = RuleBasedClassifier::new();
        let result = c.classify("RandomUnknownApp", None, None);
        assert_eq!(result.category, "Uncategorized");
        assert_eq!(result.confidence, 0.0);
    }

    #[test]
    fn test_case_insensitive_matching() {
        let c = RuleBasedClassifier::new();
        let result = c.classify("visual studio code", Some("test.rs"), None);
        assert_eq!(result.category, "Development");
    }

    #[test]
    fn test_hybrid_classifier_uses_rules() {
        let h = HybridClassifier::new(0.5);
        let result = h.classify("VS Code", Some("lib.rs"), None);
        assert_eq!(result.category, "Development");
        assert!(result.confidence >= 0.90);
    }

    #[test]
    fn test_terminal_is_development() {
        let c = RuleBasedClassifier::new();
        let result = c.classify("Terminal", Some("cargo test"), None);
        assert_eq!(result.category, "Development");
        assert!(result.confidence >= 0.75);
    }
}
