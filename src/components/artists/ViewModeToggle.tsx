import React from "react";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export type ViewMode = "grid" | "list";

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ViewModeToggle = ({ viewMode, onViewModeChange }: ViewModeToggleProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center bg-muted rounded-lg p-0.5">
      <Button
        variant={viewMode === "grid" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("grid")}
        className="h-7 px-2 gap-1"
        title={t.portfolio?.gridView || "Grid View"}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
      </Button>
      <Button
        variant={viewMode === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("list")}
        className="h-7 px-2 gap-1"
        title={t.portfolio?.listView || "List View"}
      >
        <List className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};
