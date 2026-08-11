import React, { useEffect, useMemo, useRef, useState } from "react";
import { divIcon } from "leaflet";
import type { Map as LeafletMap } from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  CaretRight,
  MapPin,
  Minus,
  NavigationArrow,
  Star,
  UsersThree,
  X,
  Plus,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { CategoryVideoCover } from "@/components/CategoryVideoCover";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { getArtistPhoto, type ArtistWithPricing } from "@/hooks/useArtistsWithPricing";
import { getCategoryVideo } from "@/lib/categoryVideos";
import { cn } from "@/lib/utils";
import {
  QATAR_AREAS,
  QATAR_MAP_DEFAULT,
  areaJitter,
  getAreaById,
  resolveArtistArea,
} from "@/lib/qatar-geo";

type MapArtist = ArtistWithPricing & { service_areas?: string[] };
type ArtistPin = MapArtist & { areaId: string; lngLat: [number, number] };

interface MapViewProps {
  artists: MapArtist[];
  onClose: () => void;
}

const createPinIcon = (active = false) =>
  divIcon({
    className: "glam-leaflet-marker-host",
    html: `<span class="glam-map-pin-dot${active ? " is-active" : ""}" aria-hidden="true"></span>`,
    iconSize: [30, 36],
    iconAnchor: [15, 34],
  });

