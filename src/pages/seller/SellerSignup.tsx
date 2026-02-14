import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, Store, Phone } from "lucide-react";
import logo from "@/assets/logo.png";
import { z } from "zod";

const SellerSignup = () => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();

  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const emailSchema = z.string().email(isRTL ? "بريد إلكتروني غير صالح" : "Invalid email");
  const passwordSchema = z.string().min(6, isRTL ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters");

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) errors.email = emailResult.error.errors[0].message;
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) errors.password = passwordResult.error.errors[0].message;
    if (!fullName.trim()) errors.fullName = isRTL ? "الاسم مطلوب" : "Name is required";
    if (!phone.trim()) errors.phone = isRTL ? "رقم الهاتف مطلوب" : "Phone is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);

    try {
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/seller-dashboard`,
          data: { full_name: fullName.trim() },
        },
      });

      if (signupError) {
        if (signupError.message.includes("User already registered")) {
          toast.error(isRTL ? "هذا البريد مسجل بالفعل" : "Email already registered");
        } else {
          toast.error(signupError.message);
        }
        return;
      }

      if (!authData.user) {
        toast.error(isRTL ? "خطأ في إنشاء الحساب" : "Error creating account");
        return;
      }

      // Call public-seller-signup edge function
      const { data: completeData, error: completeError } = await supabase.functions.invoke(
        "public-seller-signup",
        { body: { userId: authData.user.id } }
      );

      if (completeError || !completeData?.success) {
        toast.error(isRTL ? "خطأ في إكمال التسجيل" : "Error completing signup");
        return;
      }

      // Update phone
      if (phone.trim()) {
        await supabase
          .from("profiles")
          .update({ phone: phone.trim() })
          .eq("id", authData.user.id);
      }

      toast.success(isRTL ? "تم إنشاء حسابك بنجاح! تحقق من بريدك الإلكتروني" : "Account created! Check your email");
      navigate("/auth", { replace: true });
    } catch {
      toast.error(isRTL ? "حدث خطأ غير متوقع" : "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex flex-col relative overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      <div className="absolute w-64 h-64 bg-primary/30 -top-20 -start-20 blur-3xl rounded-full opacity-20" />
      <div className="absolute w-96 h-96 bg-accent/40 -bottom-32 -end-32 blur-3xl rounded-full opacity-20" />

      <div className="flex-1 flex flex-col justify-center px-6 py-12 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-card shadow-xl mb-6 overflow-hidden border-2 border-primary/20">
            <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            {isRTL ? "انضمي كبائعة منتجات" : "Join as a Product Seller"}
          </h1>
          <p className="text-muted-foreground max-w-xs mx-auto">
            {isRTL ? "سجّلي حسابك وابدئي ببيع منتجاتك" : "Create your account and start selling your products"}
          </p>
        </div>

        {/* Badge */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 max-w-md mx-auto w-full mb-6">
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {isRTL ? "تسجيل مجاني للبائعات" : "Free registration for sellers"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRTL ? "أنشئي حسابك وأضيفي منتجاتك للبيع" : "Create your account and add products to sell"}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-card/90 backdrop-blur-md rounded-3xl shadow-2xl p-6 max-w-md mx-auto w-full border border-border/50">
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">{isRTL ? "الاسم الكامل" : "Full Name"}</Label>
              <div className="relative">
                <User className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input id="fullName" placeholder={isRTL ? "اسمك الكامل" : "Your full name"} value={fullName} onChange={(e) => setFullName(e.target.value)} className="ps-12 h-14 rounded-xl border-2" />
              </div>
              {formErrors.fullName && <p className="text-sm text-destructive">⚠️ {formErrors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">{isRTL ? "رقم الهاتف" : "Phone Number"}</Label>
              <div className="relative">
                <Phone className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input id="phone" type="tel" placeholder="+974 5555 1234" value={phone} onChange={(e) => setPhone(e.target.value)} className="ps-12 h-14 rounded-xl border-2" dir="ltr" />
              </div>
              {formErrors.phone && <p className="text-sm text-destructive">⚠️ {formErrors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">{isRTL ? "البريد الإلكتروني" : "Email"}</Label>
              <div className="relative">
                <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="ps-12 h-14 rounded-xl border-2" dir="ltr" />
              </div>
              {formErrors.email && <p className="text-sm text-destructive">⚠️ {formErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">{isRTL ? "كلمة المرور" : "Password"}</Label>
              <div className="relative">
                <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="ps-12 pe-12 h-14 rounded-xl border-2" dir="ltr" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.password && <p className="text-sm text-destructive">⚠️ {formErrors.password}</p>}
            </div>

            <Button type="submit" className="w-full h-14 rounded-xl text-base font-semibold" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  {isRTL ? "جاري الإنشاء..." : "Creating..."}
                </span>
              ) : (
                <>
                  {isRTL ? "إنشاء حساب بائعة" : "Create Seller Account"}
                  <Store className="w-5 h-5 ms-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/50">
            <p className="text-center text-sm text-muted-foreground">
              {isRTL ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
              <button type="button" onClick={() => navigate("/auth")} className="text-primary font-semibold hover:underline">
                {isRTL ? "تسجيل الدخول" : "Sign In"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerSignup;
