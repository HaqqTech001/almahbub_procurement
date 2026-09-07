export type WeddingPortalThemeToggleProps = {
  resolved: "light" | "dark";
  onToggle: () => void;
};

export function WeddingPortalThemeToggle({ resolved, onToggle }: WeddingPortalThemeToggleProps) {
  const isDark = resolved === "dark";
  return (
    <button
      type="button"
      className="hamd-btn hamd-btn--ghost hamd-wedding-portal__theme"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
      onClick={onToggle}
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4 7 17M17 7l1.4-1.4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M17.5 14.5A7 7 0 0 1 9.5 6.5 5.5 5.5 0 1 0 17.5 14.5Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
