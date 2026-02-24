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
  const { session, profile, ready } = useAuthStore();

  // Still booting — show spinner
  if (!ready) {
    return (
      <div className="h-screen w-screen bg-bg-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
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

  // Not logged in
  if (!session) return <Navigate to="/login" replace />;

  // Logged in but no profile yet (new user)
  if (requireProfile && !profile) return <Navigate to="/welcome" replace />;

  // Already has profile but landed on /welcome (returning user somehow)
  if (!requireProfile && profile)
    return <Navigate to="/app/calendar" replace />;

  return <>{children}</>;
}
