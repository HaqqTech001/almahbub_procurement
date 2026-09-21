import type { MegaMenuConfig, NavLinkItem } from "@hamd/ui/navigation";
import { IE_PATHS } from "../integrated-export/ie-paths.js";

export const PROCUREMENT_HOME = "/businesses/almahbub-international";
export const publicLinks: readonly NavLinkItem[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "about", label: "About", href: "/about" },
  { id: "contact", label: "Contact", href: "/contact" },
];

export const publicServiceMenus: readonly MegaMenuConfig[] = [
  {
    id: "procurement", label: "Global Procurement", href: PROCUREMENT_HOME, compact: true,
    columns: [{ id: "procurement", title: "Almahbub International", items: [
      { id: "overview", label: "Overview", href: PROCUREMENT_HOME, description: "Sourcing built around your requirements" },
      { id: "categories", label: "Product Categories", href: `${PROCUREMENT_HOME}#categories`, description: "Explore equipment and merchandise" },
      { id: "catalogue", label: "Product Catalogue", href: "/products", description: "Browse reviewed product options" },
      { id: "process", label: "How Procurement Works", href: `${PROCUREMENT_HOME}#how-it-works`, description: "From your brief to an agreed quotation" },
      { id: "request", label: "Start Procurement Request", href: "/app/requests/new", description: "Share specifications and destination" },
    ] }],
  },
  {
    id: "export", label: "Nigerian Export", href: IE_PATHS.home, compact: true,
    columns: [{ id: "export", title: "Almahbub Integrated Export Ltd.", items: [
      { id: "overview", label: "Overview", href: IE_PATHS.home, description: "Agricultural export supply from Nigeria" },
      { id: "commodities", label: "Commodities", href: IE_PATHS.commodities, description: "Explore our published commodity range" },
      { id: "process", label: "Export Process", href: IE_PATHS.process, description: "Sourcing, preparation and shipment" },
      { id: "quality", label: "Quality", href: IE_PATHS.quality, description: "Discuss specifications and inspection" },
      { id: "markets", label: "Markets", href: IE_PATHS.markets, description: "Plan supply for your destination" },
      { id: "request", label: "Request Export Supply", href: IE_PATHS.request, description: "Tell us the grade, volume and destination" },
    ] }],
  },
  {
    id: "services", label: "Services", href: "/services", compact: true,
    columns: [{ id: "capabilities", title: "Trade support", items: [
      { id: "sourcing", label: "Sourcing & import support", href: "/services#services-grid", description: "Product requirements and supplier coordination" },
      { id: "logistics", label: "Logistics & storage", href: "/services#services-grid", description: "Delivery planning and storage support" },
      { id: "consultation", label: "Discuss your requirements", href: "/contact", description: "Find the right starting point for your project" },
    ] }],
  },
];
