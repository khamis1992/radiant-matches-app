import { useState, useRef } from "react";
import { Plus, X, Image as ImageIcon, Loader2, Tag, GripVertical, ZoomIn } from "lucide-react";
import ImageLightbox from "@/components/ImageLightbox";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useArtistPortfolio,
  useAddPortfolioItem,
  useUpdatePortfolioItem,
  useDeletePortfolioItem,
  useReorderPortfolio,
  PORTFOLIO_CATEGORIES,
  PortfolioItem,
  PortfolioCategory,
} from "@/hooks/usePortfolio";

interface PortfolioUploadProps {
  artistId: string;
}

interface SortableImageProps {
  item: PortfolioItem;
  index: number;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (item: PortfolioItem) => void;
  onView: (index: number) => void;
  isDeleting: boolean;
}

const SortableImage = ({ item, index, onEdit, onDelete, onView, isDeleting }: SortableImageProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-square group"
    >
      <img
        src={item.image_url}
        alt={item.title || `Portfolio`}
        className="w-full h-full object-cover rounded-lg cursor-pointer"
        onClick={() => onView(index)}
      />
      
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 p-1.5 bg-background/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-foreground" />
      </button>

      {/* Actions */}
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onView(index)}
          className="p-1.5 bg-background/80 backdrop-blur-sm rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => onEdit(item)}
          className="p-1.5 bg-background/80 backdrop-blur-sm rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <Tag className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(item)}
          disabled={isDeleting}
          className="p-1.5 bg-background/80 backdrop-blur-sm rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Category Badge */}
      <div className="absolute bottom-1 left-1">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
          {item.category}
        </Badge>
      </div>
    </div>
  );
};

const PortfolioUpload = ({ artistId }: PortfolioUploadProps) => {
  const { data: portfolioItems = [], isLoading } = useArtistPortfolio(artistId);
  const addItem = useAddPortfolioItem();
  const updateItem = useUpdatePortfolioItem();
  const deleteItem = useDeletePortfolioItem();
  const reorderItems = useReorderPortfolio();

  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PortfolioCategory>("General");
  const [title, setTitle] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = portfolioItems.findIndex(item => item.id === active.id);
    const newIndex = portfolioItems.findIndex(item => item.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedItems = arrayMove(portfolioItems, oldIndex, newIndex);
    
    // Update display_order for all items
    const updates = reorderedItems.map((item, index) => ({
      id: item.id,
      display_order: index + 1,
    }));

    try {
      await reorderItems.mutateAsync({ artistId, items: updates });
      toast.success("Order updated");
    } catch (error) {
      toast.error("Failed to reorder");
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
    setSelectedCategory("General");
    setTitle("");
    setUploadDialogOpen(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!pendingFile) return;

    setUploading(true);
    try {
      const fileExt = pendingFile.name.split(".").pop();
      const fileName = `${artistId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio")
        .upload(fileName, pendingFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("portfolio")
        .getPublicUrl(fileName);

      // New items get highest display_order
      const maxOrder = portfolioItems.length > 0 
        ? Math.max(...portfolioItems.map(p => p.display_order)) 
        : 0;

      await addItem.mutateAsync({
        artist_id: artistId,
        image_url: publicUrl,
        category: selectedCategory,
        title: title || null,
        display_order: maxOrder + 1,
      });

      toast.success("Image uploaded successfully");
      setUploadDialogOpen(false);
      setPendingFile(null);
      setPendingPreview(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: PortfolioItem) => {
    setDeletingId(item.id);
    try {
      await deleteItem.mutateAsync({
        id: item.id,
        artistId: item.artist_id,
        imageUrl: item.image_url,
      });
      toast.success("Image removed");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to remove image");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingItem) return;
    
    try {
      await updateItem.mutateAsync({
        id: editingItem.id,
        artistId: editingItem.artist_id,
        category: selectedCategory,
        title: title || undefined,
      });
      toast.success("Updated successfully");
      setEditingItem(null);
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const openEditDialog = (item: PortfolioItem) => {
    setEditingItem(item);
    setSelectedCategory(item.category as PortfolioCategory);
    setTitle(item.title || "");
  };

  const filteredItems = filterCategory === "all" 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === filterCategory);

  const categoryCounts = portfolioItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Portfolio</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Portfolio</h3>
          {portfolioItems.length > 1 && (
            <p className="text-xs text-muted-foreground">Drag to reorder</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Photo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Category Filter */}
      {portfolioItems.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={filterCategory === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterCategory("all")}
          >
            All ({portfolioItems.length})
          </Badge>
          {Object.entries(categoryCounts).map(([category, count]) => (
            <Badge
              key={category}
              variant={filterCategory === category ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilterCategory(category)}
            >
              {category} ({count})
            </Badge>
          ))}
        </div>
      )}

      {filteredItems.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filteredItems.map(i => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-2">
              {filteredItems.map((item, index) => (
                <SortableImage
                  key={item.id}
                  item={item}
                  index={index}
                  onEdit={openEditDialog}
                  onDelete={handleDelete}
                  onView={(idx) => {
                    setLightboxIndex(idx);
                    setLightboxOpen(true);
                  }}
                  isDeleting={deletingId === item.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-xl text-muted-foreground">
          <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
          <p className="text-sm">No portfolio images yet</p>
          <p className="text-xs mt-1">Add photos to showcase your work</p>
        </div>
      )}

      {/* Lightbox */}
      <ImageLightbox
        images={filteredItems.map(item => ({
          url: item.image_url,
          title: item.title,
          category: item.category,
        }))}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Portfolio Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {pendingPreview && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={pendingPreview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div>
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Summer Wedding Look"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as PortfolioCategory)}>
                <SelectTrigger>
                  <SelectValue />
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
            <Button className="w-full" onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Image"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Portfolio Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {editingItem && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={editingItem.image_url}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div>
              <Label htmlFor="edit-title">Title (optional)</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Summer Wedding Look"
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as PortfolioCategory)}>
                <SelectTrigger>
                  <SelectValue />
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
            <Button className="w-full" onClick={handleUpdateCategory}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortfolioUpload;