const createClusterIcon = (count: number) =>
  divIcon({
    className: "glam-map-cluster-host",
    html: `<span class="glam-map-cluster"><strong>${count}</strong><small>GLAM</small></span>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });

function MapViewportSync({
  pins,
  selectedArea,
  sheetExpanded,
}: {
  pins: ArtistPin[];
  selectedArea: string;
  sheetExpanded: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    const resizeId = window.setTimeout(() => map.invalidateSize(), 180);
    if (selectedArea !== "all") {
      const area = getAreaById(selectedArea);
      if (area) map.flyTo([area.lngLat[1], area.lngLat[0]], 11.7, { duration: 0.7 });
      return () => window.clearTimeout(resizeId);
    }

    if (pins.length > 0) {
      const latitudes = pins.map((pin) => pin.lngLat[1]);
      const longitudes = pins.map((pin) => pin.lngLat[0]);
      const spread = Math.max(
        Math.max(...latitudes) - Math.min(...latitudes),
        Math.max(...longitudes) - Math.min(...longitudes)
      );

      if (spread < 0.12) {
        const center: [number, number] = [
          latitudes.reduce((sum, value) => sum + value, 0) / latitudes.length,
          longitudes.reduce((sum, value) => sum + value, 0) / longitudes.length,
        ];
        map.flyTo(center, 12.35, { duration: 0.65 });
      } else {
        map.fitBounds(
          pins.map((pin) => [pin.lngLat[1], pin.lngLat[0]] as [number, number]),
          {
            paddingTopLeft: [48, 96],
            paddingBottomRight: [48, sheetExpanded ? 480 : 300],
            maxZoom: 11.8,
          }
        );
      }
    }

    return () => window.clearTimeout(resizeId);
  }, [map, pins, selectedArea, sheetExpanded]);

  return null;
}

function MapZoomWatcher({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  useEffect(() => onZoom(map.getZoom()), [map, onZoom]);
  return null;
}

const MapArtistCard = ({
  artist,
  active,
  language,
  onSelect,
}: {
  artist: ArtistPin;
  active: boolean;
  language: string;
  onSelect: () => void;
}) => {
  const navigate = useNavigate();
  const coverImage = getArtistPhoto(artist);
  const categoryVideo = getCategoryVideo(artist.categories);
  const name = artist.profile?.full_name || (language === "ar" ? "فنانة تجميل" : "Beauty artist");
  const location = artist.profile?.location || (language === "ar" ? "الدوحة" : "Doha");
  const category = artist.categories?.[0] || (language === "ar" ? "خبيرة تجميل" : "Beauty artist");

  return (
    <article
      onClick={onSelect}
      className={cn(
        "group relative flex min-h-[116px] w-full overflow-hidden rounded-2xl border bg-white p-2 shadow-sm transition-all",
        active ? "border-glam-rose shadow-md" : "border-glam-border"
      )}
    >
      <div className="relative h-[100px] w-[92px] shrink-0 overflow-hidden rounded-xl bg-glam-surface">
        {coverImage ? (
          <img src={coverImage} alt={name} className="h-full w-full object-cover" loading="lazy" />
        ) : categoryVideo ? (
          <CategoryVideoCover src={categoryVideo} label={category} />
        ) : (
          <div className="grid h-full place-items-center bg-glam-blush-soft text-xl font-semibold text-glam-ink">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 px-3 py-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-glam-ink">{name}</h3>
            <p className="mt-0.5 truncate text-[11px] text-glam-muted">{category}</p>
          </div>
          <FavoriteButton
            itemType="artist"
            itemId={artist.id}
            className="-me-2 -mt-2 h-10 w-10 shrink-0 text-glam-ink"
          />
        </div>

        <div className="mt-2 flex items-center gap-2 text-[11px] text-glam-secondary">
          <span className="inline-flex items-center gap-1 font-semibold text-glam-ink">
            <Star size={13} weight="fill" className="text-glam-rose" />
            {Number(artist.rating || 0).toFixed(1)}
          </span>
          <span aria-hidden="true" className="h-3 w-px bg-glam-border" />
          <span className="inline-flex min-w-0 items-center gap-1 truncate">
            <MapPin size={13} className="shrink-0 text-glam-rose" />
            {location}
          </span>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            navigate(`/artist/${artist.id}`);
          }}
          className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1 rounded-full bg-glam-ink px-3 text-[11px] font-semibold text-white transition-colors hover:bg-glam-ink-pressed active:scale-[0.98]"
        >
          {language === "ar" ? "عرض الملف" : "View profile"}
          <CaretRight size={13} className="rtl:-scale-x-100" />
        </button>
      </div>
    </article>
  );
};

export const MapView = ({ artists, onClose }: MapViewProps) => {
  const { language, isRTL } = useLanguage();
  const [selectedArea, setSelectedArea] = useState("all");
  const [activePin, setActivePin] = useState<string | null>(null);
  const [tilesLoading, setTilesLoading] = useState(true);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [mapZoom, setMapZoom] = useState(QATAR_MAP_DEFAULT.zoom);
  const mapRef = useRef<LeafletMap | null>(null);
  const touchStartY = useRef<number | null>(null);

  const pins = useMemo<ArtistPin[]>(() => artists.map((artist) => {
    const areaId = resolveArtistArea(artist.service_areas, artist.profile?.location);
    const area = getAreaById(areaId) || getAreaById("doha")!;
    const [dx, dy] = areaJitter(artist.id || artist.user_id || "artist");
    return { ...artist, areaId, lngLat: [area.lngLat[0] + dx, area.lngLat[1] + dy] };
  }), [artists]);

  const filteredPins = useMemo(() => {
    if (selectedArea === "all") return pins;
    return pins.filter((pin) => pin.areaId === selectedArea || pin.service_areas?.includes(selectedArea));
  }, [pins, selectedArea]);

  const groupedPins = useMemo(() => {
    const groups = new Map<string, ArtistPin[]>();
    filteredPins.forEach((pin) => groups.set(pin.areaId, [...(groups.get(pin.areaId) || []), pin]));
    return [...groups.entries()];
  }, [filteredPins]);

  const orderedPins = useMemo(() => {
    if (!activePin) return filteredPins;
    return [...filteredPins].sort((a, b) => Number(b.id === activePin) - Number(a.id === activePin));
  }, [activePin, filteredPins]);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  const selectArtist = (artist: ArtistPin) => {
    setActivePin(artist.id);
    mapRef.current?.flyTo([artist.lngLat[1], artist.lngLat[0]], 13, { duration: 0.55 });
  };

  const flyToUserLocation = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => mapRef.current?.flyTo([coords.latitude, coords.longitude], 13, { duration: 0.7 }),
      () => undefined,
      { timeout: 8000 }
    );
  };

  const onSheetTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null) return;
    const distance = touchStartY.current - event.changedTouches[0].clientY;
    if (Math.abs(distance) > 36) setSheetExpanded(distance > 0);
    touchStartY.current = null;
  };

  return (
    <div className="fixed inset-0 z-[100] min-h-[100dvh] overflow-hidden bg-white" dir={isRTL ? "rtl" : "ltr"}>
      <MapContainer
        ref={mapRef}
        center={[QATAR_MAP_DEFAULT.center[1], QATAR_MAP_DEFAULT.center[0]]}
        zoom={QATAR_MAP_DEFAULT.zoom}
        zoomControl={false}
        attributionControl
        className="glam-leaflet-map absolute inset-0 z-0"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          eventHandlers={{
            loading: () => setTilesLoading(true),
            load: () => setTilesLoading(false),
            tileerror: () => setTilesLoading(false),
          }}
        />
        <MapViewportSync pins={filteredPins} selectedArea={selectedArea} sheetExpanded={sheetExpanded} />
        <MapZoomWatcher onZoom={setMapZoom} />

        {mapZoom < 12
          ? groupedPins.map(([areaId, group]) => {
              if (group.length === 1) {
                const artist = group[0];
                return <Marker key={artist.id} position={[artist.lngLat[1], artist.lngLat[0]]} icon={createPinIcon(activePin === artist.id)} eventHandlers={{ click: () => selectArtist(artist) }} />;
              }
              const lat = group.reduce((sum, pin) => sum + pin.lngLat[1], 0) / group.length;
              const lng = group.reduce((sum, pin) => sum + pin.lngLat[0], 0) / group.length;
              return <Marker key={areaId} position={[lat, lng]} icon={createClusterIcon(group.length)} eventHandlers={{ click: () => mapRef.current?.flyTo([lat, lng], 13, { duration: 0.6 }) }} />;
            })
          : filteredPins.map((artist) => (
              <Marker key={artist.id} position={[artist.lngLat[1], artist.lngLat[0]]} icon={createPinIcon(activePin === artist.id)} eventHandlers={{ click: () => selectArtist(artist) }} />
            ))}
      </MapContainer>

      {tilesLoading && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-glam-porcelain">
          <div className="flex flex-col items-center gap-3">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-glam-blush border-t-glam-rose" />
            <p className="text-xs font-medium text-glam-muted">{language === "ar" ? "جارٍ تحميل الخريطة…" : "Loading map…"}</p>
          </div>
        </div>
      )}

      <header className="safe-area-top pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-4 pt-3">
        <button type="button" onClick={onClose} className="pointer-events-auto inline-flex h-11 items-center gap-2 rounded-full border border-glam-border bg-white/95 px-4 text-sm font-semibold text-glam-ink shadow-md backdrop-blur active:scale-95">
          <X size={18} />
          {language === "ar" ? "إغلاق" : "Close"}
        </button>
        <Select value={selectedArea} onValueChange={setSelectedArea}>
          <SelectTrigger aria-label={language === "ar" ? "اختيار المنطقة" : "Choose area"} className="pointer-events-auto h-11 w-[156px] rounded-full border-glam-border bg-white/95 px-4 text-sm font-medium text-glam-ink shadow-md backdrop-blur focus:ring-glam-ink">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QATAR_AREAS.map((area) => <SelectItem key={area.id} value={area.id}>{language === "ar" ? area.ar : area.en}</SelectItem>)}
          </SelectContent>
        </Select>
      </header>

      <div className="absolute end-4 top-[76px] z-20 flex flex-col overflow-hidden rounded-full border border-glam-border bg-white/95 shadow-md backdrop-blur">
        <button type="button" aria-label={language === "ar" ? "تكبير" : "Zoom in"} onClick={() => mapRef.current?.zoomIn()} className="grid h-11 w-11 place-items-center text-glam-ink hover:bg-glam-surface"><Plus size={18} /></button>
        <span className="mx-2 h-px bg-glam-border" />
        <button type="button" aria-label={language === "ar" ? "تصغير" : "Zoom out"} onClick={() => mapRef.current?.zoomOut()} className="grid h-11 w-11 place-items-center text-glam-ink hover:bg-glam-surface"><Minus size={18} /></button>
      </div>

      <button
        type="button"
        onClick={flyToUserLocation}
        aria-label={language === "ar" ? "موقعي" : "My location"}
        style={{ bottom: sheetExpanded ? "calc(72dvh + 16px)" : "calc(38dvh + 16px)" }}
        className="absolute end-4 z-20 grid h-11 w-11 place-items-center rounded-full border border-glam-border bg-white/95 text-glam-ink shadow-md backdrop-blur transition-[bottom,transform] duration-300 active:scale-90"
      >
        <NavigationArrow size={20} weight="bold" />
      </button>

      <section
        onTouchStart={(event) => { touchStartY.current = event.touches[0].clientY; }}
        onTouchEnd={onSheetTouchEnd}
        className={cn(
          "safe-area-bottom absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-3xl border-t border-glam-border bg-white shadow-[0_-10px_35px_rgba(16,20,23,0.10)] transition-[height] duration-300 ease-out",
          sheetExpanded ? "h-[72dvh]" : "h-[38dvh]"
        )}
      >
        <button
          type="button"
          aria-expanded={sheetExpanded}
          aria-label={language === "ar" ? "توسيع نتائج الفنانات" : "Expand artist results"}
          onClick={() => setSheetExpanded((value) => !value)}
          className="mx-auto flex h-8 w-20 items-center justify-center"
        >
          <span className="h-1 w-10 rounded-full bg-glam-border" />
        </button>

        <div className="flex items-center justify-between px-5 pb-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-glam-ink">
              <UsersThree size={19} weight="fill" className="text-glam-rose" />
              {language === "ar" ? `${filteredPins.length} فنانات بالقرب منك` : `${filteredPins.length} artists nearby`}
            </p>
            <p className="mt-1 text-[11px] text-glam-muted">{language === "ar" ? "اضغطي على دبوس أو بطاقة لعرض الفنانة" : "Tap a pin or card to view the artist"}</p>
          </div>
          <button type="button" onClick={() => setSheetExpanded((value) => !value)} className="h-9 rounded-full bg-glam-surface px-3 text-xs font-semibold text-glam-ink">
            {sheetExpanded ? (language === "ar" ? "تصغير" : "Collapse") : (language === "ar" ? "عرض الكل" : "View all")}
          </button>
        </div>

        <div className={cn("glam-map-results-scroll min-h-0 flex-1 px-4 pb-4", sheetExpanded ? "overflow-y-auto" : "overflow-x-auto overflow-y-hidden")}>
          <div className={cn(sheetExpanded ? "grid grid-cols-1 gap-3" : "flex w-max gap-3 snap-x snap-mandatory")}>
            {orderedPins.map((artist) => (
              <div key={artist.id} className={cn(!sheetExpanded && "w-[312px] shrink-0 snap-center")}>
                <MapArtistCard artist={artist} active={activePin === artist.id} language={language} onSelect={() => selectArtist(artist)} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MapView;
