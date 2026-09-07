import { useMemo, useState } from "react";

export type WeddingGuestRow = {
  id: string;
  displayName: string;
  email?: string | null;
  joinedAt: string;
  state: "watching" | "reconnecting" | "left";
};

export function WeddingViewersDrawer({
  open,
  viewers,
  guests,
  onClose,
}: {
  open: boolean;
  viewers: number;
  guests: WeddingGuestRow[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter(
      (row) =>
        row.displayName.toLowerCase().includes(q) || (row.email ?? "").toLowerCase().includes(q),
    );
  }, [guests, query]);
  if (!open) return null;
  return (
    <div className="hamd-wedding-viewers" role="dialog" aria-label="Joined guests">
      <header className="hamd-wedding-viewers__head">
        <div>
          <p className="hamd-wedding-viewers__back">
            <button type="button" className="hamd-btn hamd-btn--ghost" onClick={onClose}>
              Back
            </button>
          </p>
          <h2>Joined Guests</h2>
          <p>{viewers} currently watching</p>
        </div>
        <button type="button" className="hamd-btn hamd-btn--ghost" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </header>
      <label className="hamd-wedding-viewers__search">
        Search
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or email" />
      </label>
      <ul className="hamd-wedding-viewers__list">
        {rows.map((row) => (
          <li key={row.id}>
            <span aria-hidden="true">{row.displayName.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{row.displayName}</strong>
              <p>
                {row.state === "watching" ? "Watching" : row.state === "reconnecting" ? "Reconnecting" : "Left"}
                {" · "}
                {new Date(row.joinedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
