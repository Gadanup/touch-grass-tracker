import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";

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

function useToast() {
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const show = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, show };
}

export function ProfilePage() {
  const { profile, updateProfile } = useAuthStore();
  const { toast, show } = useToast();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [selectedEmoji, setSelectedEmoji] = useState(
    profile?.avatar_emoji ?? "🌿",
  );
  const [selectedColor, setSelectedColor] = useState(
    profile?.avatar_color ?? "#ea6c1e",
  );
  const [saving, setSaving] = useState(false);

  // Change password
  const [searchParams] = useSearchParams();
  const [showChangePw, setShowChangePw] = useState(
    searchParams.get("changePassword") === "1",
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const pwRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to change password section if redirected from reset email
  useEffect(() => {
    if (searchParams.get("changePassword") === "1" && pwRef.current) {
      setTimeout(
        () =>
          pwRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        300,
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      show("Password must be at least 6 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      show("Passwords do not match.", "error");
      return;
    }
    setPwSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePw(false);
      show("Password updated. 🔒");
    } catch (e: unknown) {
      show(
        e instanceof Error ? e.message : "Failed to update password.",
        "error",
      );
    } finally {
      setPwSaving(false);
    }
  };

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name);
    setSelectedEmoji(profile.avatar_emoji);
    setSelectedColor(profile.avatar_color);
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!profile) return null;

  const previewProfile = {
    display_name: displayName || profile.display_name,
    avatar_url: null, // no image upload — always emoji
    avatar_emoji: selectedEmoji,
    avatar_color: selectedColor,
  };

  const hasChanges =
    displayName.trim() !== profile.display_name ||
    selectedEmoji !== profile.avatar_emoji ||
    selectedColor !== profile.avatar_color;

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      await updateProfile({
        display_name: displayName.trim(),
        avatar_emoji: selectedEmoji,
        avatar_color: selectedColor,
      });
      show("Profile updated. Very cash money. 💸");
    } catch {
      show("Failed to save. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto flex flex-col gap-5 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-text-primary">
          Profile
        </h1>
        <p className="font-mono text-sm text-text-muted mt-0.5">
          How the squad sees you.
        </p>
      </div>

      {/* Avatar + name */}
      <div className="card flex items-center gap-4">
        <Avatar profile={previewProfile} size="lg" />
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={displayName}
            maxLength={32}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input !py-2 font-display font-bold text-base"
            placeholder="Display name…"
          />
          <p className="font-mono text-[11px] text-text-muted mt-1.5">
            {32 - displayName.length} chars left
          </p>
        </div>
      </div>

      {/* Emoji + color */}
      <div className="card flex flex-col gap-4">
        <div>
          <p className="font-mono text-xs text-text-muted uppercase tracking-wider mb-2">
            Emoji
          </p>
          <div className="grid grid-cols-10 gap-1">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setSelectedEmoji(emoji)}
                className={`
                  w-7 h-7 rounded-md text-sm flex items-center justify-center transition-all duration-100
                  ${
                    selectedEmoji === emoji
                      ? "bg-bg-card border-2 border-grass scale-110"
                      : "hover:bg-bg-elevated border border-transparent hover:scale-105"
                  }
                `}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="font-mono text-xs text-text-muted uppercase tracking-wider mb-2">
            Color
          </p>
          <div className="flex gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-7 h-7 rounded-full transition-all duration-150 ${selectedColor === color ? "scale-125 ring-2 ring-white/40" : "hover:scale-110"}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Change password */}
      <div ref={pwRef} className="card flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setShowChangePw((v) => !v)}
          className="flex items-center justify-between w-full"
        >
          <span className="font-mono text-xs text-text-muted uppercase tracking-wider">
            Change password
          </span>
          <span
            className={`font-mono text-xs text-text-muted transition-transform duration-200 ${showChangePw ? "rotate-90" : ""}`}
          >
            ›
          </span>
        </button>

        {showChangePw && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                minLength={6}
                className="input"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Same as above"
                className={`input ${confirmPassword && confirmPassword !== newPassword ? "!border-red" : ""}`}
                autoComplete="new-password"
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="font-mono text-[11px] text-red mt-1">
                  Passwords don't match
                </p>
              )}
            </div>
            <button
              onClick={handleChangePassword}
              disabled={
                pwSaving || !newPassword || newPassword !== confirmPassword
              }
              className="btn-primary w-full"
            >
              {pwSaving ? "Updating…" : "Update password →"}
            </button>
          </div>
        )}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || !hasChanges || !displayName.trim()}
        className="btn-primary w-full"
      >
        {saving ? "Saving…" : hasChanges ? "Save changes →" : "No changes"}
      </button>

      {toast && (
        <div
          className={`
          fixed bottom-6 left-1/2 -translate-x-1/2 z-50
          px-5 py-3 rounded-xl border shadow-xl font-mono text-sm animate-slide-up whitespace-nowrap
          ${toast.type === "success" ? "bg-bg-card border-grass/30 text-grass" : "bg-bg-card border-red/30 text-red"}
        `}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
