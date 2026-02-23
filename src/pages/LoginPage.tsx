import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

type Step = "idle" | "loading" | "sent" | "error";

export function LoginPage() {
  const { session } = useAuthStore();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [oauthLoading, setOauthLoading] = useState(false);

  // Already signed in — skip login
  if (session) return <Navigate to="/app/calendar" replace />;

  // ── Magic link ──────────────────────────────────────────────────────────────
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStep("loading");
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setStep("error");
      setErrorMsg(error.message);
    } else {
      setStep("sent");
    }
  };

  // ── Google OAuth ────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setOauthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setErrorMsg(error.message);
      setOauthLoading(false);
    }
    // on success the browser redirects — no cleanup needed
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
          {step === "sent" ? (
            /* ── Confirmation screen ── */
            <div className="text-center py-4 animate-fade-in">
              <div className="text-4xl mb-4">📬</div>
              <h2 className="font-display font-bold text-xl text-text-primary mb-2">
                Check your email
              </h2>
              <p className="font-mono text-text-secondary text-sm leading-relaxed">
                Magic link sent to <span className="text-grass">{email}</span>.
                <br />
                Click it to sign in. Don't make us wait.
              </p>
              <button
                onClick={() => setStep("idle")}
                className="btn-ghost mt-6 text-sm w-full"
              >
                ← Try a different email
              </button>
            </div>
          ) : (
            <>
              {/* ── Google button ── */}
              <button
                onClick={handleGoogle}
                disabled={oauthLoading || step === "loading"}
                className="w-full flex items-center justify-center gap-3 btn-secondary mb-4"
              >
                {oauthLoading ? (
                  <span className="animate-pulse">Redirecting...</span>
                ) : (
                  <>
                    <GoogleIcon />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* ── Divider ── */}
              <div className="relative flex items-center gap-3 mb-4">
                <div className="flex-1 border-t border-border" />
                <span className="font-mono text-text-muted text-xs">or</span>
                <div className="flex-1 border-t border-border" />
              </div>

              {/* ── Magic link form ── */}
              <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
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
                    disabled={step === "loading"}
                    required
                  />
                </div>

                {errorMsg && (
                  <p className="font-mono text-red text-xs animate-fade-in">
                    ⚠ {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={step === "loading" || !email.trim()}
                  className="btn-primary w-full mt-1"
                >
                  {step === "loading" ? "Sending..." : "Send magic link →"}
                </button>
              </form>

              <p className="font-mono text-text-muted text-xs text-center mt-4 leading-relaxed">
                No password. No excuses.
                <br />
                We'll email you a sign-in link.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
