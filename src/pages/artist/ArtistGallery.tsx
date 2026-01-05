import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import ArtistHeader from "@/components/artist/ArtistHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Briefcase, X } from "lucide-react";
import { PortfolioMasonryGrid } from "@/components/artist/PortfolioMasonryGrid";
import { PortfolioImageViewer } from "@/components/artist/PortfolioImageViewer";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentArtist } from "@/hooks/useArtistDashboard";
import { usePortfolio, useDeletePortfolioItem, useUpdatePortfolioItem, PORTFOLIO_CATEGORIES } from "@/hooks/usePortfolio";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ArtistGallery = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: artist, isLoading: artistLoading } = useCurrentArtist();
  const { data: portfolio = [], isLoading: portfolioLoading } = usePortfolio(artist?.id);
  const deleteItem = useDeletePortfolioItem();
  const updateItem = useUpdatePortfolioItem();
  const { t, isRTL, language } = useLanguage();

  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    is_featured: false,
  });

  // Get categories with "All" option
  const categories = ["All", ...PORTFOLIO_CATEGORIES];

  // Sort portfolio by display_order
  const sortedPortfolio = [...portfolio].sort((a, b) => a.display_order - b.display_order);

  if (authLoading || artistLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <Skeleton className="h-6 w-40" />
        </header>
        <div className="px-5 py-6 space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!user || !artist) {
    return (
      <div className="min-h-screen bg-background pb-24" dir={isRTL ? "rtl" : "ltr"}>
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <h1 className="text-xl font-bold text-foreground">
            {language === "ar" ? "المعرض" : "Portfolio"}
          </h1>
        </header>
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {language === "ar" ? "ليس فناناً" : "Not an Artist"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {language === "ar" ? "ليس لديك ملف تعريف فنان بعد" : "You don't have an artist profile yet"}
          </p>
          <Button onClick={() => navigate("/home")}>
            {language === "ar" ? "الذهاب للرئيسية" : "Go Home"}
          </Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setViewerOpen(true);
  };

  const handleFeature = async (item: any) => {
    try {
      await updateItem.mutateAsync({
        id: item.id,
        artistId: item.artist_id,
        is_featured: !item.is_featured,
      });
      toast.success(
        item.is_featured
          ? (language === "ar" ? "تمت إزالة الميزة" : "Removed from featured")
          : (language === "ar" ? "تمت الإضافة للمميزة" : "Added to featured")
      );
    } catch {
      toast.error(language === "ar" ? "فشل التحديث" : "Failed to update");
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setEditForm({
      title: item.title || "",
      category: item.category || "",
      is_featured: item.is_featured || false,
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      await updateItem.mutateAsync({
        id: editingItem.id,
        artistId: editingItem.artist_id,
        title: editForm.title || null,
        category: editForm.category,
        is_featured: editForm.is_featured,
      });
      toast.success(language === "ar" ? "تم التحديث" : "Updated successfully");
      setEditModalOpen(false);
    } catch {
      toast.error(language === "ar" ? "فشل التحديث" : "Failed to update");
    }
  };

  const handleDelete = async (item: any) => {
    try {
      await deleteItem.mutateAsync(item.id);
      toast.success(language === "ar" ? "تم الحذف" : "Deleted successfully");
      if (sortedPortfolio.length <= 1) {
        setViewerOpen(false);
      }
    } catch {
      toast.error(language === "ar" ? "فشل الحذف" : "Failed to delete");
    }
  };

  const handleReorder = () => {
    toast.info(language === "ar" ? "وضع إعادة الترتيب" : "Reorder mode");
  };

  return (
    <div className="min-h-screen bg-background pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <ArtistHeader />

      <div className="px-4 py-4 space-y-4">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {language === "ar" ? "المعرض" : "Portfolio"}
          </h2>
        </div>

        {/* Masonry Grid */}
        <PortfolioMasonryGrid
          items={sortedPortfolio}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onImageClick={handleImageClick}
          isLoading={portfolioLoading}
        />
      </div>

      {/* Full-Screen Image Viewer */}
      <PortfolioImageViewer
        isOpen={viewerOpen}
        items={sortedPortfolio}
        currentIndex={currentImageIndex}
        onClose={() => setViewerOpen(false)}
        onNavigate={setCurrentImageIndex}
        onFeature={handleFeature}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReorder={handleReorder}
        isDeleting={deleteItem.isPending}
        language={language}
      />

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-background rounded-2xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-lg font-semibold">
                {language === "ar" ? "تعديل الصورة" : "Edit Photo"}
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-4 space-y-4">
              <div>
                <Label htmlFor="title">
                  {language === "ar" ? "العنوان" : "Title"}
                </Label>
                <Input
                  id="title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder={language === "ar" ? "عنوان الصورة (اختياري)" : "Photo title (optional)"}
                />
              </div>

              <div>
                <Label htmlFor="category">
                  {language === "ar" ? "الفئة" : "Category"}
                </Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={language === "ar" ? "اختر الفئة" : "Select category"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {PORTFOLIO_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-2">
                <Label htmlFor="featured">
                  {language === "ar" ? "صورة مميزة" : "Featured"}
                </Label>
                <input
                  id="featured"
                  type="checkbox"
                  checked={editForm.is_featured}
                  onChange={(e) => setEditForm({ ...editForm, is_featured: e.target.checked })}
                  className="w-5 h-5 accent-primary"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 p-4 border-t border-border">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditModalOpen(false)}
              >
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button className="flex-1" onClick={handleSaveEdit}>
                {language === "ar" ? "حفظ" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
};

export default ArtistGallery;
