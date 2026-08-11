/**
 * Geographic reference data for Qatar service areas.
 * Coordinates are AREA CENTROIDS (not exact addresses) — artist pins on the
 * public map intentionally show area-level precision for privacy.
 */

export interface QatarArea {
  id: string;
  en: string;
  ar: string;
  /** [longitude, latitude] — MapLibre/GeoJSON order */
  lngLat: [number, number];
  /** Extra lowercase aliases for fuzzy location matching */
  aliases?: string[];
}

export const QATAR_AREAS: QatarArea[] = [
  { id: "all", en: "All Areas", ar: "كل المناطق", lngLat: [51.1839, 25.2948] },
  { id: "doha", en: "Doha", ar: "الدوحة", lngLat: [51.531, 25.2854], aliases: ["al doha", "doha", "دوحة", "الدوحه"] },
  { id: "al_rayyan", en: "Al Rayyan", ar: "الريان", lngLat: [51.4244, 25.2919], aliases: ["rayyan", "alrayyan", "al-rayyan", "الريان"] },
  { id: "al_wakrah", en: "Al Wakrah", ar: "الوكرة", lngLat: [51.5976, 25.1659], aliases: ["wakrah", "wakra", "al wakrah", "al wakra", "الوكره"] },
  { id: "al_khor", en: "Al Khor", ar: "الخور", lngLat: [51.5058, 25.6839], aliases: ["khor", "alkhor", "al-khor", "الخور"] },
  { id: "umm_salal", en: "Umm Salal", ar: "أم صلال", lngLat: [51.4039, 25.4167], aliases: ["umm salal", "umsalal", "ام صلال"] },
  { id: "al_daayen", en: "Al Daayen", ar: "الضعاين", lngLat: [51.4542, 25.5775], aliases: ["daayen", "al daayen", "dhaayen", "الضعاين", "الظعاين"] },
  { id: "al_shamal", en: "Al Shamal", ar: "الشمال", lngLat: [51.2179, 26.1182], aliases: ["shamal", "al shamal", "madinat ash shamal", "الشمال"] },
  { id: "al_sheehaniya", en: "Al Sheehaniya", ar: "الشيحانية", lngLat: [51.0386, 25.3719], aliases: ["shahaniya", "sheehaniya", "al shahaniya", "الشحانية", "الشيحانية"] },
  { id: "lusail", en: "Lusail", ar: "لوسيل", lngLat: [51.4903, 25.4189], aliases: ["lusail", "lusail city", "لوسيل"] },
  { id: "pearl", en: "The Pearl", ar: "اللؤلؤة", lngLat: [51.5516, 25.3686], aliases: ["pearl", "the pearl", "pearl qatar", "اللؤلؤه", "لؤلؤة"] },
  { id: "west_bay", en: "West Bay", ar: "الخليج الغربي", lngLat: [51.5305, 25.3285], aliases: ["west bay", "westbay", "الخليج الغربي", "الدفنة", "dafna"] },
];

/** Default map position when nothing matches — central Doha */
export const DOHA_CENTER: [number, number] = [51.531, 25.2854];

/** Nice initial view: greater Doha metro visible */
export const QATAR_MAP_DEFAULT = {
  center: [51.21, 25.32] as [number, number],
  zoom: 9.2,
};

/**
 * Resolve an artist's area id from their service areas or free-text location.
 * Returns the matching area id, or "doha" as the metro fallback.
 */
export function resolveArtistArea(
  serviceAreas: string[] | null | undefined,
  locationText: string | null | undefined
): string {
  // 1) Explicit service areas win
  const valid = (serviceAreas || []).find((a) =>
    QATAR_AREAS.some((qa) => qa.id === a && qa.id !== "all")
  );
  if (valid) return valid;

  // 2) Fuzzy-match the free-text location against known area names/aliases
  if (locationText) {
    const needle = locationText.trim().toLowerCase();
    for (const area of QATAR_AREAS) {
      if (area.id === "all") continue;
      const candidates = [area.en.toLowerCase(), area.ar, ...(area.aliases || [])];
      if (candidates.some((c) => needle.includes(c) || c.includes(needle))) {
        return area.id;
      }
    }
  }

  // 3) Metro fallback
  return "doha";
}

export function getAreaById(id: string): QatarArea | undefined {
  return QATAR_AREAS.find((a) => a.id === id);
}

/**
 * Deterministic small offset so multiple artists in the same area don't
 * stack on one pixel. ±~0.012° ≈ ±1.2 km — still firmly inside the area.
 */
export function areaJitter(seed: string): [number, number] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const dx = (((hash % 1000) / 1000) - 0.5) * 0.024;
  const dy = ((((hash >> 10) % 1000) / 1000) - 0.5) * 0.024;
  return [dx, dy];
}
