# Featured Section Lottie Icons

## Goal

Replace the static Home section icons with transparent, branded, one-shot Lottie animations while retaining the existing PNG artwork as a resilient fallback.

## Featured Artists Motion

- The artist profile settles into view first.
- The makeup brush travels upward and softly locks into position.
- The GLAM four-point star appears last with a restrained scale settle.
- The final frame remains a clear icon at 40 px.

## Featured Shops Motion

- The shop body grows upward from its base.
- The striped awning drops into place.
- Cosmetic products appear in the windows.
- The GLAM star completes the composition.

## Runtime Behavior

- Each animation plays once when its section first enters the viewport.
- `prefers-reduced-motion` users see the completed final frame without motion.
- The existing PNG is visible during loading and remains when Lottie data fails.
- `lottie-web` stays lazy-loaded through the shared `LottieIcon` component.

## Assets

- Artist: `/projects/glam-featured-icons/scene-1/lottie.json`
- Shops: `/projects/glam-featured-icons/scene-2/lottie.json`
- Both scenes use transparent rasterized SVG layers for Skia and WebView compatibility.
