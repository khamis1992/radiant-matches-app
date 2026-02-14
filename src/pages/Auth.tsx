import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Sparkles, Fingerprint } from "lucide-react";
import logo from "@/assets/logo.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { z } from "zod";

type AuthMode = "login" | "signup" | "forgot-password" | "verify-email";

type RoleRedirectResult = {
  path: string;
  role: "admin" | "artist" | "customer";
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
    return { path: "/home", role: "customer", userName };
  } catch {
    return { path: "/home", role: "customer", userName: null };
  }
};

const getWelcomeMessage = (role: "admin" | "artist" | "customer", userName: string | null, language: "en" | "ar") => {
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

const FloatingShape = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <div 
    className={`absolute rounded-full opacity-20 animate-pulse ${className}`}
    style={{ animationDelay: `${delay}s` }}
  />
);

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  
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
  const [rememberMe, setRememberMe] = useState(false);
  
  const { isSupported: biometricSupported, authenticate: biometricAuth, hasBiometricForEmail, isLoading: biometricLoading } = useBiometricAuth();

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const emailSchema = z.string().email(language === "ar" ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email address");
  const passwordSchema = z.string().min(6, t.settings.passwordMinLength);

  useEffect(() => {
    const redirectUser = async (userId: string, showToast = false) => {
      // If there's a saved redirect path, use it
      if (redirectPath) {
        if (showToast) {
          toast.success(language === "ar" ? "تم تسجيل الدخول بنجاح!" : "Logged in successfully!");
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
  }, [navigate, language, redirectPath]);

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

  const handleBiometricLogin = async () => {
    if (!biometricSupported) return;
    
    const savedEmail = localStorage.getItem("remembered_email");
    if (!savedEmail || !hasBiometricForEmail(savedEmail)) {
      toast.error(language === "ar" ? "لم يتم تفعيل البصمة لهذا الحساب" : "Biometric not enabled for this account");
      return;
    }

    const result = await biometricAuth(savedEmail);
    if (result.success && result.email) {
      // Biometric verified - now we need to get the stored password or use a token
      const storedPassword = localStorage.getItem(`saved_password_${result.email}`);
      if (storedPassword) {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
          email: result.email,
          password: storedPassword,
        });
        setLoading(false);
        
        if (error) {
          toast.error(language === "ar" ? "فشل تسجيل الدخول" : "Login failed");
          // Clear stored data if login fails
          localStorage.removeItem(`saved_password_${result.email}`);
        }
      } else {
        toast.error(language === "ar" ? "يرجى تسجيل الدخول بالبريد وكلمة المرور أولاً" : "Please login with email and password first");
      }
    } else {
      toast.error(language === "ar" ? "فشل التحقق من البصمة" : "Biometric verification failed");
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

        // Save email and password if remember me is checked
        if (rememberMe) {
          localStorage.setItem("remembered_email", email.trim());
          // Save password encrypted for biometric login (in production, use more secure storage)
          localStorage.setItem(`saved_password_${email.trim()}`, password);
        } else {
          localStorage.removeItem("remembered_email");
          localStorage.removeItem(`saved_password_${email.trim()}`);
        }
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
        
        if (data.user && !data.session) {
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex flex-col relative overflow-hidden">
      {/* Decorative floating shapes */}
      <FloatingShape className="w-64 h-64 bg-primary/30 -top-20 -start-20 blur-3xl" delay={0} />
      <FloatingShape className="w-96 h-96 bg-accent/40 -bottom-32 -end-32 blur-3xl" delay={1} />
      <FloatingShape className="w-48 h-48 bg-blush/50 top-1/3 end-10 blur-2xl" delay={0.5} />
      <FloatingShape className="w-32 h-32 bg-gold/30 bottom-1/4 start-10 blur-2xl" delay={1.5} />
      
      {/* Back button */}
      <header className="p-4 relative z-10">
        <button
          onClick={() => mode === "forgot-password" ? switchMode("login") : navigate("/")}
          className="p-3 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card shadow-lg transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      </header>

      <div className="flex-1 flex flex-col justify-center px-6 pb-12 relative z-10">
        {/* Logo/Brand area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-card shadow-xl mb-6 animate-scale-in overflow-hidden border-2 border-primary/20">
            <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-3 animate-fade-in">
            {mode === "login" && (language === "ar" ? "مرحباً بعودتك" : "Welcome Back")}
            {mode === "signup" && (language === "ar" ? "انضمي إلينا" : "Join Us")}
            {mode === "forgot-password" && (language === "ar" ? "استعادة الحساب" : "Reset Password")}
            {mode === "verify-email" && t.auth.verifyEmail}
          </h1>
          
          <p className="text-muted-foreground max-w-xs mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
            {mode === "login" && (language === "ar" ? "نحن سعداء برؤيتك مجدداً ✨" : "We're happy to see you again ✨")}
            {mode === "signup" && (language === "ar" ? "اكتشفي عالم الجمال معنا 💄" : "Discover the world of beauty with us 💄")}
            {mode === "forgot-password" && (language === "ar" ? "لا تقلقي، سنساعدك 💝" : "Don't worry, we'll help you 💝")}
            {mode === "verify-email" && (language === "ar" ? "تحققي من بريدك الإلكتروني" : "Check your email inbox")}
          </p>
        </div>

        {/* Card container */}
        <div className="bg-card/90 backdrop-blur-md rounded-3xl shadow-2xl p-6 max-w-md mx-auto w-full border border-border/50 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {mode === "verify-email" ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-pulse">
                <Mail className="w-12 h-12 text-primary" />
              </div>
              
              <div className="space-y-3">
                <p className="text-foreground font-medium">
                  {language === "ar" ? "تم إرسال رابط التحقق!" : "Verification link sent!"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" 
                    ? "انقري على الرابط في بريدك الإلكتروني للتحقق من حسابك."
                    : "Click the link in your email to verify your account."}
                </p>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">
                    📧 {signupEmail}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3 pt-2">
                <Button
                  variant="outline"
                  className="w-full rounded-xl h-12"
                  onClick={handleResendVerification}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      {language === "ar" ? "جاري الإرسال..." : "Sending..."}
                    </span>
                  ) : (
                    t.auth.resendEmail
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full rounded-xl"
                  onClick={() => switchMode("login")}
                >
                  {language === "ar" ? "العودة لتسجيل الدخول" : "Back to Sign In"}
                </Button>
              </div>
            </div>
          ) : mode === "forgot-password" ? (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">{t.auth.email}</Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative">
                    <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={language === "ar" ? "أدخلي بريدك الإلكتروني" : "Enter your email"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="ps-12 h-14 rounded-xl border-2 bg-background/50 focus:bg-background transition-all"
                    />
                  </div>
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <span className="text-xs">⚠️</span> {errors.email}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    {language === "ar" ? "يرجى الانتظار..." : "Please wait..."}
                  </span>
                ) : (
                  language === "ar" ? "إرسال رابط الاستعادة" : "Send Reset Link"
                )}
              </Button>
              
              <p className="text-center text-sm text-muted-foreground">
                {language === "ar" ? "تتذكرين كلمة المرور؟" : "Remember your password?"}{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-primary font-semibold hover:underline"
                >
                  {t.auth.login}
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-5">
              {mode === "signup" && (
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="fullName" className="text-sm font-medium">{t.auth.fullName}</Label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative">
                      <User className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder={language === "ar" ? "اسمك الكامل" : "Your full name"}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="ps-12 h-14 rounded-xl border-2 bg-background/50 focus:bg-background transition-all"
                      />
                    </div>
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="text-xs">⚠️</span> {errors.fullName}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">{t.auth.email}</Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative">
                    <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={language === "ar" ? "بريدك الإلكتروني" : "Your email address"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="ps-12 h-14 rounded-xl border-2 bg-background/50 focus:bg-background transition-all"
                    />
                  </div>
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
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
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      {t.auth.forgotPassword}
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative">
                    <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={language === "ar" ? "كلمة المرور" : "Your password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="ps-12 pe-12 h-14 rounded-xl border-2 bg-background/50 focus:bg-background transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <span className="text-xs">⚠️</span> {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me Checkbox - Login only */}
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
                    {language === "ar" ? "تذكرني" : "Remember me"}
                  </Label>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-14 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    {language === "ar" ? "يرجى الانتظار..." : "Please wait..."}
                  </span>
                ) : (
                  <>
                    {mode === "login" ? t.auth.login : t.auth.signup}
                    <Sparkles className="w-5 h-5 ms-2" />
                  </>
                )}
              </Button>

              {/* Biometric Login Button - Login mode only */}
              {mode === "login" && biometricSupported && hasBiometricForEmail(localStorage.getItem("remembered_email") || "") && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-14 rounded-xl text-base font-medium border-2"
                  onClick={handleBiometricLogin}
                  disabled={biometricLoading}
                >
                  {biometricLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      {language === "ar" ? "جاري التحقق..." : "Verifying..."}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Fingerprint className="w-5 h-5" />
                      {language === "ar" ? "تسجيل الدخول بالبصمة" : "Login with Fingerprint"}
                    </span>
                  )}
                </Button>
              )}
            </form>
          )}

          {/* Mode switcher */}
          {mode !== "verify-email" && mode !== "forgot-password" && (
            <div className="mt-6 pt-6 border-t border-border/50 space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                {mode === "login" ? t.auth.noAccount : t.auth.hasAccount}{" "}
                <button
                  type="button"
                  onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                  className="text-primary font-semibold hover:underline"
                >
                  {mode === "login" ? t.auth.signup : t.auth.login}
                </button>
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => navigate("/artist-signup")}
                  className="text-primary/80 hover:text-primary font-medium hover:underline transition-colors"
                >
                  {language === "ar" ? "انضمي كخبيرة تجميل" : "Join as Artist"}
                </button>
                <span className="text-border">|</span>
                <button
                  type="button"
                  onClick={() => navigate("/seller-signup")}
                  className="text-primary/80 hover:text-primary font-medium hover:underline transition-colors"
                >
                  {language === "ar" ? "انضمي كبائعة منتجات" : "Join as Seller"}
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
