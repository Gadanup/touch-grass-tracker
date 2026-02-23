import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProfile?: boolean;
}

export function ProtectedRoute({
  children,
  requireProfile = false,
}: ProtectedRouteProps) {
  const { session, profile, loading } = useAuthStore();

  // Show spinner while auth initialises (prevents flash of wrong page)
  if (loading) {
    return (
      <div className="h-screen w-screen bg-bg-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <img
            src="/logo.png"
            alt="TouchGrass Tracker"
            className="w-16 h-16 animate-spin-slow opacity-80"
          />
          <span className="font-mono text-text-muted text-sm">loading...</span>
        </div>
      </div>
    );
  }

  // Not logged in → login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but no profile → onboarding
  if (requireProfile && !profile) {
    return <Navigate to="/welcome" replace />;
  }

  // Already has profile but hit /welcome → skip to app
  if (!requireProfile && profile && window.location.pathname === "/welcome") {
    return <Navigate to="/app/calendar" replace />;
  }

  return <>{children}</>;
}
