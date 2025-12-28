import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNavigation from "@/components/BottomNavigation";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Clock, X, Share2, ArrowRight, ArrowLeft, Calendar, Award, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatQAR } from "@/lib/locale";
import { useAuth } from "@/hooks/useAuth";
import artist1 from "@/assets/artist-1.jpg";
import { Separator } from "@/components/ui/separator";

const CompareArtists = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  
  const artistIds = searchParams.get("ids")?.split(",").filter(Boolean) || [];
  
  const [isMobileView, setIsMobileView] = useState(false);
  
  // تحديد وضع العرض بناءً على حجم الشاشة
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // جلب بيانات الفنانات
  const { data: artists, isLoading } = useQuery({
    queryKey: ["compare-artists", artistIds],
    queryFn: async () => {
      if (artistIds.length === 0 || artistIds.length > 3) return [];
      
      const { data: artists, error } = await supabase
        .from("artists")
        .select(`
          *,
          profile:profiles (
            id,
            full_name,
            avatar_url,
            location,
            bio
          )
        `)
        .in("id", artistIds);

      if (error) throw error;
      return artists || [];
    },
    enabled: artistIds.length > 0 && artistIds.length <= 3,
  });

  // حساب المسافة (تبسيط)
  const calculateDistance = (artistLocation?: string) => {
    // هنا يمكنك إضافة منطق حساب المسافة الحقيقي
    // حالياً سنرجع قيمة تقريبية
    if (!artistLocation) return t.compare.distanceUnknown;
    return "2.5 km"; // قيمة افتراضية
  };

  const handleRemoveArtist = (artistId: string) => {
    const newIds = artistIds.filter(id => id !== artistId);
    if (newIds.length > 0) {
      navigate(`/compare?ids=${newIds.join(",")}`, { replace: true });
    } else {
      navigate("/makeup-artists", { replace: true });
    }
  };

  const handleAddArtist = () => {
    navigate("/makeup-artists");
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: t.compare.shareTitle,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      // يمكن إضافة إشعار نجاح هنا
    }
  };

  const handleBookArtist = (artistId: string) => {
    navigate(`/booking/${artistId}`);
  };

  // حالة فارغة أو عدد الفنانات غير صحيح
  if (artistIds.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader title={t.compare.title} style="modern" />
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-2xl" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center">
              <Star className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            {t.compare.noArtists}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-sm">
            {t.compare.noArtistsDesc}
          </p>
          <Button 
            onClick={() => navigate("/makeup-artists")}
            className="shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
          >
            <Star className="w-4 h-4 mr-2" />
            {t.compare.browseArtists}
          </Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (artistIds.length > 3) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader title={t.compare.title} style="modern" />
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-red-500/5 rounded-full blur-2xl" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-full flex items-center justify-center">
              <X className="w-12 h-12 text-red-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            {t.compare.tooManyArtists}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-sm">
            {t.compare.tooManyArtistsDesc}
          </p>
          <Button 
            onClick={() => navigate("/makeup-artists")}
            className="shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all"
          >
            {t.compare.backToArtists}
          </Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // عرض الشاشة للتحميل
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader title={t.compare.title} style="modern" />
        <div className="px-5 py-6 space-y-4">
          {[1, 2, 3].slice(0, artistIds.length).map((i) => (
            <Card key={i} className="rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-20 w-20 rounded-full mx-auto" />
                  <Skeleton className="h-6 w-40 mx-auto" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </div>
                  <Skeleton className="h-24" />
                  <Skeleton className="h-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <AppHeader
        title={t.compare.title}
        style="modern"
        action={
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="hover:bg-primary/10"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        }
      />

      <div className="px-5 py-6">
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.common.back}
          </Button>
          <Button
            size="sm"
            onClick={handleAddArtist}
            className="shadow-lg shadow-primary/25"
          >
            <Star className="w-4 h-4 mr-2" />
            {t.compare.addArtist}
          </Button>
        </div>

        {/* Comparison Cards */}
        {isMobileView ? (
          // Mobile View: Stack cards vertically
          <div className="space-y-4">
            {artists?.map((artist, index) => (
              <Card key={artist.id} className="rounded-2xl overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Avatar className="w-20 h-20 mx-auto mb-3 ring-2 ring-primary/20">
                        <AvatarImage 
                          src={artist.profile?.avatar_url || artist1} 
                          alt={artist.profile?.full_name || "Artist"} 
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-xl">
                          {artist.profile?.full_name?.charAt(0) || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-lg font-bold text-foreground text-center mb-1">
                        {artist.profile?.full_name || t.artist.anonymous}
                      </h3>
                      {artist.profile?.location && (
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3 text-primary" />
                          <span>{artist.profile.location}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveArtist(artist.id)}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <Separator className="my-4" />

                  {/* Rating */}
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="flex items-center gap-0.5 bg-yellow-500/10 px-3 py-1.5 rounded-full">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-bold text-foreground">
                        {Number(artist.rating || 0).toFixed(1)}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({artist.total_reviews || 0} {t.artist.reviews})
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-primary/5 rounded-xl p-3">
                      <Clock className="w-5 h-5 text-primary mb-1" />
                      <p className="text-xs text-muted-foreground mb-0.5">{t.artist.experience}</p>
                      <p className="font-bold text-foreground">
                        {artist.experience_years || 0} {t.artist.yearsExperience}
                      </p>
                    </div>
                    <div className="bg-blue-500/5 rounded-xl p-3">
                      <MapPin className="w-5 h-5 text-blue-500 mb-1" />
                      <p className="text-xs text-muted-foreground mb-0.5">{t.compare.distance}</p>
                      <p className="font-bold text-foreground">
                        {calculateDistance(artist.profile?.location)}
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  {artist.profile?.bio && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {artist.profile.bio}
                      </p>
                    </div>
                  )}

                  {/* Services Preview */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-foreground mb-2">
                      {t.artist.services}:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {artist.specialties?.slice(0, 3).map((specialty, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {artist.specialties && artist.specialties.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{artist.specialties.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    className="w-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                    onClick={() => handleBookArtist(artist.id)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {t.compare.bookNow}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Desktop View: Side by side comparison
          <div className="overflow-x-auto -mx-5 px-5">
            <div className="flex gap-4 min-w-max">
              {artists?.map((artist, index) => (
                <Card key={artist.id} className="w-80 flex-shrink-0 rounded-2xl overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-all">
                  <CardContent className="p-6 h-full flex flex-col">
                    {/* Header with Remove Button */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 text-center">
                        <Avatar className="w-24 h-24 mx-auto mb-3 ring-3 ring-primary/20">
                          <AvatarImage 
                            src={artist.profile?.avatar_url || artist1} 
                            alt={artist.profile?.full_name || "Artist"} 
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-2xl">
                            {artist.profile?.full_name?.charAt(0) || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="text-xl font-bold text-foreground mb-1">
                          {artist.profile?.full_name || t.artist.anonymous}
                        </h3>
                        {artist.profile?.location && (
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>{artist.profile.location}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveArtist(artist.id)}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    <Separator className="my-4" />

                    {/* Rating */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <div className="flex items-center gap-0.5 bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 px-4 py-2 rounded-full border border-yellow-500/20">
                        <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                        <span className="text-xl font-bold text-foreground">
                          {Number(artist.rating || 0).toFixed(1)}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({artist.total_reviews || 0} {t.artist.reviews})
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/10">
                        <Clock className="w-6 h-6 text-primary mb-2" />
                        <p className="text-xs text-muted-foreground mb-1">{t.artist.experience}</p>
                        <p className="font-bold text-lg text-foreground">
                          {artist.experience_years || 0} {t.artist.yearsExperience}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl p-4 border border-blue-500/10">
                        <MapPin className="w-6 h-6 text-blue-500 mb-2" />
                        <p className="text-xs text-muted-foreground mb-1">{t.compare.distance}</p>
                        <p className="font-bold text-lg text-foreground">
                          {calculateDistance(artist.profile?.location)}
                        </p>
                      </div>
                    </div>

                    {/* Bio */}
                    {artist.profile?.bio && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground line-clamp-4 min-h-[80px]">
                          {artist.profile.bio}
                        </p>
                      </div>
                    )}

                    {/* Services */}
                    <div className="mb-4 flex-1">
                      <p className="text-sm font-semibold text-foreground mb-2">
                        {t.artist.services}:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {artist.specialties?.slice(0, 4).map((specialty, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                        {artist.specialties && artist.specialties.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{artist.specialties.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        className="w-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                        onClick={() => handleBookArtist(artist.id)}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {t.compare.bookNow}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/artist/${artist.id}`)}
                      >
                        {t.artist.viewProfile}
                        <ArrowRight className={`w-4 h-4 ml-2 ${isRTL ? "rotate-180" : ""}`} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Info Message */}
        <div className="mt-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              {t.compare.tipText}
            </p>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default CompareArtists;

