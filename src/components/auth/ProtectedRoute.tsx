import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProfile?: boolean;
}

export function ProtectedRoute({
  children,
  requireProfile = false,
}: ProtectedRouteProps) {
  const { session, profile, ready } = useAuthStore();

  if (!ready) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  if (requireProfile && !profile) return <Navigate to="/welcome" replace />;
  if (!requireProfile && profile)
    return <Navigate to="/app/calendar" replace />;

  return <>{children}</>;
}
