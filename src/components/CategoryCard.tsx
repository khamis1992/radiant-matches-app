import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  name: string;
  icon: LucideIcon;
  color: string;
  onClick?: () => void;
}

const CategoryCard = ({ name, icon: Icon, color, onClick }: CategoryCardProps) => {
  return (
    <button
      onClick={onClick}
      className="relative flex-shrink-0 w-20 group"
    >
      <div 
        className="relative w-16 h-16 mx-auto overflow-hidden rounded-2xl shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:scale-105 flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>
      <p className="mt-2 text-xs font-medium text-center text-foreground truncate">
        {name}
      </p>
    </button>
  );
};

export default CategoryCard;
