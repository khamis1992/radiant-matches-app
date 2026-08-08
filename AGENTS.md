# GLAM — Agent Instructions

This project is the **GLAM** beauty marketplace (Capacitor + React + TypeScript + Tailwind).
The full brand guide lives at [docs/brand/GLAM_Brand_Guidelines.md](docs/brand/GLAM_Brand_Guidelines.md)
with the visual board at `docs/brand/brand-presentation.png`. **Read it before any UI work.**

## Brand compliance (mandatory for every screen)

- **Colors come only from tokens.** CSS vars in `src/theme/glam-tokens.css`, TS mirror in
  `src/theme/glam-colors.ts`, Tailwind scale `glam.*` (e.g. `bg-glam-ink`, `bg-glam-rose`,
  `text-glam-blush`). Never hard-code HEX values in components and never sample colors from images.
- **Palette:** Ink `#101417`, Rose Action `#A9475B`, Signature Blush `#EFA6A8`, Soft Blush `#F8C2C3`,
  Deep Blush `#CA8287`, Porcelain `#FCF8F8`, White `#FFFFFF`. Status colors only for states:
  success `#24745B`, warning `#9A6300`, error `#B3263E`, info `#2E5F9D`. Pink is never an error color.
- **70/20/10:** ~70% white/porcelain, ~20% ink/neutral, ≤10% pink. Pink is an accent, never a page background.
- **Light theme first.** No dark mode unless requested. Dark surfaces are allowed only for the
  splash/welcome hero or one premium banner.
- **Buttons:** one primary CTA per visual area. Default primary = `bg-glam-ink` + white text;
  pink primary = `bg-glam-rose` + white text. Never small white text on blush tones.
- **Logo:** original assets only — `public/brand/glam-logo-light.png` (light surfaces),
  `public/brand/glam-mark-dark.png` (dark surfaces). Never redraw, recolor, or typeset the logo,
  and never add stars/sparkles to it. The pink brushstroke is the only decorative brand element,
  at most once per screen (the logo's own brushstroke counts).
- **Typography:** IBM Plex Sans Arabic for Arabic UI, Inter for Latin UI (both loaded via
  `@fontsource` in `src/main.tsx`). Headings 600–700, body 400, buttons 600. No script fonts in UI.
- **Accessibility:** WCAG AA contrast (4.5:1 text, 3:1 large). Dark text on light pinks, white text
  only on ink/rose-action/status darks. Never communicate state by color alone.
- **Capacitor:** respect safe-area insets, use `100dvh` for full-height screens, keep the native
  shell background white/porcelain, dark system-bar icons on light screens.

## Before approving any screen

Run the checklist in the brand guide (§15): tokens only, light background, one primary CTA,
no unapproved colors/gradients/decorations, logo from original asset, focus/pressed/disabled
states visible, contrast verified.
