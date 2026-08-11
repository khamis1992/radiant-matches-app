import { ReactNode, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { AppRole, useUserRole } from "@/hooks/useUserRole";

type RoleGateProps = {
  allow: AppRole[];
  children: ReactNode;
  /** Optional hard redirect target when access is denied */
  redirectTo?: string;
  /** Show a minimal loading state while role/auth is loading (prevents UI flashing) */
  showLoading?: boolean;
  /**
   * When true, unauthenticated visitors are redirected to /auth (with a
   * `from` state so they return after login). When false (default),
   * guests are allowed through and the page handles them gracefully.
   */
  requireAuth?: boolean;
};

const defaultRedirectForRole = (role: AppRole | null) => {
  if (role === "artist") return "/artist-dashboard";
  if (role === "seller") return "/seller-dashboard";
  if (role === "admin") return "/admin";
  return "/home";
};

export const RoleGate = ({
  allow,
  children,
  redirectTo,
  showLoading = false,
  requireAuth = false,
}: RoleGateProps) => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  const isLoading = authLoading || roleLoading;

  const fallback = useMemo(() => {
    if (!showLoading) return null;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }, [showLoading]);

  // Guests: either send them to login, or let the page handle guest mode.
  if (!user) {
    if (authLoading) return <>{fallback}</>;
    if (requireAuth) {
      const from = location.pathname + location.search;
      return <Navigate to="/auth" replace state={{ from }} />;
    }
    return <>{children}</>;
  }

  if (isLoading) return <>{fallback}</>;

  if (!role || !allow.includes(role)) {
    const to = redirectTo ?? defaultRedirectForRole(role);
    return <Navigate to={to} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};
