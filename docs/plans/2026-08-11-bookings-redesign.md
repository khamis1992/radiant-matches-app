# GLAM bookings redesign

## Direction

The screen uses a mobile-first “next appointment first” hierarchy. The nearest upcoming booking receives one expressive, information-rich card; every later appointment uses a compact card. This makes the most time-sensitive information visible without turning the page into a dashboard.

## Structure

- A light editorial header provides back navigation, page context, and a booking icon.
- A two-option segmented control switches between upcoming and past bookings.
- The first upcoming booking shows its moment, status, date, artist, service, location, time, total, chat action, and details action.
- Remaining upcoming and past bookings use compact cards for faster scanning.
- Loading, error, and empty states reuse the same spacing, tokens, and rounded geometry.

## Brand and accessibility

- All component colors use GLAM tokens; status colors are reserved for status communication.
- The page is white/porcelain-led, with Ink as the primary action color and Rose used only as an accent.
- No decorative stars, gradients, brushstrokes, or unapproved colors are used.
- All interactive targets are at least 44px, focus states are visible, and status always includes text and an icon.
- Arabic and English layouts share the same hierarchy and support RTL direction.

## Validation

- TypeScript and ESLint checks for the page.
- Mobile layout inspection at 375px.
- Verify no horizontal overflow, clipped controls, invalid nested interactive elements, or token violations.
