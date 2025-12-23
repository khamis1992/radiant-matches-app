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
import { Search, Star } from "lucide-react";
import { toast } from "sonner";

const AdminArtists = () => {
  const { role, loading: roleLoading } = useUserRole();
  const [search, setSearch] = useState("");
  const { data: artists, isLoading } = useAdminArtists(search);
  const toggleAvailability = useToggleArtistAvailability();

  if (roleLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Skeleton className="h-8 w-32" /></div>;
  if (role !== "admin") return <Navigate to="/home" replace />;

  const handleToggle = async (artistId: string, currentState: boolean) => {
    try {
      await toggleAvailability.mutateAsync({ artistId, isAvailable: !currentState });
      toast.success(currentState ? "تم تعطيل الفنانة" : "تم تفعيل الفنانة");
    } catch { toast.error("حدث خطأ"); }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminSidebar />
      <main className="mr-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div><h1 className="text-3xl font-bold text-foreground">إدارة الفنانين</h1><p className="text-muted-foreground mt-1">{artists?.length || 0} فنانة</p></div>
            <div className="relative w-72"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="البحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" /></div>
          </div>
          <div className="bg-card rounded-xl border border-border">
            {isLoading ? <div className="p-8 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div> : (
              <Table>
                <TableHeader><TableRow><TableHead className="text-right">الفنانة</TableHead><TableHead className="text-right">التقييم</TableHead><TableHead className="text-right">الخدمات</TableHead><TableHead className="text-right">الحجوزات</TableHead><TableHead className="text-right">الأرباح</TableHead><TableHead className="text-right">الحالة</TableHead></TableRow></TableHeader>
                <TableBody>
                  {artists?.map((artist) => (
                    <TableRow key={artist.id}>
                      <TableCell><div className="flex items-center gap-3"><Avatar className="h-10 w-10"><AvatarImage src={artist.profile?.avatar_url || undefined} /><AvatarFallback>{artist.profile?.full_name?.[0] || "A"}</AvatarFallback></Avatar><div><p className="font-medium">{artist.profile?.full_name || "بدون اسم"}</p><p className="text-sm text-muted-foreground">{artist.profile?.email}</p></div></div></TableCell>
                      <TableCell><div className="flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /><span>{artist.rating?.toFixed(1) || "0.0"}</span><span className="text-muted-foreground text-sm">({artist.total_reviews || 0})</span></div></TableCell>
                      <TableCell>{artist.services_count}</TableCell>
                      <TableCell>{artist.bookings_count}</TableCell>
                      <TableCell>{artist.total_earnings.toFixed(0)} ر.ق</TableCell>
                      <TableCell><div className="flex items-center gap-2"><Switch checked={artist.is_available || false} onCheckedChange={() => handleToggle(artist.id, artist.is_available || false)} /><Badge variant={artist.is_available ? "default" : "secondary"}>{artist.is_available ? "متاحة" : "غير متاحة"}</Badge></div></TableCell>
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

export default AdminArtists;
