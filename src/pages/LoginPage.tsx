import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

type Mode = "signin" | "signup";

export function LoginPage() {
  const { session } = useAuthStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (session) return <Navigate to="/app/calendar" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        // Switch to sign in — user either needs to confirm email or can sign in directly
        setSuccess("Account created! Sign in below.");
        setMode("signin");
        setPassword("");
        setLoading(false);
      }
      return;
    }

    // Sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setError("Sign in failed — no session returned.");
      setLoading(false);
      return;
    }

    // Check if profile exists to decide where to send the user
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", data.session.user.id)
      .single();

    if (profile) {
      navigate("/app/calendar", { replace: true });
    } else {
      navigate("/welcome", { replace: true });
    }
  };

  return (
    <div className="h-screen w-screen bg-bg-base flex items-center justify-center p-4">
      {/* Dot-grid background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #7fc47a 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-sm animate-slide-up">
        {/* Logo + wordmark */}
        <div className="flex flex-col items-center mb-10 gap-3">
          <img
            src="/logo.png"
            alt="TouchGrass Tracker"
            className="w-24 h-24 drop-shadow-[0_0_24px_rgba(127,196,122,0.3)]"
          />
          <div className="text-center">
            <h1 className="font-display font-extrabold text-3xl text-text-primary tracking-tight">
              TouchGrass <span className="text-grass">Tracker</span>
            </h1>
            <p className="font-mono text-text-muted text-sm mt-1">
              Skill issue? No.{" "}
              <span className="text-amber">Scheduling issue.</span>
            </p>
          </div>
        </div>

        <div className="card">
          {/* Mode toggle */}
          <div className="flex rounded-lg bg-bg-card border border-border p-1 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError("");
                setSuccess("");
              }}
              className={`flex-1 py-1.5 rounded-md font-display font-bold text-sm transition-all duration-150
                ${
                  mode === "signin"
                    ? "bg-bg-elevated text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
                setSuccess("");
              }}
              className={`flex-1 py-1.5 rounded-md font-display font-bold text-sm transition-all duration-150
                ${
                  mode === "signup"
                    ? "bg-bg-elevated text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                placeholder={
                  mode === "signup" ? "Min. 6 characters" : "••••••••"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                disabled={loading}
                minLength={6}
                required
              />
            </div>

            {error && (
              <p className="font-mono text-red text-xs animate-fade-in">
                ⚠ {error}
              </p>
            )}

            {success && (
              <p className="font-mono text-grass text-xs animate-fade-in leading-relaxed">
                ✓ {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="btn-primary w-full mt-1"
            >
              {loading
                ? mode === "signup"
                  ? "Creating account..."
                  : "Signing in..."
                : mode === "signup"
                  ? "Create account →"
                  : "Sign in →"}
            </button>
          </form>

          {mode === "signin" && (
            <p className="font-mono text-text-muted text-xs text-center mt-4">
              No account yet?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className="text-grass hover:text-grass-glow transition-colors"
              >
                Create one
              </button>
            </p>
          )}
        </div>

        <p className="font-mono text-text-muted text-xs text-center mt-4 leading-relaxed opacity-60">
          To skip email confirmation during dev:
          <br />
          Dashboard → Auth → Providers → Email → disable "Confirm email"
        </p>
      </div>
    </div>
  );
}
