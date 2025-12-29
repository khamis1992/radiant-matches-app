import { useState, useMemo } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

const AdminReviews = () => {
  const { t, isRTL, language } = useLanguage();
  const { reviews, isLoading, deleteReview, isDeleting } = useAdminReviews();
  const dateLocale = language === "ar" ? ar : enUS;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [artistFilter, setArtistFilter] = useState<string>("all");

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
      const matchesSearch =
        review.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.customer_profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.artist_profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRating = ratingFilter === "all" || review.rating === parseInt(ratingFilter);
      const matchesArtist = artistFilter === "all" || review.artist_id === artistFilter;
      return matchesSearch && matchesRating && matchesArtist;
    });
  }, [reviews, searchQuery, ratingFilter, artistFilter]);

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  );

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

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
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t.adminReviews.title}</h1>
                <p className="text-muted-foreground text-sm">
                  {reviews.length} {t.adminReviews.reviewCount} • {t.adminReviews.avgRating} {avgRating}
                </p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {t.adminReviews.searchAndFilter}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                  <Input
                    placeholder={t.adminReviews.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={isRTL ? "pr-10" : "pl-10"}
                  />
                </div>
                
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.adminReviews.rating} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.adminReviews.allRatings}</SelectItem>
                    <SelectItem value="5">5 {t.adminReviews.stars}</SelectItem>
                    <SelectItem value="4">4 {t.adminReviews.stars}</SelectItem>
                    <SelectItem value="3">3 {t.adminReviews.stars}</SelectItem>
                    <SelectItem value="2">2 {t.adminReviews.stars}</SelectItem>
                    <SelectItem value="1">1 {t.adminReviews.star}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={artistFilter} onValueChange={setArtistFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.adminReviews.artistFilter} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.adminReviews.allArtists}</SelectItem>
                    {uniqueArtists.map(([id, name]) => (
                      <SelectItem key={id} value={id}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {filteredReviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Star className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">{t.adminReviews.noReviews}</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    {searchQuery || ratingFilter !== "all" || artistFilter !== "all"
                      ? t.adminReviews.noResultsMessage
                      : t.adminReviews.reviewsWillAppear}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={isRTL ? "text-right" : "text-left"}>{t.adminReviews.customer}</TableHead>
                      <TableHead className={isRTL ? "text-right" : "text-left"}>{t.adminReviews.artist}</TableHead>
                      <TableHead className={cn("w-32", isRTL ? "text-right" : "text-left")}>{t.adminReviews.rating}</TableHead>
                      <TableHead className={isRTL ? "text-right" : "text-left"}>{t.adminReviews.comment}</TableHead>
                      <TableHead className={cn("w-40", isRTL ? "text-right" : "text-left")}>{t.adminReviews.date}</TableHead>
                      <TableHead className={cn("w-24", isRTL ? "text-right" : "text-left")}>{t.adminReviews.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={review.customer_profile?.avatar_url || ""} />
                              <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{review.customer_profile?.full_name || t.adminReviews.customer}</span>
                          </div>
                        </TableCell>
                        <TableCell>{review.artist_profile?.full_name || t.adminReviews.artist}</TableCell>
                        <TableCell>{renderStars(review.rating)}</TableCell>
                        <TableCell className="max-w-xs truncate">{review.comment || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(review.created_at), "dd MMM yyyy", { locale: dateLocale })}
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={isDeleting}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t.adminReviews.deleteConfirmTitle}</AlertDialogTitle>
                                <AlertDialogDescription>{t.adminReviews.deleteConfirmDesc}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteReview(review.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t.common.delete}
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
