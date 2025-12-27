import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTranslateService = () => {
  const [isTranslating, setIsTranslating] = useState(false);

  const translate = async (text: string, targetLanguage: "ar" | "en"): Promise<string | null> => {
    if (!text.trim()) return null;
    
    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate-service", {
        body: { text, targetLanguage },
      });

      if (error) {
        console.error("Translation error:", error);
        toast.error(targetLanguage === "ar" ? "فشل في الترجمة" : "Translation failed");
        return null;
      }

      return data.translatedText;
    } catch (err) {
      console.error("Translation error:", err);
      toast.error(targetLanguage === "ar" ? "فشل في الترجمة" : "Translation failed");
      return null;
    } finally {
      setIsTranslating(false);
    }
  };

  return { translate, isTranslating };
};
