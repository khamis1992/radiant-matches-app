import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, Clock, MapPin, User, Plus, Pencil, Trash2, 
  Check, X, DollarSign, Briefcase, Star, ArrowLeft, TrendingUp, TrendingDown, Image
} from "lucide-react";
import PortfolioUpload from "@/components/PortfolioUpload";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  useCurrentArtist,
  useArtistBookings,
  useArtistServices,
  useArtistEarnings,
  useUpdateArtistProfile,
  useUpdateBookingStatus,
  useCreateService,
  useUpdateService,
  useDeleteService,
  ArtistService,
} from "@/hooks/useArtistDashboard";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const ArtistDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useProfile();
  const { data: artist, isLoading: artistLoading } = useCurrentArtist();
  const { data: bookings, isLoading: bookingsLoading } = useArtistBookings();
  const { data: services, isLoading: servicesLoading } = useArtistServices();
  const { data: earnings, isLoading: earningsLoading } = useArtistEarnings();
  
  const updateProfile = useUpdateArtistProfile();
  const updateBookingStatus = useUpdateBookingStatus();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    bio: "",
    experience_years: 0,
    studio_address: "",
    is_available: true,
  });

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
          <h1 className="text-xl font-bold text-foreground">Artist Dashboard</h1>
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

  const handleProfileEdit = () => {
    setProfileForm({
      bio: artist.bio || "",
      experience_years: artist.experience_years || 0,
      studio_address: artist.studio_address || "",
      is_available: artist.is_available ?? true,
    });
    setEditingProfile(true);
  };

  const handleProfileSave = async () => {
    try {
      await updateProfile.mutateAsync(profileForm);
      toast.success("Profile updated");
      setEditingProfile(false);
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleBookingAction = async (bookingId: string, status: "confirmed" | "cancelled" | "completed") => {
    try {
      await updateBookingStatus.mutateAsync({ bookingId, status });
      toast.success(`Booking ${status}`);
    } catch (error) {
      toast.error("Failed to update booking");
    }
  };

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

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, "h:mm a");
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600",
      confirmed: "bg-primary/10 text-primary",
      completed: "bg-muted text-muted-foreground",
      cancelled: "bg-destructive/10 text-destructive",
    };
    return styles[status] || styles.pending;
  };

  const { upcoming = [], past = [] } = bookings || {};

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Artist Dashboard</h1>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="px-5 py-4">
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{upcoming.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Upcoming</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <p className="text-2xl font-bold text-foreground">{artist.rating || 0}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Rating</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{artist.total_reviews || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Reviews</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="earnings" className="px-5">
        <TabsList className="w-full grid grid-cols-4 mb-4">
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        {/* Earnings Tab */}
        <TabsContent value="earnings" className="space-y-4">
          {earningsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          ) : (
            <>
              {/* Revenue Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    ${earnings?.totalEarnings.toFixed(2) || "0.00"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {earnings?.completedBookings || 0} completed bookings
                  </p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    ${earnings?.pendingEarnings.toFixed(2) || "0.00"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Confirmed bookings
                  </p>
                </div>
              </div>

              {/* Monthly Comparison */}
              <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <h3 className="font-semibold text-foreground mb-3">This Month</h3>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      ${earnings?.thisMonthEarnings.toFixed(2) || "0.00"}
                    </p>
                    {earnings && earnings.lastMonthEarnings > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {earnings.thisMonthEarnings >= earnings.lastMonthEarnings ? (
                          <>
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-500">
                              +{(((earnings.thisMonthEarnings - earnings.lastMonthEarnings) / earnings.lastMonthEarnings) * 100).toFixed(0)}%
                            </span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-4 h-4 text-destructive" />
                            <span className="text-sm text-destructive">
                              {(((earnings.thisMonthEarnings - earnings.lastMonthEarnings) / earnings.lastMonthEarnings) * 100).toFixed(0)}%
                            </span>
                          </>
                        )}
                        <span className="text-sm text-muted-foreground">vs last month</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Last month</p>
                    <p className="text-lg font-medium text-muted-foreground">
                      ${earnings?.lastMonthEarnings.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Earnings Chart */}
              {earnings && earnings.monthlyTrend.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                  <h3 className="font-semibold text-foreground mb-4">Revenue Trend</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={earnings.monthlyTrend}>
                        <defs>
                          <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="month" 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, "Earnings"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="earnings"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill="url(#earningsGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Service Breakdown */}
              {earnings && earnings.serviceBreakdown.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                  <h3 className="font-semibold text-foreground mb-3">Top Services</h3>
                  <div className="space-y-3">
                    {earnings.serviceBreakdown.slice(0, 5).map((service) => (
                      <div key={service.name} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{service.name}</p>
                          <p className="text-sm text-muted-foreground">{service.count} bookings</p>
                        </div>
                        <p className="font-semibold text-foreground">${service.earnings.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {earnings && earnings.completedBookings === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No earnings yet</p>
                  <p className="text-sm mt-1">Complete your first booking to see earnings</p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Upcoming Bookings</h2>
            {bookingsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
              </div>
            ) : upcoming.length > 0 ? (
              <div className="space-y-3">
                {upcoming.map((booking) => (
                  <div key={booking.id} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">
                            {booking.customer?.full_name || "Customer"}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusBadge(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-sm text-primary mt-0.5">{booking.service?.name}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{format(new Date(booking.booking_date), "MMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatTime(booking.booking_time)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{booking.location_address || booking.location_type}</span>
                        </div>
                      </div>
                    </div>
                    {booking.status === "pending" && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleBookingAction(booking.id, "cancelled")}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleBookingAction(booking.id, "confirmed")}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Confirm
                        </Button>
                      </div>
                    )}
                    {booking.status === "confirmed" && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleBookingAction(booking.id, "completed")}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Mark Completed
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No upcoming bookings</p>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Past Bookings</h2>
            {past.length > 0 ? (
              <div className="space-y-3">
                {past.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="bg-card rounded-2xl border border-border p-4 shadow-sm opacity-70">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-foreground">
                            {booking.customer?.full_name || "Customer"}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusBadge(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {booking.service?.name} • {format(new Date(booking.booking_date), "MMM d")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No past bookings</p>
              </div>
            )}
          </section>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
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
                      <Label htmlFor="price">Price ($)</Label>
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
                    <Input
                      id="category"
                      value={serviceForm.category}
                      onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                      placeholder="e.g., Bridal, Party, Natural"
                    />
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
                          <DollarSign className="w-3.5 h-3.5" />
                          <span className="font-medium text-foreground">${service.price}</span>
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
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Artist Profile</h2>
              {!editingProfile && (
                <Button variant="outline" size="sm" onClick={handleProfileEdit}>
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>

            {editingProfile ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="Tell clients about yourself..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={profileForm.experience_years}
                    onChange={(e) => setProfileForm({ ...profileForm, experience_years: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="studio">Studio Address</Label>
                  <Input
                    id="studio"
                    value={profileForm.studio_address}
                    onChange={(e) => setProfileForm({ ...profileForm, studio_address: e.target.value })}
                    placeholder="Your studio location"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="available">Available for Bookings</Label>
                  <Switch
                    id="available"
                    checked={profileForm.is_available}
                    onCheckedChange={(checked) => setProfileForm({ ...profileForm, is_available: checked })}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setEditingProfile(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleProfileSave}>
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bio</p>
                  <p className="text-foreground mt-1">{artist.bio || "No bio added"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="text-foreground mt-1">{artist.experience_years || 0} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-foreground mt-1">{artist.is_available ? "Available" : "Unavailable"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Studio Address</p>
                  <p className="text-foreground mt-1">{artist.studio_address || "Not set"}</p>
                </div>
              </div>
            )}
          </div>

          {/* Portfolio Section */}
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
            <PortfolioUpload artistId={artist.id} />
          </div>

          {/* Account Info */}
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4">Account Info</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-foreground">{profile?.full_name || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-foreground">{profile?.email || user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="text-foreground">{profile?.location || "Not set"}</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <BottomNavigation />
    </div>
  );
};

export default ArtistDashboard;
