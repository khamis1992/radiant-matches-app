/**
 * Service-category motion clips used as cover fallback for photo-less artist cards.
 */
import categoryMakeup from "@/assets/category-makeup.jpg";
import categoryHairstyling from "@/assets/category-hairstyling.jpg";
import categoryHenna from "@/assets/category-henna.jpg";
import categoryLashes from "@/assets/category-lashes.jpg";
import categoryNails from "@/assets/category-nails.jpg";
import categoryBridal from "@/assets/category-bridal.jpg";
import categoryPhotoshoot from "@/assets/category-photoshoot.jpg";

export const CATEGORY_VIDEOS: Record<string, string> = {
  Makeup: "/videos/categories/makeup.mp4",
  "Hair Styling": "/videos/categories/hairstyling.mp4",
  Henna: "/videos/categories/henna.mp4",
  "Lashes & Brows": "/videos/categories/lashes.mp4",
  Nails: "/videos/categories/nails.mp4",
  Bridal: "/videos/categories/bridal.mp4",
  Photoshoot: "/videos/categories/photoshoot.mp4",
};

export const CATEGORY_IMAGES: Record<string, string> = {
  Makeup: categoryMakeup,
  "Hair Styling": categoryHairstyling,
  Henna: categoryHenna,
  "Lashes & Brows": categoryLashes,
  Nails: categoryNails,
  Bridal: categoryBridal,
  Photoshoot: categoryPhotoshoot,
};

const CATEGORY_ALIASES: Record<string, keyof typeof CATEGORY_VIDEOS> = {
  makeup: "Makeup",
  "makeup artist": "Makeup",
  مكياج: "Makeup",
  "hair styling": "Hair Styling",
  hair: "Hair Styling",
  hairstyle: "Hair Styling",
  "تصفيف الشعر": "Hair Styling",
  شعر: "Hair Styling",
  henna: "Henna",
  حناء: "Henna",
  الحنة: "Henna",
  "lashes & brows": "Lashes & Brows",
  lashes: "Lashes & Brows",
  brows: "Lashes & Brows",
  "رموش وحواجب": "Lashes & Brows",
  "الرموش والحواجب": "Lashes & Brows",
  nails: "Nails",
  nail: "Nails",
  أظافر: "Nails",
  الأظافر: "Nails",
  bridal: "Bridal",
  bride: "Bridal",
  عروس: "Bridal",
  عروسات: "Bridal",
  photoshoot: "Photoshoot",
  photography: "Photoshoot",
  تصوير: "Photoshoot",
};

const resolveCategory = (category: string) => {
  if (CATEGORY_VIDEOS[category]) return category as keyof typeof CATEGORY_VIDEOS;
  return CATEGORY_ALIASES[category.trim().toLowerCase()] || null;
};

/**
 * First matching service clip wins. Artists with incomplete service data use
 * the supplied fallback, so a photo-less card never drops back to initials.
 */
export const getCategoryVideo = (
  categories?: string[] | null,
  fallbackCategory: keyof typeof CATEGORY_VIDEOS = "Makeup"
): string => {
  for (const category of categories || []) {
    const resolved = resolveCategory(category);
    const v = resolved ? CATEGORY_VIDEOS[resolved] : null;
    if (v) return v;
  }
  return CATEGORY_VIDEOS[fallbackCategory];
};

/**
 * Static poster twin of getCategoryVideo — same resolution rules, but
 * returns the still category image for photo-less cards.
 */
export const getCategoryImage = (
  categories?: string[] | null,
  fallbackCategory: keyof typeof CATEGORY_IMAGES = "Makeup"
): string => {
  for (const category of categories || []) {
    const resolved = resolveCategory(category);
    const img = resolved ? CATEGORY_IMAGES[resolved] : null;
    if (img) return img;
  }
  return CATEGORY_IMAGES[fallbackCategory];
};
