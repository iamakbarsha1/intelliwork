/**
 * TrackingToggle — Start/Stop tracking with animated status indicator.
 */

import { type TrackingState } from "../hooks/useTauri";
import { formatDuration } from "../lib/utils";

interface TrackingToggleProps {
  state: TrackingState | null;
  onStart: () => void;
  onStop: () => void;
}

export function TrackingToggle({ state, onStart, onStop }: TrackingToggleProps) {
  const isTracking = state?.is_tracking ?? false;
  const isIdle = state?.is_idle ?? false;

  return (
    <div className="tracking-toggle" data-testid="tracking-toggle">
      <div className="tracking-toggle__status">
        <div
          className={`tracking-toggle__indicator ${
            isTracking
              ? isIdle
                ? "tracking-toggle__indicator--idle"
                : "tracking-toggle__indicator--active"
              : "tracking-toggle__indicator--stopped"
          }`}
        />
        <div className="tracking-toggle__info">
          <span className="tracking-toggle__label">
            {isTracking
              ? isIdle
                ? "Idle"
                : "Tracking"
              : "Stopped"}
          </span>
          {state?.current_app && (
            <span className="tracking-toggle__app text-secondary">
              {state.current_app}
            </span>
          )}
        </div>
      </div>

      <div className="tracking-toggle__actions">
        {state && (
          <span className="tracking-toggle__duration text-tertiary">
            {formatDuration(state.session_duration_seconds)}
          </span>
        )}
        <button
          className={`btn ${isTracking ? "btn--danger" : "btn--primary"}`}
          onClick={isTracking ? onStop : onStart}
          data-testid="tracking-toggle-btn"
        >
          {isTracking ? "⏹ Stop" : "▶ Start"}
        </button>
      </div>
    </div>
  );
}
