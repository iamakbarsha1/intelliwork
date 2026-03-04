#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(unused_variables)]
// Classification rules for IntelliWork.
//
// Maps application names and window title patterns to categories.
// Used by the RuleBasedClassifier as its knowledge base.

use serde::{Deserialize, Serialize};

/// A single classification rule.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClassificationRule {
    /// Pattern to match (case-insensitive substring)
    pub pattern: String,
    /// Whether this matches app name or window title
    pub match_target: MatchTarget,
    /// Category to assign when matched
    pub category: String,
    /// Confidence score (0.0 - 1.0)
    pub confidence: f64,
}

/// What to match the pattern against.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MatchTarget {
    AppName,
    WindowTitle,
    BundleId,
    Either,
}

/// Get the default classification rules.
///
/// These cover common development, productivity, communication,
/// meeting, and entertainment applications.
pub fn default_rules() -> Vec<ClassificationRule> {
    vec![
        // ─── Development ──────────────────────────────────
        rule("Visual Studio Code", MatchTarget::AppName, "Development", 0.95),
        rule("VS Code", MatchTarget::AppName, "Development", 0.95),
        rule("code", MatchTarget::BundleId, "Development", 0.90),
        rule("IntelliJ", MatchTarget::AppName, "Development", 0.95),
        rule("WebStorm", MatchTarget::AppName, "Development", 0.95),
        rule("PyCharm", MatchTarget::AppName, "Development", 0.95),
        rule("Android Studio", MatchTarget::AppName, "Development", 0.95),
        rule("Antigravity", MatchTarget::AppName, "Development", 0.95),
        rule("Xcode", MatchTarget::AppName, "Development", 0.95),
        rule("Sublime Text", MatchTarget::AppName, "Development", 0.90),
        rule("Atom", MatchTarget::AppName, "Development", 0.85),
        rule("Vim", MatchTarget::AppName, "Development", 0.85),
        rule("Neovim", MatchTarget::AppName, "Development", 0.85),
        rule("Terminal", MatchTarget::AppName, "Development", 0.80),
        rule("iTerm", MatchTarget::AppName, "Development", 0.80),
        rule("Warp", MatchTarget::AppName, "Development", 0.80),
        rule("Alacritty", MatchTarget::AppName, "Development", 0.80),
        rule("Docker", MatchTarget::AppName, "Development", 0.80),
        rule("Postman", MatchTarget::AppName, "Development", 0.85),
        rule("Insomnia", MatchTarget::AppName, "Development", 0.85),
        rule("GitHub Desktop", MatchTarget::AppName, "Development", 0.85),
        rule("Tower", MatchTarget::AppName, "Development", 0.85),
        rule("SourceTree", MatchTarget::AppName, "Development", 0.85),
        rule("DBeaver", MatchTarget::AppName, "Development", 0.85),
        rule("TablePlus", MatchTarget::AppName, "Development", 0.85),
        rule("pgAdmin", MatchTarget::AppName, "Development", 0.85),

        // ─── Research ─────────────────────────────────────
        rule("stackoverflow", MatchTarget::WindowTitle, "Research", 0.85),
        rule("Stack Overflow", MatchTarget::WindowTitle, "Research", 0.85),
        rule("docs.rs", MatchTarget::WindowTitle, "Research", 0.85),
        rule("developer.mozilla", MatchTarget::WindowTitle, "Research", 0.85),
        rule("MDN Web Docs", MatchTarget::WindowTitle, "Research", 0.85),
        rule("GitHub", MatchTarget::WindowTitle, "Research", 0.80),
        rule("GitLab", MatchTarget::WindowTitle, "Research", 0.80),
        rule("Bitbucket", MatchTarget::WindowTitle, "Research", 0.80),
        rule("npm", MatchTarget::WindowTitle, "Research", 0.75),
        rule("crates.io", MatchTarget::WindowTitle, "Research", 0.80),
        rule("medium.com", MatchTarget::WindowTitle, "Research", 0.70),
        rule("dev.to", MatchTarget::WindowTitle, "Research", 0.75),
        rule("wikipedia", MatchTarget::WindowTitle, "Research", 0.70),

        // ─── Communication ────────────────────────────────
        rule("Slack", MatchTarget::AppName, "Communication", 0.90),
        rule("Discord", MatchTarget::AppName, "Communication", 0.85),
        rule("Microsoft Teams", MatchTarget::AppName, "Communication", 0.85),
        rule("Telegram", MatchTarget::AppName, "Communication", 0.85),
        rule("WhatsApp", MatchTarget::AppName, "Communication", 0.85),
        rule("Messages", MatchTarget::AppName, "Communication", 0.80),
        rule("Mail", MatchTarget::AppName, "Communication", 0.85),
        rule("Outlook", MatchTarget::AppName, "Communication", 0.85),
        rule("Gmail", MatchTarget::WindowTitle, "Communication", 0.85),
        rule("Thunderbird", MatchTarget::AppName, "Communication", 0.85),

        // ─── Meetings ─────────────────────────────────────
        rule("Zoom", MatchTarget::AppName, "Meetings", 0.95),
        rule("FaceTime", MatchTarget::AppName, "Meetings", 0.90),
        rule("Webex", MatchTarget::AppName, "Meetings", 0.95),
        rule("GoToMeeting", MatchTarget::AppName, "Meetings", 0.95),
        rule("BlueJeans", MatchTarget::AppName, "Meetings", 0.90),

        // ─── Design ───────────────────────────────────────
        rule("Figma", MatchTarget::AppName, "Design", 0.95),
        rule("Sketch", MatchTarget::AppName, "Design", 0.90),
        rule("Adobe XD", MatchTarget::AppName, "Design", 0.90),
        rule("Photoshop", MatchTarget::AppName, "Design", 0.85),
        rule("Illustrator", MatchTarget::AppName, "Design", 0.85),
        rule("Canva", MatchTarget::WindowTitle, "Design", 0.80),

        // ─── Productivity ─────────────────────────────────
        rule("Notion", MatchTarget::AppName, "Productivity", 0.85),
        rule("Obsidian", MatchTarget::AppName, "Productivity", 0.85),
        rule("Jira", MatchTarget::WindowTitle, "Productivity", 0.85),
        rule("Confluence", MatchTarget::WindowTitle, "Productivity", 0.80),
        rule("Trello", MatchTarget::WindowTitle, "Productivity", 0.80),
        rule("Linear", MatchTarget::WindowTitle, "Productivity", 0.80),
        rule("Asana", MatchTarget::WindowTitle, "Productivity", 0.80),
        rule("Google Docs", MatchTarget::WindowTitle, "Productivity", 0.80),
        rule("Google Sheets", MatchTarget::WindowTitle, "Productivity", 0.80),
        rule("Microsoft Word", MatchTarget::AppName, "Productivity", 0.85),
        rule("Microsoft Excel", MatchTarget::AppName, "Productivity", 0.85),
        rule("Microsoft PowerPoint", MatchTarget::AppName, "Productivity", 0.85),
        rule("Numbers", MatchTarget::AppName, "Productivity", 0.80),
        rule("Pages", MatchTarget::AppName, "Productivity", 0.80),
        rule("Keynote", MatchTarget::AppName, "Productivity", 0.80),
        rule("Preview", MatchTarget::AppName, "Productivity", 0.70),

        // ─── Entertainment ────────────────────────────────
        rule("YouTube", MatchTarget::WindowTitle, "Entertainment", 0.80),
        rule("Netflix", MatchTarget::WindowTitle, "Entertainment", 0.90),
        rule("Spotify", MatchTarget::AppName, "Entertainment", 0.85),
        rule("Apple Music", MatchTarget::AppName, "Entertainment", 0.80),
        rule("Twitter", MatchTarget::WindowTitle, "Entertainment", 0.75),
        rule("Reddit", MatchTarget::WindowTitle, "Entertainment", 0.70),
        rule("Instagram", MatchTarget::WindowTitle, "Entertainment", 0.80),
        rule("Facebook", MatchTarget::WindowTitle, "Entertainment", 0.75),
        rule("TikTok", MatchTarget::WindowTitle, "Entertainment", 0.85),
    ]
}

/// Helper to create a rule.
fn rule(pattern: &str, target: MatchTarget, category: &str, confidence: f64) -> ClassificationRule {
    ClassificationRule {
        pattern: pattern.to_string(),
        match_target: target,
        category: category.to_string(),
        confidence,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_rules_not_empty() {
        let rules = default_rules();
        assert!(rules.len() > 50);
    }

    #[test]
    fn test_all_categories_present() {
        let rules = default_rules();
        let categories: std::collections::HashSet<&str> =
            rules.iter().map(|r| r.category.as_str()).collect();

        assert!(categories.contains("Development"));
        assert!(categories.contains("Research"));
        assert!(categories.contains("Communication"));
        assert!(categories.contains("Meetings"));
        assert!(categories.contains("Design"));
        assert!(categories.contains("Productivity"));
        assert!(categories.contains("Entertainment"));
    }

    #[test]
    fn test_confidence_range() {
        let rules = default_rules();
        for rule in &rules {
            assert!(
                rule.confidence >= 0.0 && rule.confidence <= 1.0,
                "Rule '{}' has invalid confidence: {}",
                rule.pattern,
                rule.confidence
            );
        }
    }
}
