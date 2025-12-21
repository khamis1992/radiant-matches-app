import { Search, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SearchBarProps {
  placeholder?: string;
  location?: string;
}

const SearchBar = ({ placeholder, location = "Doha, Qatar" }: SearchBarProps) => {
  const { t, isRTL } = useLanguage();
  
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className={`absolute ${isRTL ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`} />
        <input
          type="text"
          placeholder={placeholder || t.home.searchPlaceholder}
          className={`w-full h-12 ${isRTL ? "pr-12 pl-4" : "pl-12 pr-4"} bg-card border border-border rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300`}
          dir={isRTL ? "rtl" : "ltr"}
        />
      </div>
      <button className={`flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors ${isRTL ? "flex-row-reverse" : ""}`}>
        <MapPin className="w-4 h-4" />
        <span>{location}</span>
      </button>
    </div>
  );
};

export default SearchBar;
