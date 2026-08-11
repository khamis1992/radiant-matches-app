# Artist profile tabs redesign

## Goal

Keep all five artist-profile sections visible on mobile without clipping or horizontal scrolling.

## Design

- Use a five-column segmented control so every destination is always discoverable.
- Stack each icon above its short label to preserve a comfortable touch target on narrow screens.
- Use GLAM Ink for the selected tab and Rose only for icons, counts, focus, and hover accents.
- Position counts inside the tab corner so they do not change label width.
- Preserve the existing sticky behavior and all tab content.

## Responsive and accessibility behavior

- The grid contracts evenly from small phones upward and does not overflow horizontally.
- Each tab has a visible selected state, focus ring, text label, and accessible name.
- Arabic uses concise labels and follows the page direction automatically.
