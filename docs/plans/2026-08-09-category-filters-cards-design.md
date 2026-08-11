# Category Filters — Card Rail Redesign (2026-08-09)

## Context

The `/makeup-artists` category filters were pills with full-bleed looping
video backgrounds and a translucent white overlay. Text sat on top of busy
imagery, contrast was poor, and the row loaded up to 7 autoplay videos.

## Decision

Option 3 (chosen by the user): replace the pills with a horizontal rail of
larger category cards.

- 84x84 rounded-2xl image tile (`rounded-2xl`), category label below
  (`text-[11px]`, `line-clamp-2`, centered).
- The "All" entry is an icon tile (`LayoutGrid` on `bg-glam-surface`) so the
  meta-filter reads as distinct from photo categories.
- Selected state: `ring-2 ring-glam-rose` + `ring-offset-2`, soft rose shadow
  via `var(--glam-rose-action)`, label in `text-glam-rose font-semibold`.
- Unselected: hairline `ring-black/[0.06]`, label `text-glam-secondary`.
- Tiles play the looping category videos (`muted`, `loop`, `playsInline`) with
  the poster image as fallback. The video element mounts only while the card is
  on screen (`IntersectionObserver`, threshold 0.25) and is replaced by the
  static poster when `prefers-reduced-motion` is set — so off-screen categories
  never decode video.

## Brand compliance

- Colors only from glam tokens (`glam-rose`, `glam-surface`, `glam-secondary`).
- Pink stays an accent (ring + selected label only); tiles remain imagery/white.
- State is not color-alone: selected also changes label weight and adds a ring.

## Verification

- `eslint` clean (one pre-existing unrelated warning).
- `npm run build` passes.
- Playwright screenshots (390x844): default and selected states verified.
