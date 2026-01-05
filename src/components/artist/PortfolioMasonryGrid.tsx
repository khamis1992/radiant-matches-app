import { useState, useRef, useEffect } from "react";
import { Plus, Star, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortfolioItem {
  id: string;
  image_url: string;
  category: string;
  title?: string;
  is_featured: boolean;
  aspect_ratio?: number;
}

interface PortfolioMasonryGridProps {
  items: PortfolioItem[];
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onImageClick: (index: number) => void;
  isLoading?: boolean;
}

export const PortfolioMasonryGrid = ({
  items,
  categories,
  selectedCategory,
  onCategoryChange,
  onImageClick,
  isLoading = false,
}: PortfolioMasonryGridProps) => {
  const [imageHeights, setImageHeights] = useState<Record<string, number>>({});
  const imageRefs = useRef<Record<string, HTMLImageElement>>({});

  // Filter items by selected category
  const filteredItems = selectedCategory === "All"
    ? items
    : items.filter(item => item.category === selectedCategory);

  // Calculate image heights for masonry layout
  useEffect(() => {
    const heights: Record<string, number> = {};
    let loadedCount = 0;
    const totalImages = filteredItems.length;

    filteredItems.forEach((item) => {
      const img = imageRefs.current[item.id];
      if (img && img.complete) {
        // Calculate height based on aspect ratio
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const columnWidth = (window.innerWidth - 32 - 8) / 2; // 32px padding, 8px gap
        heights[item.id] = columnWidth / aspectRatio;
        loadedCount++;
      }
    });

    if (loadedCount === totalImages) {
      setImageHeights(heights);
    }
  }, [filteredItems]);

  // Split items into two columns for masonry layout
  const [leftColumn, rightColumn] = filteredItems.reduce(
    (acc, item, index) => {
      if (index % 2 === 0) {
        acc[0].push(item);
      } else {
        acc[1].push(item);
      }
      return acc;
    },
    [[], []] as [PortfolioItem[], PortfolioItem[]]
  );

  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = cat === "All" ? items.length : items.filter(item => item.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Category Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={cn(
              "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all snap-start",
              selectedCategory === category
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {category === "All" ? "All" : category} {categoryCounts[category] > 0 && `(${categoryCounts[category]})`}
          </button>
        ))}
      </div>

      {/* Masonry Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-muted rounded-xl animate-pulse"
              style={{ height: `${150 + (i % 3) * 50}px` }}
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Plus className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {selectedCategory === "All" ? "No Portfolio Items" : `No ${selectedCategory} Items`}
          </h3>
          <p className="text-muted-foreground mb-6">
            {selectedCategory === "All"
              ? "Start building your portfolio by uploading your best work"
              : `No items in ${selectedCategory} category yet`}
          </p>
          <button
            onClick={onUploadClick}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
          >
            Upload First Image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {/* Left Column */}
          <div className="space-y-2">
            {leftColumn.map((item, index) => (
              <MasonryItem
                key={item.id}
                item={item}
                height={imageHeights[item.id]}
                onClick={() => onImageClick(items.indexOf(item))}
                imageRef={(el) => {
                  if (el) imageRefs.current[item.id] = el;
                }}
              />
            ))}
          </div>

          {/* Right Column */}
          <div className="space-y-2">
            {rightColumn.map((item, index) => (
              <MasonryItem
                key={item.id}
                item={item}
                height={imageHeights[item.id]}
                onClick={() => onImageClick(items.indexOf(item))}
                imageRef={(el) => {
                  if (el) imageRefs.current[item.id] = el;
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface MasonryItemProps {
  item: PortfolioItem;
  height?: number;
  onClick: () => void;
  imageRef: (el: HTMLImageElement | null) => void;
}

const MasonryItem = ({ item, height, onClick, imageRef }: MasonryItemProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      onClick={onClick}
      className="relative rounded-xl overflow-hidden shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
      style={{
        height: height || 'auto',
        minHeight: '150px',
      }}
    >
      {/* Loading Placeholder */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Image */}
      <img
        ref={imageRef}
        src={item.image_url}
        alt={item.title || item.category}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setImageLoaded(true)}
      />

      {/* Featured Badge */}
      {item.is_featured && (
        <div className="absolute top-2 right-2">
          <div className="w-8 h-8 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Star className="w-4 h-4 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Category Badge */}
      <div className="absolute bottom-2 left-2">
        <span className="px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium rounded-full">
          {item.category}
        </span>
      </div>

      {/* Overlay on Touch */}
      <div className="absolute inset-0 bg-black/0 active:bg-black/10 transition-colors" />
    </div>
  );
};

export default PortfolioMasonryGrid;
