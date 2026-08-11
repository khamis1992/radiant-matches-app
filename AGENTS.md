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

## Commands

- `npm run dev` — Vite dev server on **port 82** (`strictPort`, polling watch for Capacitor HMR).
- `npm run build` — prod web build to `dist/` (terser, `drop_console`; es2020 target for maplibre BigInt).
- `npm run lint` — ESLint 9 flat config. Must end with **0 errors** (86 legacy `any` warnings are accepted).
- `npx tsc -p tsconfig.app.json --noEmit` — typecheck. `strict` is OFF; must pass clean.
- Android APK: `npm run android:run` (build + cap sync + gradle run). CI: `.github/workflows/build-android-apk.yml`
  runs typecheck + lint as a quality gate before building debug + unsigned release APKs.
- iOS: `npm run ios:run`; CI in `.github/workflows/ios-build.yml` (fastlane; note: workflow calls
  `pod install` but the project uses Swift Package Manager — no Podfile exists).
- Supabase edge functions deploy via `deploy-sadad.bat`/`deploy-sadad.sh` (project id `besjfzlgtssriqpluzgn`).

## Architecture

- SPA, page-per-file in `src/pages/` (65 pages). All pages lazy-loaded except Onboarding/Auth.
  Routes defined in `src/App.tsx` inside provider stack: ErrorBoundary → QueryClientProvider →
  LanguageProvider → TooltipProvider → BrowserRouter. Role-gating via `src/components/auth/RoleGate.tsx`
  (`AppRole`: admin | customer | artist | seller; priority admin > artist > seller > customer).
- Data layer: TanStack Query hooks in `src/hooks/` (72 files) calling the Supabase JS client directly
  in `queryFn` (no ORM/API abstraction; multi-table joins done in JS, e.g. `useArtists.ts`).
  QueryClient defaults: staleTime 60s, gcTime 5min, retry 1, refetchOnWindowFocus false.
- Only one app context: `src/contexts/LanguageContext.tsx` (i18n, default **Arabic**, localStorage key
  `glam-app-language`, sets `dir`/`lang` on `<html>`). Auth is NOT a context — `src/hooks/useAuth.ts`
  uses module-level `cachedUser`/`authInitialized`; `signOut` wipes all `sb-*` localStorage keys.
- Design tokens: `src/theme/glam-tokens.css` + TS mirror `src/theme/glam-colors.ts` (single source of
  truth, must stay in sync) + `glam.*` Tailwind scale in `tailwind.config.ts`. No hard-coded HEX in components.
- Supabase client: `src/integrations/supabase/client.ts` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).
- Qatar-first product: `src/lib/locale.ts` (Asia/Qatar, QAR), `src/lib/qatar-geo.ts` (12 areas,
  bilingual, area-centroid pins with ±1.2km jitter for privacy), `src/lib/phoneValidation.ts` (+974 regex),
  category videos in `src/lib/categoryVideos.ts` (used as artist card covers).
- PWA: `public/sw.js` (cache-first, `glam-app-v2`), registered in production only; `manifest.json` is ar/rtl.
- Maps: both Leaflet (`react-leaflet`) and MapLibre (`maplibre-gl`) in use.

## Conventions & patterns

- Commits are mostly "Changes" / feature-named by `gpt-engineer-app[bot]`; recent human commits (khamis1992)
  are descriptive ("Add GLAM brand assets..."). Single `main` branch, no feature branches used.
- Lazy-load Lottie (`src/components/LottieIcon.tsx`) — respects `prefers-reduced-motion`, pauses offscreen.
- Guest mode: bottom dock visible to guests; protected features show `LoginPromptModal`; RoleGate preserves
  `from` state for post-login return; guest carts merge on login (`useUnifiedCart` + `useLocalCart`).
- All user-facing text goes through `t()` from `useLanguage` — keep `en.ts`/`ar.ts` translation dictionaries
  in sync (both ~1,780 lines, nested by feature).
- Edge functions use service-role keys, verify JWT via `verify_jwt` in `supabase/config.toml`
  (sadad callbacks, check-blocked-ip, validate-invitation, bootstrap-admin are public; others require JWT).

## Known gotchas

- **SADAD (Qatar) payments** are the payment backbone: initiate → checksum (AES-128-CBC + SHA-256,
  mimics PHP impl, hard-coded IV `@@@@&&&&####$$$$`) → redirect → callback verifies checksum, IP,
  and amount integrity. RESPCODE: 1=success, 400/402=pending, 810=failed. Tables: `payment_transactions`
  (status initiated/processing → success/pending/failed), `bookings.sadad_order_id`. Callback functions
  are public and must stay public (SADAD posts to them).
- **Image moderation**: `moderate-image` edge function (Gemini via Lovable gateway, needs `LOVABLE_API_KEY`)
  → `image_moderation_queue`; flagged images go `pending` for admin review; `security_audit_log` is permanent.
- **IP blocking/security hardening** is a recurring theme (Feb 2026): `check-blocked-ip` on every login,
  `blocked_ips` table, Qatar-only signup, permanent `security_audit_log`, restricted RLS on
  `artist_invitations`/`referrals`/`instagram_connections` — don't loosen these policies without review.
- iOS CI has dead config: `pod install` steps + `fastlane` Appfile placeholders (`YOUR_TEAM_ID`,
  `your-apple-id@example.com`) and `exportOptions.plist` teamID placeholder — iOS release signing is unfinished.
- Android release APK is **unsigned** (no keystore secrets in CI).
- `no-explicit-any` is warn-only: legacy `any` is being cleaned up incrementally; don't add new ones,
  but don't churn old code for it either.
- `tsconfig` is intentionally loose (`strict: false`) — typecheck passes with loose code; don't tighten without CI update.
- `docs/plans/` contains dated design briefs (2026-08-*) — new UI work often has an associated plan file.
- `bun.lockb` is gitignored; use `npm`/`package-lock.json` for deps.
