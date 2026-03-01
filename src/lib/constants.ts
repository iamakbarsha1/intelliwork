/**
 * Application-wide constants.
 */
import type { Category } from "./types";
import { Terminal, Lightbulb, MessageSquare, Calendar, ClipboardList, FileText, Palette, BarChart, HelpCircle } from "lucide-react";

/** Colors for each activity category */
export const CATEGORY_COLORS: Record<Category, string> = {
  Development: "hsl(210, 80%, 55%)",
  Research: "hsl(280, 70%, 55%)",
  Communication: "hsl(150, 65%, 45%)",
  Meetings: "hsl(35, 90%, 55%)",
  Administration: "hsl(200, 30%, 55%)",
  Documentation: "hsl(170, 60%, 45%)",
  Design: "hsl(320, 70%, 55%)",
  "Project Management": "hsl(50, 80%, 50%)",
  Uncategorized: "hsl(0, 0%, 55%)",
};

/** Icons for each category */
export const CATEGORY_ICONS: Record<Category, React.ElementType> = {
  Development: Terminal,
  Research: Lightbulb,
  Communication: MessageSquare,
  Meetings: Calendar,
  Administration: ClipboardList,
  Documentation: FileText,
  Design: Palette,
  "Project Management": BarChart,
  Uncategorized: HelpCircle,
};

/** Application metadata */
export const APP_NAME = "IntelliWork";
export const APP_VERSION = "0.1.0";

/** Default configuration values */
export const DEFAULT_OFFICE_HOURS_START = "09:00";
export const DEFAULT_OFFICE_HOURS_END = "18:00";
export const DEFAULT_IDLE_THRESHOLD_SECONDS = 180;
export const POLLING_INTERVAL_MS = 5000;
export const WRITE_BATCH_INTERVAL_MS = 30000;
