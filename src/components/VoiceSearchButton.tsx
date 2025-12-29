import { useState, useEffect } from "react";
import { Mic, MicOff, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceSearchButtonProps {
  onResult: (transcript: string) => void;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
}

/**
 * Voice Search Button Component
 * Provides a microphone button for voice-based artist search
 */
export const VoiceSearchButton = ({
  onResult,
  className,
  size = "icon",
}: VoiceSearchButtonProps) => {
  const { language, t } = useLanguage();
  const [showPulse, setShowPulse] = useState(false);

  const {
    isListening,
    transcript,
    error,
    isSupported,
    toggleListening,
    resetTranscript,
  } = useVoiceSearch({
    language: language === "ar" ? "ar-QA" : "en-US",
    onResult: (result) => {
      if (result.isFinal && result.transcript.trim()) {
        onResult(result.transcript.trim());
        resetTranscript();
      }
    },
    onError: (errorMessage) => {
      toast.error(errorMessage);
    },
  });

  // Pulse animation when listening
  useEffect(() => {
    if (isListening) {
      setShowPulse(true);
    } else {
      setShowPulse(false);
    }
  }, [isListening]);

  // Show error if voice search is not supported
  if (!isSupported) {
    return null; // Don't show button if not supported
  }

  return (
    <div className="relative">
      {/* Pulse Animation */}
      {showPulse && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-10 h-10 bg-primary/20 rounded-full animate-ping" />
          <div className="absolute w-8 h-8 bg-primary/30 rounded-full animate-pulse" />
        </div>
      )}

      <Button
        type="button"
        variant={isListening ? "destructive" : "outline"}
        size={size}
        onClick={toggleListening}
        className={cn(
          "relative transition-all duration-200",
          isListening && "bg-red-500 hover:bg-red-600 border-red-500",
          className
        )}
        title={isListening 
          ? (t.voiceSearch?.stopListening || "Stop listening") 
          : (t.voiceSearch?.startListening || "Voice search")
        }
      >
        {isListening ? (
          <MicOff className="w-4 h-4 animate-pulse" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </Button>

      {/* Transcript Preview */}
      {isListening && transcript && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-popover border border-border rounded-lg shadow-lg whitespace-nowrap text-sm z-50">
          <span className="text-muted-foreground">"</span>
          {transcript}
          <span className="text-muted-foreground">"</span>
        </div>
      )}
    </div>
  );
};

export default VoiceSearchButton;

