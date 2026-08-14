import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Rotating beauty marketing words with a Uiverse-style stroke-fill effect.
 * Outline text fills with the brand rose color; colors from glam tokens only.
 */
const HeaderBeautyTicker = () => {
  const { t } = useLanguage();
  const words = t.home.marketingWords as string[] | undefined;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!words?.length) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [words?.length]);

  if (!words?.length) return null;

  return (
    <div className="flex items-center justify-center" aria-live="polite">
      <span key={index} className="ticker-word glam-stroke-text">
        {words[index]}
        <span aria-hidden="true" className="glam-stroke-hover">
          {words[index]}
        </span>
      </span>
    </div>
  );
};

export default HeaderBeautyTicker;
