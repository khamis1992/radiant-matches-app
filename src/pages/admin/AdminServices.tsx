import { useState, useMemo } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAdminServices } from "@/hooks/useAdminServices";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search, Filter, Scissors, Edit2, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const AdminServices = () => {
  const { services, isLoading, toggleServiceStatus, updateServicePrice, isUpdating } = useAdminServices();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingService, setEditingService] = useState<{ id: string; price: number } | null>(null);
  const [newPrice, setNewPrice] = useState("");

  // Get unique categories for filter
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    services.forEach((service) => {
      if (service.category) categories.add(service.category);
    });
    return Array.from(categories);
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      // Search filter
      const matchesSearch =
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.artist_profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = categoryFilter === "all" || service.category === categoryFilter;
      
      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && service.is_active) ||
        (statusFilter === "inactive" && !service.is_active);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [services, searchQuery, categoryFilter, statusFilter]);

  const handlePriceUpdate = () => {
    if (editingService && newPrice) {
      updateServicePrice({ serviceId: editingService.id, price: parseFloat(newPrice) });
      setEditingService(null);
      setNewPrice("");
    }
  };

  const activeCount = services.filter((s) => s.is_active).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <AdminSidebar />
        <main className="mr-64 p-6 flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminSidebar />
      
      <main className="mr-64 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Scissors className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">إدارة الخدمات</h1>
                <p className="text-muted-foreground text-sm">
                  {services.length} خدمة • {activeCount} نشطة
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                البحث والفلترة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث في الخدمات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفئات</SelectItem>
                    {uniqueCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="active">نشطة</SelectItem>
                    <SelectItem value="inactive">معطلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Services Table */}
          <Card>
            <CardContent className="p-0">
              {filteredServices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Scissors className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">لا توجد خدمات</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                      ? "لا توجد نتائج تطابق معايير البحث"
                      : "ستظهر الخدمات هنا عند إضافتها"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الخدمة</TableHead>
                      <TableHead className="text-right">الفنانة</TableHead>
                      <TableHead className="text-right w-28">الفئة</TableHead>
                      <TableHead className="text-right w-24">السعر</TableHead>
                      <TableHead className="text-right w-24">المدة</TableHead>
                      <TableHead className="text-right w-24">الحالة</TableHead>
                      <TableHead className="text-right w-24">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{service.name}</p>
                            {service.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {service.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {service.artist_profile?.full_name || "فنانة"}
                        </TableCell>
                        <TableCell>
                          {service.category ? (
                            <Badge variant="secondary">{service.category}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {service.price} ر.س
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {service.duration_minutes} د
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={service.is_active || false}
                            onCheckedChange={(checked) =>
                              toggleServiceStatus({ serviceId: service.id, isActive: checked })
                            }
                            disabled={isUpdating}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingService({ id: service.id, price: service.price });
                              setNewPrice(service.price.toString());
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Price Dialog */}
      <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل السعر</DialogTitle>
            <DialogDescription>
              أدخل السعر الجديد للخدمة
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="price">السعر (ر.س)</Label>
            <Input
              id="price"
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="mt-2"
              min="0"
              step="0.01"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingService(null)}>
              إلغاء
            </Button>
            <Button onClick={handlePriceUpdate} disabled={!newPrice || isUpdating}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServices;
