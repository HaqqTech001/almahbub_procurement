import {
  useId,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx.js";

export function Chip({
  children,
  selected,
  onClick,
  className,
}: {
  children: ReactNode;
  selected?: boolean | undefined;
  onClick?: (() => void) | undefined;
  className?: string | undefined;
}) {
  return (
    <button
      type="button"
      className={cx("hamd-chip", selected && "hamd-chip--selected", className)}
      aria-pressed={selected}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: readonly { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  className?: string | undefined;
}) {
  return (
    <div className={cx("hamd-tabs", className)} role="tablist" aria-label="Sections">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={value === tab.id}
          aria-controls={`panel-${tab.id}`}
          className={cx("hamd-tabs__tab", value === tab.id && "hamd-tabs__tab--active")}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({
  id,
  active,
  children,
}: {
  id: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={!active}
      className="hamd-tabs__panel"
    >
      {children}
    </div>
  );
}

export function Tooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <span className="hamd-tooltip">
      <span tabIndex={0} aria-describedby={id} className="hamd-tooltip__trigger">
        {children}
      </span>
      <span role="tooltip" id={id} className="hamd-tooltip__bubble">
        {label}
      </span>
    </span>
  );
}

export function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="hamd-drawer" role="presentation">
      <button type="button" className="hamd-drawer__backdrop" aria-label="Close drawer" onClick={onClose} />
      <aside
        className="hamd-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="hamd-drawer__header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="hamd-btn hamd-btn--ghost" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="hamd-drawer__body">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}

export function Stepper({
  steps,
  currentId,
}: {
  steps: readonly { id: string; label: string }[];
  currentId: string;
}) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === currentId),
  );
  return (
    <ol className="hamd-stepper" aria-label="Progress">
      {steps.map((step, index) => {
        const state =
          index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming";
        return (
          <li key={step.id} className={cx("hamd-stepper__item", `hamd-stepper__item--${state}`)}>
            <span className="hamd-stepper__index">{index + 1}</span>
            <span className="hamd-stepper__label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function NotificationItem({
  title,
  body,
  unread = false,
}: {
  title: string;
  body: string;
  unread?: boolean | undefined;
}) {
  return (
    <article
      className={cx(
        "hamd-notification",
        unread && "hamd-notification--unread",
      )}
    >
      <h3 className="hamd-notification__title">{title}</h3>
      <p className="hamd-notification__body">{body}</p>
    </article>
  );
}

export function Timeline({
  items,
}: {
  items: readonly { id: string; title: string; body: string }[];
}) {
  return (
    <ol className="hamd-timeline">
      {items.map((item) => (
        <li key={item.id} className="hamd-timeline__item">
          <p className="hamd-timeline__title">{item.title}</p>
          <p className="hamd-timeline__body">{item.body}</p>
        </li>
      ))}
    </ol>
  );
}

/** Popover - lightweight disclosure for filters and help. */
export function Popover({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="hamd-popover">
      <button
        type="button"
        className="hamd-btn hamd-btn--secondary"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      {open ? <div className="hamd-popover__panel">{children}</div> : null}
    </div>
  );
}
