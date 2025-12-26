import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAdminArtists, useToggleArtistAvailability } from "@/hooks/useAdminArtists";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Star, UserPlus, Copy, Check, Link } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// دالة إنشاء token عشوائي
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const randomValues = new Uint8Array(32);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 32; i++) {
    token += chars[randomValues[i] % chars.length];
  }
  return token;
}

const AdminArtists = () => {
  const { role, loading: roleLoading } = useUserRole();
  const [search, setSearch] = useState("");
  const { data: artists, isLoading } = useAdminArtists(search);
  const toggleAvailability = useToggleArtistAvailability();

  // حالة Dialog الدعوة
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  if (roleLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Skeleton className="h-8 w-32" /></div>;
  if (role !== "admin") return <Navigate to="/home" replace />;

  const handleToggle = async (artistId: string, currentState: boolean) => {
    try {
      await toggleAvailability.mutateAsync({ artistId, isAvailable: !currentState });
      toast.success(currentState ? "تم تعطيل الفنانة" : "تم تفعيل الفنانة");
    } catch { toast.error("حدث خطأ"); }
  };

  // إنشاء رابط دعوة جديد - مباشرة في الـ database
  const handleCreateInvitation = async () => {
    setInviteLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("يجب تسجيل الدخول");
        return;
      }

      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // صالحة لمدة 7 أيام

      const { error } = await supabase
        .from("artist_invitations")
        .insert({
          token,
          full_name: inviteName || null,
          created_by: user.id,
          expires_at: expiresAt.toISOString(),
        });

      if (error) {
        console.error("Error creating invitation:", error);
        throw new Error(error.message);
      }

      const link = `${window.location.origin}/artist-signup/${token}`;
      setGeneratedLink(link);
      toast.success("تم إنشاء رابط الدعوة بنجاح");
    } catch (error) {
      console.error("Error creating invitation:", error);
      toast.error("حدث خطأ أثناء إنشاء الدعوة");
    } finally {
      setInviteLoading(false);
    }
  };

  // نسخ الرابط
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success("تم نسخ الرابط");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("فشل في نسخ الرابط");
    }
  };

  // إعادة تعيين حالة Dialog
  const handleCloseDialog = () => {
    setInviteDialogOpen(false);
    setInviteName("");
    setGeneratedLink("");
    setCopied(false);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminSidebar />
      <main className="mr-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">إدارة الفنانين</h1>
              <p className="text-muted-foreground mt-1">{artists?.length || 0} فنانة</p>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                دعوة فنانة جديدة
              </Button>
              <div className="relative w-72">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="البحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border">
            {isLoading ? <div className="p-8 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الفنانة</TableHead>
                    <TableHead className="text-right">التقييم</TableHead>
                    <TableHead className="text-right">الخدمات</TableHead>
                    <TableHead className="text-right">الحجوزات</TableHead>
                    <TableHead className="text-right">الأرباح</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {artists?.map((artist) => (
                    <TableRow key={artist.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={artist.profile?.avatar_url || undefined} />
                            <AvatarFallback>{artist.profile?.full_name?.[0] || "A"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{artist.profile?.full_name || "بدون اسم"}</p>
                            <p className="text-sm text-muted-foreground">{artist.profile?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{artist.rating?.toFixed(1) || "0.0"}</span>
                          <span className="text-muted-foreground text-sm">({artist.total_reviews || 0})</span>
                        </div>
                      </TableCell>
                      <TableCell>{artist.services_count}</TableCell>
                      <TableCell>{artist.bookings_count}</TableCell>
                      <TableCell>{artist.total_earnings.toFixed(0)} ر.ق</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={artist.is_available || false} 
                            onCheckedChange={() => handleToggle(artist.id, artist.is_available || false)} 
                          />
                          <Badge variant={artist.is_available ? "default" : "secondary"}>
                            {artist.is_available ? "متاحة" : "غير متاحة"}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </main>

      {/* Dialog دعوة فنانة جديدة */}
      <Dialog open={inviteDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              دعوة فنانة جديدة
            </DialogTitle>
            <DialogDescription>
              أنشئ رابط دعوة وأرسله للفنانة لإنشاء حسابها
            </DialogDescription>
          </DialogHeader>

          {!generatedLink ? (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="invite-name">اسم الفنانة (اختياري)</Label>
                <Input
                  id="invite-name"
                  placeholder="اسم الفنانة للمتابعة"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleCreateInvitation} 
                disabled={inviteLoading}
                className="w-full"
              >
                {inviteLoading ? "جاري الإنشاء..." : "إنشاء رابط الدعوة"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                سيتم إنشاء رابط يمكنك إرساله للفنانة عبر واتساب أو أي وسيلة أخرى
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link className="h-4 w-4" />
                  <span>رابط التسجيل:</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    value={generatedLink} 
                    readOnly 
                    className="text-sm" 
                    dir="ltr"
                  />
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={handleCopyLink}
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  ⏰ صالح لمدة 7 أيام
                </p>
              </div>
              <Button variant="outline" onClick={handleCloseDialog} className="w-full">
                إغلاق
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminArtists;
