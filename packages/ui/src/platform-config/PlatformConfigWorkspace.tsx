import { useEffect, useMemo, useState } from "react";
import { cx } from "../utils/cx.js";
import {
  PLATFORM_CONFIG_SECTIONS,
  diffPlatformConfig,
  fieldsForSection,
  platformConfigSectionLabel,
  validatePlatformConfig,
  type PlatformConfigChangeLogEntry,
  type PlatformConfigDocument,
  type PlatformConfigFieldDef,
  type PlatformConfigRollbackInput,
  type PlatformConfigSaveInput,
  type PlatformConfigSection,
  type PlatformConfigValidationIssue,
  type PlatformConfigValues,
  type PlatformConfigVersion,
} from "./types.js";

export type PlatformConfigWorkspaceTab = "editor" | "versions" | "audit";

export type PlatformConfigWorkspaceProps = {
  document: PlatformConfigDocument;
  versions?: PlatformConfigVersion[] | undefined;
  changeLog?: PlatformConfigChangeLogEntry[] | undefined;
  title?: string | undefined;
  loading?: boolean | undefined;
  className?: string | undefined;
  canSave?: boolean | undefined;
  canRollback?: boolean | undefined;
  onSave?: ((input: PlatformConfigSaveInput) => void | Promise<void>) | undefined;
  onRollback?: ((
    input: PlatformConfigRollbackInput,
  ) => void | Promise<void>) | undefined;
  onValidate?: ((
    issues: PlatformConfigValidationIssue[],
  ) => void) | undefined;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString();
}

