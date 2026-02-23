import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

const EMOJIS = [
  "🌿",
  "🌱",
  "🍀",
  "🌲",
  "🌵",
  "🌾",
  "🍄",
  "🌻",
  "🌊",
  "🔥",
  "⚡",
  "🐉",
  "🐺",
  "🦊",
  "🐻",
  "🦝",
  "🐸",
  "🐢",
  "🦋",
  "🦅",
  "⚔️",
  "🛡️",
  "🏹",
  "🗡️",
  "🔮",
  "💎",
  "🎮",
  "🕹️",
  "🎯",
  "🏆",
];

const COLORS = [
  "#ea6c1e",
  "#f59e0b",
  "#7fc47a",
  "#5b8dd9",
  "#9b59b6",
  "#e74c3c",
  "#1abc9c",
  "#e91e8c",
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { session, setProfile } = useAuthStore();

  const [displayName, setDisplayName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🌿");
  const [selectedColor, setSelectedColor] = useState("#ea6c1e");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-detect the user's local timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !displayName.trim()) return;

    setLoading(true);
    setError("");

    const newProfile = {
      id: session.user.id,
      display_name: displayName.trim(),
      avatar_emoji: selectedEmoji,
      avatar_color: selectedColor,
      avatar_url: null,
      timezone,
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(newProfile)
      .select()
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setProfile(data);
    navigate("/app/calendar", { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      {/* Dot-grid background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #7fc47a 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <img src="/logo.png" alt="TGT" className="w-14 h-14" />
          <div>
            <h1 className="font-display font-extrabold text-2xl text-text-primary">
              Welcome to TGT
            </h1>
            <p className="font-mono text-text-muted text-sm">
              Let's set up your profile real quick.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Display name */}
          <div className="card">
            <label htmlFor="displayName" className="label">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              placeholder="e.g. Ghostblade, Nachtfalke, João..."
              maxLength={32}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input"
              autoFocus
              required
            />
            <p className="font-mono text-text-muted text-xs mt-2">
              This is how your friends see you. {32 - displayName.length} chars
              left.
            </p>
          </div>

          {/* Avatar preview + picker */}
          <div className="card">
            {/* Live preview */}
            <div className="flex items-center gap-4 mb-5">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0 border-2"
                style={{
                  backgroundColor: selectedColor + "30",
                  borderColor: selectedColor,
                }}
              >
                {selectedEmoji}
              </div>
              <div>
                <p className="font-display font-bold text-text-primary">
                  {displayName || "Your Name"}
                </p>
                <p className="font-mono text-text-muted text-xs">{timezone}</p>
              </div>
            </div>

            {/* Emoji grid */}
            <label className="label">Pick your emoji</label>
            <div className="grid grid-cols-10 gap-1.5 mb-4">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`
                    w-8 h-8 rounded-lg text-base flex items-center justify-center
                    transition-all duration-150
                    ${
                      selectedEmoji === emoji
                        ? "bg-bg-card border-2 border-grass scale-110"
                        : "bg-bg-elevated border border-border hover:border-border-warm hover:scale-105"
                    }
                  `}
                  aria-label={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Color swatches */}
            <label className="label">Pick your color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`
                    w-8 h-8 rounded-full transition-all duration-150
                    ${
                      selectedColor === color
                        ? "scale-125 ring-2 ring-white/50"
                        : "hover:scale-110"
                    }
                  `}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Timezone notice */}
          <div className="flex items-start gap-3 px-4 py-3 bg-bg-elevated border border-border rounded-lg">
            <span className="text-base mt-0.5">🕐</span>
            <div>
              <p className="font-mono text-text-secondary text-sm">
                Timezone auto-detected:{" "}
                <span className="text-amber">{timezone}</span>
              </p>
              <p className="font-mono text-text-muted text-xs mt-0.5">
                You can change this later in your profile.
              </p>
            </div>
          </div>

          {error && (
            <p className="font-mono text-red text-sm animate-fade-in">
              ⚠ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !displayName.trim()}
            className="btn-primary w-full text-base py-3"
          >
            {loading ? "Creating profile..." : "Let's go 🌿"}
          </button>
        </form>

        <p className="font-mono text-text-muted text-xs text-center mt-4 leading-relaxed">
          Welcome to TouchGrass Tracker. You won't touch any grass here, but at
          least you'll know when your friends theoretically could.
        </p>
      </div>
    </div>
  );
}
