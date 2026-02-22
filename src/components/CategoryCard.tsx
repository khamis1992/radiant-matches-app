interface CategoryCardProps {
  name: string;
  image: string;
  onClick?: () => void;
}

const CategoryCard = ({ name, image, onClick }: CategoryCardProps) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 flex-shrink-0 w-[72px] group"
    >
      <div className="w-[60px] h-[60px] rounded-full overflow-hidden shadow-sm border border-border/30">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      <span className="text-[11px] font-medium text-muted-foreground text-center leading-tight line-clamp-2">
        {name}
      </span>
    </button>
  );
};

export default CategoryCard;
