use crate::storage::models::ActivityLog;
use serde::{Deserialize, Serialize};
use std::cmp;
use chrono::{DateTime, Utc};

const DEEP_WORK_MIN_SECONDS: i64 = 15 * 60;
const HIGH_CONTEXT_SWITCH_THRESHOLD: usize = 10;
const HIGH_CONTEXT_SWITCH_WINDOW_SECONDS: i64 = 15 * 60;
const LONG_MEETING_STREAK_SECONDS: i64 = 2 * 60 * 60;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FocusScoreBreakdown {
    pub deep_work_ratio: i64,
    pub context_switch_score: i64,
    pub meeting_load_score: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FocusScoreResult {
    pub score: i64,
    pub label: String,
    pub color: String,
    pub breakdown: FocusScoreBreakdown,
    pub context_switch_count: usize,
    pub deep_work_seconds: i64,
    pub meeting_seconds: i64,
    pub total_seconds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Nudge {
    pub id: String,
    pub nudge_type: String,
    pub icon: String,
    pub message: String,
}

pub fn calculate_focus_score(activities: &[ActivityLog]) -> FocusScoreResult {
    if activities.is_empty() {
        return empty_result();
    }

    let non_idle: Vec<&ActivityLog> = activities.iter().filter(|a| !a.is_idle).collect();
    let total_seconds = non_idle.iter().map(|a| a.duration_seconds).sum::<i64>();

    if total_seconds == 0 {
        return empty_result();
    }

    // 1. Deep Work Ratio (40%)
    let deep_work_seconds = non_idle
        .iter()
        .filter(|a| a.duration_seconds >= DEEP_WORK_MIN_SECONDS && !a.is_meeting)
        .map(|a| a.duration_seconds)
        .sum::<i64>();
    let deep_work_ratio = std::cmp::min((deep_work_seconds as f64 / total_seconds as f64 * 100.0) as i64, 100);

    // 2. Context Switch Score (35%)
    let context_switch_count = non_idle.len().saturating_sub(1);
    let hours_tracked = f64::max(total_seconds as f64 / 3600.0, 0.5);
    let switches_per_hour = context_switch_count as f64 / hours_tracked;
    let context_switch_score = (100.0 - (switches_per_hour / 30.0 * 100.0)).clamp(0.0, 100.0) as i64;

    // 3. Meeting Load Score (25%)
    let meeting_seconds = non_idle
        .iter()
        .filter(|a| a.is_meeting || a.category == "Meetings")
        .map(|a| a.duration_seconds)
        .sum::<i64>();
    let meeting_ratio = meeting_seconds as f64 / total_seconds as f64;
    let meeting_load_score = (100.0 * (1.0 - meeting_ratio / 0.8)).clamp(0.0, 100.0) as i64;

    let score = ((deep_work_ratio as f64 * 0.4)
        + (context_switch_score as f64 * 0.35)
        + (meeting_load_score as f64 * 0.25))
        .round() as i64;
    let score = score.clamp(0, 100);

    FocusScoreResult {
        score,
        label: score_label(score),
        color: score_color(score),
        breakdown: FocusScoreBreakdown {
            deep_work_ratio,
            context_switch_score,
            meeting_load_score,
        },
        context_switch_count,
        deep_work_seconds,
        meeting_seconds,
        total_seconds,
    }
}

pub fn generate_nudges(activities: &[ActivityLog]) -> Vec<Nudge> {
    let mut nudges = Vec::new();
    let non_idle: Vec<&ActivityLog> = activities.iter().filter(|a| !a.is_idle).collect();

    if non_idle.is_empty() {
        return nudges;
    }

    let recent_switches = count_recent_switches(&non_idle, HIGH_CONTEXT_SWITCH_WINDOW_SECONDS);
    if recent_switches >= HIGH_CONTEXT_SWITCH_THRESHOLD {
        nudges.push(Nudge {
            id: "high-context-switch".into(),
            nudge_type: "warning".into(),
            icon: "🔄".into(),
            message: format!("High context switching detected ({} switches in 15 min). Try batching similar tasks.", recent_switches),
        });
    }

    let meeting_streak = get_longest_meeting_streak(&non_idle);
    if meeting_streak >= LONG_MEETING_STREAK_SECONDS {
        let hours = (meeting_streak as f64 / 3600.0 * 10.0).round() / 10.0;
        nudges.push(Nudge {
            id: "long-meeting-streak".into(),
            nudge_type: "warning".into(),
            icon: "📅".into(),
            message: format!("You've been in meetings for {}h straight. Consider blocking focus time.", hours),
        });
    }

    let longest_deep = get_longest_deep_work_session(&non_idle);
    if longest_deep >= 3600 {
        let hours = (longest_deep as f64 / 3600.0 * 10.0).round() / 10.0;
        nudges.push(Nudge {
            id: "great-deep-work".into(),
            nudge_type: "success".into(),
            icon: "🎯".into(),
            message: format!("Your longest deep work session is {}h — great flow! Keep it going.", hours),
        });
    }

    let short_sessions = non_idle.iter().filter(|a| a.duration_seconds < 120 && !a.is_meeting).count();
    if short_sessions > 15 {
        nudges.push(Nudge {
            id: "fragmented-work".into(),
            nudge_type: "info".into(),
            icon: "⚡".into(),
            message: format!("{} sessions under 2 minutes today. Consider deeper focus blocks.", short_sessions),
        });
    }

    nudges
}

fn empty_result() -> FocusScoreResult {
    FocusScoreResult {
        score: 0,
        label: "No data".into(),
        color: "var(--color-text-tertiary)".into(),
        breakdown: FocusScoreBreakdown {
            deep_work_ratio: 0,
            context_switch_score: 0,
            meeting_load_score: 0,
        },
        context_switch_count: 0,
        deep_work_seconds: 0,
        meeting_seconds: 0,
        total_seconds: 0,
    }
}

fn count_recent_switches(activities: &[&ActivityLog], window_seconds: i64) -> usize {
    if activities.len() < 2 {
        return 0;
    }

    let mut sorted = activities.to_vec();
    sorted.sort_by_key(|a| DateTime::parse_from_rfc3339(&a.start_time).unwrap_or_default().timestamp());
    sorted.reverse();

    let now = Utc::now().timestamp();
    let cutoff = now - window_seconds;

    sorted.iter().filter(|a| DateTime::parse_from_rfc3339(&a.start_time).unwrap_or_default().timestamp() >= cutoff).count()
}

fn get_longest_meeting_streak(activities: &[&ActivityLog]) -> i64 {
    let mut sorted: Vec<&&ActivityLog> = activities.iter().filter(|a| a.is_meeting || a.category == "Meetings").collect();
    if sorted.is_empty() {
        return 0;
    }

    sorted.sort_by_key(|a| DateTime::parse_from_rfc3339(&a.start_time).unwrap_or_default().timestamp());

    let mut max_streak = 0;
    let mut current_streak = sorted[0].duration_seconds;

    for i in 1..sorted.len() {
        let prev_end = if let Some(et) = &sorted[i - 1].end_time {
            DateTime::parse_from_rfc3339(et).unwrap_or_default().timestamp()
        } else {
            Utc::now().timestamp()
        };
        let curr_start = DateTime::parse_from_rfc3339(&sorted[i].start_time).unwrap_or_default().timestamp();
        let gap = curr_start - prev_end;

        if gap <= 300 {
            current_streak += sorted[i].duration_seconds + gap;
        } else {
            max_streak = cmp::max(max_streak, current_streak);
            current_streak = sorted[i].duration_seconds;
        }
    }
    cmp::max(max_streak, current_streak)
}

fn get_longest_deep_work_session(activities: &[&ActivityLog]) -> i64 {
    activities
        .iter()
        .filter(|a| !a.is_meeting && a.category != "Meetings" && a.duration_seconds >= DEEP_WORK_MIN_SECONDS)
        .map(|a| a.duration_seconds)
        .max()
        .unwrap_or(0)
}

fn score_label(score: i64) -> String {
    match score {
        80..=100 => "Excellent".into(),
        60..=79 => "Good".into(),
        40..=59 => "Fair".into(),
        20..=39 => "Low".into(),
        _ => "Very Low".into(),
    }
}

fn score_color(score: i64) -> String {
    match score {
        80..=100 => "#28bc6f".into(),
        60..=79 => "#3370ff".into(),
        40..=59 => "#f59e1a".into(),
        20..=39 => "#ee5c5c".into(),
        _ => "#b5bac5".into(),
    }
}

/// Generate AI-powered daily coach tips.
pub async fn generate_daily_coach_tips(
    activities: &[ActivityLog],
    llm: &super::llm::LlmClient,
) -> Result<String, super::errors::AiError> {
    if activities.is_empty() {
        return Ok("### Start Tracking\nTrack your work today to receive personalized coaching tips tomorrow!".to_string());
    }

    if llm.provider() == &super::llm::AiProvider::RuleBased {
        return Ok(generate_fallback_tips(activities));
    }

    let summary = activities
        .iter()
        .take(20) // Just a sample for context
        .map(|a| format!("- {} ({}s): {}", a.app_name, a.duration_seconds, a.window_title.as_deref().unwrap_or("")))
        .collect::<Vec<_>>()
        .join("\n");

    let prompt = format!(
        "You are an elite productivity coach. Based on these recent work activities, provide 3 tactical, actionable tips to improve tomorrow's performance. 
        Format your response exactly as follows:
        ### [Tip Title]
        [Brief Tip Content]
        
        Activities:
        {}",
        summary
    );

    llm.complete(&prompt).await
}

fn generate_fallback_tips(activities: &[ActivityLog]) -> String {
    // Basic heuristics for fallback
    let total_duration: i64 = activities.iter().map(|a| a.duration_seconds).sum();
    let meeting_duration: i64 = activities
        .iter()
        .filter(|a| a.is_meeting)
        .map(|a| a.duration_seconds)
        .sum();

    let mut tips = Vec::new();

    if total_duration > 8 * 3600 {
        tips.push("### Watch for Burnout\nYou've logged over 8 hours of active work. Consider a strictly offline evening to recharge.");
    } else {
        tips.push("### Goal Calibration\nReview your core objectives. Are your logged activities aligned with your top 3 priorities?");
    }

    if meeting_duration > 3 * 3600 {
        tips.push("### Meeting Recovery\nYou spent significant time in meetings. Schedule a 90-minute 'No-Meeting' block tomorrow for deep work.");
    } else {
        tips.push("### Deep Work Opportunity\nWith few meetings logged, tomorrow is perfect for a multi-hour deep work session on a complex task.");
    }

    tips.push("### Environment Audit\nSmall changes to your workspace can lead to big focus gains. Try clearing your physical desk before starting tomorrow.");

    tips.join("\n\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn mock_activity(category: &str, duration_seconds: i64, is_meeting: bool, is_idle: bool) -> ActivityLog {
        let mut log = ActivityLog::default();
        log.category = category.into();
        log.duration_seconds = duration_seconds;
        log.is_meeting = is_meeting;
        log.is_idle = is_idle;
        log
    }

    #[test]
    fn test_returns_zero_for_no_activities() {
        let result = calculate_focus_score(&[]);
        assert_eq!(result.score, 0);
        assert_eq!(result.label, "No data");
    }

    #[test]
    fn test_calculates_high_score_for_deep_work() {
        let activities = vec![
            mock_activity("Development", 3600, false, false),
            mock_activity("Development", 3600, false, false),
        ];
        let result = calculate_focus_score(&activities);
        assert!(result.score > 90);
        assert_eq!(result.breakdown.deep_work_ratio, 100);
    }

    #[test]
    fn test_penalizes_high_meeting_load() {
        let activities = vec![
            mock_activity("Meetings", 7200, true, false),
            mock_activity("Development", 1800, false, false),
        ];
        let result = calculate_focus_score(&activities);
        assert!(result.breakdown.meeting_load_score < 50);
        assert!(result.score < 60);
    }

    #[test]
    fn test_generate_nudges_long_meetings() {
        let activities = vec![
            mock_activity("Meetings", 7300, true, false),
        ];
        let nudges = generate_nudges(&activities);
        assert!(nudges.iter().any(|n| n.id == "long-meeting-streak"));
    }

    #[test]
    fn test_generate_nudges_deep_work() {
        let activities = vec![
            mock_activity("Development", 4000, false, false),
        ];
        let nudges = generate_nudges(&activities);
        assert!(nudges.iter().any(|n| n.id == "great-deep-work"));
    }
}
