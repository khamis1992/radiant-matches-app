import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Language } from "@/lib/translations";

const LanguageSwitcher = () => {
  const { language, setLanguage, languageNames, t, isRTL } = useLanguage();

  const languages: Language[] = ["en", "ar"];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="relative group flex items-center justify-center w-11 h-11 rounded-xl bg-card shadow-sm border border-border/40 hover:border-primary/30 hover:shadow-md active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={t.common.changeLanguage}
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <Globe className="relative w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align={isRTL ? "start" : "end"} 
        sideOffset={12}
        className="w-40 bg-card border border-border/50 shadow-2xl rounded-2xl p-2 animate-in fade-in-0 zoom-in-95 duration-200"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`cursor-pointer rounded-xl py-3 px-4 transition-colors duration-150 ${
              language === lang 
                ? "bg-primary/10 text-primary font-semibold" 
                : "focus:bg-muted/80"
            }`}
            aria-current={language === lang ? "true" : undefined}
          >
            <span className="font-medium">{languageNames[lang]}</span>
            {language === lang && (
              <span className="ms-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
