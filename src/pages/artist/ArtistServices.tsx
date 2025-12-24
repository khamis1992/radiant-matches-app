import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import ArtistHeader from "@/components/artist/ArtistHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Clock, Briefcase } from "lucide-react";
import { formatQAR } from "@/lib/locale";
import { useAuth } from "@/hooks/useAuth";
import {
  useCurrentArtist,
  useArtistServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  ArtistService,
} from "@/hooks/useArtistDashboard";
import { SERVICE_CATEGORIES } from "@/hooks/useArtists";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ArtistServices = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: artist, isLoading: artistLoading } = useCurrentArtist();
  const { data: services, isLoading: servicesLoading } = useArtistServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ArtistService | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    duration_minutes: 60,
    price: 0,
    category: "",
    is_active: true,
  });

  if (authLoading || artistLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <Skeleton className="h-6 w-40" />
        </header>
        <div className="px-5 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!user || !artist) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <h1 className="text-xl font-bold text-foreground">Services</h1>
        </header>
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Not an Artist</h2>
          <p className="text-muted-foreground mb-6">You don't have an artist profile yet</p>
          <Button onClick={() => navigate("/home")}>Go Home</Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const openServiceDialog = (service?: ArtistService) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        name: service.name,
        description: service.description || "",
        duration_minutes: service.duration_minutes,
        price: service.price,
        category: service.category || "",
        is_active: service.is_active ?? true,
      });
    } else {
      setEditingService(null);
      setServiceForm({
        name: "",
        description: "",
        duration_minutes: 60,
        price: 0,
        category: "",
        is_active: true,
      });
    }
    setServiceDialogOpen(true);
  };

  const handleServiceSave = async () => {
    try {
      if (editingService) {
        await updateService.mutateAsync({ id: editingService.id, ...serviceForm });
        toast.success("Service updated");
      } else {
        await createService.mutateAsync(serviceForm);
        toast.success("Service created");
      }
      setServiceDialogOpen(false);
    } catch (error) {
      toast.error("Failed to save service");
    }
  };

  const handleServiceDelete = async (serviceId: string) => {
    try {
      await deleteService.mutateAsync(serviceId);
      toast.success("Service deleted");
    } catch (error) {
      toast.error("Failed to delete service");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <ArtistHeader />

      <div className="px-5 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Your Services</h2>
          <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => openServiceDialog()}>
                <Plus className="w-4 h-4 mr-1" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    placeholder="e.g., Bridal Makeup"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    placeholder="Describe your service..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (QAR)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={serviceForm.duration_minutes}
                      onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: parseInt(e.target.value) || 60 })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={serviceForm.category}
                    onValueChange={(value) => setServiceForm({ ...serviceForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="active">Active</Label>
                  <Switch
                    id="active"
                    checked={serviceForm.is_active}
                    onCheckedChange={(checked) => setServiceForm({ ...serviceForm, is_active: checked })}
                  />
                </div>
                <Button className="w-full" onClick={handleServiceSave}>
                  {editingService ? "Update Service" : "Create Service"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {servicesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        ) : services && services.length > 0 ? (
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.id} className={`bg-card rounded-2xl border border-border p-4 shadow-sm ${!service.is_active ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{service.name}</h3>
                      {!service.is_active && (
                        <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">Inactive</span>
                      )}
                    </div>
                    {service.category && (
                      <span className="text-xs text-primary">{service.category}</span>
                    )}
                    {service.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{formatQAR(service.price)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{service.duration_minutes} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openServiceDialog(service)}
                      className="p-2 rounded-full hover:bg-muted transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button 
                      onClick={() => handleServiceDelete(service.id)}
                      className="p-2 rounded-full hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No services yet</p>
            <p className="text-sm mt-1">Add your first service to start receiving bookings</p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ArtistServices;
