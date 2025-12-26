import React from "react";
import { AlertCircle, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: "default" | "inline" | "toast";
}

export const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onDismiss, 
  className,
  variant = "default" 
}: ErrorDisplayProps) => {
  if (!error) return null;

  if (variant === "toast") {
    return (
      <div className={cn(
        "fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto",
        className
      )}>
        <div className="bg-destructive/90 text-destructive-foreground p-4 rounded-xl shadow-lg backdrop-blur-sm animate-slide-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Error</p>
              <p className="text-sm opacity-90 mt-1">{error}</p>
              {onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 text-destructive-foreground border-destructive-foreground/20 hover:bg-destructive-foreground/10"
                  onClick={onRetry}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1 hover:bg-destructive-foreground/10 rounded-lg transition-colors"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn(
        "p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2",
        className
      )}>
        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
        <span className="text-sm text-destructive">{error}</span>
        {onRetry && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-destructive hover:bg-destructive/10"
            onClick={onRetry}
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-8 px-4",
      className
    )}>
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h3>
      <p className="text-muted-foreground text-center mb-4">{error}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorDisplay;
