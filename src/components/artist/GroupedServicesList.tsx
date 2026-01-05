import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SwipeableServiceCard } from "./SwipeableServiceCard";

interface Service {
  id: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  description?: string;
  description_ar?: string;
  description_en?: string;
  price: number;
  duration_minutes: number;
  category?: string;
  is_active?: boolean;
}

interface GroupedServicesListProps {
  services: Service[];
  onEditService: (service: Service) => void;
  onDeleteService: (serviceId: string) => void;
  onToggleActive?: (serviceId: string) => void;
  language?: string;
}

export const GroupedServicesList = ({
  services,
  onEditService,
  onDeleteService,
  onToggleActive,
  language = "en",
}: GroupedServicesListProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["All"]) // All expanded by default
  );

  // Define category order
  const categoryOrder = [
    "Bridal",
    "Party",
    "Makeup",
    "Hair Styling",
    "Henna",
    "Lashes & Brows",
    "Nails",
    "Photoshoot",
    "General",
  ];

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || "General";
    if (!acc.has(category)) {
      acc.set(category, []);
    }
    acc.get(category)!.push(service);
    return acc;
  }, new Map<string, Service[]>());

  // Sort categories according to order, then alphabetically
  const sortedCategories = Array.from(groupedServices.keys()).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const getServiceDisplayName = (service: Service) => {
    if (language === "ar" && service.name_ar) {
      return service.name_ar;
    }
    if (language === "en" && service.name_en) {
      return service.name_en;
    }
    return service.name;
  };

  const getServiceDisplayDescription = (service: Service) => {
    if (language === "ar" && service.description_ar) {
      return service.description_ar;
    }
    if (language === "en" && service.description_en) {
      return service.description_en;
    }
    return service.description;
  };

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <ChevronRight className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {language === "ar" ? "لا توجد خدمات" : "No Services"}
        </h3>
        <p className="text-muted-foreground">
          {language === "ar"
            ? "ابدأ بإضافة خدماتك لاستقبال الحجوزات"
            : "Create your first service to start receiving bookings"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedCategories.map((category) => {
        const categoryServices = groupedServices.get(category) || [];
        const isExpanded = expandedCategories.has(category);
        const serviceCount = categoryServices.length;

        return (
          <div
            key={category}
            className="bg-card rounded-2xl border border-border overflow-hidden"
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 transition-colors",
                isExpanded && "bg-primary/5"
              )}
              style={{ minHeight: "56px" }}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-primary" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
                <span className="font-semibold text-foreground">{category}</span>
              </div>
              <span
                className={cn(
                  "px-2.5 py-0.5 text-xs font-medium rounded-full",
                  isExpanded
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {serviceCount}
              </span>
            </button>

            {/* Services List (Expanded) */}
            {isExpanded && (
              <div className="px-3 pb-3 space-y-2 animate-fade-in">
                {categoryServices.map((service) => (
                  <SwipeableServiceCard
                    key={service.id}
                    name={getServiceDisplayName(service)}
                    description={getServiceDisplayDescription(service)}
                    price={service.price}
                    duration={service.duration_minutes}
                    category={service.category}
                    isActive={service.is_active ?? true}
                    onEdit={() => onEditService(service)}
                    onDelete={() => onDeleteService(service.id)}
                    onToggleActive={
                      onToggleActive
                        ? () => onToggleActive(service.id)
                        : undefined
                    }
                  />
                ))}

                {categoryServices.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    {language === "ar"
                      ? "لا توجد خدمات في هذه الفئة"
                      : "No services in this category yet"}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GroupedServicesList;
