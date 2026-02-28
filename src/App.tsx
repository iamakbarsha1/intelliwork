import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

import type { AppInfo } from "./lib/types";
import { APP_NAME } from "./lib/constants";
import "./styles/globals.css";
import "./styles/app.css";

/**
 * Root application component.
 *
 * Phase 1: Shows a branded landing screen with app info from the Rust backend.
 * Phase 6+: Will include routing between Dashboard, Settings, ConsentScreen.
 */
function App() {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="app" data-testid="app-root">
      <div className="app__hero animate-fade-in">
        <div className="app__logo">⚡</div>
        <h1 className="app__title">{APP_NAME}</h1>
        <p className="app__subtitle">AI-Powered Work Intelligence Assistant</p>

        {appInfo ? (
          <div className="app__info card animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="app__info-row">
              <span className="text-secondary">Version</span>
              <span className="app__info-value">{appInfo.version}</span>
            </div>
            <div className="app__info-row">
              <span className="text-secondary">Backend</span>
              <span className="app__info-value app__status app__status--connected">
                Connected (Rust)
              </span>
            </div>
            <div className="app__info-row">
              <span className="text-secondary">Status</span>
              <span className="app__info-value">Ready for Phase 2</span>
            </div>
          </div>
        ) : error ? (
          <div className="app__error card">
            <span className="text-danger">⚠ Backend error: {error}</span>
          </div>
        ) : (
          <div className="app__loading animate-pulse">
            <span className="text-secondary">Connecting to backend...</span>
          </div>
        )}

        <div className="app__features animate-fade-in" style={{ animationDelay: "400ms" }}>
          <div className="app__feature">
            <span className="app__feature-icon">🔍</span>
            <span>Smart Tracking</span>
          </div>
          <div className="app__feature">
            <span className="app__feature-icon">🤖</span>
            <span>AI Classification</span>
          </div>
          <div className="app__feature">
            <span className="app__feature-icon">📊</span>
            <span>Auto Summaries</span>
          </div>
          <div className="app__feature">
            <span className="app__feature-icon">🔐</span>
            <span>Privacy First</span>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
