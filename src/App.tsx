import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Zap, LayoutDashboard, Settings, Sun, Moon, AlertTriangle, Activity } from "lucide-react";

import { TrackingToggle } from "./components/TrackingToggle";
import { ActivityTimeline } from "./components/ActivityTimeline";
import { CategoryChart } from "./components/CategoryChart";
import { DailySummary } from "./components/DailySummary";
import { SettingsPanel } from "./components/SettingsPanel";
import { ConsentScreen } from "./components/ConsentScreen";
import { SetupWizard } from "./components/SetupWizard";
import { ExportPanel } from "./components/ExportPanel";
import { LiveView } from "./components/LiveView";
import { FocusScore } from "./components/FocusScore";
import { useTracking, useActivities, useConfig } from "./hooks/useTauri";

import type { AppInfo } from "./lib/types";
import { APP_NAME } from "./lib/constants";
import { getTodayDate } from "./lib/utils";

import "./styles/globals.css";
import "./styles/dashboard.css";
import "./styles/consent.css";
import { WeeklyTrends } from "./components/WeeklyTrends";
import "./styles/focus-score.css";
import "./styles/weekly-trends.css";

type View = "dashboard" | "trends" | "settings" | "consent" | "setup" | "live";

/**
 * Root application component.
 *
 * Phase 6: Full dashboard with activity timeline, category chart,
 * daily summary, tracking toggle, and settings panel.
 */
function App() {
  const [view, setView] = useState<View>("live");
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const today = getTodayDate();
  const tracking = useTracking();
  const { activities, loading: activitiesLoading, refresh: refreshActivities, deleteActivities } = useActivities(today);
  const { config, loading: configLoading, updateConfig } = useConfig();

  // Redirect to onboarding if needed
  useEffect(() => {
    if (!configLoading && config.onboarding_completed !== "true") {
      setView((prev) => (prev === "dashboard" || prev === "settings" || prev === "live" ? "consent" : prev));
    }
  }, [configLoading, config.onboarding_completed]);

  // Fetch app info
  const fetchAppInfo = useCallback(async () => {
    try {
      const info = await invoke<AppInfo>("get_app_info");
      setAppInfo(info);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    fetchAppInfo();
  }, [fetchAppInfo]);

  // Auto-refresh activities when tracking polls
  useEffect(() => {
    if (tracking.state?.is_tracking) {
      const interval = setInterval(async () => {
        try {
          await invoke("flush_tracker");
        } catch (e) {
          console.error("Failed to flush activities", e);
        }
        refreshActivities();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [tracking.state?.is_tracking, refreshActivities]);

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <main
      className={`dashboard`}
      data-testid="app-root"
    >
      {/* Header */}
      <div className="dashboard__header animate-fade-in">
        <div className="dashboard__brand">
          <Zap className="dashboard__logo" size={24} color="var(--color-primary)" />
          <span className="dashboard__title">{APP_NAME}</span>
          {appInfo && (
            <span className="badge badge--neutral">v{appInfo.version}</span>
          )}
        </div>
        <div className="dashboard__nav">
          <button
            className={`dashboard__nav-btn ${view === "live" ? "dashboard__nav-btn--active" : ""}`}
            onClick={() => setView("live")}
          >
            <Activity size={18} /> Live Activity
          </button>
          <button
            className={`dashboard__nav-btn ${view === "dashboard" ? "dashboard__nav-btn--active" : ""}`}
            onClick={() => setView("dashboard")}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button
            className={`dashboard__nav-btn ${view === "trends" ? "dashboard__nav-btn--active" : ""}`}
            onClick={() => setView("trends")}
          >
            <Activity size={18} /> Trends
          </button>
          <button
            className={`dashboard__nav-btn ${view === "settings" ? "dashboard__nav-btn--active" : ""}`}
            onClick={() => setView("settings")}
          >
            <Settings size={18} /> Settings
          </button>
          <button
            className="dashboard__nav-btn"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {(error || tracking.error) && (
        <div className="card" style={{ borderColor: "var(--color-danger)", flexShrink: 0 }}>
          <span className="text-danger" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertTriangle size={18} /> {error || tracking.error}
          </span>
        </div>
      )}

      {/* Tracking Toggle Bar */}
      <TrackingToggle
        state={tracking.state}
        onStart={tracking.startTracking}
        onStop={tracking.stopTracking}
      />

      {/* Main Content Area */}
      {view === "live" && tracking.state && (
        <LiveView activities={activities} tracking={tracking.state} />
      )}

      {view === "dashboard" ? (
          <div className="dashboard-grid">
            {/* Left Column: Summary + Daily Stats */}
            <div className="dashboard-column">
              <ExportPanel date={today} />
              <FocusScore activities={activities} />
              <DailySummary date={today} activities={activities} />
              <CategoryChart activities={activities} />
            </div>

            {/* Right Column: Timeline */}
            <div className="dashboard-column">
              <ActivityTimeline 
                activities={activities} 
                loading={activitiesLoading} 
                onDelete={(id) => deleteActivities([id])}
                onDeleteAll={() => deleteActivities(activities.map(a => a.id))}
              />
            </div>
          </div>
      ) : view === "trends" ? (
        <WeeklyTrends />
      ) : (
        <SettingsPanel config={config} onUpdate={updateConfig} />
      )}

      {/* Onboarding Overlays */}
      {!configLoading && config.onboarding_completed !== "true" && (
        view === "consent" ? (
          <ConsentScreen
            onAccept={() => setView("setup")}
            onDecline={() => invoke("plugin:process|exit", { code: 0 }).catch(() => window.close())}
          />
        ) : view === "setup" ? (
          <SetupWizard
            config={config}
            onUpdateConfig={updateConfig}
            onComplete={async () => {
              await updateConfig("onboarding_completed", "true");
              setView("dashboard");
            }}
          />
        ) : null
      )}
    </main>
  );
}

export default App;
