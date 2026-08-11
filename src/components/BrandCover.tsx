/**
 * Brand fallback cover for photo-less cards — the dark GLAM app icon,
 * full-bleed with a slight zoom so its transparent corners stay hidden
 * inside the card's rounded frame.
 */
const BrandCover = () => (
  <div className="glam-brand-cover absolute inset-0 overflow-hidden bg-glam-ink">
    <div className="glam-brand-cover__motion absolute inset-0">
      <img
        src="/brand/glam-app-icon.png"
        alt="GLAM"
        loading="lazy"
        draggable={false}
        className="glam-brand-cover__image h-full w-full object-cover"
      />
    </div>
  </div>
);

export default BrandCover;
