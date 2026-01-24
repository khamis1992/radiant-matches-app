import React, { useMemo, useState } from "react";
import { X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedArtistCard } from "./EnhancedArtistCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icon issue in React
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const QATAR_AREAS = [
  { id: "all", en: "All Areas", ar: "كل المناطق", lat: 25.286106, lng: 51.508976 },
  { id: "doha", en: "Doha", ar: "الدوحة", lat: 25.2854, lng: 51.5310 },
  { id: "al_rayyan", en: "Al Rayyan", ar: "الريان", lat: 25.2919, lng: 51.4244 },
  { id: "al_wakrah", en: "Al Wakrah", ar: "الوكرة", lat: 25.1768, lng: 51.6048 },
  { id: "al_khor", en: "Al Khor", ar: "الخور", lat: 25.6804, lng: 51.4968 },
  { id: "umm_salal", en: "Umm Salal", ar: "أم صلال", lat: 25.4106, lng: 51.4227 },
  { id: "al_daayen", en: "Al Daayen", ar: "الظعاين", lat: 25.5794, lng: 51.4796 },
  { id: "al_shamal", en: "Al Shamal", ar: "الشمال", lat: 26.1156, lng: 51.2136 },
  { id: "al_sheehaniya", en: "Al Sheehaniya", ar: "الشيحانية", lat: 25.3674, lng: 51.2235 },
  { id: "lusail", en: "Lusail", ar: "لوسيل", lat: 25.4175, lng: 51.5319 },
  { id: "pearl", en: "The Pearl", ar: "اللؤلؤة", lat: 25.3707, lng: 51.5491 },
  { id: "west_bay", en: "West Bay", ar: "الخليج الغربي", lat: 25.3223, lng: 51.5317 },
];

interface MapViewProps {
  artists: any[];
  onClose: () => void;
}

export const MapView = ({ artists, onClose }: MapViewProps) => {
  const { t, language } = useLanguage();
  const [selectedArea, setSelectedArea] = useState<string>("all");
  
  // Generate deterministic coordinates
  const pins = useMemo(() => {
    return artists.map((artist, i) => {
      const hash = (artist.id || "").split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      
      // Determine base position
      // Default to slightly inland Doha to avoid pins in the sea
      let baseLat = 25.286106; 
      let baseLng = 51.508976; 

      // If artist has service areas, pick the first one's coordinates as center
      if (artist.service_areas && artist.service_areas.length > 0) {
         const areaId = artist.service_areas[0];
         const area = QATAR_AREAS.find(a => a.id === areaId);
         if (area && area.lat && area.lng) {
             baseLat = area.lat;
             baseLng = area.lng;
         }
      } else {
         // Fallback to "random" distribution across major cities for variety if no area set
         // This makes the map look populated even without data
         const cityIndex = hash % (QATAR_AREAS.length - 1) + 1; // Skip "all"
         const randomCity = QATAR_AREAS[cityIndex];
         if (randomCity && randomCity.lat) {
            baseLat = randomCity.lat;
            baseLng = randomCity.lng;
         }
      }

      // Add small jitter to prevent stacking
      // 0.01 degrees is approx 1.1km
      const latOffset = ((hash % 100) - 50) / 3000; 
      const lngOffset = (((hash * 13) % 100) - 50) / 3000;
      
      return {
        ...artist,
        lat: baseLat + latOffset,
        lng: baseLng + lngOffset,
      };
    });
  }, [artists]);

  const filteredPins = useMemo(() => {
    if (!selectedArea || selectedArea === "all") return pins;
    return pins.filter(p => p.service_areas?.includes(selectedArea));
  }, [pins, selectedArea]);

  // Determine center based on selection
  const mapCenter: [number, number] = useMemo(() => {
      if (selectedArea && selectedArea !== "all") {
          const area = QATAR_AREAS.find(a => a.id === selectedArea);
          if (area) return [area.lat, area.lng];
      }
      return [25.286106, 51.508976]; // Default Doha
  }, [selectedArea]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
       {/* Map Header Overlay */}
       <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-start pointer-events-none">
          <Button 
            onClick={onClose} 
            variant="secondary" 
            className="rounded-full shadow-lg pointer-events-auto bg-white/90 backdrop-blur-sm hover:bg-white"
          >
             <X className="w-4 h-4 mr-2" />
             {t.common?.close || "Close Map"}
          </Button>

          <div className="pointer-events-auto shadow-lg">
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className="w-[180px] bg-white/90 backdrop-blur-sm border-0 h-10 rounded-full">
                <SelectValue placeholder={language === "ar" ? "اختر المنطقة" : "Select Area"} />
              </SelectTrigger>
              <SelectContent>
                {QATAR_AREAS.map(area => (
                  <SelectItem key={area.id} value={area.id}>
                    {language === "ar" ? area.ar : area.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
       </div>
       
       <div className="flex-1 relative z-0">
          {/* Key forces remount when center changes to fly to new location */}
          <MapContainer 
            key={`${mapCenter[0]}-${mapCenter[1]}`}
            center={mapCenter} 
            zoom={11} 
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredPins.map((artist) => (
              <Marker key={artist.id} position={[artist.lat, artist.lng]}>
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="font-semibold text-sm mb-1">{artist.profile?.full_name}</div>
                    <div className="text-xs text-muted-foreground mb-2">{artist.profile?.location}</div>
                    <div className="flex flex-wrap gap-1 mb-2">
                        {artist.service_areas?.slice(0, 3).map((area: string) => {
                            const areaLabel = QATAR_AREAS.find(a => a.id === area);
                            return (
                                <span key={area} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                                    {language === "ar" ? areaLabel?.ar || area : areaLabel?.en || area}
                                </span>
                            );
                        })}
                        {artist.service_areas?.length > 3 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">
                                +{artist.service_areas.length - 3}
                            </span>
                        )}
                    </div>
                    <div className="text-primary font-medium text-xs mb-2">
                        {artist.min_price ? `Starts from ${artist.min_price} QAR` : "Contact for price"}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
       </div>

       {/* Horizontal Scroll List of Artists at bottom */}
       <div className="h-auto bg-background/80 backdrop-blur-md border-t border-border p-4 pb-8 safe-area-bottom z-[1000] relative pointer-events-auto">
          <p className="text-sm font-semibold mb-3 px-1">{t.artistsListing?.artistsFound || "Artists Found"} ({filteredPins.length})</p>
          <div className="flex gap-4 overflow-x-auto pb-4 px-1 snap-x w-full touch-pan-x scrollbar-thin">
             {filteredPins.map(artist => (
                <div key={artist.id} className="w-[280px] shrink-0 snap-center first:pl-2 last:pr-4">
                   <EnhancedArtistCard artist={artist} viewMode="list" />
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};
