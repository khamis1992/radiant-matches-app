import { useMemo, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAdminArtists, useToggleArtistAvailability } from "@/hooks/useAdminArtists";
import {
  useClearFeaturedArtist,
  useFeaturedArtistSelection,
  useSetFeaturedArtist,
} from "@/hooks/useFeaturedArtistSelection";
import { useUserRole } from "@/hooks/useUserRole";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { Search, Star, UserPlus, Copy, Check, Link, Pin, CircleCheck, ShieldCheck, CircleAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Generate random token
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
  const { t, isRTL } = useLanguage();
  const [search, setSearch] = useState("");
  const { data: allArtists, isLoading } = useAdminArtists();
  const toggleAvailability = useToggleArtistAvailability();
  const { data: featuredSelection, isLoading: featuredSelectionLoading } = useFeaturedArtistSelection();
  const setFeaturedArtist = useSetFeaturedArtist();
  const clearFeaturedArtist = useClearFeaturedArtist();

  const artists = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return allArtists ?? [];

    return (allArtists ?? []).filter(
      (artist) =>
        artist.profile?.full_name?.toLowerCase().includes(normalizedSearch) ||
        artist.profile?.email?.toLowerCase().includes(normalizedSearch) ||
        artist.profile?.phone?.includes(search.trim()),
    );
  }, [allArtists, search]);

  const selectedArtist = allArtists?.find((artist) => artist.id === featuredSelection?.artist_id);
  const featuredMutationPending = setFeaturedArtist.isPending || clearFeaturedArtist.isPending;

  // Invitation dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [reviewingArtistId, setReviewingArtistId] = useState<string | null>(null);

  if (roleLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Skeleton className="h-8 w-32" /></div>;
  if (role !== "admin") return <Navigate to="/home" replace />;

  const handleToggle = async (artistId: string, currentState: boolean) => {
    try {
      if (currentState && featuredSelection?.artist_id === artistId) {
        await clearFeaturedArtist.mutateAsync();
      }
      await toggleAvailability.mutateAsync({ artistId, isAvailable: !currentState });
      toast.success(currentState ? t.adminArtists.artistDisabled : t.adminArtists.artistEnabled);
    } catch { toast.error(t.adminArtists.error); }
  };

  const handleSetFeatured = async (artistId: string) => {
    try {
      await setFeaturedArtist.mutateAsync(artistId);
      toast.success(t.adminArtists.featuredArtistUpdated);
    } catch {
      toast.error(t.adminArtists.featuredArtistError);
    }
  };

  const handleClearFeatured = async () => {
    try {
      await clearFeaturedArtist.mutateAsync();
      toast.success(t.adminArtists.featuredArtistRemoved);
    } catch {
      toast.error(t.adminArtists.featuredArtistError);
    }
  };

  const handleReviewArtist = async (artistId: string, status: "approved" | "pending_review") => {
    setReviewingArtistId(artistId);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("not_authenticated");
      const update = status === "approved"
        ? { onboarding_status: status, approved_at: new Date().toISOString(), approved_by: auth.user.id, onboarding_notes: null }
        : { onboarding_status: status, approved_at: null, approved_by: null };
      const { error } = await supabase.from("artists").update(update).eq("id", artistId);
      if (error) throw error;
      toast.success(status === "approved" ? (isRTL ? "تم اعتماد الفنانة" : "Artist approved") : (isRTL ? "أعيدت للمراجعة" : "Returned for review"));
      window.location.reload();
    } catch (error) {
      console.error("Artist review error", error);
      toast.error(isRTL ? "تعذر تحديث حالة المراجعة" : "Could not update review status");
    } finally {
      setReviewingArtistId(null);
    }
  };

  // Create invitation link
  const handleCreateInvitation = async () => {
    setInviteLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t.adminArtists.mustBeLoggedIn);
        return;
      }

      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days

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
      toast.success(t.adminArtists.invitationCreated);
    } catch (error) {
      console.error("Error creating invitation:", error);
      toast.error(t.adminArtists.invitationError);
    } finally {
      setInviteLoading(false);
    }
  };

  // Copy link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success(t.adminArtists.linkCopied);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t.adminArtists.copyFailed);
    }
  };

  // Reset dialog state
  const handleCloseDialog = () => {
    setInviteDialogOpen(false);
    setInviteName("");
    setGeneratedLink("");
    setCopied(false);
  };

  const textAlign = isRTL ? "text-right" : "text-left";
  const searchIconPos = isRTL ? "right-3" : "left-3";
  const inputPadding = isRTL ? "pr-10" : "pl-10";

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <AdminSidebar />
      <main className={`${isRTL ? "lg:mr-64" : "lg:ml-64"} p-4 pt-20 lg:p-8`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t.adminArtists.title}</h1>
              <p className="text-muted-foreground mt-1">{allArtists?.length || 0} {t.adminArtists.artistCount}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                {t.adminArtists.inviteNewArtist}
              </Button>
              <div className="relative w-72">
                <Search className={`absolute ${searchIconPos} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                <Input placeholder={t.adminArtists.search} value={search} onChange={(e) => setSearch(e.target.value)} className={inputPadding} />
              </div>
            </div>
          </div>
          <section className="mb-6 rounded-2xl border border-glam-border bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-glam-surface text-glam-rose">
                  <Pin className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-semibold text-glam-ink">{t.adminArtists.featuredArtist}</h2>
                  <p className="mt-1 text-sm text-glam-secondary">
                    {t.adminArtists.featuredArtistDescription}
                  </p>
                </div>
              </div>

              {featuredSelectionLoading ? (
                <Skeleton className="h-12 w-full rounded-xl sm:w-72" />
              ) : selectedArtist ? (
                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-glam-border bg-glam-porcelain p-2.5 sm:min-w-72">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={selectedArtist.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-glam-blush-soft text-glam-ink">
                      {selectedArtist.profile?.full_name?.[0] || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-glam-ink">
                      {selectedArtist.profile?.full_name || t.common.notAvailable}
                    </p>
                    <p className="text-xs text-glam-rose">{t.adminArtists.currentlyFeatured}</p>
                    {!selectedArtist.is_available && (
                      <p className="mt-0.5 text-xs text-glam-warning">
                        {t.adminArtists.featuredArtistUnavailable}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={featuredMutationPending}
                    onClick={handleClearFeatured}
                    className="shrink-0 border-glam-border text-glam-ink"
                  >
                    {t.adminArtists.removeFeatured}
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-glam-border bg-glam-porcelain px-4 py-3 text-sm text-glam-muted sm:min-w-72">
                  {t.adminArtists.noFeaturedArtist}
                </div>
              )}
            </div>
          </section>
          <div className="bg-card rounded-xl border border-border">
            {isLoading ? <div className="p-8 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={textAlign}>{t.adminArtists.artist}</TableHead>
                    <TableHead className={textAlign}>{t.adminArtists.rating}</TableHead>
                    <TableHead className={textAlign}>{t.adminArtists.services}</TableHead>
                    <TableHead className={textAlign}>{t.adminArtists.bookings}</TableHead>
                    <TableHead className={textAlign}>{t.adminArtists.earnings}</TableHead>
                    <TableHead className={textAlign}>{isRTL ? "الجاهزية" : "Readiness"}</TableHead>
                    <TableHead className={textAlign}>{t.adminArtists.featuredArtist}</TableHead>
                    <TableHead className={textAlign}>{t.adminArtists.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {artists.map((artist) => (
                    <TableRow key={artist.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={artist.profile?.avatar_url || undefined} />
                            <AvatarFallback>{artist.profile?.full_name?.[0] || "A"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{artist.profile?.full_name || t.common.notAvailable}</p>
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
                      <TableCell>{artist.total_earnings.toFixed(0)} QAR</TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-2">
                          <Badge variant={artist.onboarding_status === "approved" ? "default" : "secondary"} className="gap-1">
                            {artist.onboarding_status === "approved" ? <ShieldCheck className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}
                            {artist.onboarding_status === "approved" ? (isRTL ? "معتمدة" : "Approved") : (isRTL ? "قيد المراجعة" : "Review")}
                          </Badge>
                          <Button
                            size="sm"
                            variant={artist.onboarding_status === "approved" ? "outline" : "default"}
                            disabled={reviewingArtistId === artist.id}
                            onClick={() => handleReviewArtist(artist.id, artist.onboarding_status === "approved" ? "pending_review" : "approved")}
                          >
                            {artist.onboarding_status === "approved" ? (isRTL ? "إعادة للمراجعة" : "Review again") : (isRTL ? "اعتماد" : "Approve")}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {featuredSelection?.artist_id === artist.id ? (
                          <div className="inline-flex min-h-10 items-center gap-2 rounded-full bg-glam-blush-soft px-3 text-xs font-semibold text-glam-ink">
                            <CircleCheck className="h-4 w-4 text-glam-rose" aria-hidden="true" />
                            {t.adminArtists.currentlyFeatured}
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!artist.is_available || featuredMutationPending}
                            onClick={() => handleSetFeatured(artist.id)}
                            className="min-h-10 border-glam-border text-glam-ink hover:border-glam-rose hover:bg-glam-porcelain"
                          >
                            <Pin className="h-4 w-4" aria-hidden="true" />
                            {artist.is_available ? t.adminArtists.setFeatured : t.adminArtists.enableToFeature}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={artist.is_available || false} 
                            onCheckedChange={() => handleToggle(artist.id, artist.is_available || false)} 
                          />
                          <Badge variant={artist.is_available ? "default" : "secondary"}>
                            {artist.is_available ? t.adminArtists.available : t.adminArtists.unavailable}
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

      {/* Invite New Artist Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t.adminArtists.inviteDialogTitle}
            </DialogTitle>
            <DialogDescription>
              {t.adminArtists.inviteDialogDesc}
            </DialogDescription>
          </DialogHeader>

          {!generatedLink ? (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="invite-name">{t.adminArtists.artistNameOptional}</Label>
                <Input
                  id="invite-name"
                  placeholder={t.adminArtists.artistNamePlaceholder}
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleCreateInvitation} 
                disabled={inviteLoading}
                className="w-full"
              >
                {inviteLoading ? t.adminArtists.creating : t.adminArtists.createInvitationLink}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link className="h-4 w-4" />
                  <span>{t.adminArtists.invitationLinkReady}</span>
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
                  ⏰ {t.adminArtists.validFor7Days}
                </p>
              </div>
              <Button variant="outline" onClick={handleCloseDialog} className="w-full">
                {t.adminArtists.close}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminArtists;
