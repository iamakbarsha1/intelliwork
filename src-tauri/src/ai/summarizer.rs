#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(unused_variables)]
// Summary generator for IntelliWork.
//
// Generates end-of-day timesheet summaries from classified activities.
// Supports both local (rule-based) and AI-powered summaries.

use std::collections::HashMap;

use crate::storage::ActivityLog;

use serde::{Deserialize, Serialize};

/// Generated daily summary.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailySummary {
    /// Date this summary covers (YYYY-MM-DD)
    pub date: String,
    /// Total tracked seconds
    pub total_seconds: i64,
    /// Total productive seconds (excludes idle + entertainment)
    pub productive_seconds: i64,
    /// Breakdown by category
    pub categories: Vec<CategoryBreakdown>,
    /// Top applications by time
    pub top_apps: Vec<AppTimeEntry>,
    /// Number of meetings detected
    pub meeting_count: usize,
    /// Total meeting time in seconds
    pub meeting_seconds: i64,
    /// Plain-text summary
    pub text_summary: String,
}

/// Time breakdown for a single category.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryBreakdown {
    pub category: String,
    pub seconds: i64,
    pub percentage: f64,
    pub app_count: usize,
}

/// Time entry for a single application.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppTimeEntry {
    pub app_name: String,
    pub category: String,
    pub seconds: i64,
}

/// Summary generator.
pub struct SummaryGenerator;

impl SummaryGenerator {
    /// Generate a daily summary from a list of activities.
    pub fn generate(date: &str, activities: &[ActivityLog]) -> DailySummary {
        let total_seconds: i64 = activities
            .iter()
            .map(|a| a.duration_seconds)
            .sum();

        // Productive = everything except idle + entertainment
        let productive_seconds: i64 = activities
            .iter()
            .filter(|a| !a.is_idle && a.category != "Entertainment")
            .map(|a| a.duration_seconds)
            .sum();

        // Category breakdown
        let mut category_map: HashMap<String, (i64, usize)> = HashMap::new();
        for activity in activities {
            let entry = category_map
                .entry(activity.category.clone())
                .or_insert((0, 0));
            entry.0 += activity.duration_seconds;
            entry.1 += 1;
        }

        let mut categories: Vec<CategoryBreakdown> = category_map
            .into_iter()
            .map(|(cat, (secs, count))| {
                let percentage = if total_seconds > 0 {
                    (secs as f64 / total_seconds as f64) * 100.0
                } else {
                    0.0
                };
                CategoryBreakdown {
                    category: cat,
                    seconds: secs,
                    percentage,
                    app_count: count,
                }
            })
            .collect();

        // Sort by time descending
        categories.sort_by(|a, b| b.seconds.cmp(&a.seconds));

        // Top apps by time
        let mut app_map: HashMap<String, (String, i64)> = HashMap::new();
        for activity in activities {
            let entry = app_map
                .entry(activity.app_name.clone())
                .or_insert((activity.category.clone(), 0));
            entry.1 += activity.duration_seconds;
        }

        let mut top_apps: Vec<AppTimeEntry> = app_map
            .into_iter()
            .map(|(name, (cat, secs))| AppTimeEntry {
                app_name: name,
                category: cat,
                seconds: secs,
            })
            .collect();

        top_apps.sort_by(|a, b| b.seconds.cmp(&a.seconds));
        top_apps.truncate(10); // Top 10

        // Meeting stats
        let meeting_activities: Vec<&ActivityLog> = activities
            .iter()
            .filter(|a| a.is_meeting)
            .collect();
        let meeting_count = meeting_activities.len();
        let meeting_seconds: i64 = meeting_activities
            .iter()
            .map(|a| a.duration_seconds)
            .sum();

        // Generate text summary
        let text_summary = Self::generate_text_summary(
            date,
            total_seconds,
            productive_seconds,
            &categories,
            meeting_count,
            meeting_seconds,
        );

        DailySummary {
            date: date.to_string(),
            total_seconds,
            productive_seconds,
            categories,
            top_apps,
            meeting_count,
            meeting_seconds,
            text_summary,
        }
    }

    /// Generate a human-readable text summary.
    fn generate_text_summary(
        date: &str,
        total_seconds: i64,
        productive_seconds: i64,
        categories: &[CategoryBreakdown],
        meeting_count: usize,
        meeting_seconds: i64,
    ) -> String {
        let total_hours = total_seconds as f64 / 3600.0;
        let productive_hours = productive_seconds as f64 / 3600.0;

        let mut lines = Vec::new();
        lines.push(format!("📅 Daily Summary for {}", date));
        lines.push(format!(
            "⏱ Total: {:.1}h tracked, {:.1}h productive",
            total_hours, productive_hours
        ));

        if !categories.is_empty() {
            lines.push("📊 Breakdown:".to_string());
            for cat in categories.iter().take(5) {
                let hours = cat.seconds as f64 / 3600.0;
                lines.push(format!(
                    "  • {} — {:.1}h ({:.0}%)",
                    cat.category, hours, cat.percentage
                ));
            }
        }

        if meeting_count > 0 {
            let meeting_hours = meeting_seconds as f64 / 3600.0;
            lines.push(format!(
                "🤝 {} meeting(s), {:.1}h total",
                meeting_count, meeting_hours
            ));
        }

        lines.join("\n")
    }

