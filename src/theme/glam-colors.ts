/**
 * GLAM brand color tokens — single source of truth (TypeScript side).
 * Mirror of src/theme/glam-tokens.css. See docs/brand/GLAM_Brand_Guidelines.md.
 */
export const GLAM_COLORS = {
  ink: "#101417",
  roseAction: "#A9475B",
  blush: "#EFA6A8",
  softBlush: "#F8C2C3",
  deepBlush: "#CA8287",
  porcelain: "#FFFFFF",
  white: "#FFFFFF",

  textPrimary: "#101417",
  textSecondary: "#5F6268",
  textMuted: "#8A8C91",
  border: "#E7E1E3",
  disabled: "#B9B5B7",
  softSurface: "#F5F3F4",

  success: "#24745B",
  warning: "#9A6300",
  error: "#B3263E",
  info: "#2E5F9D",
} as const;

export const GLAM_THEME = {
  pageBackground: GLAM_COLORS.white,
  alternateBackground: GLAM_COLORS.porcelain,
  primaryText: GLAM_COLORS.textPrimary,
  secondaryText: GLAM_COLORS.textSecondary,
  primaryAction: GLAM_COLORS.ink,
  accentAction: GLAM_COLORS.roseAction,
  divider: GLAM_COLORS.border,
} as const;

export type GlamColorToken = (typeof GLAM_COLORS)[keyof typeof GLAM_COLORS];
