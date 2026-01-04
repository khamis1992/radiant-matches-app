import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, X, Plus, Minus, Package, Video, FileText, Gift, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct, useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { toast } from "sonner";
import type { ProductType, ProductCategory } from "@/types/product";

const PRODUCT_TYPES: { value: ProductType; label: string; icon: any; description: string }[] = [
  {
    value: "physical",
    label: "Physical Product",
    icon: Package,
    description: "Makeup, beauty tools, skincare, accessories",
  },
  {
    value: "digital",
    label: "Digital Product",
    icon: FileText,
    description: "Tutorials, guides, presets",
  },
  {
    value: "bundle",
    label: "Service Bundle",
    icon: Briefcase,
    description: "Combined service packages",
  },
  {
    value: "gift_card",
    label: "Gift Card",
    icon: Gift,
    description: "Prepaid service or product credits",
  },
];

const CATEGORIES: Record<ProductType, ProductCategory[]> = {
  physical: ["makeup", "beauty_tools", "skincare", "accessories"],
  digital: ["tutorial", "guide", "consultation"],
  bundle: ["bundle"],
  gift_card: ["gift_card"],
};

const ArtistProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const { data: product, isLoading: productLoading } = useProduct(id || "");
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  // Form state
  const [selectedType, setSelectedType] = useState<ProductType | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ProductCategory | "">("");
  const [price, setPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [inventory, setInventory] = useState("");
  const [digitalUrl, setDigitalUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);

  // Populate form on edit
  useEffect(() => {
    if (product && isEditing) {
      setSelectedType(product.product_type);
      setTitle(product.title);
      setDescription(product.description || "");
      setCategory(product.category);
      setPrice(product.price_qar.toString());
      setComparePrice(product.compare_at_price?.toString() || "");
      setInventory(product.inventory_count.toString());
      setDigitalUrl(product.digital_content_url || "");
      setImages(product.images || []);
      setIsFeatured(product.is_featured);
    }
  }, [product, isEditing]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // In a real app, you'd upload to Supabase Storage
      // For now, we'll use local object URLs
      const newImages = Array.from(files).slice(0, 5 - images.length).map((file) => URL.createObjectURL(file));
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType || !title || !price || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    const productData = {
      title,
      description,
      product_type: selectedType,
      category,
      price_qar: parseFloat(price),
      compare_at_price: comparePrice ? parseFloat(comparePrice) : undefined,
      images,
      inventory_count: selectedType === "physical" ? parseInt(inventory) || 0 : 0,
      digital_content_url: selectedType === "digital" ? digitalUrl : undefined,
      is_featured: isFeatured,
    };

    try {
      if (isEditing && id) {
        await updateProduct.mutateAsync({ id, ...productData });
        toast.success("Product updated successfully");
      } else {
        await createProduct.mutateAsync(productData);
        toast.success("Product created successfully");
      }
      navigate("/artist-products");
    } catch (error: any) {
      toast.error(error.message || "Failed to save product");
    }
  };

  if (isEditing && productLoading) {
    return (
      <div className="min-h-screen bg-background p-5">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background pt-8 pb-6 px-5">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/artist-products")}
            className="p-2 rounded-xl bg-card hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">
            {isEditing ? "Edit Product" : "Add New Product"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-6 space-y-6">
        {/* Product Type Selection */}
        {!selectedType ? (
          <div className="space-y-4">
            <Label className="text-base font-semibold">What type of product?</Label>
            <div className="grid grid-cols-1 gap-3">
              {PRODUCT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSelectedType(type.value)}
                    className="p-4 bg-card rounded-2xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{type.label}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {/* Selected Type Display */}
            <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  {PRODUCT_TYPES.find((t) => t.value === selectedType)?.icon({
                    className: "w-5 h-5 text-primary",
                  })}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Product Type</p>
                  <p className="font-semibold text-foreground capitalize">
                    {selectedType.replace("_", " ")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedType(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Change
              </button>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Basic Information</Label>

              <div className="space-y-2">
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Professional Makeup Brush Set"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your product..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="rounded-xl resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  required
                  className="w-full h-12 px-3 rounded-xl bg-card border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES[selectedType].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace("_", " ").toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Pricing</Label>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (QAR) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comparePrice">Compare at Price</Label>
                  <Input
                    id="comparePrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Product Images</Label>
              <div className="grid grid-cols-5 gap-2">
                {images.map((image, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={image} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {index === 0 && (
                      <Badge className="absolute top-1 left-1 text-[10px] px-1.5 py-0 bg-primary text-primary-foreground border-0">
                        Cover
                      </Badge>
                    )}
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Type-specific fields */}
            {selectedType === "physical" && (
              <div className="space-y-2">
                <Label htmlFor="inventory">Inventory Count</Label>
                <Input
                  id="inventory"
                  type="number"
                  placeholder="0"
                  value={inventory}
                  onChange={(e) => setInventory(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            )}

            {selectedType === "digital" && (
              <div className="space-y-2">
                <Label htmlFor="digitalUrl">Digital Content URL</Label>
                <Input
                  id="digitalUrl"
                  type="url"
                  placeholder="https://..."
                  value={digitalUrl}
                  onChange={(e) => setDigitalUrl(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            )}

            {/* Featured Toggle */}
            <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/50">
              <div>
                <p className="font-medium text-foreground">Featured Product</p>
                <p className="text-sm text-muted-foreground">Show this product on your profile</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFeatured(!isFeatured)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  isFeatured ? "bg-primary" : "bg-muted"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isFeatured ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => navigate("/artist-products")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-xl"
                disabled={createProduct.isPending || updateProduct.isPending}
              >
                {isEditing ? "Save Changes" : "Create Product"}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default ArtistProductForm;