function FieldControl({
  field,
  value,
  error,
  onChange,
}: {
  field: PlatformConfigFieldDef;
  value: string | number | boolean | undefined;
  error?: string | undefined;
  onChange: (next: string | number | boolean) => void;
}) {
  const id = `hamd-pc-field-${field.key}`;

  if (field.type === "boolean") {
    return (
      <label className="hamd-pc-switch" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          <strong>{field.label}</strong>
          {field.description ? <em>{field.description}</em> : null}
        </span>
      </label>
    );
  }

  return (
    <label className="hamd-pc-field" htmlFor={id}>
      <span className="hamd-pc-field__label">
        {field.label}
        {field.required ? " *" : ""}
      </span>
      {field.description ? (
        <span className="hamd-pc-field__hint">{field.description}</span>
      ) : null}
      {field.type === "textarea" ? (
        <textarea
          id={id}
          rows={3}
          value={String(value ?? "")}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === "select" ? (
        <select
          id={id}
          value={String(value ?? "")}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
        >
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={
            field.type === "number"
              ? "number"
              : field.type === "secret"
                ? "password"
                : field.type === "email"
                  ? "email"
                  : field.type === "url"
                    ? "url"
                    : "text"
          }
          value={value === undefined || value === null ? "" : String(value)}
          aria-invalid={error ? true : undefined}
          autoComplete={field.secret ? "new-password" : undefined}
          onChange={(e) => {
            if (field.type === "number") {
              const n = Number(e.target.value);
              onChange(Number.isNaN(n) ? 0 : n);
              return;
            }
            onChange(e.target.value);
          }}
        />
      )}
      {error ? (
        <span className="hamd-pc-field__error" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function PlatformConfigWorkspaceSkeleton({
  className,
}: {
  className?: string | undefined;
}) {
  return (
    <div
      className={cx("hamd-pc", "hamd-pc--skeleton", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hamd-pc-skel hamd-pc-skel--nav" />
      <div className="hamd-pc-skel hamd-pc-skel--form" />
    </div>
  );
}

/**
 * Centralized platform configuration - typed sections, draft save,
 * validation, rollback, and config change audit trail. Presentational.
 */
export function PlatformConfigWorkspace({
  document,
  versions = [],
  changeLog = [],
  title = "Platform configuration",
  loading,
  className,
  canSave = true,
  canRollback = true,
  onSave,
  onRollback,
  onValidate,
}: PlatformConfigWorkspaceProps) {
  const [section, setSection] = useState<PlatformConfigSection>("general");
  const [tab, setTab] = useState<PlatformConfigWorkspaceTab>("editor");
  const [draft, setDraft] = useState<PlatformConfigValues>(document.values);
  const [issues, setIssues] = useState<PlatformConfigValidationIssue[]>([]);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setDraft(document.values);
    setIssues([]);
  }, [document.id, document.rowVersion]);

  const dirtyKeys = useMemo(
    () => diffPlatformConfig(document.values, draft),
    [document.values, draft],
  );

  const issueByField = useMemo(() => {
    const map = new Map<string, string>();
    for (const issue of issues) map.set(issue.field, issue.message);
    return map;
  }, [issues]);

  if (loading) {
    return <PlatformConfigWorkspaceSkeleton className={className} />;
  }

  const run = async (fn?: () => void | Promise<void>, ok?: string) => {
    setError(null);
    try {
      await fn?.();
      if (ok) setToast(ok);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    }
  };

  const runValidation = () => {
    const next = validatePlatformConfig(draft);
    setIssues(next);
    onValidate?.(next);
    return next;
  };

  const fields = fieldsForSection(section);

  return (
    <div
      className={cx(
        "hamd-pc",
        mobileOpen && "hamd-pc--detail-open",
        className,
      )}
    >
      <a className="hamd-pc__skip" href="#hamd-pc-editor">
        Skip to settings editor
      </a>

      <header className="hamd-pc__header">
        <div>
          <h1 className="hamd-pc__title">{title}</h1>
          <p className="hamd-pc__subtitle">
            Centralized settings for general, branding, email, notifications,
            authentication, security, storage, AI, integrations, payments, SEO,
            maintenance, and wedding campaign - with save, validation, rollback,
            and audit logging.
          </p>
          <p className="hamd-pc__meta">
            v{document.version}
            {document.updatedBy ? ` · ${document.updatedBy}` : ""} ·{" "}
            {formatWhen(document.updatedAt)}
            {dirtyKeys.length
              ? ` · ${dirtyKeys.length} unsaved change${dirtyKeys.length === 1 ? "" : "s"}`
              : " · In sync"}
          </p>
        </div>
      </header>

      <div className="hamd-pc-actions" role="group" aria-label="Configuration actions">
        <button
          type="button"
          className="hamd-pc-btn"
          onClick={() => {
            const next = runValidation();
            setToast(
              next.length
                ? `${next.length} validation issue${next.length === 1 ? "" : "s"}`
                : "Validation passed",
            );
          }}
        >
          Validate
        </button>
        {canSave ? (
          <button
            type="button"
            className="hamd-pc-btn hamd-pc-btn--primary"
            disabled={!dirtyKeys.length}
            onClick={() =>
              void run(async () => {
                const next = runValidation();
                if (next.length) {
                  throw new Error(
                    `Fix ${next.length} validation issue${next.length === 1 ? "" : "s"} before save.`,
                  );
                }
                await onSave?.({
                  values: draft,
                  rowVersion: document.rowVersion,
                  ...(summary.trim() ? { summary: summary.trim() } : {}),
                });
              }, "Configuration saved")
            }
          >
            Save
          </button>
        ) : null}
        <label className="hamd-pc-summary">
          Change summary
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Optional audit summary"
          />
        </label>
      </div>

      <div className="hamd-pc__layout">
        <nav className="hamd-pc__nav" aria-label="Settings sections">
          <ul>
            {PLATFORM_CONFIG_SECTIONS.map((key) => (
              <li key={key}>
                <button
                  type="button"
                  className={cx(
                    "hamd-pc-nav",
                    section === key && tab === "editor" && "is-active",
                  )}
                  aria-current={
                    section === key && tab === "editor" ? "page" : undefined
                  }
                  onClick={() => {
                    setSection(key);
                    setTab("editor");
                    setMobileOpen(true);
                  }}
                >
                  {platformConfigSectionLabel(key)}
                </button>
              </li>
            ))}
          </ul>
          <div className="hamd-pc-side-tabs">
            <button
              type="button"
              className={cx("hamd-pc-nav", tab === "versions" && "is-active")}
              onClick={() => {
                setTab("versions");
                setMobileOpen(true);
              }}
            >
              Rollback / versions
            </button>
            <button
              type="button"
              className={cx("hamd-pc-nav", tab === "audit" && "is-active")}
              onClick={() => {
                setTab("audit");
                setMobileOpen(true);
              }}
            >
              Audit logging
            </button>
          </div>
        </nav>

        <section
          id="hamd-pc-editor"
          className="hamd-pc__panel"
          aria-label="Settings panel"
        >
          <button
            type="button"
            className="hamd-pc-back"
            onClick={() => setMobileOpen(false)}
          >
            Sections
          </button>

          {tab === "editor" ? (
            <form
              className="hamd-pc-form"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <header className="hamd-pc-panel__head">
                <h2>{platformConfigSectionLabel(section)}</h2>
                {section === "maintenance" && draft.maintenanceEnabled ? (
                  <p className="hamd-pc-banner" role="status">
                    Maintenance mode is enabled in this draft.
                  </p>
                ) : null}
                {section === "wedding_campaign" &&
                draft.weddingCampaignEnabled ? (
                  <p className="hamd-pc-banner hamd-pc-banner--campaign" role="status">
                    Wedding campaign is enabled in this draft.
                  </p>
                ) : null}
              </header>

              <div className="hamd-pc-fields">
                {fields.map((field) => (
                  <FieldControl
                    key={field.key}
                    field={field}
                    value={draft[field.key]}
                    error={issueByField.get(field.key)}
                    onChange={(next) =>
                      setDraft((prev) => ({ ...prev, [field.key]: next }))
                    }
                  />
                ))}
              </div>

              {issues.filter((i) => i.section === section).length ? (
                <ul className="hamd-pc-issues" aria-label="Section validation issues">
                  {issues
                    .filter((i) => i.section === section)
                    .map((issue) => (
                      <li key={`${issue.field}-${issue.message}`}>
                        {issue.message}
                      </li>
                    ))}
                </ul>
              ) : null}
            </form>
          ) : null}

          {tab === "versions" ? (
            <div className="hamd-pc-versions" aria-label="Configuration versions">
              <h2>Rollback / versions</h2>
              <p className="hamd-pc-muted">
                Rollback restores a prior published configuration as a new
                version. History is not rewritten.
              </p>
              <ol>
                {versions.length === 0 ? (
                  <li className="hamd-pc-empty">No versions provided.</li>
                ) : (
                  versions.map((version) => (
                    <li
                      key={version.id}
                      className={cx(version.current && "is-current")}
                    >
                      <strong>
                        v{version.version}
                        {version.current ? " · Current" : ""}
                      </strong>
                      <span>{version.summary}</span>
                      <span className="hamd-pc-muted">
                        {version.authorName ? `${version.authorName} · ` : ""}
                        {formatWhen(version.createdAt)}
                      </span>
                      {canRollback && !version.current ? (
                        <button
                          type="button"
                          className="hamd-pc-btn"
                          onClick={() =>
                            void run(
                              () =>
                                onRollback?.({
                                  versionId: version.id,
                                  rowVersion: document.rowVersion,
                                  ...(summary.trim()
                                    ? { reason: summary.trim() }
                                    : {}),
                                }),
                              `Rolled back to v${version.version}`,
                            )
                          }
                        >
                          Rollback to this version
                        </button>
                      ) : null}
                    </li>
                  ))
                )}
              </ol>
            </div>
          ) : null}

          {tab === "audit" ? (
            <div className="hamd-pc-audit" aria-label="Configuration audit log">
              <h2>Audit logging</h2>
              <p className="hamd-pc-muted">
                Configuration changes are append-only audit events. Hosts also
                write immutable platform audit records on save/rollback.
              </p>
              <ol>
                {changeLog.length === 0 ? (
                  <li className="hamd-pc-empty">No change log entries.</li>
                ) : (
                  changeLog.map((entry) => (
                    <li key={entry.id}>
                      <time dateTime={entry.occurredAt}>
                        {formatWhen(entry.occurredAt)}
                      </time>
                      <strong>
                        {platformConfigSectionLabel(String(entry.section))}
                      </strong>
                      <span>{entry.summary}</span>
                      <span className="hamd-pc-muted">
                        {entry.actorName} · v{entry.version}
                      </span>
                    </li>
                  ))
                )}
              </ol>
            </div>
          ) : null}
        </section>
      </div>

      {error ? (
        <p className="hamd-pc-toast" role="alert">
          {error}
        </p>
      ) : null}
      <div className="hamd-sr-only" role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
