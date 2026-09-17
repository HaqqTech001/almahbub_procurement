import { INTEGRATED_EXPORT_BRAND } from "./group.js";

export const BUSINESS_LOGOS = {
  international: { src: "/almahbub.svg", alt: "Almahbub International logo" },
  export: { src: INTEGRATED_EXPORT_BRAND.logoSrc, alt: INTEGRATED_EXPORT_BRAND.logoAlt },
} as const;
