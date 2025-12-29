import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface LazyImageProps {
  src: string;
  alt?: string;
  className?: string;
  loading?: boolean;
  onLoad?: () => void;
}

const LazyImage = ({ src, alt = "", className = "", loading: false, onLoad }: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {loading && !isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`transition-opacity duration-300 ${isInView ? "opacity-100" : "opacity-0"} ${className}`}
        onLoad={handleLoad}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};

export default LazyImage;

