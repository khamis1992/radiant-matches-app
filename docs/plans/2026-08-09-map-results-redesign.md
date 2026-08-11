# GLAM Map Results Redesign

## Goal

Make the artist map useful at mobile width: focus on nearby results, reveal overlapping artists, prevent navigation overlap, and keep artist discovery in the thumb zone.

## Approved interaction

- Leaflet remains the map engine because its raster tiles are reliable in the app runtime.
- The initial viewport centers on the visible artists. Nearby pins use a close zoom; wider results use fitted bounds.
- Pins in the same service area become a numbered cluster while zoomed out and separate at street-level zoom.
- Results live in a bottom sheet with two snap states: 38% collapsed and 72% expanded.
- Tapping the handle or swiping vertically changes the sheet state.
- Opening the map places it above the application dock, so the dock cannot obscure results.
- Artist results use a compact map-specific card with real imagery or the category video fallback.
- Map controls sit below the header and move above the sheet in both states.

## Brand and accessibility

- Components use the existing `glam.*` tokens only.
- Porcelain/white dominate; Rose Action is reserved for pins, active selection, and small accents.
- Controls use 44px minimum targets, visible focus states, and localized accessible labels.
- Arabic and English labels are generated from the active language without mixing directions.

## Verification

- Test at 375–465px width and desktop.
- Verify tiles, pin count, cluster expansion, sheet swipe/toggle, card navigation, safe-area padding, and hidden underlying dock.
- Run TypeScript and ESLint checks after implementation.
