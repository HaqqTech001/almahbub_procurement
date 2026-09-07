import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type ModuleDetailProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  tabs?: readonly { id: string; label: string; content: ReactNode }[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  sidebar?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function ModuleDetail({
  title,
  subtitle,
  actions,
  tabs,
  activeTab,
  onTabChange,
  sidebar,
  children,
  className,
}: ModuleDetailProps) {
  const active = tabs?.find((tab) => tab.id === activeTab);

  return (
    <div className={cx("hamd-module-detail", className)}>
      <div className="hamd-module-detail__main">
        <div className="hamd-module-detail__header">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--hamd-space-4, 1rem)" }}>
            <div>
              <h1 className="hamd-module-detail__title">{title}</h1>
              {subtitle ? <p className="hamd-module-detail__subtitle">{subtitle}</p> : null}
            </div>
            {actions ? <div className="hamd-module-detail__header-actions">{actions}</div> : null}
          </div>
          {tabs && tabs.length > 0 ? (
            <div className="hamd-module-detail__tabs" role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  className="hamd-module-detail__tab"
                  aria-selected={tab.id === activeTab}
                  onClick={() => onTabChange?.(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div role="tabpanel">
          {active ? active.content : children}
        </div>
      </div>
      {sidebar ? <aside className="hamd-module-detail__sidebar">{sidebar}</aside> : null}
    </div>
  );
}
