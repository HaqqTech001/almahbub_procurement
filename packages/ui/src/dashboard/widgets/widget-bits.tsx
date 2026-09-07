import { type ReactNode } from "react";

export function StatusPill({ status }: { status: string }) {
  return (
    <span className="hamd-dash-pill" data-status={status.toLowerCase()}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function Meta({ children }: { children: ReactNode }) {
  return <span className="hamd-dash-meta">{children}</span>;
}

export function RowLink({
  href,
  title,
  meta,
  trailing,
}: {
  href: string;
  title: string;
  meta?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <a className="hamd-dash-row" href={href}>
      <span className="hamd-dash-row__main">
        <span className="hamd-dash-row__title">{title}</span>
        {meta ? <span className="hamd-dash-row__meta">{meta}</span> : null}
      </span>
      {trailing ? <span className="hamd-dash-row__trail">{trailing}</span> : null}
    </a>
  );
}

export function listFooter(href: string, label: string) {
  return (
    <a href={href} className="hamd-dash-link">
      {label}
    </a>
  );
}
