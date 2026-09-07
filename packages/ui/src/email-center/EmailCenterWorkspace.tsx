import { useEffect, useMemo, useState } from "react";
import { cx } from "../utils/cx.js";
import { useEmailDirectory } from "./useEmailDirectory.js";
import {
  EMAIL_TEMPLATE_KINDS,
  EMAIL_TEMPLATE_STATUSES,
  emailTemplateKindLabel,
  emailTemplateStatusLabel,
  emptyEmailFilters,
  renderEmailTemplate,
  sampleVariablesFrom,
  type EmailPreviewInput,
  type EmailSaveDraftInput,
  type EmailScheduleInput,
  type EmailTemplateRecord,
  type EmailTestSendInput,
} from "./types.js";

export type EmailCenterTab =
  | "editor"
  | "preview"
  | "variables"
  | "schedule"
  | "test_send"
  | "versions";

export type EmailCenterWorkspaceProps = {
  templates: EmailTemplateRecord[];
  title?: string | undefined;
  loading?: boolean | undefined;
  className?: string | undefined;
  canEdit?: boolean | undefined;
  canTestSend?: boolean | undefined;
  canSchedule?: boolean | undefined;
  onSelect?: ((template: EmailTemplateRecord) => void) | undefined;
  onSaveDraft?: ((
    id: string,
    input: EmailSaveDraftInput,
    meta: { rowVersion: number },
  ) => void | Promise<void>) | undefined;
  onPreview?: ((
    id: string,
    input: EmailPreviewInput,
  ) => void | Promise<void>) | undefined;
  onSchedule?: ((
    id: string,
    input: EmailScheduleInput,
    meta: { rowVersion: number },
  ) => void | Promise<void>) | undefined;
  onTestSend?: ((
    id: string,
    input: EmailTestSendInput,
  ) => void | Promise<void>) | undefined;
  onRestoreVersion?: ((
    id: string,
    versionId: string,
    meta: { rowVersion: number },
  ) => void | Promise<void>) | undefined;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function EmailCenterWorkspaceSkeleton({
  className,
}: {
  className?: string | undefined;
}) {
  return (
    <div
      className={cx("hamd-em", "hamd-em--skeleton", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hamd-em-skel hamd-em-skel--list" />
      <div className="hamd-em-skel hamd-em-skel--detail" />
    </div>
  );
}

/**
 * Enterprise Email Center - transactional/marketing templates with preview,
 * variables, scheduling, test send, and version history. Presentational.
 */
export function EmailCenterWorkspace({
  templates,
  title = "Enterprise Email Center",
  loading,
  className,
  canEdit = true,
  canTestSend = true,
  canSchedule = true,
  onSelect,
  onSaveDraft,
  onPreview,
  onSchedule,
  onTestSend,
  onRestoreVersion,
}: EmailCenterWorkspaceProps) {
  const directory = useEmailDirectory(templates);
  const selected = directory.selected;
  const [tab, setTab] = useState<EmailCenterTab>("editor");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [varOverrides, setVarOverrides] = useState<Record<string, string>>({});
  const [scheduleAt, setScheduleAt] = useState("");
  const [testTo, setTestTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setSubject(selected.subject);
    setBodyHtml(selected.bodyHtml);
    setBodyText(selected.bodyText ?? "");
    setVarOverrides({});
    setScheduleAt(selected.scheduledFor?.slice(0, 16) ?? "");
  }, [selected?.id]);

  const sampleVars = useMemo(
    () =>
      selected
        ? sampleVariablesFrom(selected.variables, varOverrides)
        : {},
    [selected, varOverrides],
  );

  const previewSubject = renderEmailTemplate(subject, sampleVars);
  const previewHtml = renderEmailTemplate(bodyHtml, sampleVars);

  if (loading) {
    return <EmailCenterWorkspaceSkeleton className={className} />;
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

  const tabs: { id: EmailCenterTab; label: string }[] = [
    { id: "editor", label: "Editor" },
    { id: "preview", label: "Preview" },
    { id: "variables", label: "Variables" },
    { id: "schedule", label: "Scheduling" },
    { id: "test_send", label: "Test send" },
    { id: "versions", label: "Version history" },
  ];

  return (
    <div
      className={cx(
        "hamd-em",
        mobileOpen && "hamd-em--detail-open",
        className,
      )}
    >
      <a className="hamd-em__skip" href="#hamd-em-detail">
        Skip to email template detail
      </a>

      <header className="hamd-em__header">
        <div>
          <h1 className="hamd-em__title">{title}</h1>
          <p className="hamd-em__subtitle">
            Governed email templates - welcome through wedding congratulations -
            with preview, variables, scheduling, test send, and version history.
          </p>
        </div>
      </header>

      <div className="hamd-em__layout">
        <aside className="hamd-em__directory" aria-label="Email templates">
          <div className="hamd-em-filters">
            <label className="hamd-sr-only" htmlFor="hamd-em-q">
              Search templates
            </label>
            <input
              id="hamd-em-q"
              type="search"
              placeholder="Search templates…"
              value={directory.filters.query}
              onChange={(e) =>
                directory.setFilters((prev) => ({
                  ...prev,
                  query: e.target.value,
                  page: 1,
                }))
              }
            />
            <label>
              Kind
              <select
                value={directory.filters.kind}
                onChange={(e) =>
                  directory.setFilters((prev) => ({
                    ...prev,
                    kind: e.target.value,
                    page: 1,
                  }))
                }
              >
                <option value="all">All templates</option>
                {EMAIL_TEMPLATE_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {emailTemplateKindLabel(kind)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={directory.filters.status}
                onChange={(e) =>
                  directory.setFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                    page: 1,
                  }))
                }
              >
                <option value="all">All statuses</option>
                {EMAIL_TEMPLATE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {emailTemplateStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="hamd-em-btn"
              onClick={() => directory.setFilters(emptyEmailFilters())}
            >
              Clear filters
            </button>
          </div>

          <ul className="hamd-em-list" role="list" aria-label="Template list">
            {directory.page.items.map((row) => {
              const active = selected?.id === row.id;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    className={cx("hamd-em-row", active && "is-active")}
                    aria-current={active ? "true" : undefined}
                    onClick={() => {
                      directory.select(row.id);
                      setTab("editor");
                      setMobileOpen(true);
                      onSelect?.(row);
                    }}
                  >
                    <span className="hamd-em-row__kind">
                      {emailTemplateKindLabel(String(row.kind))}
                    </span>
                    <span className="hamd-em-row__title">{row.name}</span>
                    <span className="hamd-em-row__meta">
                      {emailTemplateStatusLabel(String(row.status))} · v
                      {row.versionNumber} · {row.locale}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="hamd-em-pager" aria-label="Pagination">
            <button
              type="button"
              disabled={directory.page.page <= 1}
              onClick={() =>
                directory.setFilters((prev) => ({
                  ...prev,
                  page: prev.page - 1,
                }))
              }
            >
              Previous
            </button>
            <span>
              {directory.page.page}/{directory.page.pageCount}
            </span>
            <button
              type="button"
              disabled={directory.page.page >= directory.page.pageCount}
              onClick={() =>
                directory.setFilters((prev) => ({
                  ...prev,
                  page: prev.page + 1,
                }))
              }
            >
              Next
            </button>
          </div>
        </aside>

        <section
          id="hamd-em-detail"
          className="hamd-em__detail"
          aria-label="Email template detail"
        >
          {selected ? (
            <>
              <header className="hamd-em-detail__head">
                <button
                  type="button"
                  className="hamd-em-back"
                  onClick={() => setMobileOpen(false)}
                >
                  Templates
                </button>
                <div>
                  <p className="hamd-em-detail__code">
                    {selected.id} · v{selected.versionNumber}
                  </p>
                  <h2 className="hamd-em-detail__title">{selected.name}</h2>
                  <p className="hamd-em-detail__sub">
                    <span className="hamd-em-pill" data-status={selected.status}>
                      {emailTemplateStatusLabel(String(selected.status))}
                    </span>
                    <span className="hamd-em-pill">
                      {emailTemplateKindLabel(String(selected.kind))}
                    </span>
                    <span className="hamd-em-pill">{selected.locale}</span>
                  </p>
                </div>
              </header>

              <nav className="hamd-em-tabs" aria-label="Email template sections">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={cx("hamd-em-tab", tab === t.id && "is-active")}
                    aria-current={tab === t.id ? "page" : undefined}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>

              <div className="hamd-em-panel">
                {tab === "editor" ? (
                  <form
                    className="hamd-em-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!canEdit) return;
                      void run(
                        () =>
                          onSaveDraft?.(
                            selected.id,
                            {
                              subject: subject.trim(),
                              bodyHtml,
                              ...(bodyText.trim()
                                ? { bodyText: bodyText.trim() }
                                : {}),
                            },
                            { rowVersion: selected.rowVersion },
                          ),
                        "Draft saved",
                      );
                    }}
                  >
                    <label>
                      Subject
                      <input
                        required
                        value={subject}
                        disabled={!canEdit}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </label>
                    <label>
                      HTML body
                      <textarea
                        rows={10}
                        value={bodyHtml}
                        disabled={!canEdit}
                        onChange={(e) => setBodyHtml(e.target.value)}
                      />
                    </label>
                    <label>
                      Plain text (optional)
                      <textarea
                        rows={4}
                        value={bodyText}
                        disabled={!canEdit}
                        onChange={(e) => setBodyText(e.target.value)}
                      />
                    </label>
                    {canEdit ? (
                      <button
                        type="submit"
                        className="hamd-em-btn hamd-em-btn--primary"
                      >
                        Save draft
                      </button>
                    ) : null}
                  </form>
                ) : null}

                {tab === "preview" ? (
                  <div className="hamd-em-preview" aria-label="Email preview">
                    <p className="hamd-em-preview__badge">
                      Preview with sample variables - not sent
                    </p>
                    <p className="hamd-em-preview__subject">
                      <strong>Subject:</strong> {previewSubject}
                    </p>
                    <div
                      className="hamd-em-preview__frame"
                      // Structured template HTML from host/fixtures only.
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                    <button
                      type="button"
                      className="hamd-em-btn"
                      onClick={() =>
                        void run(
                          () =>
                            onPreview?.(selected.id, {
                              variables: sampleVars,
                            }),
                          "Host preview opened",
                        )
                      }
                    >
                      Open host preview
                    </button>
                  </div>
                ) : null}

                {tab === "variables" ? (
                  <div className="hamd-em-vars" aria-label="Template variables">
                    <p className="hamd-em-muted">
                      Use {"{{variable}}"} tokens in subject and body. Override
                      sample values for preview and test send.
                    </p>
                    <ul>
                      {selected.variables.map((variable) => (
                        <li key={variable.key}>
                          <label>
                            <span>
                              <code>{`{{${variable.key}}}`}</code>
                              {variable.required ? " *" : ""} - {variable.label}
                            </span>
                            <input
                              value={
                                varOverrides[variable.key] ?? variable.example
                              }
                              onChange={(e) =>
                                setVarOverrides((prev) => ({
                                  ...prev,
                                  [variable.key]: e.target.value,
                                }))
                              }
                            />
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {tab === "schedule" ? (
                  <form
                    className="hamd-em-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!canSchedule) return;
                      void run(
                        () =>
                          onSchedule?.(
                            selected.id,
                            { scheduledFor: new Date(scheduleAt).toISOString() },
                            { rowVersion: selected.rowVersion },
                          ),
                        "Schedule saved",
                      );
                    }}
                  >
                    <p className="hamd-em-muted">
                      Current schedule:{" "}
                      {selected.scheduledFor
                        ? formatWhen(selected.scheduledFor)
                        : "Not scheduled"}
                    </p>
                    <label>
                      Schedule for
                      <input
                        type="datetime-local"
                        required
                        value={scheduleAt}
                        disabled={!canSchedule}
                        onChange={(e) => setScheduleAt(e.target.value)}
                      />
                    </label>
                    {canSchedule ? (
                      <button
                        type="submit"
                        className="hamd-em-btn hamd-em-btn--primary"
                      >
                        Save schedule
                      </button>
                    ) : null}
                  </form>
                ) : null}

                {tab === "test_send" ? (
                  <form
                    className="hamd-em-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!canTestSend) return;
                      void run(
                        () =>
                          onTestSend?.(selected.id, {
                            to: testTo.trim(),
                            variables: sampleVars,
                          }),
                        "Test send queued",
                      );
                    }}
                  >
                    <p className="hamd-em-muted">
                      Sends a one-off render to an allowlisted address. Uses
                      current variable samples.
                    </p>
                    <label>
                      Recipient email
                      <input
                        type="email"
                        required
                        value={testTo}
                        disabled={!canTestSend}
                        onChange={(e) => setTestTo(e.target.value)}
                        placeholder="you@almahbub.example"
                      />
                    </label>
                    {canTestSend ? (
                      <button
                        type="submit"
                        className="hamd-em-btn hamd-em-btn--primary"
                      >
                        Send test email
                      </button>
                    ) : null}
                  </form>
                ) : null}

                {tab === "versions" ? (
                  <ol
                    className="hamd-em-versions"
                    aria-label="Version history"
                  >
                    {selected.versions.map((version) => (
                      <li
                        key={version.id}
                        className={cx(version.current && "is-current")}
                      >
                        <strong>
                          v{version.versionNumber}
                          {version.current ? " · Current" : ""}
                        </strong>
                        <span>
                          {emailTemplateStatusLabel(String(version.status))}
                          {version.authorName
                            ? ` · ${version.authorName}`
                            : ""}
                        </span>
                        {version.summary ? <em>{version.summary}</em> : null}
                        <time dateTime={version.createdAt}>
                          {formatWhen(version.createdAt)}
                        </time>
                        <p className="hamd-em-muted">{version.subject}</p>
                        {!version.current && canEdit ? (
                          <button
                            type="button"
                            className="hamd-em-btn"
                            onClick={() =>
                              void run(
                                () =>
                                  onRestoreVersion?.(
                                    selected.id,
                                    version.id,
                                    { rowVersion: selected.rowVersion },
                                  ),
                                `Restored v${version.versionNumber}`,
                              )
                            }
                          >
                            Restore this version
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            </>
          ) : (
            <p className="hamd-em-empty" role="status">
              Select an email template.
            </p>
          )}
        </section>
      </div>

      {error ? (
        <p className="hamd-em-toast" role="alert">
          {error}
        </p>
      ) : null}
      <div className="hamd-sr-only" role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
