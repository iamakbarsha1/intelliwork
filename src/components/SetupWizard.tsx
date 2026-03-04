import { useState } from "react";
import { SettingsPanel } from "./SettingsPanel";
import { PartyPopper } from "lucide-react";

interface SetupWizardProps {
  config: Record<string, string>;
  onUpdateConfig: (key: string, value: string) => Promise<void>;
  onComplete: () => void;
}

export function SetupWizard({ config, onUpdateConfig, onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);

  const nextStep = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card animate-fade-in">
        <div className="onboarding-header">
          <h1 className="onboarding-title">🛠 Quick Setup</h1>
          <p className="onboarding-subtitle">
            Let's configure tracking to fit your workflow. You can change these later.
          </p>
        </div>

        <div className="wizard-progress">
          <div className={`wizard-step-dot ${step >= 1 ? "wizard-step-dot--completed" : ""}`}>
            1
          </div>
          <div className={`wizard-step-dot ${step >= 2 ? (step === 2 ? "wizard-step-dot--active" : "wizard-step-dot--completed") : ""}`}>
            2
          </div>
        </div>

        <div className="wizard-step-content styled-scroll">
          {step === 1 && (
            <div className="animate-slide-in">
              <h3 style={{ marginBottom: "1rem" }}>Office Hours Setting</h3>
              <p className="text-secondary" style={{ marginBottom: "1.5rem" }}>
                IntelliWork can seamlessly start and stop tracking along with your default office hours.
              </p>
              {/* Reuse part of the SettingsPanel conceptually or inject via wrapper */}
              <SettingsPanel config={config} onUpdate={onUpdateConfig} />
            </div>
          )}

          {step === 2 && (
            <div className="animate-slide-in text-center">
              <div className="onboarding-icon" style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-4)" }}>
                <PartyPopper size={48} color="var(--color-primary)" />
              </div>
              <h3>You're All Set!</h3>
              <p className="text-secondary" style={{ marginTop: "1rem" }}>
                IntelliWork is ready. Your tracking toggle is currently set to:{" "}
                <strong>{config.tracking_enabled === "true" ? "Auto-Track On" : "Auto-Track Off"}</strong>
              </p>
              <br />
              <p className="text-tertiary">
                The app will sit quietly in your system tray to monitor activity. 
              </p>
            </div>
          )}
        </div>

        <div className="buttons-row" style={{ marginTop: "1rem" }}>
          {step > 1 && (
            <button className="btn btn--secondary" onClick={prevStep}>
              Back
            </button>
          )}
          <button className="btn btn--primary" onClick={nextStep} data-testid="wizard-next-btn">
            {step === 2 ? "Finish Setup & Open Dashboard" : "Next Step"}
          </button>
        </div>
      </div>
    </div>
  );
}
