import { useState, useMemo } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAdminReviews } from "@/hooks/useAdminReviews";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Filter, Star, Trash2, User, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const AdminReviews = () => {
  const { reviews, isLoading, deleteReview, isDeleting } = useAdminReviews();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [artistFilter, setArtistFilter] = useState<string>("all");

  // Get unique artists for filter
  const uniqueArtists = useMemo(() => {
    const artists = new Map<string, string>();
    reviews.forEach((review) => {
      if (review.artist_profile?.full_name) {
        artists.set(review.artist_id, review.artist_profile.full_name);
      }
    });
    return Array.from(artists.entries());
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      // Search filter
      const matchesSearch =
        review.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.customer_profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.artist_profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Rating filter
      const matchesRating = ratingFilter === "all" || review.rating === parseInt(ratingFilter);
      
      // Artist filter
      const matchesArtist = artistFilter === "all" || review.artist_id === artistFilter;
      
      return matchesSearch && matchesRating && matchesArtist;
    });
  }, [reviews, searchQuery, ratingFilter, artistFilter]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

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
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">إدارة المراجعات</h1>
                <p className="text-muted-foreground text-sm">
                  {reviews.length} مراجعة • متوسط التقييم {avgRating}
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
                    placeholder="البحث في المراجعات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="التقييم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع التقييمات</SelectItem>
                    <SelectItem value="5">5 نجوم</SelectItem>
                    <SelectItem value="4">4 نجوم</SelectItem>
                    <SelectItem value="3">3 نجوم</SelectItem>
                    <SelectItem value="2">2 نجمتان</SelectItem>
                    <SelectItem value="1">نجمة واحدة</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={artistFilter} onValueChange={setArtistFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="الفنانة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفنانات</SelectItem>
                    {uniqueArtists.map(([id, name]) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Table */}
          <Card>
            <CardContent className="p-0">
              {filteredReviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Star className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">لا توجد مراجعات</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    {searchQuery || ratingFilter !== "all" || artistFilter !== "all"
                      ? "لا توجد نتائج تطابق معايير البحث"
                      : "ستظهر المراجعات هنا عند إضافتها"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">العميل</TableHead>
                      <TableHead className="text-right">الفنانة</TableHead>
                      <TableHead className="text-right w-32">التقييم</TableHead>
                      <TableHead className="text-right">التعليق</TableHead>
                      <TableHead className="text-right w-40">التاريخ</TableHead>
                      <TableHead className="text-right w-24">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={review.customer_profile?.avatar_url || ""} />
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {review.customer_profile?.full_name || "عميل"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {review.artist_profile?.full_name || "فنانة"}
                        </TableCell>
                        <TableCell>{renderStars(review.rating)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {review.comment || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(review.created_at), "dd MMM yyyy", {
                            locale: ar,
                          })}
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف المراجعة</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف هذه المراجعة؟ لا يمكن التراجع عن هذا الإجراء.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteReview(review.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminReviews;
