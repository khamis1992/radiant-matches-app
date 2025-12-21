import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface BackButtonProps {
  onClick?: () => void;
  className?: string;
  variant?: "default" | "overlay";
}

const BackButton = ({ onClick, className, variant = "default" }: BackButtonProps) => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <button
      onClick={handleClick}
      className={cn(
        "p-2 rounded-full transition-colors",
        variant === "default" && (isRTL ? "-mr-2" : "-ml-2") + " hover:bg-muted",
        variant === "overlay" && "bg-card/80 backdrop-blur-sm shadow-md hover:bg-card",
        className
      )}
      aria-label={t.common.back}
    >
      <ArrowIcon className="w-5 h-5 text-foreground" />
    </button>
  );
};

export default BackButton;
