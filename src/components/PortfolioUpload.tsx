import { useState, useRef, useCallback } from "react";
import { Plus, X, Image as ImageIcon, Loader2, Tag, GripVertical, ZoomIn, Star, Crop, Upload, RotateCw, Undo2, Redo2, RotateCcw, LayoutGrid, List, Maximize } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import ImageLightbox from "@/components/ImageLightbox";
import ImageCropper from "@/components/ImageCropper";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { compressImage, formatFileSize, rotateImage } from "@/lib/imageCompression";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  onSetFeatured: (item: PortfolioItem) => void;
  isDeleting: boolean;
}

const SortableImage = ({ item, index, onEdit, onDelete, onView, onSetFeatured, isDeleting }: SortableImageProps) => {
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
      
      {/* Featured Badge */}
      {item.is_featured && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 gap-1">
            <Star className="w-3 h-3 fill-current" />
            Featured
          </Badge>
        </div>
      )}
      
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
        {!item.is_featured && (
          <button
            onClick={() => onSetFeatured(item)}
            className="p-1.5 bg-background/80 backdrop-blur-sm rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
            title="Set as featured"
          >
            <Star className="w-4 h-4" />
          </button>
        )}
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

  interface EditState {
    file: File;
    preview: string;
  }

  interface PendingUpload {
    id: string;
    file: File;
    originalSize: number;
    compressedSize: number;
    preview: string;
    croppedPreview?: string;
    category: PortfolioCategory;
    title: string;
    isFeatured: boolean;
    editHistory: EditState[];
    historyIndex: number;
  }

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [currentCropIndex, setCurrentCropIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PortfolioCategory>("General");
  const [title, setTitle] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [pendingLightboxOpen, setPendingLightboxOpen] = useState(false);
  const [pendingLightboxIndex, setPendingLightboxIndex] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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

  const processFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const validFiles: File[] = [];
    
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 10MB`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Show compressing toast for multiple files
    const toastId = validFiles.length > 1 
      ? toast.loading(`Compressing ${validFiles.length} images...`) 
      : undefined;

    const pendingItems: PendingUpload[] = [];

    for (const file of validFiles) {
      try {
        const originalSize = file.size;
        const compressedFile = await compressImage(file);
        
        const previewUrl = URL.createObjectURL(compressedFile);
        pendingItems.push({
          id: `pending-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          file: compressedFile,
          originalSize,
          compressedSize: compressedFile.size,
          preview: previewUrl,
          category: "General",
          title: "",
          isFeatured: false,
          editHistory: [{ file: compressedFile, preview: previewUrl }],
          historyIndex: 0,
        });
      } catch (error) {
        console.error("Compression error:", error);
        // Fall back to original file if compression fails
        const previewUrl = URL.createObjectURL(file);
        pendingItems.push({
          id: `pending-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          file,
          originalSize: file.size,
          compressedSize: file.size,
          preview: previewUrl,
          category: "General",
          title: "",
          isFeatured: false,
          editHistory: [{ file, preview: previewUrl }],
          historyIndex: 0,
        });
      }
    }

    if (toastId) toast.dismiss(toastId);

    if (pendingItems.length === 0) return;

    // Show compression savings summary
    const totalOriginal = pendingItems.reduce((sum, item) => sum + item.originalSize, 0);
    const totalCompressed = pendingItems.reduce((sum, item) => sum + item.compressedSize, 0);
    const savings = totalOriginal - totalCompressed;
    
    if (savings > 1024) {
      toast.success(`Compressed ${pendingItems.length} image${pendingItems.length > 1 ? 's' : ''} (saved ${formatFileSize(savings)})`);
    }

    setPendingUploads(pendingItems);
    
    if (pendingItems.length === 1) {
      setCurrentCropIndex(0);
      setCropDialogOpen(true);
    } else {
      setBatchDialogOpen(true);
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set to false if we're leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleCropComplete = (croppedBlob: Blob) => {
    if (currentCropIndex === null) return;
    
    const croppedFile = new File([croppedBlob], pendingUploads[currentCropIndex]?.file.name || "cropped.jpg", { type: "image/jpeg" });
    const croppedPreviewUrl = URL.createObjectURL(croppedBlob);
    
    setPendingUploads(prev => prev.map((item, idx) => {
      if (idx !== currentCropIndex) return item;
      
      // Truncate future history and add new state
      const newHistory = item.editHistory.slice(0, item.historyIndex + 1);
      newHistory.push({ file: croppedFile, preview: croppedPreviewUrl });
      
      return {
        ...item,
        file: croppedFile,
        croppedPreview: croppedPreviewUrl,
        compressedSize: croppedFile.size,
        editHistory: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }));
    setCropDialogOpen(false);
    setCurrentCropIndex(null);
    setBatchDialogOpen(true);
  };

  const handleSkipCrop = () => {
    setCropDialogOpen(false);
    setCurrentCropIndex(null);
    setBatchDialogOpen(true);
  };

  const handleCropImage = (index: number) => {
    setCurrentCropIndex(index);
    setBatchDialogOpen(false);
    setCropDialogOpen(true);
  };

  const handleRotateImage = async (index: number) => {
    const item = pendingUploads[index];
    if (!item) return;

    try {
      const { file: rotatedFile, previewUrl } = await rotateImage(item.file);
      
      setPendingUploads(prev => prev.map((p, idx) => {
        if (idx !== index) return p;
        
        // Truncate future history and add new state
        const newHistory = p.editHistory.slice(0, p.historyIndex + 1);
        newHistory.push({ file: rotatedFile, preview: previewUrl });
        
        return {
          ...p,
          file: rotatedFile,
          croppedPreview: previewUrl,
          compressedSize: rotatedFile.size,
          editHistory: newHistory,
          historyIndex: newHistory.length - 1,
        };
      }));
      toast.success("Image rotated");
    } catch (error) {
      console.error("Rotation error:", error);
      toast.error("Failed to rotate image");
    }
  };

  const handleUndo = (index: number) => {
    setPendingUploads(prev => prev.map((item, idx) => {
      if (idx !== index || item.historyIndex <= 0) return item;
      
      const newIndex = item.historyIndex - 1;
      const state = item.editHistory[newIndex];
      
      return {
        ...item,
        file: state.file,
        croppedPreview: state.preview,
        compressedSize: state.file.size,
        historyIndex: newIndex,
      };
    }));
  };

  const handleRedo = (index: number) => {
    setPendingUploads(prev => prev.map((item, idx) => {
      if (idx !== index || item.historyIndex >= item.editHistory.length - 1) return item;
      
      const newIndex = item.historyIndex + 1;
      const state = item.editHistory[newIndex];
      
      return {
        ...item,
        file: state.file,
        croppedPreview: state.preview,
        compressedSize: state.file.size,
        historyIndex: newIndex,
      };
    }));
  };

  const handleReset = (index: number) => {
    setPendingUploads(prev => prev.map((item, idx) => {
      if (idx !== index || item.historyIndex === 0) return item;
      
      const state = item.editHistory[0];
      
      return {
        ...item,
        file: state.file,
        croppedPreview: undefined,
        compressedSize: state.file.size,
        historyIndex: 0,
      };
    }));
    toast.success("Image reset to original");
  };

  const handleRemoveFromBatch = (index: number) => {
    setPendingUploads(prev => {
      const updated = prev.filter((_, idx) => idx !== index);
      if (updated.length === 0) {
        setBatchDialogOpen(false);
      }
      return updated;
    });
  };

  const handleUpdatePendingItem = (index: number, updates: Partial<PendingUpload>) => {
    setPendingUploads(prev => prev.map((item, idx) => 
      idx === index ? { ...item, ...updates } : item
    ));
  };

  const handlePendingDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = pendingUploads.findIndex(item => item.id === active.id);
    const newIndex = pendingUploads.findIndex(item => item.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    setPendingUploads(prev => arrayMove(prev, oldIndex, newIndex));
  };

  const handleBatchUpload = async () => {
    if (pendingUploads.length === 0) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: pendingUploads.length });
    
    let successCount = 0;
    const maxOrder = portfolioItems.length > 0 
      ? Math.max(...portfolioItems.map(p => p.display_order)) 
      : 0;

    for (let i = 0; i < pendingUploads.length; i++) {
      const item = pendingUploads[i];
      setUploadProgress({ current: i + 1, total: pendingUploads.length });
      
      try {
        const fileExt = item.file.name.split(".").pop();
        const fileName = `${artistId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("portfolio")
          .upload(fileName, item.file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("portfolio")
          .getPublicUrl(fileName);

        await addItem.mutateAsync({
          artist_id: artistId,
          image_url: publicUrl,
          category: item.category,
          title: item.title || null,
          display_order: maxOrder + i + 1,
          is_featured: item.isFeatured,
        });

        successCount++;
      } catch (error) {
        console.error("Upload error:", error);
      }
    }

    if (successCount === pendingUploads.length) {
      toast.success(`${successCount} image${successCount > 1 ? 's' : ''} uploaded successfully`);
    } else if (successCount > 0) {
      toast.warning(`${successCount} of ${pendingUploads.length} images uploaded`);
    } else {
      toast.error("Failed to upload images");
    }

    setBatchDialogOpen(false);
    setPendingUploads([]);
    setUploading(false);
    setUploadProgress({ current: 0, total: 0 });
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

  const handleSetFeatured = async (item: PortfolioItem) => {
    try {
      await updateItem.mutateAsync({
        id: item.id,
        artistId: item.artist_id,
        is_featured: true,
      });
      toast.success("Set as featured image");
    } catch (error) {
      toast.error("Failed to set featured");
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
          multiple
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

      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-xl transition-all ${
          isDragOver 
            ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
            : ""
        }`}
      >
        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center border-2 border-dashed border-primary">
            <Upload className="w-10 h-10 text-primary mb-2" />
            <p className="text-sm font-medium text-primary">Drop images here</p>
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
                    onSetFeatured={handleSetFeatured}
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
          <div 
            className={`flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              isDragOver 
                ? "border-primary bg-primary/5" 
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">No portfolio images yet</p>
            <p className="text-xs mt-1">Click or drag photos to upload</p>
          </div>
        )}
      </div>

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

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCropDialogOpen(false);
          if (currentCropIndex !== null) {
            setCurrentCropIndex(null);
            setBatchDialogOpen(true);
          }
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="w-5 h-5" />
              Crop Image {pendingUploads.length > 1 && currentCropIndex !== null ? `(${currentCropIndex + 1}/${pendingUploads.length})` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            {currentCropIndex !== null && pendingUploads[currentCropIndex] && (
              <ImageCropper
                imageSrc={pendingUploads[currentCropIndex].preview}
                onCropComplete={handleCropComplete}
                onCancel={handleSkipCrop}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Upload Dialog */}
      <Dialog open={batchDialogOpen} onOpenChange={(open) => {
        if (!open && !uploading) {
          if (pendingUploads.length > 0) {
            setCloseConfirmOpen(true);
          } else {
            setBatchDialogOpen(false);
          }
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                Upload {pendingUploads.length} Image{pendingUploads.length > 1 ? 's' : ''}
              </DialogTitle>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setPendingLightboxIndex(0);
                    setPendingLightboxOpen(true);
                  }}
                  title="Fullscreen preview"
                  disabled={pendingUploads.length === 0}
                >
                  <Maximize className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("list")}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("grid")}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Bulk actions */}
            {pendingUploads.length > 1 && (() => {
              const editedCount = pendingUploads.filter(p => p.historyIndex > 0).length;
              const totalCount = pendingUploads.length;
              
              return (
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap flex-1">
                      <Label className="text-sm whitespace-nowrap">Apply to all:</Label>
                      <Select 
                        onValueChange={(v) => {
                          setPendingUploads(prev => prev.map(item => ({ ...item, category: v as PortfolioCategory })));
                          toast.success(`Category set to "${v}" for all images`);
                        }}
                        disabled={uploading}
                      >
                        <SelectTrigger className="text-sm w-[140px]">
                          <SelectValue placeholder="Set category..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PORTFOLIO_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const hasAnyFeatured = pendingUploads.some(p => p.isFeatured);
                          setPendingUploads(prev => prev.map(item => ({ ...item, isFeatured: !hasAnyFeatured })));
                          toast.success(hasAnyFeatured ? "Cleared featured from all" : "Note: Only one image can be featured after upload");
                        }}
                        disabled={uploading}
                      >
                        <Star className={`w-4 h-4 mr-1 ${pendingUploads.some(p => p.isFeatured) ? 'fill-current' : ''}`} />
                        {pendingUploads.some(p => p.isFeatured) ? "Clear Featured" : "Set Featured"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPendingUploads(prev => prev.map(item => {
                            if (item.historyIndex === 0) return item;
                            const state = item.editHistory[0];
                            return {
                              ...item,
                              file: state.file,
                              croppedPreview: undefined,
                              compressedSize: state.file.size,
                              historyIndex: 0,
                            };
                          }));
                          toast.success("All images reset to original");
                        }}
                        disabled={uploading || editedCount === 0}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reset All
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={uploading}
                            className="text-destructive hover:text-destructive"
                          >
                            Clear All
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Clear all uploads?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove all {pendingUploads.length} pending images and any edits you have made. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                setPendingUploads([]);
                                setBatchDialogOpen(false);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Clear All
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <Badge variant={editedCount > 0 ? "default" : "secondary"} className="ml-2 whitespace-nowrap">
                      {editedCount > 0 ? `${editedCount}/${totalCount} edited` : "No edits"}
                    </Badge>
                  </div>
                </div>
              );
            })()}
            
            {viewMode === "grid" ? (
              /* Grid View */
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handlePendingDragEnd}
              >
                <SortableContext
                  items={pendingUploads.map(item => item.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-3 gap-2">
                    {pendingUploads.map((item, index) => {
                      const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
                      const style = {
                        transform: CSS.Transform.toString(transform),
                        transition,
                        opacity: isDragging ? 0.5 : 1,
                        zIndex: isDragging ? 10 : 1,
                      };
                      
                      return (
                        <div
                          key={item.id}
                          ref={setNodeRef}
                          style={style}
                          className={`relative aspect-square group rounded-lg overflow-hidden ${item.isFeatured ? 'ring-2 ring-primary' : ''}`}
                        >
                          <img
                            src={item.croppedPreview || item.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => {
                              setPendingLightboxIndex(index);
                              setPendingLightboxOpen(true);
                            }}
                          />
                          {/* Drag Handle */}
                          <button
                            {...attributes}
                            {...listeners}
                            className="absolute top-1 left-1 p-1 bg-background/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                            disabled={uploading}
                          >
                            <GripVertical className="w-4 h-4 text-foreground" />
                          </button>
                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveFromBatch(index)}
                            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={uploading}
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {/* Badges */}
                          {item.isFeatured && (
                            <div className="absolute top-1 left-1/2 -translate-x-1/2">
                              <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 gap-1">
                                <Star className="w-3 h-3 fill-current" />
                              </Badge>
                            </div>
                          )}
                          {item.historyIndex > 0 && (
                            <div className="absolute bottom-1 left-1">
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                                Edited
                              </Badge>
                            </div>
                          )}
                          {/* Category Badge */}
                          <div className="absolute bottom-1 right-1">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                              {item.category}
                            </Badge>
                          </div>
                          {/* Quick Actions on Hover */}
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleRotateImage(index)}
                              className="p-1 bg-background/80 backdrop-blur-sm rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                              disabled={uploading}
                              title="Rotate"
                            >
                              <RotateCw className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleCropImage(index)}
                              className="p-1 bg-background/80 backdrop-blur-sm rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                              disabled={uploading}
                              title="Crop"
                            >
                              <Crop className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              /* List View */
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handlePendingDragEnd}
              >
                <SortableContext
                  items={pendingUploads.map(item => item.id)}
                  strategy={rectSortingStrategy}
                >
                  {pendingUploads.map((item, index) => {
                    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
                    const style = {
                      transform: CSS.Transform.toString(transform),
                      transition,
                      opacity: isDragging ? 0.5 : 1,
                      zIndex: isDragging ? 10 : 1,
                    };
                    
                    return (
                      <div 
                        key={item.id}
                        ref={setNodeRef}
                        style={style}
                        className={`flex gap-3 p-3 border rounded-lg ${item.isFeatured ? 'border-primary bg-primary/5' : 'border-border'}`}
                      >
                        {/* Drag Handle */}
                        <button
                          {...attributes}
                          {...listeners}
                          className="flex items-center justify-center p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                          disabled={uploading}
                        >
                          <GripVertical className="w-5 h-5" />
                        </button>
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <img
                            src={item.croppedPreview || item.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              setPendingLightboxIndex(index);
                              setPendingLightboxOpen(true);
                            }}
                          />
                          {item.isFeatured && (
                            <div className="absolute top-0 left-0 right-0 flex justify-center">
                              <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 gap-1 -mt-2">
                                <Star className="w-3 h-3 fill-current" />
                                Featured
                              </Badge>
                            </div>
                          )}
                          {item.historyIndex > 0 && (
                            <div className="absolute bottom-1 left-1">
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                                Edited
                              </Badge>
                            </div>
                          )}
                          <button
                            onClick={() => handleRemoveFromBatch(index)}
                            className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                            disabled={uploading}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={item.title}
                              onChange={(e) => handleUpdatePendingItem(index, { title: e.target.value })}
                              placeholder="Title (optional)"
                              className="text-sm"
                              disabled={uploading}
                            />
                            <Button
                              variant={item.isFeatured ? "default" : "outline"}
                              size="icon"
                              onClick={() => {
                                setPendingUploads(prev => prev.map((p, idx) => ({
                                  ...p,
                                  isFeatured: idx === index ? !p.isFeatured : false
                                })));
                              }}
                              disabled={uploading}
                              title={item.isFeatured ? "Remove featured" : "Set as featured"}
                            >
                              <Star className={`w-4 h-4 ${item.isFeatured ? 'fill-current' : ''}`} />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleUndo(index)}
                              disabled={uploading || item.historyIndex <= 0}
                              title="Undo"
                            >
                              <Undo2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleRedo(index)}
                              disabled={uploading || item.historyIndex >= item.editHistory.length - 1}
                              title="Redo"
                            >
                              <Redo2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleReset(index)}
                              disabled={uploading || item.historyIndex === 0}
                              title="Reset to original"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleRotateImage(index)}
                              disabled={uploading}
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleCropImage(index)}
                              disabled={uploading}
                              title="Crop image"
                            >
                              <Crop className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Select 
                              value={item.category} 
                              onValueChange={(v) => handleUpdatePendingItem(index, { category: v as PortfolioCategory })}
                              disabled={uploading}
                            >
                              <SelectTrigger className="text-sm flex-1">
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
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {item.originalSize !== item.compressedSize ? (
                                <>
                                  <span className="line-through">{formatFileSize(item.originalSize)}</span>
                                  {" → "}
                                  <span className="text-primary font-medium">{formatFileSize(item.compressedSize)}</span>
                                </>
                              ) : (
                                formatFileSize(item.compressedSize)
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </SortableContext>
              </DndContext>
            )}
            
            {/* Compression Savings Summary */}
            {pendingUploads.length > 0 && (() => {
              const totalOriginal = pendingUploads.reduce((sum, item) => sum + item.originalSize, 0);
              const totalCompressed = pendingUploads.reduce((sum, item) => sum + item.compressedSize, 0);
              const savings = totalOriginal - totalCompressed;
              const savingsPercent = totalOriginal > 0 ? Math.round((savings / totalOriginal) * 100) : 0;
              
              return savings > 0 ? (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                  <span className="text-muted-foreground">Total compression savings:</span>
                  <span className="font-medium text-primary">
                    {formatFileSize(savings)} saved ({savingsPercent}%)
                  </span>
                </div>
              ) : null;
            })()}
            
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Uploading {uploadProgress.current} of {uploadProgress.total}...
                  </span>
                  <span className="font-medium">
                    {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={(uploadProgress.current / uploadProgress.total) * 100} 
                  className="h-2"
                />
              </div>
            )}
            
            <Button 
              className="w-full" 
              onClick={handleBatchUpload} 
              disabled={uploading || pendingUploads.length === 0}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                `Upload ${pendingUploads.length} Image${pendingUploads.length > 1 ? 's' : ''}`
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

      {/* Pending Uploads Lightbox */}
      <ImageLightbox
        images={pendingUploads.map(item => ({
          url: item.croppedPreview || item.preview,
          title: item.title || null,
          category: item.category,
        }))}
        initialIndex={pendingLightboxIndex}
        open={pendingLightboxOpen}
        onOpenChange={setPendingLightboxOpen}
      />

      {/* Close Confirmation Dialog */}
      <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard pending uploads?</AlertDialogTitle>
            <AlertDialogDescription>
              You have {pendingUploads.length} image{pendingUploads.length > 1 ? "s" : ""} ready to upload. If you close now, all pending uploads and edits will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setPendingUploads([]);
                setBatchDialogOpen(false);
                setCloseConfirmOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PortfolioUpload;
