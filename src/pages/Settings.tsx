import { useState } from "react";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { Bell, Lock, User, ChevronRight, Eye, EyeOff, Globe } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Language } from "@/lib/translations";

type PasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

const Settings = () => {
  const navigate = useNavigate();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { settings, isLoading, updateSettings } = useUserSettings();
  const { t, language, setLanguage, languageNames } = useLanguage();

  useSwipeBack();

  const passwordSchema = z.object({
    newPassword: z.string().min(6, t.settings.passwordMinLength),
    confirmPassword: z.string().min(6, t.settings.passwordMinLength),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t.settings.passwordsNoMatch,
    path: ["confirmPassword"],
  });

  type PasswordFormValues = z.infer<typeof passwordSchema>;

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmitPassword = async (values: PasswordFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t.settings.passwordUpdated);
        setPasswordDialogOpen(false);
        form.reset();
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-xl font-bold text-foreground">{t.settings.title}</h1>
          </div>
        </div>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Notifications Section */}
        <section className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{t.settings.notifications}</h2>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications" className="text-foreground font-medium">
                    {t.settings.pushNotifications}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t.settings.pushNotificationsDesc}
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.push_notifications}
                  onCheckedChange={(checked) => updateSettings({ push_notifications: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications" className="text-foreground font-medium">
                    {t.settings.emailNotifications}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t.settings.emailNotificationsDesc}
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => updateSettings({ email_notifications: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="booking-reminders" className="text-foreground font-medium">
                    {t.settings.bookingReminders}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t.settings.bookingRemindersDesc}
                  </p>
                </div>
                <Switch
                  id="booking-reminders"
                  checked={settings.booking_reminders}
                  onCheckedChange={(checked) => updateSettings({ booking_reminders: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="promotional-emails" className="text-foreground font-medium">
                    {t.settings.promotionalEmails}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t.settings.promotionalEmailsDesc}
                  </p>
                </div>
                <Switch
                  id="promotional-emails"
                  checked={settings.promotional_emails}
                  onCheckedChange={(checked) => updateSettings({ promotional_emails: checked })}
                />
              </div>
            </div>
          )}
        </section>

        {/* Privacy Section */}
        <section className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{t.settings.privacy}</h2>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="profile-visibility" className="text-foreground font-medium">
                    {t.settings.publicProfile}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t.settings.publicProfileDesc}
                  </p>
                </div>
                <Switch
                  id="profile-visibility"
                  checked={settings.profile_visibility}
                  onCheckedChange={(checked) => updateSettings({ profile_visibility: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="booking-history" className="text-foreground font-medium">
                    {t.settings.showBookingHistory}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t.settings.showBookingHistoryDesc}
                  </p>
                </div>
                <Switch
                  id="booking-history"
                  checked={settings.show_booking_history}
                  onCheckedChange={(checked) => updateSettings({ show_booking_history: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="data-analytics" className="text-foreground font-medium">
                    {t.settings.shareAnalytics}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t.settings.shareAnalyticsDesc}
                  </p>
                </div>
                <Switch
                  id="data-analytics"
                  checked={settings.share_data_analytics}
                  onCheckedChange={(checked) => updateSettings({ share_data_analytics: checked })}
                />
              </div>
            </div>
          )}
        </section>

        {/* Account Section */}
        <section className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center gap-3 p-5 pb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{t.settings.account}</h2>
          </div>
          
          <div className="px-5 pb-5 space-y-1">
            <button 
              onClick={() => setPasswordDialogOpen(true)}
              className="w-full flex items-center justify-between py-3 hover:bg-muted/50 transition-colors rounded-lg px-2 -mx-2"
            >
              <span className="text-foreground font-medium">{t.settings.changePassword}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            
            <Separator />
            
            <button className="w-full flex items-center justify-between py-3 hover:bg-muted/50 transition-colors rounded-lg px-2 -mx-2">
              <span className="text-foreground font-medium">{t.settings.linkedAccounts}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            
            <Separator />
            
            <div className="flex items-center justify-between py-3 px-2 -mx-2">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground font-medium">{t.settings.language}</span>
              </div>
              <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{languageNames.en}</SelectItem>
                  <SelectItem value="ar">{languageNames.ar}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <button className="w-full flex items-center justify-between py-3 hover:bg-destructive/10 transition-colors rounded-lg px-2 -mx-2">
              <span className="text-destructive font-medium">{t.settings.deleteAccount}</span>
              <ChevronRight className="w-5 h-5 text-destructive" />
            </button>
          </div>
        </section>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.settings.changePassword}</DialogTitle>
            <DialogDescription>
              {t.settings.enterNewPassword}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitPassword)} className="space-y-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.settings.newPassword}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.settings.confirmPassword}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setPasswordDialogOpen(false);
                    form.reset();
                  }}
                >
                  {t.common.cancel}
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? t.settings.updating : t.settings.updatePassword}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
};

export default Settings;
