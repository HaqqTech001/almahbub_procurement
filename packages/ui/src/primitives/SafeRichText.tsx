import { useMemo, type ReactNode } from "react";
import { cx } from "../utils/cx.js";

const ALLOWED = new Set(["P", "BR", "STRONG", "EM", "B", "I", "UL", "OL", "LI", "H2", "H3", "H4"]);

function sanitizeNode(node: Node): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const element = node as Element;
  const tag = element.tagName.toUpperCase();
  if (!ALLOWED.has(tag)) {
    return Array.from(element.childNodes).map((child, index) => (
      <span key={index}>{sanitizeNode(child)}</span>
    ));
  }
  const children = Array.from(element.childNodes).map((child, index) => (
    <span key={index}>{sanitizeNode(child)}</span>
  ));
  switch (tag) {
    case "P":
      return <p>{children}</p>;
    case "BR":
      return <br />;
    case "STRONG":
    case "B":
      return <strong>{children}</strong>;
    case "EM":
    case "I":
      return <em>{children}</em>;
    case "UL":
      return <ul>{children}</ul>;
    case "OL":
      return <ol>{children}</ol>;
    case "LI":
      return <li>{children}</li>;
    case "H2":
      return <h2>{children}</h2>;
    case "H3":
      return <h3>{children}</h3>;
    case "H4":
      return <h4>{children}</h4>;
    default:
      return children;
  }
}

export type SafeRichTextProps = {
  value: string;
  className?: string | undefined;
};

export function SafeRichText({ value, className }: SafeRichTextProps) {
  const content = useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (!/<[a-z][\s\S]*>/i.test(trimmed)) {
      return trimmed.split(/\n{2,}/).map((paragraph, index) => (
        <p key={index}>{paragraph.split("\n").map((line, lineIndex) => (
          <span key={lineIndex}>
            {lineIndex > 0 ? <br /> : null}
            {line}
          </span>
        ))}</p>
      ));
    }
    if (typeof DOMParser === "undefined") {
      return <p>{trimmed.replace(/<[^>]*>/g, "")}</p>;
    }
    const doc = new DOMParser().parseFromString(trimmed, "text/html");
    return Array.from(doc.body.childNodes).map((node, index) => (
      <span key={index}>{sanitizeNode(node)}</span>
    ));
  }, [value]);

  return <div className={cx("hamd-safe-rich-text", className)}>{content}</div>;
}
