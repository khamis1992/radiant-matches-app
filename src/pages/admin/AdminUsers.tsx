import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAdminUsers, useUpdateUserRole } from "@/hooks/useAdminUsers";
import { useUserRole } from "@/hooks/useUserRole";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { Search, MoreVertical, Shield, Palette, Key, Eye, EyeOff, Trash2, UserPlus, Mail } from "lucide-react";
import { sendEmail } from "@/lib/email";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const roleColors: Record<string, string> = { admin: "bg-purple-100 text-purple-800", artist: "bg-pink-100 text-pink-800", customer: "bg-blue-100 text-blue-800" };

const AdminUsers = () => {
  const { role, loading: roleLoading } = useUserRole();
  const { t, isRTL, language } = useLanguage();
  const [search, setSearch] = useState("");
  const { data: users, isLoading } = useAdminUsers(search);
  const updateRole = useUpdateUserRole();
  const queryClient = useQueryClient();
  const dateLocale = language === "ar" ? ar : enUS;
  
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
  const [sendingEmailUserId, setSendingEmailUserId] = useState<string | null>(null);
  
  // New user form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState<string>("customer");
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  if (roleLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Skeleton className="h-8 w-32" /></div>;
  if (role !== "admin") return <Navigate to="/home" replace />;

  const roleLabels: Record<string, string> = { 
    admin: t.adminUsers.admin, 
    artist: t.adminUsers.artist, 
    customer: t.adminUsers.customer 
  };

  const handleRoleChange = async (userId: string, targetRole: "admin" | "artist" | "customer") => {
    try {
      await updateRole.mutateAsync({ userId, role: targetRole });
      toast.success(`${t.adminUsers.roleChanged} ${roleLabels[targetRole]}`);
    } catch (error: any) {
      toast.error(error?.message || t.adminUsers.error);
    }
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

      toast.success(t.adminUsers.userDeleted);
      setDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error: any) {
      toast.error(error.message || t.adminUsers.error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!selectedUser) return;
    
    if (newPassword.length < 6) {
      toast.error(t.adminUsers.passwordMinError);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error(t.adminUsers.passwordMismatch);
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

      toast.success(t.adminUsers.passwordChanged);
      setPasswordDialog(false);
    } catch (error: any) {
      toast.error(error.message || t.adminUsers.error);
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
      toast.error(t.adminUsers.emailRequired);
      return;
    }

    if (newUserPassword.length < 6) {
      toast.error(t.adminUsers.passwordMin);
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

      toast.success(t.adminUsers.userCreated);
      setAddUserDialog(false);
      resetAddUserForm();
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error: any) {
      toast.error(error.message || t.adminUsers.error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <AdminSidebar />
      <main className={cn("p-8", isRTL ? "mr-64" : "ml-64")}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div><h1 className="text-3xl font-bold text-foreground">{t.adminUsers.title}</h1><p className="text-muted-foreground mt-1">{users?.length || 0} {t.adminUsers.userCount}</p></div>
            <div className="flex items-center gap-4">
              <div className="relative w-72"><Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} /><Input placeholder={t.adminUsers.search} value={search} onChange={(e) => setSearch(e.target.value)} className={isRTL ? "pr-10" : "pl-10"} /></div>
              <Button onClick={() => setAddUserDialog(true)}><UserPlus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />{t.adminUsers.addUser}</Button>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border">
            {isLoading ? <div className="p-8 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div> : (
              <Table>
                <TableHeader><TableRow><TableHead className={isRTL ? "text-right" : "text-left"}>{t.adminUsers.user}</TableHead><TableHead className={isRTL ? "text-right" : "text-left"}>{t.adminUsers.roles}</TableHead><TableHead className={isRTL ? "text-right" : "text-left"}>{t.adminUsers.bookings}</TableHead><TableHead className={isRTL ? "text-right" : "text-left"}>{t.adminUsers.registrationDate}</TableHead><TableHead className={isRTL ? "text-right" : "text-left"}>{t.adminUsers.actions}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell><div className="flex items-center gap-3"><Avatar className="h-10 w-10"><AvatarImage src={user.avatar_url || undefined} /><AvatarFallback>{user.full_name?.[0] || "U"}</AvatarFallback></Avatar><div><p className="font-medium">{user.full_name || t.adminUsers.noName}</p><p className="text-sm text-muted-foreground">{user.email}</p></div></div></TableCell>
                      <TableCell><div className="flex gap-1 flex-wrap">{user.roles.map((r) => <Badge key={r} variant="secondary" className={roleColors[r]}>{roleLabels[r]}</Badge>)}</div></TableCell>
                      <TableCell>{user.bookings_count}</TableCell>
                      <TableCell>{format(new Date(user.created_at), "d MMM yyyy", { locale: dateLocale })}</TableCell>
                      <TableCell>
                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, "admin")} disabled={user.roles.includes("admin")}><Shield className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />{t.adminUsers.makeAdmin}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, "artist")} disabled={user.roles.includes("artist")}><Palette className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />{t.adminUsers.makeArtist}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, "customer")} disabled={user.roles.includes("customer")}><Shield className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />{t.adminUsers.makeCustomer}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openPasswordDialog(user.id, user.full_name || user.email || t.adminUsers.user)}><Key className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />{t.adminUsers.changePassword}</DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={async () => {
                                if (!user.email) return;
                                setSendingEmailUserId(user.id);
                                try {
                                  const result = await sendEmail({ type: 'welcome', to: user.email, data: { name: user.full_name || '' } });
                                  if (result.success) {
                                    toast.success(t.adminUsers.welcomeEmailSent);
                                  } else {
                                    toast.error(t.adminUsers.welcomeEmailError);
                                  }
                                } catch {
                                  toast.error(t.adminUsers.welcomeEmailError);
                                } finally {
                                  setSendingEmailUserId(null);
                                }
                              }}
                              disabled={sendingEmailUserId === user.id || !user.email}
                            >
                              <Mail className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                              {sendingEmailUserId === user.id ? t.adminUsers.sendingEmail : t.adminUsers.sendWelcomeEmail}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteDialog(user.id, user.full_name || user.email || t.adminUsers.user)} className="text-destructive focus:text-destructive"><Trash2 className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />{t.adminUsers.deleteUser}</DropdownMenuItem>
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
        <DialogContent className="sm:max-w-md" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t.adminUsers.changePasswordTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {t.adminUsers.changePasswordFor} <span className="font-medium text-foreground">{selectedUser?.name}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="new-password">{t.adminUsers.newPassword}</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={isRTL ? "pr-10" : "pl-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground", isRTL ? "right-3" : "left-3")}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t.adminUsers.confirmPassword}</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPasswordDialog(false)}>{t.adminUsers.cancel}</Button>
            <Button onClick={handlePasswordChange} disabled={isUpdating}>
              {isUpdating ? t.adminUsers.updating : t.adminUsers.changePassword}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.adminUsers.confirmDeleteUser}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.adminUsers.deleteUserConfirmation} <span className="font-medium">{selectedUser?.name}</span>?
              <br />
              {t.adminUsers.deleteWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>{t.adminUsers.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t.adminUsers.deleting : t.adminUsers.deleteUser}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={addUserDialog} onOpenChange={(open) => { setAddUserDialog(open); if (!open) resetAddUserForm(); }}>
        <DialogContent className="sm:max-w-md" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t.adminUsers.addNewUser}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">{t.adminUsers.fullName}</Label>
              <Input
                id="user-name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">{t.adminUsers.email} *</Label>
              <Input
                id="user-email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="example@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-phone">{t.adminUsers.phone}</Label>
              <Input
                id="user-phone"
                type="tel"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
                placeholder="05xxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">{t.adminUsers.password} *</Label>
              <div className="relative">
                <Input
                  id="user-password"
                  type={showNewUserPassword ? "text" : "password"}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className={isRTL ? "pr-10" : "pl-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                  className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground", isRTL ? "right-3" : "left-3")}
                >
                  {showNewUserPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.adminUsers.role}</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">{t.adminUsers.customer}</SelectItem>
                  <SelectItem value="artist">{t.adminUsers.artist}</SelectItem>
                  <SelectItem value="admin">{t.adminUsers.admin}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddUserDialog(false)}>{t.adminUsers.cancel}</Button>
            <Button onClick={handleCreateUser} disabled={isCreating}>
              {isCreating ? t.adminUsers.creating : t.adminUsers.addUser}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
