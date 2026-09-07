import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type DetailTab = {
  id: string;
  label: string;
  content: ReactNode;
};

export type DetailWorkspaceProps = {
  tabs: readonly DetailTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  sidebar?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function DetailWorkspace({
  tabs,
  activeTab,
  onTabChange,
  sidebar,
  children,
  className,
}: DetailWorkspaceProps) {
  const active = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className={cx("hamd-module-detail", className)}>
      <div className="hamd-module-detail__main">
        {tabs.length > 0 ? (
          <div className="hamd-module-detail__tabs" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                className="hamd-module-detail__tab"
                aria-selected={tab.id === activeTab}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}
        <div role="tabpanel">
          {active ? active.content : children}
        </div>
      </div>
      {sidebar ? (
        <aside className="hamd-module-detail__sidebar">{sidebar}</aside>
      ) : null}
    </div>
  );
}
