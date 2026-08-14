/**
 * Brand fallback cover for photo-less cards — full-bleed GLAM brand mark.
 * The asset is pre-cropped solid (no transparent corners), so it fills
 * the card frame exactly with no gaps and no animation.
 */
const BrandCover = () => (
  <div className="absolute inset-0 overflow-hidden bg-glam-ink">
    <img
      src="/brand/glam-brand-cover.jpg"
      alt="GLAM"
      loading="lazy"
      draggable={false}
      className="h-full w-full object-cover"
    />
  </div>
);

export default BrandCover;
