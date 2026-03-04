/**
 * SettingsPanel — Configurable tracking settings.
 */

import { useState } from "react";
import { Settings } from "lucide-react";

interface SettingsPanelProps {
  config: Record<string, string>;
  onUpdate: (key: string, value: string) => Promise<void>;
}

export function SettingsPanel({ config, onUpdate }: SettingsPanelProps) {
  const [saving, setSaving] = useState<string | null>(null);

  const handleToggle = async (key: string, current: string) => {
    setSaving(key);
    try {
      await onUpdate(key, current === "true" ? "false" : "true");
    } finally {
      setSaving(null);
    }
  };

  const handleChange = async (key: string, value: string) => {
    setSaving(key);
    try {
      await onUpdate(key, value);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="settings card" data-testid="settings-panel">
      <h3 style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", margin: 0, paddingBottom: "var(--space-4)" }}><Settings size={20} /> Settings</h3>

      <div className="settings__group">
        <h4>Tracking</h4>
        <SettingRow
          label="Enable Tracking"
          description="Automatically track foreground applications"
        >
          <Toggle
            checked={config.tracking_enabled === "true"}
            onChange={() => handleToggle("tracking_enabled", config.tracking_enabled ?? "true")}
            disabled={saving === "tracking_enabled"}
          />
        </SettingRow>

        <SettingRow
          label="Idle Threshold"
          description="Seconds before marking as idle"
        >
          <select
            className="settings__select"
            value={config.idle_threshold ?? "180"}
            onChange={(e) => handleChange("idle_threshold", e.target.value)}
            disabled={saving === "idle_threshold"}
          >
            <option value="60">1 minute</option>
            <option value="120">2 minutes</option>
            <option value="180">3 minutes</option>
            <option value="300">5 minutes</option>
            <option value="600">10 minutes</option>
          </select>
        </SettingRow>
      </div>

      <div className="settings__group">
        <h4>Office Hours</h4>
        <SettingRow
          label="Enable Office Hours"
          description="Only track during configured hours"
        >
          <Toggle
            checked={config.office_hours_enabled === "true"}
            onChange={() =>
              handleToggle("office_hours_enabled", config.office_hours_enabled ?? "false")
            }
            disabled={saving === "office_hours_enabled"}
          />
        </SettingRow>

        <SettingRow label="Start Time" description="">
          <input
            type="time"
            className="settings__input"
            value={config.office_hours_start ?? "09:00"}
            onChange={(e) => handleChange("office_hours_start", e.target.value)}
            disabled={saving === "office_hours_start"}
          />
        </SettingRow>

        <SettingRow label="End Time" description="">
          <input
            type="time"
            className="settings__input"
            value={config.office_hours_end ?? "18:00"}
            onChange={(e) => handleChange("office_hours_end", e.target.value)}
            disabled={saving === "office_hours_end"}
          />
        </SettingRow>
      </div>

      <div className="settings__group">
        <h4>AI Provider</h4>
        <SettingRow
          label="Classification Provider"
          description="How activities are categorized"
        >
          <select
            className="settings__select"
            value={config.ai_provider ?? "rule_based"}
            onChange={(e) => handleChange("ai_provider", e.target.value)}
            disabled={saving === "ai_provider"}
          >
            <option value="rule_based">Rule-Based (offline)</option>
            <option value="ollama">Ollama (local AI)</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Google Gemini</option>
          </select>
        </SettingRow>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="settings__row">
      <div className="settings__label-group">
        <span className="settings__label">{label}</span>
        {description && (
          <span className="settings__description text-tertiary">{description}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled: boolean;
}) {
  return (
    <button
      className={`toggle ${checked ? "toggle--on" : ""}`}
      onClick={onChange}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
    >
      <div className="toggle__thumb" />
    </button>
  );
}
