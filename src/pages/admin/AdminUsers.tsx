import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAdminUsers, useUpdateUserRole } from "@/hooks/useAdminUsers";
import { useAdminInvitations, useSendInvitation, useDeleteInvitation } from "@/hooks/useAdminInvitations";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MoreVertical, Shield, Palette, UserPlus, Mail, Trash2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format, isAfter } from "date-fns";
import { ar } from "date-fns/locale";

const roleLabels: Record<string, string> = { admin: "مدير", artist: "فنانة", customer: "عميل" };
const roleColors: Record<string, string> = { admin: "bg-purple-100 text-purple-800", artist: "bg-pink-100 text-pink-800", customer: "bg-blue-100 text-blue-800" };

const AdminUsers = () => {
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [search, setSearch] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "artist">("admin");

  const { data: users, isLoading } = useAdminUsers(search);
  const { data: invitations, isLoading: invitationsLoading } = useAdminInvitations();
  const updateRole = useUpdateUserRole();
  const sendInvitation = useSendInvitation();
  const deleteInvitation = useDeleteInvitation();

  if (roleLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Skeleton className="h-8 w-32" /></div>;
  if (role !== "admin") return <Navigate to="/home" replace />;

  const handleRoleChange = async (userId: string, targetRole: "admin" | "artist" | "customer", hasRole: boolean) => {
    try {
      await updateRole.mutateAsync({ userId, role: targetRole, action: hasRole ? "remove" : "add" });
      toast.success(hasRole ? `تم إزالة صلاحية ${roleLabels[targetRole]}` : `تم إضافة صلاحية ${roleLabels[targetRole]}`);
    } catch { toast.error("حدث خطأ"); }
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail || !user?.id) {
      toast.error("يرجى إدخال البريد الإلكتروني");
      return;
    }

    try {
      await sendInvitation.mutateAsync({
        email: inviteEmail,
        role: inviteRole,
        invitedBy: user.id,
      });
      toast.success("تم إرسال الدعوة بنجاح");
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("admin");
    } catch (error: any) {
      toast.error(error.message || "فشل إرسال الدعوة");
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    try {
      await deleteInvitation.mutateAsync(invitationId);
      toast.success("تم حذف الدعوة");
    } catch {
      toast.error("فشل حذف الدعوة");
    }
  };

  const getInvitationStatus = (invitation: { accepted_at: string | null; expires_at: string }) => {
    if (invitation.accepted_at) {
      return { label: "مقبولة", icon: CheckCircle2, color: "bg-green-100 text-green-800" };
    }
    if (!isAfter(new Date(invitation.expires_at), new Date())) {
      return { label: "منتهية", icon: XCircle, color: "bg-red-100 text-red-800" };
    }
    return { label: "معلقة", icon: Clock, color: "bg-yellow-100 text-yellow-800" };
  };

  const pendingInvitations = invitations?.filter(inv => !inv.accepted_at && isAfter(new Date(inv.expires_at), new Date())) || [];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminSidebar />
      <main className="mr-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">إدارة المستخدمين</h1>
              <p className="text-muted-foreground mt-1">{users?.length || 0} مستخدم • {pendingInvitations.length} دعوة معلقة</p>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    دعوة مستخدم
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle>دعوة مستخدم جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الدور</Label>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "artist")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              مدير
                            </div>
                          </SelectItem>
                          <SelectItem value="artist">
                            <div className="flex items-center gap-2">
                              <Palette className="h-4 w-4" />
                              فنانة
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      className="w-full gap-2" 
                      onClick={handleSendInvitation}
                      disabled={sendInvitation.isPending}
                    >
                      <Mail className="h-4 w-4" />
                      {sendInvitation.isPending ? "جاري الإرسال..." : "إرسال الدعوة"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList>
              <TabsTrigger value="users">المستخدمين</TabsTrigger>
              <TabsTrigger value="invitations">
                الدعوات
                {pendingInvitations.length > 0 && (
                  <Badge variant="secondary" className="mr-2 bg-primary/10 text-primary">
                    {pendingInvitations.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div className="relative w-72">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="البحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
              </div>
              <div className="bg-card rounded-xl border border-border">
                {isLoading ? (
                  <div className="p-8 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المستخدم</TableHead>
                        <TableHead className="text-right">الأدوار</TableHead>
                        <TableHead className="text-right">الحجوزات</TableHead>
                        <TableHead className="text-right">تاريخ التسجيل</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback>{user.full_name?.[0] || "U"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.full_name || "بدون اسم"}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {user.roles.map((r) => (
                                <Badge key={r} variant="secondary" className={roleColors[r]}>
                                  {roleLabels[r]}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{user.bookings_count}</TableCell>
                          <TableCell>{format(new Date(user.created_at), "d MMM yyyy", { locale: ar })}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, "admin", user.roles.includes("admin"))}>
                                  <Shield className="h-4 w-4 ml-2" />
                                  {user.roles.includes("admin") ? "إزالة المدير" : "جعله مدير"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, "artist", user.roles.includes("artist"))}>
                                  <Palette className="h-4 w-4 ml-2" />
                                  {user.roles.includes("artist") ? "إزالة الفنانة" : "جعله فنانة"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>

            <TabsContent value="invitations" className="space-y-4">
              <div className="bg-card rounded-xl border border-border">
                {invitationsLoading ? (
                  <div className="p-8 space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
                ) : invitations?.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد دعوات</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">البريد الإلكتروني</TableHead>
                        <TableHead className="text-right">الدور</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">تاريخ الإرسال</TableHead>
                        <TableHead className="text-right">تنتهي في</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations?.map((invitation) => {
                        const status = getInvitationStatus(invitation);
                        const StatusIcon = status.icon;
                        return (
                          <TableRow key={invitation.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                {invitation.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={roleColors[invitation.role]}>
                                {roleLabels[invitation.role]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={status.color}>
                                <StatusIcon className="h-3 w-3 ml-1" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell>{format(new Date(invitation.created_at), "d MMM yyyy", { locale: ar })}</TableCell>
                            <TableCell>{format(new Date(invitation.expires_at), "d MMM yyyy", { locale: ar })}</TableCell>
                            <TableCell>
                              {!invitation.accepted_at && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteInvitation(invitation.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;
