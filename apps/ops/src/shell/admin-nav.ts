import type { AdminNavIconName } from "./AdminNavIcon.js";

export type AdminNavItem = {
  id: string;
  label: string;
  href: string;
  icon: AdminNavIconName;
  permission?: string;
};

export type AdminNavSection = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

/** Only modules backed by a real V2 API. Fake fixture pages are omitted. */
export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    id: "overview",
    label: "Overview",
    items: [{ id: "dashboard", label: "Dashboard", href: "/", icon: "dashboard" }],
  },
  {
    id: "procurement",
    label: "Procurement",
    items: [
      { id: "requests", label: "Requests", href: "/requests", icon: "requests" },
      { id: "quotations", label: "Quotations", href: "/quotations", icon: "quotations" },
      { id: "payments", label: "Payments", href: "/payments", icon: "payments" },
      { id: "invoices", label: "Invoices", href: "/invoices", icon: "invoices" },
      { id: "shipments", label: "Shipments", href: "/shipments", icon: "shipments" },
    ],
  },
  {
    id: "catalogue",
    label: "Catalogue",
    items: [
      { id: "products", label: "Products", href: "/products", icon: "products" },
      { id: "categories", label: "Categories", href: "/categories", icon: "categories" },
      {
        id: "ie-commodities",
        label: "Export commodities",
        href: "/integrated-export/commodities",
        icon: "products",
      },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    items: [
      { id: "users", label: "Users", href: "/users", icon: "users" },
      { id: "organizations", label: "Organisations", href: "/organizations", icon: "organizations" },
      { id: "support", label: "Chat", href: "/support", icon: "support" },
    ],
  },
  {
    id: "content",
    label: "Content",
    items: [
      { id: "announcements", label: "Announcements", href: "/cms", icon: "announcements" },
      {
        id: "guidance-admin",
        label: "Guidance Admin",
        href: "/guidance-admin",
        icon: "ai",
        permission: "guidance:manage",
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { id: "notifications", label: "Notifications", href: "/notifications", icon: "notifications" },
      {
        id: "ai-assistant",
        label: "AI Assistant / Knowledge",
        href: "/ai-assistant",
        icon: "ai",
        permission: "guidance:manage",
      },
      { id: "audit", label: "Audit Log", href: "/audit", icon: "audit", permission: "audit:read" },
      {
        id: "wedding",
        label: "Wedding Campaign",
        href: "/wedding",
        icon: "announcements",
        permission: "ops:access",
      },
    ],
  },
];

export function filterAdminNav(
  sections: readonly AdminNavSection[],
  permissions: readonly string[],
): AdminNavSection[] {
  const keys = new Set(permissions);
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.permission) return true;
        return keys.has(item.permission);
      }),
    }))
    .filter((section) => section.items.length > 0);
}

export function isAdminNavCurrent(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function adminPageTitle(pathname: string): string {
  const ranked = ADMIN_NAV_SECTIONS.flatMap((section) => section.items).sort(
    (a, b) => b.href.length - a.href.length,
  );
  const match = ranked.find((item) => isAdminNavCurrent(pathname, item.href));
  if (match) return match.label;
  if (pathname.startsWith("/account")) return "My account";
  return "Operations";
}
