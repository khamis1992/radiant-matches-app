import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { z } from "zod";

type AuthMode = "login" | "signup" | "forgot-password" | "verify-email";

type RoleRedirectResult = {
  path: string;
  role: "admin" | "artist" | "customer";
  userName: string | null;
};

const getRedirectInfo = async (userId: string): Promise<RoleRedirectResult> => {
  try {
    // Fetch role and profile in parallel
    const [rolesResult, profileResult] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("full_name").eq("id", userId).single()
    ]);

    const roles = (rolesResult.data || []).map((r) => r.role);
    const userName = profileResult.data?.full_name || null;

    if (roles.includes("admin")) return { path: "/admin", role: "admin", userName };
    if (roles.includes("artist")) return { path: "/artist-dashboard", role: "artist", userName };
    return { path: "/home", role: "customer", userName };
  } catch {
    return { path: "/home", role: "customer", userName: null };
  }
};

const getWelcomeMessage = (role: "admin" | "artist" | "customer", userName: string | null, language: "en" | "ar") => {
  const name = userName?.split(" ")[0]; // First name only
  
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
  const { t, language } = useLanguage();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [signupEmail, setSignupEmail] = useState("");

  const emailSchema = z.string().email(language === "ar" ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email address");
  const passwordSchema = z.string().min(6, t.settings.passwordMinLength);

  useEffect(() => {
    const redirectUser = async (userId: string, showToast = false) => {
      const { path, role, userName } = await getRedirectInfo(userId);
      if (showToast) {
        toast.success(getWelcomeMessage(role, userName, language));
      }
      navigate(path, { replace: true });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
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
  }, [navigate, language]);

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
      newErrors.fullName = language === "ar" ? "الاسم الكامل مطلوب" : "Full name is required";
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
      
      toast.success(language === "ar" ? "تم إرسال رابط إعادة التعيين! تحقق من بريدك." : "Password reset email sent! Check your inbox.");
      setMode("login");
      setEmail("");
    } catch (error: any) {
      toast.error(t.errors.somethingWrong);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error(language === "ar" ? "بريد إلكتروني أو كلمة مرور غير صحيحة" : "Invalid email or password");
          } else {
            toast.error(error.message);
          }
          return;
        }
        // Toast is shown via onAuthStateChange
      } else {
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
          if (error.message.includes("User already registered")) {
            toast.error(language === "ar" ? "يوجد حساب بهذا البريد بالفعل. يرجى تسجيل الدخول." : "An account with this email already exists. Please sign in.");
          } else {
            toast.error(error.message);
          }
          return;
        }
        
        // Check if email confirmation is required
        if (data.user && !data.session) {
          // User created but no session means email confirmation is required
          setSignupEmail(email.trim());
          setMode("verify-email");
          setEmail("");
          setPassword("");
          setFullName("");
        } else {
          toast.success(language === "ar" ? "تم إنشاء الحساب بنجاح!" : "Account created successfully!");
        }
      }
    } catch (error: any) {
      toast.error(t.errors.somethingWrong);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
  };

  const getTitle = () => {
    switch (mode) {
      case "login": return language === "ar" ? "مرحباً بعودتك" : "Welcome back";
      case "signup": return language === "ar" ? "إنشاء حساب" : "Create account";
      case "forgot-password": return language === "ar" ? "إعادة تعيين كلمة المرور" : "Reset password";
      case "verify-email": return t.auth.verifyEmail;
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "login": return language === "ar" ? "سجلي دخولك لمتابعة حجز فنانتك المفضلة" : "Sign in to continue booking your favorite artists";
      case "signup": return language === "ar" ? "انضمي إلينا لاكتشاف فنانات مكياج مميزات" : "Join us to discover amazing makeup artists";
      case "forgot-password": return language === "ar" ? "أدخلي بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين" : "Enter your email and we'll send you a reset link";
      case "verify-email": return `${t.auth.checkEmail}`;
    }
  };

  const handleResendVerification = async () => {
    if (!signupEmail) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: signupEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/home`,
        },
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t.auth.emailSent);
      }
    } catch (error) {
      toast.error(language === "ar" ? "فشل في إعادة إرسال بريد التحقق" : "Failed to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4">
        <button
          onClick={() => mode === "forgot-password" ? switchMode("login") : navigate("/")}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      </header>

      <div className="flex-1 flex flex-col justify-center px-6 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {getTitle()}
          </h1>
          <p className="text-muted-foreground">
            {getSubtitle()}
          </p>
        </div>

        {mode === "verify-email" ? (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            
            <div className="space-y-2">
              <p className="text-foreground">
                {language === "ar" ? "انقري على الرابط في بريدك الإلكتروني للتحقق من حسابك." : "Click the link in your email to verify your account."}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "تحققي من مجلد الرسائل غير المرغوب فيها إذا لم تجديه." : "Check your spam folder if you don't see it."}
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendVerification}
                disabled={loading}
              >
                {loading ? (language === "ar" ? "جاري الإرسال..." : "Sending...") : t.auth.resendEmail}
              </Button>
              
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => switchMode("login")}
              >
                {language === "ar" ? "العودة لتسجيل الدخول" : "Back to Sign In"}
              </Button>
            </div>
          </div>
        ) : mode === "forgot-password" ? (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.email}</Label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={language === "ar" ? "أدخلي بريدك الإلكتروني" : "Enter your email"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ps-10"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (language === "ar" ? "يرجى الانتظار..." : "Please wait...") : (language === "ar" ? "إرسال رابط إعادة التعيين" : "Send Reset Link")}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="space-y-5">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">{t.auth.fullName}</Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={language === "ar" ? "أدخلي اسمك الكامل" : "Enter your full name"}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="ps-10"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.email}</Label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={language === "ar" ? "أدخلي بريدك الإلكتروني" : "Enter your email"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ps-10"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">{t.auth.password}</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => switchMode("forgot-password")}
                    className="text-sm text-primary hover:underline"
                  >
                    {t.auth.forgotPassword}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={language === "ar" ? "أدخلي كلمة المرور" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ps-10 pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (language === "ar" ? "يرجى الانتظار..." : "Please wait...") : mode === "login" ? t.auth.login : t.auth.signup}
            </Button>
          </form>
        )}

        {mode !== "verify-email" && (
          <div className="mt-6 text-center">
            {mode === "forgot-password" ? (
              <p className="text-muted-foreground">
                {language === "ar" ? "تتذكرين كلمة المرور؟" : "Remember your password?"}{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-primary font-semibold hover:underline"
                >
                  {t.auth.login}
                </button>
              </p>
            ) : (
            <p className="text-muted-foreground">
              {mode === "login" ? t.auth.noAccount : t.auth.hasAccount}{" "}
              <button
                type="button"
                onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                className="text-primary font-semibold hover:underline"
              >
                {mode === "login" ? t.auth.signup : t.auth.login}
              </button>
            </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
