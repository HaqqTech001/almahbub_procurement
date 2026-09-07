import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type ModuleHeaderProps = {
  icon?: ReactNode;
  breadcrumbs?: readonly BreadcrumbItem[];
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function ModuleHeader({
  icon,
  breadcrumbs,
  title,
  description,
  actions,
  className,
}: ModuleHeaderProps) {
  return (
    <header className={cx("hamd-module-workspace__header", className)}>
      <div className="hamd-module-workspace__header-left">
        {icon ? (
          <span className="hamd-module-workspace__header-icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <div className="hamd-module-workspace__header-text">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav className="hamd-module-workspace__crumbs" aria-label="Breadcrumb">
              <ol>
                {breadcrumbs.map((item, index) => (
                  <li key={`${item.label}-${index}`}>
                    {index > 0 ? <span aria-hidden="true">/</span> : null}
                    {item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
          <h1 className="hamd-module-workspace__title">{title}</h1>
          {description ? (
            <p className="hamd-module-workspace__description">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="hamd-module-workspace__header-actions">{actions}</div>
      ) : null}
    </header>
  );
}
