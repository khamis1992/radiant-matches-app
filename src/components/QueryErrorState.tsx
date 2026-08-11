import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface QueryErrorStateProps {
  onRetry?: () => void;
  className?: string;
  /** Compact inline variant for sections inside a page */
  compact?: boolean;
}

/**
 * Bilingual error state for failed react-query fetches, so a network
 * failure never masquerades as "no data" empty states.
 */
export const QueryErrorState = ({ onRetry, className, compact = false }: QueryErrorStateProps) => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (compact) {
    return (
      <div
        className={cn(
          "mx-5 flex items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3",
          className
        )}
        role="alert"
      >
        <div className="flex items-center gap-2 min-w-0">
          <WifiOff className="h-4 w-4 shrink-0 text-destructive" />
          <p className="truncate text-sm text-destructive">
            {isAr ? "تعذر تحميل البيانات" : "Couldn't load data"}
          </p>
        </div>
        {onRetry && (
          <Button size="sm" variant="ghost" onClick={onRetry} className="shrink-0 text-destructive">
            <RefreshCw className="h-3.5 w-3.5 me-1" />
            {isAr ? "إعادة المحاولة" : "Retry"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-10 text-center", className)} role="alert">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <WifiOff className="h-7 w-7 text-destructive" />
      </div>
      <h3 className="mb-1 font-semibold text-foreground">
        {isAr ? "تعذر تحميل البيانات" : "Couldn't load data"}
      </h3>
      <p className="mb-4 max-w-xs text-sm text-muted-foreground">
        {isAr
          ? "تحقق من اتصالك بالإنترنت وحاول مرة أخرى"
          : "Check your internet connection and try again"}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 me-2" />
          {isAr ? "إعادة المحاولة" : "Try Again"}
        </Button>
      )}
    </div>
  );
};

export default QueryErrorState;
