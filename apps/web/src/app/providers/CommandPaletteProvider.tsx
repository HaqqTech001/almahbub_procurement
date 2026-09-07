import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { PUBLIC_NAV, LEGAL_NAV } from "../../lib/routes.js";

type CommandItem = {
  id: string;
  label: string;
  href: string;
  group: string;
};

type CommandPaletteContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  query: string;
  setQuery: (query: string) => void;
  results: CommandItem[];
  run: (href: string) => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null,
);

const COMMANDS: CommandItem[] = [
  ...PUBLIC_NAV.map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
    group: "Navigate",
  })),
  { id: "home", label: "Home", href: "/", group: "Navigate" },
  { id: "request", label: "Request Procurement", href: "/contact", group: "Actions" },
  ...LEGAL_NAV.map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
    group: "Legal",
  })),
];

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.href.toLowerCase().includes(q),
    );
  }, [query]);

  const run = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      navigate(href);
    },
    [navigate],
  );

  const value = useMemo(
    () => ({ open, setOpen, query, setQuery, results, run }),
    [open, query, results, run],
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      {open ? (
        <div className="hamd-cmdk" role="presentation">
          <button
            type="button"
            className="hamd-cmdk__backdrop"
            aria-label="Close command palette"
            onClick={() => setOpen(false)}
          />
          <div
            className="hamd-cmdk__panel"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <input
              className="hamd-cmdk__input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pages and actions…"
              aria-label="Search commands"
              autoFocus
            />
            <ul className="hamd-cmdk__list" role="listbox">
              {results.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="hamd-cmdk__item"
                    onClick={() => run(item.href)}
                  >
                    <span>{item.label}</span>
                    <span className="hamd-cmdk__meta">{item.group}</span>
                  </button>
                </li>
              ))}
              {results.length === 0 ? (
                <li className="hamd-cmdk__empty">No matching commands</li>
              ) : null}
            </ul>
            <p className="hamd-cmdk__hint">Ctrl/⌘ K to toggle</p>
          </div>
        </div>
      ) : null}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  }
  return ctx;
}
