import { useState, useCallback, useEffect, useRef } from "react";

interface VoiceSearchResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface UseVoiceSearchOptions {
  language?: string;
  continuous?: boolean;
  onResult?: (result: VoiceSearchResult) => void;
  onError?: (error: string) => void;
}

/**
 * Hook for voice search using Web Speech API
 * Provides speech-to-text functionality for artist search
 */
export const useVoiceSearch = (options: UseVoiceSearchOptions = {}) => {
  const { language = "en-US", continuous = false, onResult, onError } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check if speech recognition is supported
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);

        if (onResult) {
          onResult({
            transcript: currentTranscript,
            confidence: event.results[event.results.length - 1][0].confidence,
            isFinal: event.results[event.results.length - 1].isFinal,
          });
        }
      };

      recognitionRef.current.onerror = (event) => {
        const errorMessage = getErrorMessage(event.error);
        setError(errorMessage);
        setIsListening(false);
        if (onError) {
          onError(errorMessage);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language, continuous, onResult, onError]);

  // Update language when it changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case "no-speech":
        return "No speech detected. Please try again.";
      case "audio-capture":
        return "No microphone found. Please ensure a microphone is connected.";
      case "not-allowed":
        return "Microphone permission denied. Please allow microphone access.";
      case "network":
        return "Network error. Please check your connection.";
      case "aborted":
        return "Speech recognition was aborted.";
      default:
        return "An error occurred. Please try again.";
    }
  };

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("Voice search is not supported in this browser.");
      return;
    }

    setError(null);
    setTranscript("");

    try {
      recognitionRef.current?.start();
      setIsListening(true);
    } catch (err) {
      // Recognition might already be running
      setError("Failed to start voice recognition.");
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
};

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

