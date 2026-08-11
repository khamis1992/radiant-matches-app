# Customer dock redesign

The customer bottom navigation is changed from a full-width bar into a floating
capsule that follows the supplied reference: two destination items on each side,
a dominant centered search action, a soft blush outer halo, and a small rose
indicator under the active destination.

The implementation keeps the existing Phosphor icons, customer search sheet,
badges, haptic feedback, guest access, role routing, and RTL text direction.
Only the customer presentation is changed; artist and seller bars keep their
existing behavior and layout.

Brand adjustments use GLAM tokens only: white for the capsule, Rose Action for
the primary action and active state, Ink for inactive icons, and restrained
Deep Blush shadows for elevation. The dock remains light-theme first and keeps
a visible focus state on the central action and destinations.
