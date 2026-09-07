import { Link } from "react-router-dom";
import { cx } from "./cx.js";

export type BreadcrumbItem = {
  label: string;
  href?: string | undefined;
};

export type BreadcrumbProps = {
  items: readonly BreadcrumbItem[];
  className?: string | undefined;
};

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cx("hamd-breadcrumb", className)} aria-label="Breadcrumb">
      <ol className="hamd-breadcrumb__list">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="hamd-breadcrumb__item">
              {item.href && !current ? (
                <Link to={item.href}>{item.label}</Link>
              ) : (
                <span aria-current={current ? "page" : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
