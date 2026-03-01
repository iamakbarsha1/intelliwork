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
  created_at: string | null;
}

/** Hook: tracking state with polling */
export function useTracking(pollIntervalMs = 5000) {
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

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { activities, loading, error, refresh };
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
    try {
      await invoke("set_config", { key, value });
      setConfig((prev) => ({ ...prev, [key]: value }));
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { config, loading, updateConfig, refresh };
}
