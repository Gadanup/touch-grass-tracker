import { useEffect, useState } from "react";
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
  const { session, profile, loading, setLoading } = useAuthStore();
  const [timedOut, setTimedOut] = useState(false);

  // Hard fallback: if still loading after 6s, force-unblock
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      setTimedOut(true);
      setLoading(false);
    }, 6000);
    return () => clearTimeout(t);
  }, [loading, setLoading]);

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

  // If we timed out with no session, go to login
  if (timedOut && !session) {
    return <Navigate to="/login" replace />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requireProfile && !profile) {
    return <Navigate to="/welcome" replace />;
  }

  if (!requireProfile && profile && window.location.pathname === "/welcome") {
    return <Navigate to="/app/calendar" replace />;
  }

  return <>{children}</>;
}
