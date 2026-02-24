import { useState, useMemo } from "react";
import { useCalendarWeek } from "@/hooks/useCalendarWeek";
import { useGroupSchedules } from "@/hooks/useGroupSchedules";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { AllDayBanner } from "@/components/calendar/AllDayBanner";
import { MemberLegend } from "@/components/calendar/MemberLegend";
import { Schedule, Profile } from "@/lib/supabase";

export function CalendarPage() {
  const {
    days,
    weekStart,
    weekEnd,
    monthLabel,
    isCurrentWeek,
    goNext,
    goPrev,
    goToday,
  } = useCalendarWeek();
  const { members, loading, error } = useGroupSchedules(weekStart, weekEnd);

  // Track which members are visible — default all visible
  const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set());
  const [legendOpen, setLegendOpen] = useState(true);

  // Once members load, initialise visibleIds with everyone
  const allIds = useMemo(
    () => new Set(members.map((m) => m.profile.id)),
    [members],
  );
  const effectiveVisible = visibleIds.size === 0 ? allIds : visibleIds;

  const handleToggle = (userId: string) => {
    setVisibleIds((prev) => {
      const next = new Set(prev.size === 0 ? allIds : prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleToggleAll = () => {
    setVisibleIds((prev) => {
      const current = prev.size === 0 ? allIds : prev;
      return current.size === allIds.size ? new Set() : new Set(allIds);
    });
  };

  // All-day events for visible members
  const allDayEvents = useMemo(() => {
    const out: { schedule: Schedule; profile: Profile }[] = [];
    for (const { profile, schedules } of members) {
      if (!effectiveVisible.has(profile.id)) continue;
      for (const s of schedules) {
        if (s.is_all_day) out.push({ schedule: s, profile });
      }
    }
    return out;
  }, [members, effectiveVisible]);

  // Day summary: count members with "available" blocks per day
  const todayFreeCount = useMemo(() => {
    const today = days.find((d) => d.isToday);
    if (!today) return null;
    const free = new Set<string>();
    for (const { profile, schedules } of members) {
      if (!effectiveVisible.has(profile.id)) continue;
      if (
        schedules.some(
          (s) =>
            s.type === "available" &&
            new Date(s.starts_at).toDateString() === today.date.toDateString(),
        )
      ) {
        free.add(profile.id);
      }
    }
    return free.size;
  }, [days, members, effectiveVisible]);

  return (
    <div className="flex h-full">
      {/* ── Member legend sidebar ─────────────────────────────────────────── */}
      {legendOpen && (
        <div className="hidden md:flex flex-col w-44 shrink-0 border-r border-border bg-bg-surface overflow-y-auto">
          {loading ? (
            <div className="p-4 flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-7 rounded bg-bg-elevated animate-pulse"
                />
              ))}
            </div>
          ) : (
            <MemberLegend
              members={members}
              visibleIds={effectiveVisible}
              onToggle={handleToggle}
              onToggleAll={handleToggleAll}
            />
          )}

          {/* Today's free count */}
          {todayFreeCount !== null && todayFreeCount > 0 && (
            <div className="mt-auto px-3 pb-3">
              <div className="bg-grass/10 border border-grass/20 rounded-lg px-2.5 py-2">
                <p className="font-mono text-[10px] text-grass leading-snug">
                  {todayFreeCount} of {members.length} free today 👀
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Main calendar area ────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLegendOpen((o) => !o)}
              className="hidden md:flex w-7 h-7 items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all text-sm"
              title="Toggle member panel"
            >
              ☰
            </button>
            <h1 className="font-display font-extrabold text-xl text-text-primary">
              {monthLabel}
            </h1>
            {!isCurrentWeek && (
              <button
                onClick={goToday}
                className="font-mono text-xs text-grass border border-grass/30 bg-grass/10 px-2.5 py-1 rounded-full hover:bg-grass/20 transition-colors"
              >
                Today
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {error && (
              <span className="font-mono text-xs text-red mr-2">⚠ {error}</span>
            )}
            {loading && (
              <span className="font-mono text-xs text-text-muted mr-2 animate-pulse">
                loading…
              </span>
            )}
            <button
              onClick={goPrev}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all font-mono text-base"
              aria-label="Previous week"
            >
              ‹
            </button>
            <button
              onClick={goNext}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all font-mono text-base"
              aria-label="Next week"
            >
              ›
            </button>
          </div>
        </div>

        {/* All-day banner */}
        <AllDayBanner days={days} events={allDayEvents} />

        {/* Calendar grid */}
        <div className="flex-1 overflow-hidden">
          <CalendarGrid
            days={days}
            members={members}
            visibleIds={effectiveVisible}
          />
        </div>
      </div>
    </div>
  );
}
