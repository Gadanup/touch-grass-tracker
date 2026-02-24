// Placeholder pages — replaced phase by phase.
// Phase 2 ✅ MySchedulePage  → src/pages/MySchedulePage.tsx
// Phase 3 ✅ CalendarPage    → src/pages/CalendarPage.tsx
// Phase 4 ✅ FindTimePage    → src/pages/FindTimePage.tsx

export function ProfilePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center animate-fade-in">
      <span className="text-5xl">👤</span>
      <h1 className="font-display font-extrabold text-2xl text-text-primary">
        Profile
      </h1>
      <p className="font-mono text-text-muted text-sm">Coming in Phase 5.</p>
    </div>
  );
}
