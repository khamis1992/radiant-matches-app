import { useState, useEffect, useRef } from "react";
import { sendEmail } from "@/lib/email";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Fingerprint, ShieldCheck, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { checkBlockedIp } from "@/hooks/useBlockedIps";

// Auth page modes: credentials, reset, and OTP verification
type AuthMode = "login" | "signup" | "forgot-password" | "verify-email";

type RoleRedirectResult = {
  path: string;
  role: "admin" | "artist" | "customer" | "seller";
  userName: string | null;
};

const getRedirectInfo = async (userId: string): Promise<RoleRedirectResult> => {
  try {
    const [rolesResult, profileResult] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("full_name").eq("id", userId).single()
    ]);

    const roles = (rolesResult.data || []).map((r) => r.role);
    const userName = profileResult.data?.full_name || null;

    if (roles.includes("admin")) return { path: "/admin", role: "admin", userName };
    if (roles.includes("artist")) return { path: "/artist-dashboard", role: "artist", userName };
    if (roles.includes("seller")) return { path: "/seller-dashboard", role: "seller", userName };
    return { path: "/home", role: "customer", userName };
  } catch {
    return { path: "/home", role: "customer", userName: null };
  }
};

const getWelcomeMessage = (role: "admin" | "artist" | "customer" | "seller", userName: string | null, language: "en" | "ar") => {
  const name = userName?.split(" ")[0];

  if (language === "ar") {
    if (name) {
      switch (role) {
        case "admin": return `مرحباً ${name} في لوحة الإدارة!`;
        case "artist": return `مرحباً بك يا ${name}!`;
        default: return `مرحباً بعودتك يا ${name}!`;
      }
    }
    switch (role) {
      case "admin": return "مرحباً بك في لوحة الإدارة!";
      case "artist": return "مرحباً بك في لوحة التحكم يا فنانة!";
      default: return "مرحباً بعودتك!";
    }
  }

  if (name) {
    switch (role) {
      case "admin": return `Welcome ${name} to the Admin Dashboard!`;
      case "artist": return `Welcome back, ${name}!`;
      default: return `Welcome back, ${name}!`;
    }
  }
  switch (role) {
    case "admin": return "Welcome to the Admin Dashboard!";
    case "artist": return "Welcome to your Artist Dashboard!";
    default: return "Welcome back!";
  }
};

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, isRTL } = useLanguage();
  const isAr = language === "ar";

  // Get redirect path from location state (saved when user tried to access protected page)
  const redirectPath = (location.state as { from?: string })?.from;
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [signupEmail, setSignupEmail] = useState("");
  const [signupName, setSignupName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const pendingOtpRef = useRef(false); // Prevents auto-redirect during OTP flow

  const { isSupported: biometricSupported, authenticate: biometricAuth, hasBiometricForEmail, isLoading: biometricLoading } = useBiometricAuth();

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const emailSchema = z.string().email(isAr ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email address");
  const passwordSchema = z.string().min(6, t.settings.passwordMinLength);

  useEffect(() => {
    const redirectUser = async (userId: string, showToast = false) => {
      // If there's a saved redirect path, use it
      if (redirectPath) {
        if (showToast) {
          toast.success(isAr ? "تم تسجيل الدخول بنجاح!" : "Logged in successfully!");
        }
        navigate(redirectPath, { replace: true });
        return;
      }

      // Otherwise, redirect based on role
      const { path, role, userName } = await getRedirectInfo(userId);
      if (showToast) {
        toast.success(getWelcomeMessage(role, userName, language));
      }
      navigate(path, { replace: true });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && !pendingOtpRef.current) {
        const showWelcome = event === "SIGNED_IN";
        setTimeout(() => {
          redirectUser(session.user.id, showWelcome);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        redirectUser(session.user.id, false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, language, redirectPath, isAr]);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string; fullName?: string } = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    if (mode !== "forgot-password") {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }

    if (mode === "signup" && !fullName.trim()) {
      newErrors.fullName = isAr ? "الاسم الكامل مطلوب" : "Full name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.errors[0].message });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(isAr ? "تم إرسال رابط إعادة التعيين! تحققي من بريدك." : "Password reset email sent! Check your inbox.");
      setMode("login");
      setEmail("");
    } catch {
      toast.error(t.errors.somethingWrong);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricSupported) return;

    const savedEmail = localStorage.getItem("remembered_email");
    if (!savedEmail || !hasBiometricForEmail(savedEmail)) {
      toast.error(isAr ? "لم يتم تفعيل البصمة لهذا الحساب" : "Biometric not enabled for this account");
      return;
    }

    const result = await biometricAuth(savedEmail);
    if (result.success && result.email) {
      // Biometric verified - use existing session (Supabase persists sessions)
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        toast.success(isAr ? "تم تسجيل الدخول بنجاح" : "Logged in successfully");
      } else {
        toast.error(isAr ? "يرجى تسجيل الدخول بالبريد وكلمة المرور أولاً" : "Please login with email and password first");
      }
    } else {
      toast.error(isAr ? "فشل التحقق من البصمة" : "Biometric verification failed");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Check if IP is blocked
      const ipCheck = await checkBlockedIp();
      if (ipCheck.blocked) {
        toast.error(isAr ? "تم حظر هذا الجهاز من التسجيل. تواصل مع الدعم." : "This device has been blocked. Contact support.");
        setLoading(false);
        return;
      }

      // Restrict signup to Qatar only
      if (mode === "signup" && ipCheck.country_code && ipCheck.country_code !== "QA") {
        toast.error(isAr ? "التسجيل متاح فقط من داخل قطر" : "Registration is only available from Qatar");
        setLoading(false);
        return;
      }

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error(isAr ? "بريد إلكتروني أو كلمة مرور غير صحيحة" : "Invalid email or password");
          } else {
            toast.error(error.message);
          }
          return;
        }

        // Save user IP and log login event
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user?.id) {
          supabase.functions.invoke("check-blocked-ip", {
            body: { userId: sessionData.session.user.id, eventType: "login" },
          }).catch(() => {});
        }

        // Save email if remember me is checked (never store passwords)
        if (rememberMe) {
          localStorage.setItem("remembered_email", email.trim());
        } else {
          localStorage.removeItem("remembered_email");
        }
      } else {
        // Set pendingOtp BEFORE signUp so onAuthStateChange won't redirect
        pendingOtpRef.current = true;
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          pendingOtpRef.current = false; // Reset on error
          if (error.message.includes("User already registered")) {
            toast.error(isAr ? "يوجد حساب بهذا البريد بالفعل. يرجى تسجيل الدخول." : "An account with this email already exists. Please sign in.");
          } else {
            toast.error(error.message);
          }
          return;
        }

        if (data.user && data.session) {
          // Auto-confirmed — send OTP for custom verification
          setSignupEmail(email.trim());
          setSignupName(fullName.trim());
          setMode("verify-email");
          // Log signup to security audit
          supabase.functions.invoke("check-blocked-ip", {
            body: { userId: data.user.id, eventType: "signup", email: email.trim(), fullName: fullName.trim() },
          }).catch(() => {});
          // Send OTP
          supabase.functions.invoke("send-verification-otp", {
            body: { email: email.trim(), name: fullName.trim() },
          });
          setOtpCooldown(60);
          setEmail("");
          setPassword("");
          setFullName("");
        } else if (data.user && !data.session) {
          // Fallback if auto-confirm is off
          // NOTE: welcome email is sent after OTP verification (authenticated),
          // not here — the send-email function requires a valid session.
          setSignupEmail(email.trim());
          setSignupName(fullName.trim());
          setMode("verify-email");
          setEmail("");
          setPassword("");
          setFullName("");
        }
      }
    } catch {
      toast.error(t.errors.somethingWrong);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
  };

  const handleResendOTP = async () => {
    if (!signupEmail || otpCooldown > 0) return;

    setOtpLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-verification-otp", {
        body: { email: signupEmail, name: signupName },
      });

      if (error) {
        toast.error(isAr ? "فشل في إعادة إرسال الرمز" : "Failed to resend OTP");
      } else {
        toast.success(isAr ? "تم إرسال رمز جديد!" : "New OTP sent!");
        setOtpCooldown(60);
      }
    } catch {
      toast.error(isAr ? "فشل في إعادة إرسال الرمز" : "Failed to resend OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpValue.length !== 6) return;

    setOtpLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-email-otp", {
        body: { otp: otpValue },
      });

      if (error || !data?.verified) {
        toast.error(isAr ? "رمز غير صحيح أو منتهي الصلاحية" : "Invalid or expired OTP");
        setOtpValue("");
        return;
      }

      toast.success(isAr ? "تم التحقق بنجاح! 🎉" : "Email verified! 🎉");
      // Send welcome email after verification
      sendEmail({
        type: "welcome",
        to: signupEmail,
        data: { name: signupName },
      });
      // Redirect to home
      const { path, role, userName } = await getRedirectInfo((await supabase.auth.getUser()).data.user!.id);
      toast.success(getWelcomeMessage(role, userName, language));
      navigate(path, { replace: true });
    } catch {
      toast.error(isAr ? "حدث خطأ أثناء التحقق" : "Verification error");
    } finally {
      setOtpLoading(false);
    }
  };

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const inputClasses =
    "ps-12 h-14 rounded-2xl border-border/60 bg-muted/40 transition-all focus-visible:bg-card focus-visible:border-glam-blush-deep focus-visible:ring-2 focus-visible:ring-glam-blush-soft";

  const primaryButtonClasses = cn(
    "w-full h-14 rounded-2xl text-base font-semibold transition-all duration-200",
    "bg-glam-ink hover:bg-glam-ink-pressed text-white",
    "active:scale-[0.98] shadow-md shadow-black/15"
  );

  const modeTitle =
    mode === "login"
      ? isAr ? "مرحباً بعودتك" : "Welcome Back"
      : mode === "signup"
        ? isAr ? "انضمي إلينا" : "Join Us"
        : mode === "forgot-password"
          ? isAr ? "استعادة الحساب" : "Reset Password"
          : t.auth.verifyEmail;

  const modeSubtitle =
    mode === "login"
      ? isAr ? "سعداء برؤيتك مجددًا" : "Happy to see you again"
      : mode === "signup"
        ? isAr ? "اكتشفي عالم الجمال معنا" : "Discover the world of beauty with us"
        : mode === "forgot-password"
          ? isAr ? "لا تقلقي، سنساعدك" : "Don't worry, we'll help you"
          : isAr ? "تحققي من بريدك الإلكتروني" : "Check your email inbox";

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Slow zoom on the photo */}
      <style>{`
        @keyframes authKenBurns { from { transform: scale(1); } to { transform: scale(1.07); } }
        .auth-kenburns { animation: authKenBurns 18s ease-out forwards; }
        @media (prefers-reduced-motion: reduce) { .auth-kenburns { animation: none; } }
      `}</style>

      {/* Photo panel */}
      <div className="relative h-[30dvh] min-h-[220px] lg:h-auto lg:min-h-screen overflow-hidden">
        <img
          src="/images/onboarding/slide-discover.jpg"
          alt={isAr ? "إطلالة مكياج ساحرة" : "Glamorous makeup look"}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover auth-kenburns"
        />

        {/* Scrims */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/55 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none lg:from-black/60" />

        {/* Back button */}
        <div className="absolute top-0 inset-x-0 safe-area-top px-5 pt-5 flex items-center justify-between z-10">
          <button
            onClick={() => (mode === "forgot-password" ? switchMode("login") : navigate("/"))}
            aria-label={isAr ? "رجوع" : "Back"}
            className="w-11 h-11 rounded-full border border-white/15 bg-black/25 backdrop-blur-md flex items-center justify-center text-white transition-colors hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
          </button>
        </div>

        {/* Brand lockup over the photo (raised above the form sheet overlap) */}
        <div className="absolute bottom-16 inset-x-6 lg:bottom-10 z-10 pointer-events-none">
          <img
            src="/brand/glam-mark-dark.png"
            alt="GLAM"
            className="h-14 lg:h-16 w-auto object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
          />
        </div>
      </div>

      {/* Form panel */}
      <div className="relative z-10 -mt-7 lg:mt-0 bg-background rounded-t-[2rem] lg:rounded-none lg:flex lg:items-center lg:justify-center lg:max-h-screen lg:overflow-y-auto">
        <div className="w-full max-w-md mx-auto px-6 pt-8 pb-10 lg:py-14">
          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-[1.7rem] leading-snug font-bold text-foreground mb-1.5">
              {modeTitle}
            </h1>
            <p className="text-sm text-muted-foreground">{modeSubtitle}</p>
          </div>

          {/* Login / Signup segmented tabs */}
          {(mode === "login" || mode === "signup") && (
            <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-muted/70 mb-7" role="tablist">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={cn(
                    "h-11 rounded-full text-sm font-semibold transition-all duration-200",
                    mode === m
                      ? "bg-card text-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m === "login" ? t.auth.login : t.auth.signup}
                </button>
              ))}
            </div>
          )}

          {mode === "verify-email" ? (
            <div className="text-center space-y-6 py-2 animate-in fade-in duration-300 motion-reduce:animate-none">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="w-8 h-8" strokeWidth={1.75} />
              </div>

              <div className="space-y-3">
                <p className="text-foreground font-semibold text-lg">
                  {isAr ? "أدخلي رمز التحقق" : "Enter verification code"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? "تم إرسال رمز مكون من 6 أرقام إلى بريدك"
                    : "A 6-digit code was sent to your email"}
                </p>
                <div className="inline-flex items-center gap-2 bg-muted/60 rounded-full px-4 py-2" dir="ltr">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">{signupEmail}</p>
                </div>
              </div>

              {/* OTP Input */}
              <div className="flex justify-center" dir="ltr">
                <InputOTP
                  maxLength={6}
                  value={otpValue}
                  onChange={(value) => setOtpValue(value)}
                >
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="w-11 h-13 text-lg font-semibold rounded-xl border-2 border-border/60 bg-muted/40 first:rounded-xl last:rounded-xl"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  className={primaryButtonClasses}
                  onClick={handleVerifyOTP}
                  disabled={otpLoading || otpValue.length !== 6}
                >
                  {otpLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isAr ? "جاري التحقق..." : "Verifying..."}
                    </span>
                  ) : (
                    <>
                      {isAr ? "تأكيد الرمز" : "Verify Code"}
                      <ShieldCheck className="w-5 h-5 ms-2" />
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full rounded-2xl h-12 border-border/60"
                  onClick={handleResendOTP}
                  disabled={otpLoading || otpCooldown > 0}
                >
                  {otpCooldown > 0
                    ? isAr
                      ? `إعادة الإرسال بعد ${otpCooldown}ث`
                      : `Resend in ${otpCooldown}s`
                    : isAr
                      ? "إعادة إرسال الرمز"
                      : "Resend Code"}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full rounded-2xl text-muted-foreground"
                  onClick={() => switchMode("login")}
                >
                  {isAr ? "العودة لتسجيل الدخول" : "Back to Sign In"}
                </Button>
              </div>
            </div>
          ) : mode === "forgot-password" ? (
            <form onSubmit={handleForgotPassword} className="space-y-5 animate-in fade-in duration-300 motion-reduce:animate-none">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">{t.auth.email}</Label>
                <div className="relative">
                  <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={isAr ? "أدخلي بريدك الإلكتروني" : "Enter your email"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1.5">
                    <span className="text-xs">⚠️</span> {errors.email}
                  </p>
                )}
              </div>

              <Button type="submit" className={primaryButtonClasses} disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isAr ? "يرجى الانتظار..." : "Please wait..."}
                  </span>
                ) : (
                  isAr ? "إرسال رابط الاستعادة" : "Send Reset Link"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {isAr ? "تتذكرين كلمة المرور؟" : "Remember your password?"}{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-glam-rose font-semibold hover:underline"
                >
                  {t.auth.login}
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-5">
              {mode === "signup" && (
                <div className="space-y-2 animate-in fade-in duration-300 motion-reduce:animate-none">
                  <Label htmlFor="fullName" className="text-sm font-medium">{t.auth.fullName}</Label>
                  <div className="relative">
                    <User className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder={isAr ? "اسمك الكامل" : "Your full name"}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-destructive flex items-center gap-1.5">
                      <span className="text-xs">⚠️</span> {errors.fullName}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">{t.auth.email}</Label>
                <div className="relative">
                  <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={isAr ? "بريدك الإلكتروني" : "Your email address"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1.5">
                    <span className="text-xs">⚠️</span> {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-medium">{t.auth.password}</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot-password")}
                      className="text-xs text-glam-rose hover:underline font-medium"
                    >
                      {t.auth.forgotPassword}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isAr ? "كلمة المرور" : "Your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(inputClasses, "pe-12")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={isAr ? "إظهار كلمة المرور" : "Toggle password visibility"}
                    className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1.5">
                    <span className="text-xs">⚠️</span> {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me - Login only */}
              {mode === "login" && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    {isAr ? "تذكرني" : "Remember me"}
                  </Label>
                </div>
              )}

              <Button type="submit" className={primaryButtonClasses} disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isAr ? "يرجى الانتظار..." : "Please wait..."}
                  </span>
                ) : (
                  mode === "login" ? t.auth.login : t.auth.signup
                )}
              </Button>

              {/* Biometric Login - Login mode only */}
              {mode === "login" &&
                biometricSupported &&
                hasBiometricForEmail(localStorage.getItem("remembered_email") || "") && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-14 rounded-2xl text-base font-medium border-border/60"
                    onClick={handleBiometricLogin}
                    disabled={biometricLoading}
                  >
                    {biometricLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {isAr ? "جاري التحقق..." : "Verifying..."}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Fingerprint className="w-5 h-5" />
                        {isAr ? "تسجيل الدخول بالبصمة" : "Login with Fingerprint"}
                      </span>
                    )}
                  </Button>
                )}
            </form>
          )}

          {/* Artist / Seller links */}
          {(mode === "login" || mode === "signup") && (
            <div className="mt-8 pt-6 border-t border-border/50">
              <div className="flex items-center justify-center gap-4 text-xs">
                <button
                  type="button"
                  onClick={() => navigate("/artist-signup")}
                  className="text-glam-rose hover:text-glam-rose-pressed font-medium hover:underline transition-colors"
                >
                  {isAr ? "انضمي كخبيرة تجميل" : "Join as Artist"}
                </button>
                <span className="text-border">|</span>
                <button
                  type="button"
                  onClick={() => navigate("/seller-signup")}
                  className="text-glam-rose hover:text-glam-rose-pressed font-medium hover:underline transition-colors"
                >
                  {isAr ? "انضمي كبائعة منتجات" : "Join as Seller"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
