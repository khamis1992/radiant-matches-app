interface CategoryCardProps {
  name: string;
  image: string;
  onClick?: () => void;
}

const CategoryCard = ({ name, image, onClick }: CategoryCardProps) => {
  return (
    <button
      onClick={onClick}
      className="relative flex-shrink-0 w-20 group"
    >
      <div className="relative w-16 h-16 mx-auto overflow-hidden rounded-2xl shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
      </div>
      <p className="mt-2 text-xs font-medium text-center text-foreground truncate">
        {name}
      </p>
    </button>
  );
};

export default CategoryCard;
