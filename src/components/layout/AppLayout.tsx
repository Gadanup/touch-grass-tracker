import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Avatar } from "@/components/ui/Avatar";

const NAV_ITEMS = [
  { to: "/app/calendar", icon: "📅", label: "Calendar" },
  { to: "/app/schedule", icon: "📋", label: "My Schedule" },
  { to: "/app/find", icon: "🔍", label: "Find a Time" },
  { to: "/app/profile", icon: "👤", label: "Profile" },
];

export function AppLayout() {
  const { profile, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [signingOut, setSigningOut] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);

  // Calendar page manages its own scroll/padding — give it the full viewport
  const isCalendar = location.pathname.startsWith("/app/calendar");

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate("/login", { replace: true });
  };

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (next >= 5) {
      setLogoClicks(0);
      triggerConfetti();
    }
  };

  return (
    <div className="h-screen bg-bg-base flex overflow-hidden">
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 bg-bg-surface border-r border-border shrink-0">
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-3 p-4 pb-0 group select-none cursor-pointer"
          aria-label="TouchGrass Tracker"
        >
          <img
            src="/logo.png"
            alt="TGT"
            className="w-10 h-10 transition-transform duration-300 group-hover:rotate-12"
          />
          <div className="text-left">
            <p className="font-display font-extrabold text-sm text-text-primary leading-tight">
              TouchGrass
            </p>
            <p className="font-display font-bold text-xs text-grass leading-tight">
              Tracker
            </p>
          </div>
        </button>

        <nav className="flex-1 px-3 py-6 flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-sm
                 transition-all duration-150 border
                 ${
                   isActive
                     ? "bg-grass/10 text-grass border-grass/20"
                     : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated border-transparent"
                 }`
              }
            >
              <span className="text-base w-5 text-center">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2">
            {profile && <Avatar profile={profile} size="sm" />}
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm text-text-primary truncate">
                {profile?.display_name ?? "..."}
              </p>
              <p className="font-mono text-xs text-text-muted">online</p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="btn-ghost !px-2 !py-1 text-xs"
              title="Sign out"
            >
              {signingOut ? "..." : "↩"}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main
          className={`flex-1 overflow-hidden ${isCalendar ? "" : "overflow-auto p-4 md:p-6 pb-20 md:pb-6"}`}
        >
          <Outlet />
        </main>
      </div>

      {/* ── Mobile bottom nav ────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-surface border-t border-border flex">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 gap-0.5
               font-mono text-xs transition-colors duration-150
               ${isActive ? "text-grass" : "text-text-muted"}`
            }
          >
            <span className="text-lg leading-none">{icon}</span>
            <span>{label.split(" ")[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function triggerConfetti() {
  const emojis = ["🌿", "🎉", "⚡", "🌱", "✨", "🏆"];
  for (let i = 0; i < 40; i++) {
    const el = document.createElement("div");
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.cssText = `
      position:fixed; pointer-events:none; z-index:9999;
      font-size:${12 + Math.random() * 16}px;
      left:${Math.random() * 100}vw; top:-20px; opacity:1;
      transition:
        transform ${1.5 + Math.random() * 1.5}s ease-in,
        opacity   ${1 + Math.random()}s      ${0.5 + Math.random()}s ease-out;
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transform = `translateY(110vh) rotate(${(Math.random() - 0.5) * 720}deg)`;
      el.style.opacity = "0";
    });
    setTimeout(() => el.remove(), 3500);
  }
}
