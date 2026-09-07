import { useState } from "react";

const INSERT_CHARS = ["🙂", "👍", "🙏", "🎉", "👏", "😊", "🤝"] as const;

export function EmojiInsertButton({
  onInsert,
  disabled,
}: {
  onInsert: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="hamd-emoji-insert">
      <button
        type="button"
        className="hamd-emoji-insert__trigger"
        aria-label="Insert emoji"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
          <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="7.4" cy="8.4" r="0.9" fill="currentColor" />
          <circle cx="12.6" cy="8.4" r="0.9" fill="currentColor" />
          <path
            d="M7 12.2c.8 1.1 1.8 1.6 3 1.6s2.2-.5 3-1.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open ? (
        <div className="hamd-emoji-insert__panel" role="listbox" aria-label="Emoji">
          {INSERT_CHARS.map((char) => (
            <button
              key={char}
              type="button"
              className="hamd-emoji-insert__option"
              onClick={() => {
                onInsert(char);
                setOpen(false);
              }}
            >
              {char}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
