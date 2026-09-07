import { useId, useState } from "react";
import { cx } from "../utils/cx.js";
import type { CatalogCategoryNode } from "./types.js";

export type CategoryTreeProps = {
  nodes: CatalogCategoryNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  className?: string | undefined;
  label?: string;
};

function TreeNode({
  node,
  depth,
  selectedIds,
  onToggle,
}: {
  node: CatalogCategoryNode;
  depth: number;
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = Boolean(node.children?.length);
  const selected = selectedIds.includes(node.id);
  const panelId = `cat-tree-${node.id}`;

  return (
    <li className="hamd-cat-tree__node" style={{ ["--depth" as string]: depth }}>
      <div className="hamd-cat-tree__row">
        {hasChildren ? (
          <button
            type="button"
            className="hamd-cat-tree__twist"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="hamd-sr-only">{open ? "Collapse" : "Expand"} {node.name}</span>
            <span aria-hidden="true">{open ? "▾" : "▸"}</span>
          </button>
        ) : (
          <span className="hamd-cat-tree__twist hamd-cat-tree__twist--spacer" aria-hidden="true" />
        )}
        <label className={cx("hamd-cat-tree__label", selected && "is-selected")}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggle(node.id)}
          />
          <span>{node.name}</span>
          {typeof node.productCount === "number" ? (
            <span className="hamd-cat-tree__count">{node.productCount}</span>
          ) : null}
        </label>
      </div>
      {hasChildren && open ? (
        <ul id={panelId} className="hamd-cat-tree__children">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              onToggle={onToggle}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function CategoryTree({
  nodes,
  selectedIds,
  onToggle,
  className,
  label = "Categories",
}: CategoryTreeProps) {
  const headingId = useId();
  return (
    <nav className={cx("hamd-cat-tree", className)} aria-labelledby={headingId}>
      <h2 id={headingId} className="hamd-cat-aside__title">
        {label}
      </h2>
      <ul className="hamd-cat-tree__root">
        {nodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            selectedIds={selectedIds}
            onToggle={onToggle}
          />
        ))}
      </ul>
    </nav>
  );
}
