import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const Logout = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await supabase.auth.signOut();
        toast.success(language === "ar" ? "تم تسجيل الخروج بنجاح" : "Logged out successfully");
        // Force a hard reload to clear any cached states
        window.location.href = "/auth";
      } catch (error) {
        console.error("Logout error:", error);
        toast.error(language === "ar" ? "فشل تسجيل الخروج" : "Failed to log out");
        navigate("/auth");
      }
    };

    handleLogout();
  }, [navigate, language]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default Logout;