    /// Generate an AI Weekly Insight from a list of activities.
    pub async fn generate_weekly_insights(
        activities: &[ActivityLog],
        llm: &crate::ai::llm::LlmClient,
    ) -> Result<String, crate::ai::errors::AiError> {
        if activities.is_empty() {
            return Ok("Not enough data to generate a weekly insight.".to_string());
        }
        
        let total_seconds: i64 = activities.iter().map(|a| a.duration_seconds).sum();
        let meeting_seconds: i64 = activities.iter().filter(|a| a.is_meeting).map(|a| a.duration_seconds).sum();
        
        // Group by day to find most productive day
        let mut daily_productive = HashMap::new();
        let mut category_map = HashMap::new();
        
        for a in activities {
            let day = a.start_time.split('T').next().unwrap_or("Unknown").to_string();
            let entry = daily_productive.entry(day).or_insert(0i64);
            if !a.is_idle && a.category != "Entertainment" {
                *entry += a.duration_seconds;
            }
            
            let cat_entry = category_map.entry(a.category.clone()).or_insert(0i64);
            *cat_entry += a.duration_seconds;
        }

        let mut prompt = String::new();
        prompt.push_str("Generate a weekly productivity insight summary for the user based on the following data.\n");
        prompt.push_str(&format!("Total time tracked: {:.1} hours\n", total_seconds as f64 / 3600.0));
        prompt.push_str(&format!("Meeting time: {:.1} hours\n", meeting_seconds as f64 / 3600.0));
        
        prompt.push_str("Daily productive hours:\n");
        for (day, secs) in daily_productive {
            prompt.push_str(&format!("- {}: {:.1} hours\n", day, secs as f64 / 3600.0));
        }

        prompt.push_str("Category breakdown (hours):\n");
        for (cat, secs) in category_map {
             prompt.push_str(&format!("- {}: {:.1} hours\n", cat, secs as f64 / 3600.0));
        }

        prompt.push_str("\nRequirements:\n");
        prompt.push_str("- Keep it concise and natural.\n");
        prompt.push_str("- Mention their most productive day.\n");
        prompt.push_str("- Comment on their meeting load if relevant.\n");
        prompt.push_str("- Provide exactly 1 actionable recommendation for next week.\n");

        if llm.is_ready() && !llm.provider().is_local() {
             llm.complete(&prompt).await
        } else {
             // Fallback for rule-based or unconfigured
             Ok("Weekly insight requires cloud AI capabilities to be configured (OpenAI or Gemini). For now, review your dashboard to assess your trends.".to_string())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::storage::ActivityLog;
    use chrono::Utc;

    fn make_activity(app: &str, category: &str, seconds: i64, is_meeting: bool) -> ActivityLog {
        let mut a = ActivityLog::new(app, Some("window"), Utc::now());
        a.duration_seconds = seconds;
        a.category = category.to_string();
        a.is_meeting = is_meeting;
        a
    }

    #[test]
    fn test_empty_activities() {
        let summary = SummaryGenerator::generate("2026-03-01", &[]);
        assert_eq!(summary.total_seconds, 0);
        assert_eq!(summary.productive_seconds, 0);
        assert!(summary.categories.is_empty());
    }

    #[test]
    fn test_basic_summary() {
        let activities = vec![
            make_activity("VS Code", "Development", 7200, false),
            make_activity("Chrome", "Research", 3600, false),
            make_activity("Zoom", "Meetings", 1800, true),
        ];

        let summary = SummaryGenerator::generate("2026-03-01", &activities);
        assert_eq!(summary.total_seconds, 12600);
        assert_eq!(summary.meeting_count, 1);
        assert_eq!(summary.meeting_seconds, 1800);
        assert_eq!(summary.categories.len(), 3);
    }

    #[test]
    fn test_productive_seconds_excludes_entertainment() {
        let activities = vec![
            make_activity("VS Code", "Development", 3600, false),
            make_activity("YouTube", "Entertainment", 1800, false),
        ];

        let summary = SummaryGenerator::generate("2026-03-01", &activities);
        assert_eq!(summary.total_seconds, 5400);
        assert_eq!(summary.productive_seconds, 3600);
    }

    #[test]
    fn test_category_breakdown_sorted() {
        let activities = vec![
            make_activity("VS Code", "Development", 7200, false),
            make_activity("Chrome", "Research", 1800, false),
            make_activity("Slack", "Communication", 3600, false),
        ];

        let summary = SummaryGenerator::generate("2026-03-01", &activities);
        assert_eq!(summary.categories[0].category, "Development");
        assert_eq!(summary.categories[1].category, "Communication");
        assert_eq!(summary.categories[2].category, "Research");
    }

    #[test]
    fn test_top_apps_limited_to_10() {
        let mut activities = Vec::new();
        for i in 0..15 {
            activities.push(make_activity(
                &format!("App{}", i),
                "Development",
                100 * (i as i64 + 1),
                false,
            ));
        }

        let summary = SummaryGenerator::generate("2026-03-01", &activities);
        assert!(summary.top_apps.len() <= 10);
    }

    #[test]
    fn test_text_summary_format() {
        let activities = vec![
            make_activity("VS Code", "Development", 7200, false),
        ];

        let summary = SummaryGenerator::generate("2026-03-01", &activities);
        assert!(summary.text_summary.contains("2026-03-01"));
        assert!(summary.text_summary.contains("Development"));
    }
}
