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
          className="flex items-center justify-center w-10 h-10 rounded-2xl bg-muted hover:bg-muted/80 active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={t.common.changeLanguage}
        >
          <Globe className="w-5 h-5 text-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align={isRTL ? "start" : "end"} 
        sideOffset={8}
        className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-2xl p-1.5"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`cursor-pointer rounded-xl py-2.5 px-3 ${language === lang ? "bg-primary/10 text-primary" : "focus:bg-muted"}`}
            aria-current={language === lang ? "true" : undefined}
          >
            <span className="font-medium">{languageNames[lang]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
