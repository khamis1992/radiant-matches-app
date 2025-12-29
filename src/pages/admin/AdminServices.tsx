import { useState, useMemo } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { cn } from "@/lib/utils";

const AdminServices = () => {
  const { t, isRTL } = useLanguage();
  const { services, isLoading, toggleServiceStatus, updateServicePrice, isUpdating } = useAdminServices();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingService, setEditingService] = useState<{ id: string; price: number } | null>(null);
  const [newPrice, setNewPrice] = useState("");

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    services.forEach((service) => {
      if (service.category) categories.add(service.category);
    });
    return Array.from(categories);
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.artist_profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || service.category === categoryFilter;
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
      <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
        <AdminSidebar />
        <main className={cn("p-6 flex items-center justify-center min-h-screen", isRTL ? "mr-64" : "ml-64")}>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <AdminSidebar />
      
      <main className={cn("p-6", isRTL ? "mr-64" : "ml-64")}>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Scissors className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t.adminServices.title}</h1>
                <p className="text-muted-foreground text-sm">
                  {services.length} {t.adminServices.serviceCount} • {activeCount} {t.adminServices.active}
                </p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {t.adminServices.searchAndFilter}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                  <Input
                    placeholder={t.adminServices.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={isRTL ? "pr-10" : "pl-10"}
                  />
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.adminServices.category} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.adminServices.allCategories}</SelectItem>
                    {uniqueCategories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.adminServices.status} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.adminServices.allStatuses}</SelectItem>
                    <SelectItem value="active">{t.adminServices.activeStatus}</SelectItem>
                    <SelectItem value="inactive">{t.adminServices.inactiveStatus}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {filteredServices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Scissors className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">{t.adminServices.noServices}</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                      ? t.adminServices.noResultsMessage
                      : t.adminServices.servicesWillAppear}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={isRTL ? "text-right" : "text-left"}>{t.adminServices.service}</TableHead>
                      <TableHead className={isRTL ? "text-right" : "text-left"}>{t.adminServices.artist}</TableHead>
                      <TableHead className={cn("w-28", isRTL ? "text-right" : "text-left")}>{t.adminServices.category}</TableHead>
                      <TableHead className={cn("w-24", isRTL ? "text-right" : "text-left")}>{t.adminServices.price}</TableHead>
                      <TableHead className={cn("w-24", isRTL ? "text-right" : "text-left")}>{t.adminServices.duration}</TableHead>
                      <TableHead className={cn("w-24", isRTL ? "text-right" : "text-left")}>{t.adminServices.status}</TableHead>
                      <TableHead className={cn("w-24", isRTL ? "text-right" : "text-left")}>{t.adminServices.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{service.name}</p>
                            {service.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">{service.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{service.artist_profile?.full_name || t.adminServices.artist}</TableCell>
                        <TableCell>
                          {service.category ? <Badge variant="secondary">{service.category}</Badge> : "-"}
                        </TableCell>
                        <TableCell className="font-medium">{service.price} {isRTL ? "ر.ق" : "QAR"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {service.duration_minutes} {t.adminServices.min}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={service.is_active || false}
                            onCheckedChange={(checked) => toggleServiceStatus({ serviceId: service.id, isActive: checked })}
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

      <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.adminServices.editPrice}</DialogTitle>
            <DialogDescription>{t.adminServices.enterNewPrice}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="price">{t.adminServices.priceLabel}</Label>
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
            <Button variant="outline" onClick={() => setEditingService(null)}>{t.common.cancel}</Button>
            <Button onClick={handlePriceUpdate} disabled={!newPrice || isUpdating}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServices;
