import React from "react";
import AppHeader, { HeaderStyle } from "./AppHeader";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";

interface PageHeaderProps {
  title?: string;
  showBack?: boolean;
  showLogo?: boolean;
  showSearch?: boolean;
  onSearchClick?: () => void;
  style?: HeaderStyle;
  children?: React.ReactNode;
  className?: string;
  // Legacy props for backward compatibility
  showSearchInput?: boolean;
  searchPlaceholder?: string;
}

const PageHeader = ({
  title,
  showBack = false,
  showLogo = false,
  showSearch = false,
  onSearchClick,
  style = "modern",
  children,
  className,
  showSearchInput = false,
  searchPlaceholder,
}: PageHeaderProps) => {
  const { isRTL } = useLanguage();

  return (
    <AppHeader
      title={title}
      showBack={showBack}
      showLogo={showLogo}
      showSearch={showSearch || showSearchInput}
      onSearchClick={onSearchClick}
      style={style}
      className={className}
    >
      {showSearchInput && (
        <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
          <Search className={`absolute ${isRTL ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            className={`h-10 ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} bg-card/50 backdrop-blur-sm border-border/50 rounded-full text-sm focus:border-primary/50 transition-all`}
          />
        </div>
      )}
      {children && !showSearchInput && children}
    </AppHeader>
  );
};

export default PageHeader;
