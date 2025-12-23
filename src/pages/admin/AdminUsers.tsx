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
import { Search, MoreVertical, Shield, Palette, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const roleLabels: Record<string, string> = { admin: "مدير", artist: "فنانة", customer: "عميل" };
const roleColors: Record<string, string> = { admin: "bg-purple-100 text-purple-800", artist: "bg-pink-100 text-pink-800", customer: "bg-blue-100 text-blue-800" };

const AdminUsers = () => {
  const { role, loading: roleLoading } = useUserRole();
  const [search, setSearch] = useState("");
  const { data: users, isLoading } = useAdminUsers(search);
  const updateRole = useUpdateUserRole();

  if (roleLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Skeleton className="h-8 w-32" /></div>;
  if (role !== "admin") return <Navigate to="/home" replace />;

  const handleRoleChange = async (userId: string, targetRole: "admin" | "artist" | "customer", hasRole: boolean) => {
    try {
      await updateRole.mutateAsync({ userId, role: targetRole, action: hasRole ? "remove" : "add" });
      toast.success(hasRole ? `تم إزالة صلاحية ${roleLabels[targetRole]}` : `تم إضافة صلاحية ${roleLabels[targetRole]}`);
    } catch { toast.error("حدث خطأ"); }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminSidebar />
      <main className="mr-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div><h1 className="text-3xl font-bold text-foreground">إدارة المستخدمين</h1><p className="text-muted-foreground mt-1">{users?.length || 0} مستخدم</p></div>
            <div className="relative w-72"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="البحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" /></div>
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
    </div>
  );
};

export default AdminUsers;
