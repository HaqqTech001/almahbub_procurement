export type PublicRoute =
  | "/"
  | "/about"
  | "/services"
  | "/products"
  | "/product/:slug"
  | "/industries"
  | "/faq"
  | "/contact"
  | "/privacy"
  | "/terms"
  | "/cookies";

export const PUBLIC_NAV = [
  { id: "about", label: "About", href: "/about" },
  { id: "services", label: "Services", href: "/services" },
  { id: "products", label: "Products", href: "/products" },
  { id: "industries", label: "Industries", href: "/industries" },
  { id: "faq", label: "FAQ", href: "/faq" },
  { id: "contact", label: "Contact", href: "/contact" },
] as const;

export const LEGAL_NAV = [
  { id: "privacy", label: "Privacy Policy", href: "/privacy" },
  { id: "terms", label: "Terms of Service", href: "/terms" },
  { id: "cookies", label: "Cookie Policy", href: "/cookies" },
] as const;
