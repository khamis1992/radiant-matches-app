interface CategoryCardProps {
  name: string;
  image: string;
  onClick?: () => void;
}

const CategoryCard = ({ name, image, onClick }: CategoryCardProps) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2.5 flex-shrink-0 w-[68px] group active:scale-95 transition-transform"
    >
      {/* Circle with border ring */}
      <div className="relative">
        <div className="w-[56px] h-[56px] rounded-full overflow-hidden ring-2 ring-border/40 group-hover:ring-primary/40 transition-all duration-300 shadow-sm group-hover:shadow-md">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
      </div>
      {/* Label */}
      <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground text-center leading-tight line-clamp-2 transition-colors">
        {name}
      </span>
    </button>
  );
};

export default CategoryCard;
