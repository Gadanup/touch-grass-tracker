import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

// This page is no longer the primary auth flow (that's handled by LoginPage now).
// It exists as a fallback landing spot — e.g. if you add OAuth providers later.
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { session, profile } = useAuthStore();

  useEffect(() => {
    // Give onAuthStateChange in App.tsx a moment to process, then redirect
    const t = setTimeout(() => {
      if (session && profile) navigate("/app/calendar", { replace: true });
      else if (session && !profile) navigate("/welcome", { replace: true });
      else navigate("/login", { replace: true });
    }, 500);

    return () => clearTimeout(t);
  }, [session, profile, navigate]);

  return (
    <div className="h-screen w-screen bg-bg-base flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <img
          src="/logo.png"
          alt="TouchGrass Tracker"
          className="w-16 h-16 animate-spin-slow opacity-80"
        />
        <span className="font-mono text-text-muted text-sm">
          redirecting...
        </span>
      </div>
    </div>
  );
}
