import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { 
  usePromoCodes, 
  useCreatePromoCode, 
  useDeletePromoCode, 
  useTogglePromoCode,
  CreatePromoCodeData 
} from "@/hooks/usePromoCodes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Trash2, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

const AdminPromoCodes = () => {
  const { role, loading: roleLoading } = useUserRole();
  const { data: promoCodes, isLoading } = usePromoCodes();
  const createPromoCode = useCreatePromoCode();
  const deletePromoCode = useDeletePromoCode();
  const togglePromoCode = useTogglePromoCode();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreatePromoCodeData>({
    code: "",
    discount_type: "percentage",
    discount_value: 10,
    max_uses: null,
    valid_from: null,
    valid_until: null,
    min_order_amount: 0,
  });

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <AdminSidebar />
        <main className="flex-1 mr-64 p-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim()) {
      toast.error("يرجى إدخال كود الخصم");
      return;
    }

    if (formData.discount_value <= 0) {
      toast.error("يرجى إدخال قيمة خصم صحيحة");
      return;
    }

    if (formData.discount_type === "percentage" && formData.discount_value > 100) {
      toast.error("نسبة الخصم لا يمكن أن تتجاوز 100%");
      return;
    }

    await createPromoCode.mutateAsync({
      ...formData,
      code: formData.code.toUpperCase().trim(),
    });
    
    setIsDialogOpen(false);
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: 10,
      max_uses: null,
      valid_from: null,
      valid_until: null,
      min_order_amount: 0,
    });
  };

  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("تم نسخ الكود");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusBadge = (promo: typeof promoCodes extends (infer T)[] | undefined ? T : never) => {
    if (!promo) return null;
    
    const now = new Date();
    const validFrom = promo.valid_from ? new Date(promo.valid_from) : null;
    const validUntil = promo.valid_until ? new Date(promo.valid_until) : null;
    
    if (!promo.is_active) {
      return <Badge variant="secondary">غير مفعل</Badge>;
    }
    
    if (validUntil && validUntil < now) {
      return <Badge variant="destructive">منتهي</Badge>;
    }
    
    if (validFrom && validFrom > now) {
      return <Badge variant="outline">قادم</Badge>;
    }
    
    if (promo.max_uses && promo.current_uses >= promo.max_uses) {
      return <Badge variant="destructive">مستنفد</Badge>;
    }
    
    return <Badge className="bg-green-500 hover:bg-green-600">نشط</Badge>;
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      
      <main className="flex-1 mr-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">أكواد الخصم</h1>
            <p className="text-muted-foreground mt-1">إدارة العروض الترويجية وأكواد الخصم</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                إنشاء كود جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>إنشاء كود خصم جديد</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="code">كود الخصم</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="مثال: SAVE20"
                    className="uppercase"
                    maxLength={20}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع الخصم</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value: "percentage" | "fixed") => 
                        setFormData({ ...formData, discount_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                        <SelectItem value="fixed">مبلغ ثابت (ر.ق)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount_value">
                      قيمة الخصم {formData.discount_type === "percentage" ? "(%)" : "(ر.ق)"}
                    </Label>
                    <Input
                      id="discount_value"
                      type="number"
                      min="1"
                      max={formData.discount_type === "percentage" ? 100 : undefined}
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_uses">الحد الأقصى للاستخدام</Label>
                    <Input
                      id="max_uses"
                      type="number"
                      min="1"
                      value={formData.max_uses || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        max_uses: e.target.value ? Number(e.target.value) : null 
                      })}
                      placeholder="غير محدود"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_order_amount">الحد الأدنى للطلب (ر.ق)</Label>
                    <Input
                      id="min_order_amount"
                      type="number"
                      min="0"
                      value={formData.min_order_amount || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        min_order_amount: Number(e.target.value) || 0 
                      })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valid_from">تاريخ البداية</Label>
                    <Input
                      id="valid_from"
                      type="datetime-local"
                      value={formData.valid_from || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        valid_from: e.target.value || null 
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valid_until">تاريخ الانتهاء</Label>
                    <Input
                      id="valid_until"
                      type="datetime-local"
                      value={formData.valid_until || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        valid_until: e.target.value || null 
                      })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={createPromoCode.isPending}>
                    {createPromoCode.isPending ? "جاري الإنشاء..." : "إنشاء"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Promo Codes Table */}
        <div className="bg-card rounded-xl border border-border">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : promoCodes && promoCodes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الكود</TableHead>
                  <TableHead className="text-right">الخصم</TableHead>
                  <TableHead className="text-right">الاستخدام</TableHead>
                  <TableHead className="text-right">الصلاحية</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">مفعل</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                          {promo.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(promo.code)}
                        >
                          {copiedCode === promo.code ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {promo.discount_type === "percentage" 
                        ? `${promo.discount_value}%` 
                        : `${promo.discount_value} ر.ق`}
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {promo.current_uses || 0}
                        {promo.max_uses ? ` / ${promo.max_uses}` : " / ∞"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {promo.valid_from && (
                          <div className="text-muted-foreground">
                            من: {format(new Date(promo.valid_from), "dd MMM yyyy", { locale: ar })}
                          </div>
                        )}
                        {promo.valid_until && (
                          <div className="text-muted-foreground">
                            إلى: {format(new Date(promo.valid_until), "dd MMM yyyy", { locale: ar })}
                          </div>
                        )}
                        {!promo.valid_from && !promo.valid_until && (
                          <span className="text-muted-foreground">غير محدد</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(promo)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={promo.is_active}
                        onCheckedChange={(checked) => 
                          togglePromoCode.mutate({ id: promo.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف كود الخصم</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف كود الخصم "{promo.code}"؟ لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => deletePromoCode.mutate(promo.id)}
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-4">لا توجد أكواد خصم</p>
              <Button onClick={() => setIsDialogOpen(true)} variant="outline">
                إنشاء أول كود خصم
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPromoCodes;
