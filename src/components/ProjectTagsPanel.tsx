/**
 * ProjectTagsPanel — Manage project tagging rules.
 *
 * Displays existing pattern → project mappings, allows adding new ones
 * and deleting old ones. Integrates with the useProjectTags hook.
 */

import { useState } from "react";
import { Tag, Plus, Trash2, RefreshCw } from "lucide-react";
import { useProjectTags } from "../hooks/useTauri";

export function ProjectTagsPanel() {
  const { tags, loading, error, addTag, removeTag } = useProjectTags();

  const [pattern, setPattern] = useState("");
  const [projectName, setProjectName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimPat = pattern.trim();
    const trimProj = projectName.trim();
    if (!trimPat || !trimProj) return;

    setSaving(true);
    setSaveError(null);
    try {
      await addTag(trimPat, trimProj);
      setPattern("");
      setProjectName("");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Remove tag rule for project "${name}"?`)) return;
    try {
      await removeTag(id);
    } catch (err) {
      alert(`Failed to remove: ${err}`);
    }
  };

  return (
    <div className="settings__group" data-testid="project-tags-panel">
      <h4 style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <Tag size={16} /> Smart Project Tags
      </h4>

      <p
        className="text-secondary"
        style={{ margin: "0 0 var(--space-3)", fontSize: "var(--font-size-sm)", lineHeight: 1.5 }}
      >
        Map keyword patterns to project names. When a window title or URL contains the
        pattern, that activity is automatically tagged with the project name — including
        retroactively on past data.
      </p>

      {/* Add new rule form */}
      <form
        onSubmit={handleAdd}
        style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-3)", flexWrap: "wrap" }}
      >
        <input
          className="settings__input"
          style={{ flex: "1 1 160px", minWidth: 0 }}
          type="text"
          placeholder="Pattern (e.g. auth-service)"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          required
          aria-label="Pattern keyword"
        />
        <input
          className="settings__input"
          style={{ flex: "1 1 140px", minWidth: 0 }}
          type="text"
          placeholder="Project name (e.g. Auth Refactor)"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          required
          aria-label="Project name"
        />
        <button
          type="submit"
          className="btn btn--primary"
          disabled={saving || !pattern.trim() || !projectName.trim()}
          style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", whiteSpace: "nowrap" }}
        >
          {saving ? <RefreshCw size={14} className="spin" /> : <Plus size={14} />}
          Add Rule
        </button>
      </form>

      {saveError && (
        <p style={{ color: "var(--color-danger)", fontSize: "var(--font-size-sm)", margin: "0 0 var(--space-2)" }}>
          {saveError}
        </p>
      )}

      {/* Rules list */}
      {loading ? (
        <p className="text-secondary" style={{ fontSize: "var(--font-size-sm)" }}>Loading…</p>
      ) : error ? (
        <p style={{ color: "var(--color-danger)", fontSize: "var(--font-size-sm)" }}>{error}</p>
      ) : tags.length === 0 ? (
        <p className="text-tertiary" style={{ fontSize: "var(--font-size-sm)", fontStyle: "italic" }}>
          No rules yet — add one above.
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
            maxHeight: "280px",
            overflowY: "auto",
          }}
        >
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="settings__row"
              style={{ alignItems: "center" }}
              data-testid={`tag-row-${tag.id}`}
            >
              <div className="settings__label-group" style={{ gap: "var(--space-1)" }}>
                <code
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "4px",
                    padding: "2px 6px",
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-primary)",
                  }}
                >
                  {tag.title_pattern}
                </code>
                <span className="text-tertiary" style={{ fontSize: "var(--font-size-sm)" }}>→</span>
                <span
                  className="badge"
                  style={{
                    backgroundColor: "hsla(175,60%,40%,0.15)",
                    color: "hsl(175,60%,55%)",
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                  }}
                >
                  <Tag size={10} /> {tag.project_name}
                </span>
              </div>
              <button
                className="btn btn--secondary"
                onClick={() => handleDelete(tag.id, tag.project_name)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-danger)",
                  cursor: "pointer",
                  padding: "var(--space-1)",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Remove this rule"
                aria-label={`Remove rule for ${tag.project_name}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
