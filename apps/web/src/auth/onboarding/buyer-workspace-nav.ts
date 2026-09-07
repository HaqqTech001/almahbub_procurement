import type { DashboardNavSection } from "@hamd/ui/dashboard";

/** Authenticated buyer workspace navigation. Includes Integrated Export after login. */
export function buildBuyerWorkspaceNav(pathname: string): DashboardNavSection[] {
  const current = (match: RegExp) => match.test(pathname);
  return [
    {
      id: "overview",
      label: "Overview",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          href: "/app",
          icon: "dashboard",
          current: current(/^\/app\/?$/),
        },
      ],
    },
    {
      id: "work",
      label: "My work",
      items: [
        {
          id: "requests",
          label: "Requests",
          href: "/app/requests",
          icon: "requests",
          current: current(/^\/app\/requests/),
        },
        {
          id: "products",
          label: "Products",
          href: "/app/products",
          icon: "dashboard",
          current: current(/^\/app\/products/),
        },
        {
          id: "quotations",
          label: "Quotations",
          href: "/app/quotations",
          icon: "quotations",
          current: current(/^\/app\/quotations/),
        },
      ],
    },
    {
      id: "orders",
      label: "Orders",
      items: [
        {
          id: "invoices",
          label: "Invoices",
          href: "/app/invoices",
          icon: "invoices",
          current: current(/^\/app\/invoices/),
        },
        {
          id: "payments",
          label: "Payments",
          href: "/app/payments",
          icon: "payments",
          current: current(/^\/app\/payments/),
        },
        {
          id: "shipments",
          label: "Shipments",
          href: "/app/shipments",
          icon: "shipments",
          current: current(/^\/app\/shipments/),
        },
      ],
    },
    {
      id: "help",
      label: "Help",
      items: [
        {
          id: "announcements",
          label: "Announcements",
          href: "/app/announcements",
          icon: "notifications",
          current: current(/^\/app\/announcements/),
        },
        {
          id: "chat",
          label: "Chat",
          href: "/app/chat",
          icon: "chat",
          current: current(/^\/app\/chat/),
        },
      ],
    },
    {
      id: "businesses",
      label: "Businesses",
      items: [
        {
          id: "agro-produce",
          label: "Agro Produce",
          href: "/app/agro-produce",
          icon: "dashboard",
          current: current(/^\/app\/agro-produce/),
        },
      ],
    },
    {
      id: "account",
      label: "Account",
      items: [
        {
          id: "profile",
          label: "Profile",
          href: "/app/profile",
          icon: "profile",
          current: current(/^\/app\/profile/),
        },
        {
          id: "settings",
          label: "Settings",
          href: "/app/settings",
          icon: "settings",
          current: current(/^\/app\/settings/),
        },
      ],
    },
  ];
}
