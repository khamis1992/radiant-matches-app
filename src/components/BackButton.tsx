import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  onClick?: () => void;
  className?: string;
  variant?: "default" | "overlay";
}

const BackButton = ({ onClick, className, variant = "default" }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "p-2 rounded-full transition-colors",
        variant === "default" && "-ml-2 hover:bg-muted",
        variant === "overlay" && "bg-card/80 backdrop-blur-sm shadow-md hover:bg-card",
        className
      )}
      aria-label="Go back"
    >
      <ArrowLeft className="w-5 h-5 text-foreground" />
    </button>
  );
};

export default BackButton;
