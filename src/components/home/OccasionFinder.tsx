import { CalendarDays, MapPin, Sparkles, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackProductEvent } from "@/lib/productAnalytics";

const OCCASIONS = [
  { value: "bridal", category: "Bridal", ar: "زفاف", en: "Bridal" },
  { value: "engagement", category: "Makeup", ar: "خطوبة", en: "Engagement" },
  { value: "celebration", category: "Makeup", ar: "سهرة أو مناسبة", en: "Evening & events" },
  { value: "photoshoot", category: "Photoshoot", ar: "تصوير", en: "Photoshoot" },
  { value: "henna", category: "Henna", ar: "حنة", en: "Henna" },
];

const BUDGETS = [
  { value: "", ar: "أي ميزانية", en: "Any budget" },
  { value: "500", ar: "حتى ٥٠٠ ر.ق", en: "Up to QAR 500" },
  { value: "1000", ar: "حتى ١٬٠٠٠ ر.ق", en: "Up to QAR 1,000" },
  { value: "2000", ar: "حتى ٢٬٠٠٠ ر.ق", en: "Up to QAR 2,000" },
];

const VISUAL_STYLES = [
  { value: "", ar: "أي ستايل", en: "Any style" },
  { value: "natural", ar: "طبيعي وناعم", en: "Natural & soft" },
  { value: "soft_glam", ar: "سوفت جلام", en: "Soft glam" },
  { value: "full_glam", ar: "فول جلام", en: "Full glam" },
];

const todayIso = () => new Date().toISOString().slice(0, 10);

export const OccasionFinder = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRTL = language === "ar";
  const [occasion, setOccasion] = useState("");
  const [date, setDate] = useState("");
  const [area, setArea] = useState("");
  const [budget, setBudget] = useState("");
  const [visualStyle, setVisualStyle] = useState("");

  const selectedOccasion = useMemo(
    () => OCCASIONS.find((item) => item.value === occasion),
    [occasion],
  );

  const findExperts = () => {
    const params = new URLSearchParams();
    params.set("journey", "occasion");
    params.set("available", "true");
    if (selectedOccasion) {
      params.set("occasion", selectedOccasion.value);
      params.set("category", selectedOccasion.category);
    }
    if (date) params.set("date", date);
    if (area.trim()) params.set("location", area.trim());
    if (budget) params.set("maxPrice", budget);
    if (visualStyle) params.set("style", visualStyle);
    void trackProductEvent("occasion_search", { occasion, date, area: area.trim() || null, budget: budget || null, visual_style: visualStyle || null }, "home");
    navigate(`/makeup-artists?${params.toString()}`);
  };

  const label = (item: { ar: string; en: string }) => (isRTL ? item.ar : item.en);

  return (
    <section
      aria-label={isRTL ? "ابحثي حسب مناسبتك" : "Find experts for your occasion"}
      className="mx-5 -mt-1 rounded-[28px] border border-glam-border/70 bg-white p-4 shadow-[0_18px_42px_-26px_rgba(16,20,23,0.34)]"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-glam-blush-soft text-glam-rose">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-glam-ink">
            {isRTL ? "احجزي حسب مناسبتك" : "Book for your occasion"}
          </h2>
          <p className="text-[11px] text-glam-muted">
            {isRTL ? "نطابقك مع خبيرات متاحات بسعر واضح" : "Find available experts with transparent pricing"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <label className="rounded-2xl border border-glam-border bg-glam-porcelain px-3 py-2.5">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-glam-muted">
            <Sparkles className="h-3 w-3 text-glam-rose" aria-hidden="true" />
            {isRTL ? "المناسبة" : "Occasion"}
          </span>
          <select
            value={occasion}
            onChange={(event) => setOccasion(event.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-glam-ink outline-none"
            aria-label={isRTL ? "اختاري المناسبة" : "Select occasion"}
          >
            <option value="">{isRTL ? "اختاري المناسبة" : "Choose occasion"}</option>
            {OCCASIONS.map((item) => (
              <option key={item.value} value={item.value}>{label(item)}</option>
            ))}
          </select>
        </label>

        <label className="rounded-2xl border border-glam-border bg-glam-porcelain px-3 py-2.5">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-glam-muted">
            <CalendarDays className="h-3 w-3 text-glam-rose" aria-hidden="true" />
            {isRTL ? "التاريخ" : "Date"}
          </span>
          <input
            type="date"
            min={todayIso()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-glam-ink outline-none"
            aria-label={isRTL ? "اختاري التاريخ" : "Choose date"}
          />
        </label>

        <label className="rounded-2xl border border-glam-border bg-glam-porcelain px-3 py-2.5">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-glam-muted">
            <MapPin className="h-3 w-3 text-glam-rose" aria-hidden="true" />
            {isRTL ? "المنطقة" : "Area"}
          </span>
          <input
            value={area}
            onChange={(event) => setArea(event.target.value)}
            placeholder={isRTL ? "مثال: الدوحة" : "e.g. Doha"}
            className="w-full bg-transparent text-xs font-semibold text-glam-ink placeholder:text-glam-muted outline-none"
            aria-label={isRTL ? "اكتبي المنطقة" : "Enter area"}
          />
        </label>

        <label className="rounded-2xl border border-glam-border bg-glam-porcelain px-3 py-2.5">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-glam-muted">
            <WalletCards className="h-3 w-3 text-glam-rose" aria-hidden="true" />
            {isRTL ? "الميزانية" : "Budget"}
          </span>
          <select
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-glam-ink outline-none"
            aria-label={isRTL ? "اختاري الميزانية" : "Choose budget"}
          >
            {BUDGETS.map((item) => (
              <option key={item.value || "any"} value={item.value}>{label(item)}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-2.5 block rounded-2xl border border-glam-border bg-glam-porcelain px-3 py-2.5">
        <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-glam-muted">
          <Sparkles className="h-3 w-3 text-glam-rose" aria-hidden="true" />
          {isRTL ? "ستايل اللوك" : "Look style"}
        </span>
        <select
          value={visualStyle}
          onChange={(event) => setVisualStyle(event.target.value)}
          className="w-full bg-transparent text-xs font-semibold text-glam-ink outline-none"
          aria-label={isRTL ? "اختاري ستايل اللوك" : "Choose a look style"}
        >
          {VISUAL_STYLES.map((item) => <option key={item.value || "any"} value={item.value}>{label(item)}</option>)}
        </select>
      </label>

      <button
        type="button"
        onClick={findExperts}
        className="mt-3 flex h-11 w-full items-center justify-center rounded-full bg-glam-ink px-4 text-sm font-bold text-white transition-transform active:scale-[0.98]"
      >
        {isRTL ? "اعرضي الخبيرات المتاحات" : "Show available experts"}
      </button>
    </section>
  );
};

export default OccasionFinder;
