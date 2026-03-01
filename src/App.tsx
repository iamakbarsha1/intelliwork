import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

import { TrackingToggle } from "./components/TrackingToggle";
import { ActivityTimeline } from "./components/ActivityTimeline";
import { CategoryChart } from "./components/CategoryChart";
import { DailySummary } from "./components/DailySummary";
import { SettingsPanel } from "./components/SettingsPanel";
import { ConsentScreen } from "./components/ConsentScreen";
import { SetupWizard } from "./components/SetupWizard";
import { ExportPanel } from "./components/ExportPanel";
import { useTracking, useActivities, useConfig } from "./hooks/useTauri";

import type { AppInfo } from "./lib/types";
import { APP_NAME } from "./lib/constants";
import { getTodayDate } from "./lib/utils";

import "./styles/globals.css";
import "./styles/dashboard.css";
import "./styles/consent.css";

type View = "dashboard" | "settings" | "consent" | "setup";

/**
 * Root application component.
 *
 * Phase 6: Full dashboard with activity timeline, category chart,
 * daily summary, tracking toggle, and settings panel.
 */
function App() {
  const [view, setView] = useState<View>("dashboard");
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
      setView((prev) => (prev === "dashboard" || prev === "settings" ? "consent" : prev));
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
      const interval = setInterval(refreshActivities, 30000);
      return () => clearInterval(interval);
    }
  }, [tracking.state?.is_tracking, refreshActivities]);

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <main
      className={`dashboard ${view === "settings" ? "dashboard--settings" : ""}`}
      data-testid="app-root"
    >
      {/* Header */}
      <div className="dashboard__header animate-fade-in">
        <div className="dashboard__brand">
          <span className="dashboard__logo">⚡</span>
          <span className="dashboard__title">{APP_NAME}</span>
          {appInfo && (
            <span className="badge badge--neutral">v{appInfo.version}</span>
          )}
        </div>
        <div className="dashboard__nav">
          <button
            className={`dashboard__nav-btn ${view === "dashboard" ? "dashboard__nav-btn--active" : ""}`}
            onClick={() => setView("dashboard")}
          >
            📊 Dashboard
          </button>
          <button
            className={`dashboard__nav-btn ${view === "settings" ? "dashboard__nav-btn--active" : ""}`}
            onClick={() => setView("settings")}
          >
            ⚙️ Settings
          </button>
          <button
            className="dashboard__nav-btn"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {(error || tracking.error) && (
        <div className="card" style={{ gridColumn: "1 / -1", borderColor: "var(--color-danger)" }}>
          <span className="text-danger">
            ⚠ {error || tracking.error}
          </span>
        </div>
      )}

      {/* Tracking Toggle Bar */}
      <TrackingToggle
        state={tracking.state}
        onStart={tracking.startTracking}
        onStop={tracking.stopTracking}
      />

      {/* Main Content */}
      {view === "dashboard" ? (
          <div className="dashboard-grid">
            {/* Left Column: Summary + Daily Stats */}
            <div className="dashboard-column styled-scroll">
              <ExportPanel date={today} />
              <DailySummary date={today} activities={activities} />
              <CategoryChart activities={activities} />
            </div>

            {/* Right Column: Timeline */}
            <div style={{ gridColumn: "1 / -1" }}>
              <ActivityTimeline 
                activities={activities} 
                loading={activitiesLoading} 
                onDelete={(id) => deleteActivities([id])}
                onDeleteAll={() => deleteActivities(activities.map(a => a.id))}
              />
            </div>
          </div>
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
