/**
 * Semantic foundation tokens from the HAMD Enterprise Design System.
 * Components consume these semantic names rather than raw palette values.
 */
export const color = {
  light: {
    canvas: "#F9FAFB",
    surface: "#FFFFFF",
    surfaceSubtle: "#F2F4F7",
    surfaceHover: "#F2F4F7",
    surfaceSelected: "#E8F1FB",
    textPrimary: "#101828",
    textSecondary: "#344054",
    textTertiary: "#667085",
    border: "#D0D5DD",
    borderSubtle: "#EAECF0",
    actionPrimary: "#155AAF",
    actionPrimaryHover: "#123B66",
    actionSelected: "#E8F1FB",
    success: "#067647",
    successSubtle: "#D1FADF",
    warning: "#9A6700",
    warningSubtle: "#FEF0C7",
    danger: "#B42318",
    dangerSubtle: "#FEE4E2",
    information: "#175CD3",
    informationSubtle: "#D1E9FF",
    celebration: "#8A6415",
    celebrationSubtle: "#FBF3DD",
  },
  dark: {
    canvas: "#101828",
    surface: "#182230",
    surfaceRaised: "#1D2939",
    surfaceHover: "#1D2939",
    surfaceSelected: "#123B66",
    textPrimary: "#F9FAFB",
    textSecondary: "#D0D5DD",
    textTertiary: "#98A2B3",
    border: "#344054",
    borderSubtle: "#1D2939",
    actionPrimary: "#53B1FD",
    actionPrimaryHover: "#84CAFF",
    actionSelected: "#123B66",
    success: "#6CE9A6",
    successSubtle: "#054F31",
    warning: "#E3B341",
    warningSubtle: "#3D2A12",
    danger: "#F5B7B1",
    dangerSubtle: "#4A1D18",
    information: "#9EC9EA",
    informationSubtle: "#1B3358",
    celebration: "#F9DB8B",
    celebrationSubtle: "#5F4C13",
  },
} as const;

/** Shared button pair tokens. Text must stay readable on both default and hover surfaces. */
export const button = {
  light: {
    primaryBg: "#155AAF",
    primaryText: "#FFFFFF",
    primaryHoverBg: "#123B66",
    primaryHoverText: "#FFFFFF",
    secondaryBg: "#FFFFFF",
    secondaryText: "#101828",
    secondaryHoverBg: "#F2F4F7",
    secondaryHoverText: "#101828",
    outlineBg: "transparent",
    outlineText: "#101828",
    outlineHoverBg: "#F2F4F7",
    outlineHoverText: "#101828",
    ghostText: "#155AAF",
    ghostHoverBg: "#E8F1FB",
    ghostHoverText: "#155AAF",
    dangerBg: "#B42318",
    dangerText: "#FFFFFF",
    dangerHoverBg: "#912018",
    dangerHoverText: "#FFFFFF",
  },
  dark: {
    primaryBg: "#1849A9",
    primaryText: "#FFFFFF",
    primaryHoverBg: "#1D5EC4",
    primaryHoverText: "#FFFFFF",
    secondaryBg: "#182230",
    secondaryText: "#F9FAFB",
    secondaryHoverBg: "#1D2939",
    secondaryHoverText: "#F9FAFB",
    outlineBg: "transparent",
    outlineText: "#F9FAFB",
    outlineHoverBg: "#1D2939",
    outlineHoverText: "#F9FAFB",
    ghostText: "#84CAFF",
    ghostHoverBg: "#1B3358",
    ghostHoverText: "#B2DDFF",
    dangerBg: "#B42318",
    dangerText: "#FFFFFF",
    dangerHoverBg: "#912018",
    dangerHoverText: "#FFFFFF",
  },
} as const;

export const space = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  14: "3.5rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

export const radius = {
  xs: "2px",
  sm: "4px",
  md: "6px",
  lg: "8px",
  xl: "12px",
  "2xl": "16px",
  pill: "9999px",
  circular: "50%",
} as const;

export const shadow = {
  xs: "0 1px 2px rgb(16 24 40 / 0.05)",
  sm: "0 1px 3px rgb(16 24 40 / 0.1), 0 1px 2px rgb(16 24 40 / 0.06)",
  md: "0 4px 6px -2px rgb(16 24 40 / 0.05), 0 12px 16px -4px rgb(16 24 40 / 0.1)",
  lg: "0 8px 8px -4px rgb(16 24 40 / 0.03), 0 20px 24px -4px rgb(16 24 40 / 0.08)",
} as const;

export const font = {
  sans: '"Inter", "Segoe UI", sans-serif',
  mono: '"Roboto Mono", "SFMono-Regular", Consolas, monospace',
} as const;

export const typography = {
  displayXl: { fontSize: "48px", lineHeight: "56px", fontWeight: 600 },
  displayL: { fontSize: "40px", lineHeight: "48px", fontWeight: 600 },
  displayM: { fontSize: "32px", lineHeight: "40px", fontWeight: 600 },
  h1: { fontSize: "28px", lineHeight: "36px", fontWeight: 600 },
  h2: { fontSize: "24px", lineHeight: "32px", fontWeight: 600 },
  h3: { fontSize: "20px", lineHeight: "28px", fontWeight: 600 },
  title: { fontSize: "20px", lineHeight: "28px", fontWeight: 600 },
  section: { fontSize: "16px", lineHeight: "24px", fontWeight: 600 },
  body: { fontSize: "14px", lineHeight: "22px", fontWeight: 400 },
  bodySm: { fontSize: "13px", lineHeight: "20px", fontWeight: 400 },
  label: { fontSize: "12px", lineHeight: "16px", fontWeight: 500 },
  helper: { fontSize: "12px", lineHeight: "18px", fontWeight: 400 },
  meta: { fontSize: "12px", lineHeight: "16px", fontWeight: 400 },
  badge: { fontSize: "12px", lineHeight: "16px", fontWeight: 600 },
  stat: { fontSize: "22px", lineHeight: "28px", fontWeight: 600 },
  button: { fontSize: "14px", lineHeight: "20px", fontWeight: 500 },
} as const;

export const control = {
  heightSm: "2rem",
  height: "2.25rem",
  heightLg: "2.5rem",
  widthSidebar: "16.5rem",
  widthSidebarCollapsed: "4rem",
} as const;

export const focusRing = {
  width: "2px",
  offset: "2px",
  color: "#53B1FD",
} as const;

export const motion = {
  fast: "120ms",
  normal: "180ms",
  panel: "240ms",
  easing: "cubic-bezier(0.2, 0, 0, 1)",
  distance: { control: "8px", panel: "16px", sheet: "20px" },
} as const;
