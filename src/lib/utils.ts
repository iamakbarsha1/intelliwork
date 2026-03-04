/**
 * Utility functions for formatting and data manipulation.
 */

/**
 * Format seconds into a human-readable duration string.
 * @param seconds - Duration in seconds
 * @returns Formatted string like "2h 30m" or "45m" or "0m"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) return "0m";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

/**
 * Format an ISO 8601 timestamp to a human-readable time string.
 * @param isoString - ISO 8601 timestamp
 * @returns Formatted time like "09:30 AM"
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format an ISO date string to a human-readable date.
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date like "March 1, 2026"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get today's date in YYYY-MM-DD format.
 * @returns Today's date string
 */
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Calculate the percentage of a value relative to a total.
 * @param value - The part
 * @param total - The whole
 * @returns Percentage (0-100), or 0 if total is 0
 */
export function calculatePercentage(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Get a consistent color for a category.
 * @param category - Activity category name
 * @returns HSL color string
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Development: "#2F73F6",
    Research: "#7845F0",
    Communication: "#F59E1A",
    Meetings: "#28BC6F",
    Design: "#DE31AD",
    Productivity: "#199BE6",
    Entertainment: "#EE5C5C",
    Uncategorized: "#B5BAC5",
  };
  return colors[category] ?? colors.Uncategorized;
}
