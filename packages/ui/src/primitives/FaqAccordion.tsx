import {
  useId,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cx } from "../utils/cx.js";

export type FaqAccordionItem = {
  id: string;
  question: string;
  answer: ReactNode;
};

export type FaqAccordionProps = {
  items: readonly FaqAccordionItem[];
  /** Opens the first item by default when true. */
  defaultOpenFirst?: boolean;
  className?: string;
};

/** Single-expand FAQ accordion - shared by Homepage and other marketing pages. */
export function FaqAccordion({
  items,
  defaultOpenFirst = true,
  className,
}: FaqAccordionProps) {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(
    defaultOpenFirst ? (items[0]?.id ?? null) : null,
  );

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, itemId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpenId((current) => (current === itemId ? null : itemId));
    }
  };

  return (
    <div className={cx("hamd-faq__list", className)}>
      {items.map((item) => {
        const panelId = `${baseId}-${item.id}-panel`;
        const buttonId = `${baseId}-${item.id}-button`;
        const expanded = openId === item.id;
        return (
          <div
            key={item.id}
            className={cx("hamd-faq__item", expanded && "hamd-faq__item--open")}
          >
            <h3 className="hamd-faq__question">
              <button
                id={buttonId}
                type="button"
                className="hamd-faq__trigger"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() =>
                  setOpenId((current) => (current === item.id ? null : item.id))
                }
                onKeyDown={(event) => onKeyDown(event, item.id)}
              >
                {item.question}
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!expanded}
              className="hamd-faq__panel"
            >
              {typeof item.answer === "string" ? <p>{item.answer}</p> : item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
