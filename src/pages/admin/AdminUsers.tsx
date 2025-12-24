import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAdminUsers, useUpdateUserRole } from "@/hooks/useAdminUsers";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MoreVertical, Shield, Palette, Key, Eye, EyeOff, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const roleLabels: Record<string, string> = { admin: "مدير", artist: "فنانة", customer: "عميل" };
const roleColors: Record<string, string> = { admin: "bg-purple-100 text-purple-800", artist: "bg-pink-100 text-pink-800", customer: "bg-blue-100 text-blue-800" };

const AdminUsers = () => {
  const { role, loading: roleLoading } = useUserRole();
  const [search, setSearch] = useState("");
  const { data: users, isLoading } = useAdminUsers(search);
  const updateRole = useUpdateUserRole();
  const queryClient = useQueryClient();
  
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // New user form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState<string>("customer");
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  if (roleLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Skeleton className="h-8 w-32" /></div>;
  if (role !== "admin") return <Navigate to="/home" replace />;

  const handleRoleChange = async (userId: string, targetRole: "admin" | "artist" | "customer", hasRole: boolean) => {
    try {
      await updateRole.mutateAsync({ userId, role: targetRole, action: hasRole ? "remove" : "add" });
      toast.success(hasRole ? `تم إزالة صلاحية ${roleLabels[targetRole]}` : `تم إضافة صلاحية ${roleLabels[targetRole]}`);
    } catch { toast.error("حدث خطأ"); }
  };

  const openPasswordDialog = (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName });
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setPasswordDialog(true);
  };

  const openDeleteDialog = (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName });
    setDeleteDialog(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    try {
      const response = await supabase.functions.invoke("admin-delete-user", {
        body: { userId: selectedUser.id },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success("تم حذف المستخدم بنجاح");
      setDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء حذف المستخدم");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!selectedUser) return;
    
    if (newPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("كلمات المرور غير متطابقة");
      return;
    }

    setIsUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("admin-reset-password", {
        body: { userId: selectedUser.id, newPassword },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success("تم تغيير كلمة المرور بنجاح");
      setPasswordDialog(false);
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء تغيير كلمة المرور");
    } finally {
      setIsUpdating(false);
    }
  };

  const resetAddUserForm = () => {
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserName("");
    setNewUserPhone("");
    setNewUserRole("customer");
    setShowNewUserPassword(false);
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast.error("البريد الإلكتروني وكلمة المرور مطلوبان");
      return;
    }

    if (newUserPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setIsCreating(true);
    try {
      const response = await supabase.functions.invoke("admin-create-user", {
        body: {
          email: newUserEmail,
          password: newUserPassword,
          fullName: newUserName,
          phone: newUserPhone,
          role: newUserRole,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success("تم إنشاء المستخدم بنجاح");
      setAddUserDialog(false);
      resetAddUserForm();
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء إنشاء المستخدم");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminSidebar />
      <main className="mr-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div><h1 className="text-3xl font-bold text-foreground">إدارة المستخدمين</h1><p className="text-muted-foreground mt-1">{users?.length || 0} مستخدم</p></div>
            <div className="flex items-center gap-4">
              <div className="relative w-72"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="البحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" /></div>
              <Button onClick={() => setAddUserDialog(true)}><UserPlus className="h-4 w-4 ml-2" />إضافة مستخدم</Button>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border">
            {isLoading ? <div className="p-8 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div> : (
              <Table>
                <TableHeader><TableRow><TableHead className="text-right">المستخدم</TableHead><TableHead className="text-right">الأدوار</TableHead><TableHead className="text-right">الحجوزات</TableHead><TableHead className="text-right">تاريخ التسجيل</TableHead><TableHead className="text-right">الإجراءات</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell><div className="flex items-center gap-3"><Avatar className="h-10 w-10"><AvatarImage src={user.avatar_url || undefined} /><AvatarFallback>{user.full_name?.[0] || "U"}</AvatarFallback></Avatar><div><p className="font-medium">{user.full_name || "بدون اسم"}</p><p className="text-sm text-muted-foreground">{user.email}</p></div></div></TableCell>
                      <TableCell><div className="flex gap-1 flex-wrap">{user.roles.map((r) => <Badge key={r} variant="secondary" className={roleColors[r]}>{roleLabels[r]}</Badge>)}</div></TableCell>
                      <TableCell>{user.bookings_count}</TableCell>
                      <TableCell>{format(new Date(user.created_at), "d MMM yyyy", { locale: ar })}</TableCell>
                      <TableCell>
                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, "admin", user.roles.includes("admin"))}><Shield className="h-4 w-4 ml-2" />{user.roles.includes("admin") ? "إزالة المدير" : "جعله مدير"}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, "artist", user.roles.includes("artist"))}><Palette className="h-4 w-4 ml-2" />{user.roles.includes("artist") ? "إزالة الفنانة" : "جعله فنانة"}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openPasswordDialog(user.id, user.full_name || user.email || "المستخدم")}><Key className="h-4 w-4 ml-2" />تغيير كلمة المرور</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteDialog(user.id, user.full_name || user.email || "المستخدم")} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 ml-2" />حذف المستخدم</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </main>

      <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تغيير كلمة المرور</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              تغيير كلمة المرور للمستخدم: <span className="font-medium text-foreground">{selectedUser?.name}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الجديدة"
                  className="pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPasswordDialog(false)}>إلغاء</Button>
            <Button onClick={handlePasswordChange} disabled={isUpdating}>
              {isUpdating ? "جاري التحديث..." : "تغيير كلمة المرور"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف المستخدم</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المستخدم <span className="font-medium">{selectedUser?.name}</span>؟
              <br />
              سيتم حذف جميع بيانات المستخدم بشكل نهائي ولا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "جاري الحذف..." : "حذف المستخدم"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={addUserDialog} onOpenChange={(open) => { setAddUserDialog(open); if (!open) resetAddUserForm(); }}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مستخدم جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">الاسم الكامل</Label>
              <Input
                id="user-name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="أدخل اسم المستخدم"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">البريد الإلكتروني *</Label>
              <Input
                id="user-email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="example@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-phone">رقم الهاتف</Label>
              <Input
                id="user-phone"
                type="tel"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
                placeholder="05xxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">كلمة المرور *</Label>
              <div className="relative">
                <Input
                  id="user-password"
                  type={showNewUserPassword ? "text" : "password"}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                  className="pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewUserPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>الدور</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">عميل</SelectItem>
                  <SelectItem value="artist">فنانة</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddUserDialog(false)}>إلغاء</Button>
            <Button onClick={handleCreateUser} disabled={isCreating}>
              {isCreating ? "جاري الإنشاء..." : "إنشاء المستخدم"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
