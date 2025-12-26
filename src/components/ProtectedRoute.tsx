import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Loader2, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";

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
}

const ProtectedRoute = ({ 
  children, 
  title,
  message,
  icon: Icon = Lock,
  loginButtonText,
  backButtonText,
  hideBackButton = false,
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Icon className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            {title || t.auth.loginRequired}
          </h1>
          <p className="text-muted-foreground mb-8">
            {message || t.auth.loginToBookMessage}
          </p>
          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={() => navigate("/auth", { state: { from: window.location.pathname + window.location.search } })}
            >
              {loginButtonText || t.auth.login}
            </Button>
            {!hideBackButton && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(-1)}
              >
                {backButtonText || t.common.back}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
