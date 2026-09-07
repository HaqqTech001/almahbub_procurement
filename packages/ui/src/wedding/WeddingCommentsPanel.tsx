import type { FormEvent } from "react";

import { cx } from "../utils/cx.js";

export type WeddingPortalComment = {
  id: string;
  displayName: string;
  message: string;
};

export type WeddingCommentsPanelProps = {
  comments: readonly WeddingPortalComment[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  error?: string | null;
  open?: boolean;
  onClose?: () => void;
  canCompose?: boolean;
  signInHref?: string | undefined;
};

export function WeddingCommentsPanel({
  comments,
  draft,
  onDraftChange,
  onSubmit,
  error,
  open = true,
  onClose,
  canCompose = true,
  signInHref,
}: WeddingCommentsPanelProps) {
  return (
    <aside
      className={cx("hamd-wedding-portal__comments", open && "is-open")}
      aria-label="Guest messages"
    >
      <header className="hamd-wedding-portal__comments-head">
        <h2>Guest Messages</h2>
        {onClose ? (
          <button type="button" className="hamd-btn hamd-btn--ghost" onClick={onClose}>
            Close
          </button>
        ) : null}
      </header>
      <ul className="hamd-wedding-portal__comments-list">
        {comments.map((row) => (
          <li key={row.id} className="hamd-wedding-comments__item">
            <span className="hamd-wedding-comments__avatar" aria-hidden="true">
              {row.displayName.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{row.displayName}</strong>
              <p>{row.message}</p>
            </div>
          </li>
        ))}
      </ul>
      {canCompose ? (
        <form className="hamd-wedding-comments__composer" onSubmit={onSubmit}>
          <label className="hamd-sr-only" htmlFor="wedding-portal-comment">
            Write a message
          </label>
          <input
            id="wedding-portal-comment"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            maxLength={500}
            placeholder="Write a message"
            required
          />
          <button type="submit" className="hamd-btn hamd-btn--primary">
            Send
          </button>
        </form>
      ) : signInHref ? (
        <p className="hamd-wedding-portal__comments-signin">
          <a href={signInHref}>Sign in</a> to leave a message.
        </p>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
    </aside>
  );
}
