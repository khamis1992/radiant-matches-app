import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Loader2, LucideIcon, LogIn, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo.png";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Custom title for the login required screen */
  title?: string;
  /** Custom message/description for the login required screen */
  message?: string;
  /** Custom icon component for the login required screen */
  icon?: LucideIcon;
  /** Custom login button text */
  loginButtonText?: string;
  /** Custom back button text */
  backButtonText?: string;
  /** Hide the back button */
  hideBackButton?: boolean;
  /** Show logo instead of icon */
  showLogo?: boolean;
}

const FloatingShape = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <div 
    className={`absolute rounded-full opacity-20 animate-pulse ${className}`}
    style={{ animationDelay: `${delay}s` }}
  />
);

const ProtectedRoute = ({ 
  children, 
  title,
  message,
  icon: Icon = Lock,
  loginButtonText,
  backButtonText,
  hideBackButton = false,
  showLogo = true,
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex flex-col relative overflow-hidden">
        {/* Decorative floating shapes */}
        <FloatingShape className="w-64 h-64 bg-primary/30 -top-20 -start-20 blur-3xl" delay={0} />
        <FloatingShape className="w-96 h-96 bg-accent/40 -bottom-32 -end-32 blur-3xl" delay={1} />
        <FloatingShape className="w-48 h-48 bg-primary/20 top-1/3 end-10 blur-2xl" delay={0.5} />
        <FloatingShape className="w-32 h-32 bg-accent/30 bottom-1/4 start-10 blur-2xl" delay={1.5} />

        {/* Back button */}
        <header className="p-4 relative z-10">
          {!hideBackButton && (
            <button
              onClick={() => navigate(-1)}
              className="p-3 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card shadow-lg transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 relative z-10">
          <div className="text-center max-w-sm animate-fade-in">
            {/* Logo or Icon */}
            {showLogo ? (
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-card shadow-2xl mb-8 animate-scale-in overflow-hidden border-2 border-primary/20">
                <img src={logo} alt="Logo" className="w-24 h-24 object-contain" />
              </div>
            ) : (
              <div className="relative mb-8 animate-scale-in">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-xl">
                  <Icon className="w-12 h-12 text-primary" />
                </div>
                <div className="absolute -top-2 -end-2">
                  <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                </div>
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl font-bold text-foreground mb-4" style={{ animationDelay: "0.1s" }}>
              {title || t.auth.loginRequired}
            </h1>

            {/* Message */}
            <p className="text-muted-foreground mb-10 text-base leading-relaxed" style={{ animationDelay: "0.2s" }}>
              {message || t.auth.loginToBookMessage}
            </p>

            {/* Action Buttons */}
            <div className="space-y-4" style={{ animationDelay: "0.3s" }}>
              <Button 
                size="lg"
                className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 gap-2" 
                onClick={() => navigate("/auth", { state: { from: window.location.pathname + window.location.search } })}
              >
                <LogIn className="w-5 h-5" />
                {loginButtonText || t.auth.login}
              </Button>
              
              {!hideBackButton && (
                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full h-14 rounded-2xl text-base font-medium border-2 hover:bg-accent/50 transition-all duration-300"
                  onClick={() => navigate(-1)}
                >
                  {backButtonText || t.common.back}
                </Button>
              )}
            </div>

            {/* Additional info */}
            <p className="mt-8 text-sm text-muted-foreground">
              {language === "ar" ? "ليس لديك حساب؟ " : "Don't have an account? "}
              <button 
                onClick={() => navigate("/auth")}
                className="text-primary font-semibold hover:underline"
              >
                {t.auth.signup}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
