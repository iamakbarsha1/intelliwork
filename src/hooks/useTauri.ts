/**
 * Custom hooks for Tauri IPC communication.
 *
 * Provides React hooks that wrap `invoke()` calls to the Rust backend,
 * managing loading/error states and auto-refresh.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

/** Tracking state from the Rust backend */
export interface TrackingState {
  is_tracking: boolean;
  is_idle: boolean;
  current_app: string | null;
  current_window: string | null;
  current_category: string;
  session_duration_seconds: number;
  today_total_seconds: number;
}

/** Activity log from DB */
export interface ActivityLog {
  id: string;
  app_name: string;
  window_title: string | null;
  start_time: string;
  end_time: string | null;
  duration_seconds: number;
  category: string;
  confidence: number;
  is_meeting: boolean;
  is_idle: boolean;
  browser_url?: string | null;
  created_at: string | null;
}

/** Hook: tracking state with polling */
export function useTracking(pollIntervalMs = 1000) {
  const [state, setState] = useState<TrackingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  const poll = useCallback(async () => {
    try {
      const result = await invoke<TrackingState>("poll_tracker");
      setState(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const startTracking = useCallback(async () => {
    try {
      const result = await invoke<TrackingState>("start_tracking");
      setState(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const stopTracking = useCallback(async () => {
    try {
      const result = await invoke<TrackingState>("stop_tracking");
      setState(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  // Start polling when tracking is active
  useEffect(() => {
    if (state?.is_tracking) {
      intervalRef.current = window.setInterval(poll, pollIntervalMs);
    }
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state?.is_tracking, poll, pollIntervalMs]);

  // Initial fetch
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const result = await invoke<TrackingState>("get_tracking_state");
        setState(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    };
    fetchInitial();
  }, []);

  return { state, error, startTracking, stopTracking, poll };
}

/** Hook: activities for a date */
export function useActivities(date: string) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await invoke<ActivityLog[]>("get_activities", { date });
      setActivities(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [date]);

  const deleteActivities = useCallback(async (ids: string[]) => {
    try {
      await invoke("delete_activities", { ids });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { activities, loading, error, refresh, deleteActivities };
}

/** Hook: config values */
export function useConfig() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const result = await invoke<Record<string, string>>("get_all_config");
      setConfig(result);
    } catch {
      // Config may not be available yet
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (key: string, value: string) => {
    await invoke("set_config", { key, value });
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { config, loading, updateConfig, refresh };
}

export interface DailySummaryRecord {
  id: string;
  summary_date: string;
  raw_summary: string;
  edited_summary: string | null;
  total_productive_seconds: number;
  category_breakdown: string;
  ai_provider: string;
  is_approved: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export function useAISummary(date: string) {
  const [summary, setSummary] = useState<DailySummaryRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await invoke<DailySummaryRecord | null>("get_summary", { date });
      setSummary(result);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [date]);

  const saveSummary = useCallback(async (newSummary: DailySummaryRecord) => {
    await invoke("upsert_summary", { summary: newSummary });
    await refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, loading, saveSummary, refresh };
}
