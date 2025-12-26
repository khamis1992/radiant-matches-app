import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ImageSuggestion {
  category: string;
  title: string;
  isFeatured: boolean;
  reason: string;
}

export const useImageAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeImage = async (imageFile: File): Promise<ImageSuggestion | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Convert file to base64
      const base64 = await fileToBase64(imageFile);

      const { data, error: fnError } = await supabase.functions.invoke("analyze-portfolio-image", {
        body: { imageBase64: base64 },
      });

      if (fnError) {
        throw new Error(fnError.message || "Failed to analyze image");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data as ImageSuggestion;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to analyze image";
      setError(message);
      console.error("Image analysis error:", err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeImage,
    isAnalyzing,
    error,
  };
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
