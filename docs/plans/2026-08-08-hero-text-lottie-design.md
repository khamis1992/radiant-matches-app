# Hero text Lottie reveal

The home hero keeps its existing semantic, localized HTML copy as an accessible
fallback while native Lottie text layers render the visible kinetic copy. Words
enter in reading order with distinct motion roles: the first word rises, the
second travels laterally, and the active second-line word lands with a restrained
scale settle. The rose phrase and supporting line arrive as calmer follow-through.

English and Arabic use separate scenes so typography, shaping, placement, and
reading direction stay intentional. English uses native Lottie text layers.
Because `lottie-web` separates Arabic glyphs instead of shaping connected script,
the Arabic scene uses transparent, 2× rasterized IBM Plex Sans Arabic word layers
generated from the browser, while the underlying HTML remains semantic text.
When `prefers-reduced-motion` is enabled, when loading fails, or when the player
is unavailable, the copy is shown statically. The animation uses the project's
existing lazy-loaded `lottie-web` dependency and a scene stored under the
Diffusion Studio project/scene layout.

Verification covers JSON validity, TypeScript/build output, the first, middle,
and final frames, both language directions, and the GLAM brand checklist.
