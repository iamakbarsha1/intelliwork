import { useState } from "react";
import { Shield, Monitor, Bot, Settings } from "lucide-react";

interface ConsentScreenProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentScreen({ onAccept, onDecline }: ConsentScreenProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card animate-fade-in text-center">
        <div className="onboarding-header">
          <div className="onboarding-icon" style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-4)" }}>
            <Shield size={48} color="var(--color-primary)" />
          </div>
          <h1 className="onboarding-title">Privacy & Data Security</h1>
          <p className="onboarding-subtitle">How IntelliWork handles your data.</p>
        </div>

        <div className="consent-sections text-left">
          <div className="consent-section">
            <span className="consent-section__icon" style={{ display: "flex", alignItems: "center" }}><Monitor size={24} color="var(--color-primary)" /></span>
            <div className="consent-section__content">
              <span className="consent-section__title">Local Storage Only</span>
              <span className="text-secondary text-sm">
                All tracking data (activities, timeline, stats) is stored locally on your machine in an encrypted database. IntelliWork never uploads your raw activity timeline to our servers.
              </span>
            </div>
          </div>

          <div className="consent-section">
            <span className="consent-section__icon" style={{ display: "flex", alignItems: "center" }}><Bot size={24} color="var(--color-primary)" /></span>
            <div className="consent-section__content">
              <span className="consent-section__title">AI Analysis & Anonymization</span>
              <span className="text-secondary text-sm">
                If you opt to use a cloud-based AI provider (like OpenAI or Gemini) for summary generation, the app will automatically anonymize window titles — stripping emails, URLs, and file paths — before sending the activity list for processing. The AI provider only sees sanitized app names and durations.
              </span>
            </div>
          </div>

          <div className="consent-section">
            <span className="consent-section__icon" style={{ display: "flex", alignItems: "center" }}><Settings size={24} color="var(--color-primary)" /></span>
            <div className="consent-section__content">
              <span className="consent-section__title">OS Permissions Needed</span>
              <span className="text-secondary text-sm">
                To track the active app window, IntelliWork requires "Screen Recording" and "Accessibility" permissions on macOS, and equivalent permissions on Windows/Linux. It does not actually record your screen visually, only the window metadata.
              </span>
            </div>
          </div>
        </div>

        <div className="consent-actions">
          <label className="consent-checkbox">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              data-testid="consent-checkbox"
            />
            <span className="consent-checkbox__text">
              I understand how my data is used and stored, and I am ready to configure IntelliWork.
            </span>
          </label>

          <div className="buttons-row">
            <button className="btn btn--secondary" onClick={onDecline}>
              Decline & Quit
            </button>
            <button
              className="btn btn--primary"
              onClick={onAccept}
              disabled={!agreed}
              data-testid="consent-accept-btn"
            >
              Continue to Setup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
