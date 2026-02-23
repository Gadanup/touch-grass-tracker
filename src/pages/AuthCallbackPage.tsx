import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { fetchProfile } = useAuthStore();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase auto-parses the token from the URL hash/query string
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        setError(
          error?.message ?? "Authentication failed. Try signing in again.",
        );
        return;
      }

      // Check whether this user already has a profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        // Returning user
        await fetchProfile(session.user.id);
        navigate("/app/calendar", { replace: true });
      } else {
        // New user — go set up their profile
        navigate("/welcome", { replace: true });
      }
    };

    handleCallback();
  }, [navigate, fetchProfile]);

  if (error) {
    return (
      <div className="h-screen w-screen bg-bg-base flex items-center justify-center p-4">
        <div className="card max-w-sm w-full text-center animate-fade-in">
          <div className="text-4xl mb-4">💀</div>
          <h2 className="font-display font-bold text-xl text-text-primary mb-2">
            Auth failed
          </h2>
          <p className="font-mono text-text-secondary text-sm mb-6">{error}</p>
          <a href="/login" className="btn-primary block w-full text-center">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-bg-base flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <img
          src="/logo.png"
          alt="TouchGrass Tracker"
          className="w-16 h-16 animate-spin-slow opacity-80"
        />
        <span className="font-mono text-text-muted text-sm">
          signing you in...
        </span>
      </div>
    </div>
  );
}
