import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, Sparkles, AlertCircle, CheckCircle } from "lucide-react";
import logo from "@/assets/logo.png";
import { z } from "zod";

interface InvitationData {
  id: string;
  full_name: string | null;
  expires_at: string;
  used_at: string | null;
}

const ArtistSignup = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { t, isRTL } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});

  const emailSchema = z.string().email(t.artistSignup.invalidEmail);
  const passwordSchema = z.string().min(6, t.artistSignup.passwordMin);

  // Check invitation validity
  useEffect(() => {
    const checkInvitation = async () => {
      if (!token) {
        setError(t.artistSignup.invalidLink);
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("artist_invitations")
          .select("id, full_name, expires_at, used_at")
          .eq("token", token)
          .single();

        if (fetchError || !data) {
          setError(t.artistSignup.invalidLink);
          setLoading(false);
          return;
        }

        // Check expiration
        if (new Date(data.expires_at) < new Date()) {
          setError(t.artistSignup.linkExpired);
          setLoading(false);
          return;
        }

        // Check previous usage
        if (data.used_at) {
          setError(t.artistSignup.linkUsed);
          setLoading(false);
          return;
        }

        setInvitation(data);
        setFullName(data.full_name || "");
        setLoading(false);
      } catch {
        setError(t.artistSignup.errorCheckingInvitation);
        setLoading(false);
      }
    };

    checkInvitation();
  }, [token, t.artistSignup]);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string; fullName?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (!fullName.trim()) {
      newErrors.fullName = t.artistSignup.fullNameRequired;
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !invitation) return;
    
    setSubmitting(true);

    try {
      // Create account
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/artist-dashboard`,
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (signupError) {
        if (signupError.message.includes("User already registered")) {
          toast.error(t.artistSignup.accountExists);
        } else {
          toast.error(signupError.message);
        }
        return;
      }

      if (!authData.user) {
        toast.error(t.artistSignup.errorCreatingAccount);
        return;
      }

      // Call edge function to complete artist signup
      const { data: completeData, error: completeError } = await supabase.functions.invoke(
        "complete-artist-signup",
        {
          body: {
            invitationId: invitation.id,
            userId: authData.user.id,
          },
        }
      );

      if (completeError) {
        console.error("Error completing artist signup:", completeError);
        toast.error(t.artistSignup.errorCompletingSignup);
        return;
      }

      if (!completeData?.success) {
        console.error("Artist signup failed:", completeData?.error);
        toast.error(completeData?.error || t.artistSignup.errorCompletingSignup);
        return;
      }

      toast.success(t.artistSignup.accountCreatedSuccess);
      navigate("/auth", { replace: true });
      
    } catch (error) {
      console.error("Signup error:", error);
      toast.error(t.artistSignup.errorCreatingAccount);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center" dir={isRTL ? "rtl" : "ltr"}>
        <div className="text-center space-y-4">
          <Skeleton className="w-24 h-24 rounded-full mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center p-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="bg-card rounded-3xl shadow-2xl p-8 max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{t.artistSignup.invalidLink}</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={() => navigate("/")} variant="outline" className="w-full">
            {t.artistSignup.backToHome}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex flex-col relative overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* Decorative shapes */}
      <div className="absolute w-64 h-64 bg-primary/30 -top-20 -start-20 blur-3xl rounded-full opacity-20" />
      <div className="absolute w-96 h-96 bg-accent/40 -bottom-32 -end-32 blur-3xl rounded-full opacity-20" />

      <div className="flex-1 flex flex-col justify-center px-6 py-12 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-card shadow-xl mb-6 overflow-hidden border-2 border-primary/20">
            <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-3">{t.artistSignup.welcome}</h1>
          <p className="text-muted-foreground max-w-xs mx-auto">
            {t.artistSignup.createAccount}
          </p>
        </div>

        {/* Invitation details */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 max-w-md mx-auto w-full mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">{t.artistSignup.validInvitation}</p>
              <p className="text-xs text-green-600">{t.artistSignup.invitedAsArtist}</p>
            </div>
          </div>
        </div>

        {/* Signup form */}
        <div className="bg-card/90 backdrop-blur-md rounded-3xl shadow-2xl p-6 max-w-md mx-auto w-full border border-border/50">
          <form onSubmit={handleSignup} className="space-y-5">
            {/* Full name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">{t.artistSignup.fullName}</Label>
              <div className="relative">
                <User className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder={t.artistSignup.fullNamePlaceholder}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="ps-12 h-14 rounded-xl border-2"
                />
              </div>
              {formErrors.fullName && (
                <p className="text-sm text-destructive">⚠️ {formErrors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">{t.artistSignup.email}</Label>
              <div className="relative">
                <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t.artistSignup.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ps-12 h-14 rounded-xl border-2"
                  dir="ltr"
                />
              </div>
              {formErrors.email && (
                <p className="text-sm text-destructive">⚠️ {formErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">{t.artistSignup.password}</Label>
              <div className="relative">
                <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t.artistSignup.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ps-12 pe-12 h-14 rounded-xl border-2"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-sm text-destructive">⚠️ {formErrors.password}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg" 
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  {t.artistSignup.creatingAccount}
                </span>
              ) : (
                <>
                  {t.artistSignup.createAccountBtn}
                  <Sparkles className={`w-5 h-5 ${isRTL ? "me-2" : "ms-2"}`} />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/50">
            <p className="text-center text-sm text-muted-foreground">
              {t.artistSignup.alreadyHaveAccount}{" "}
              <button
                type="button"
                onClick={() => navigate("/auth")}
                className="text-primary font-semibold hover:underline"
              >
                {t.artistSignup.signIn}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistSignup;
