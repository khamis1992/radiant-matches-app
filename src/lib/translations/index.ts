import { en, TranslationKeys } from "./en";
import { ar } from "./ar";

export type Language = "en" | "ar";

export const translations: Record<Language, TranslationKeys> = {
  en,
  ar,
};

export const languageNames: Record<Language, string> = {
  en: "English",
  ar: "العربية",
};

export const isRTL = (lang: Language): boolean => lang === "ar";

export type { TranslationKeys };
