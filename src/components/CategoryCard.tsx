import { useEffect, useRef } from "react";

interface CategoryCardProps {
  name: string;
  image: string;
  /** Optional looping motion clip; the image stays as poster/fallback. */
  video?: string;
  onClick?: () => void;
}

const CategoryCard = ({ name, image, video, onClick }: CategoryCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
    } else {
      v.play().catch(() => {});
    }
  }, [video]);

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 flex-shrink-0 w-[72px] group"
    >
      <div className="w-[60px] h-[60px] rounded-full overflow-hidden shadow-sm border-2 border-glam-blush-soft">
        {video ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={image}
            aria-label={name}
          >
            <source src={video} type="video/mp4" />
          </video>
        ) : (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <span className="text-[11px] font-medium text-glam-secondary text-center leading-tight line-clamp-2">
        {name}
      </span>
    </button>
  );
};

export default CategoryCard;
