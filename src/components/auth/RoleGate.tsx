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

  // Keep existing public/unauth behavior (don't force redirect) unless we later decide otherwise.
  if (!user) return <>{children}</>;

  if (isLoading) return <>{fallback}</>;

  if (!role || !allow.includes(role)) {
    const to = redirectTo ?? defaultRedirectForRole(role);
    return <Navigate to={to} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};
