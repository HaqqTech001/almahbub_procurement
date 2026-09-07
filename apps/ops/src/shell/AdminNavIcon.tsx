export type AdminNavIconName =
  | "dashboard"
  | "products"
  | "categories"
  | "requests"
  | "quotations"
  | "invoices"
  | "payments"
  | "shipments"
  | "users"
  | "organizations"
  | "announcements"
  | "support"
  | "audit"
  | "website"
  | "account"
  | "signout"
  | "ai"
  | "notifications";

const svg = {
  viewBox: "0 0 24 24",
  width: 18,
  height: 18,
  fill: "none",
  "aria-hidden": true as const,
};

export function AdminNavIcon({ name }: { name: AdminNavIconName }) {
  switch (name) {
    case "products":
      return (
        <svg {...svg}>
          <path
            d="M4 8 12 4l8 4v11l-8 4-8-4V8Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M12 12v11M4 8l8 4 8-4" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "categories":
      return (
        <svg {...svg}>
          <path
            d="M4 7h7l2 2h7v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "requests":
      return (
        <svg {...svg}>
          <path
            d="M7 4h10a2 2 0 0 1 2 2v14l-4-2-3 2-3-2-4 2V6a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "quotations":
      return (
        <svg {...svg}>
          <path
            d="M7 3h8l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "invoices":
      return (
        <svg {...svg}>
          <path
            d="M6 3h12v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2V3Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M9 8h6M9 12h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "payments":
      return (
        <svg {...svg}>
          <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
          <path d="M7 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "shipments":
      return (
        <svg {...svg}>
          <path
            d="M3 7h11v10H3zM14 10h4l3 3v4h-7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="7.5" cy="18" r="1.4" fill="currentColor" />
          <circle cx="17.5" cy="18" r="1.4" fill="currentColor" />
        </svg>
      );
    case "users":
      return (
        <svg {...svg}>
          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="17" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M16 19a4.2 4.2 0 0 1 5-3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "organizations":
      return (
        <svg {...svg}>
          <path
            d="M4 20V8l8-4 8 4v12H4Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "announcements":
      return (
        <svg {...svg}>
          <path
            d="M4 10v4h3l6 4V6L7 10H4Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M18 9a4 4 0 0 1 0 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "ai":
      return (
        <svg {...svg}>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "notifications":
      return (
        <svg {...svg}>
          <path
            d="M6 16h12l-1.2-2.2A6 6 0 0 1 16 10V9a4 4 0 0 0-8 0v1a6 6 0 0 1-.8 3.8L6 16Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "support":
      return (
        <svg {...svg}>
          <path
            d="M5 6h14v9H9l-4 3V6Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "audit":
      return (
        <svg {...svg}>
          <path
            d="M12 3 5 6v5c0 4.2 2.8 7.8 7 9 4.2-1.2 7-4.8 7-9V6l-7-3Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "website":
      return (
        <svg {...svg}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4 12h16M12 4c2.5 2.8 3.8 5.6 3.8 8S14.5 17.2 12 20c-2.5-2.8-3.8-5.6-3.8-8S9.5 6.8 12 4Z" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "account":
      return (
        <svg {...svg}>
          <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5 19a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "signout":
      return (
        <svg {...svg}>
          <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M14 16l5-4-5-4M19 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg {...svg}>
          <path d="M4 4h7v7H4V4ZM13 4h7v7h-7V4ZM4 13h7v7H4v-7ZM13 13h7v7h-7v-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
  }
}

export function AdminMenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function AdminCloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function AdminCollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d={collapsed ? "M10 6l6 6-6 6" : "M14 6l-6 6 6 6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
