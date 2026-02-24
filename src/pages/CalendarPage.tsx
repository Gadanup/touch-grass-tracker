import { useState, useMemo, useEffect, useCallback } from "react";
import { useCalendarWeek } from "@/hooks/useCalendarWeek";
import { useGroupSchedules } from "@/hooks/useGroupSchedules";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { AllDayBanner } from "@/components/calendar/AllDayBanner";
import { MemberLegend } from "@/components/calendar/MemberLegend";
import { ShortcutsModal } from "@/components/calendar/ShortcutsModal";
import { ScheduleForm } from "@/components/schedule/ScheduleForm";
import { useScheduleStore } from "@/stores/scheduleStore";
import { NewSchedulePayload } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
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
  const { members, loading, error, refetch } = useGroupSchedules(
    weekStart,
    weekEnd,
  );

  const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set());
  const [legendOpen, setLegendOpen] = useState(true);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState<{ date: Date; hour: number } | null>(
    null,
  );

  const { addSchedule, addBulk, deleteSchedule } = useScheduleStore();
  const { profile } = useAuthStore();

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

  const handleSlotClick = (date: Date, hour: number) => {
    setQuickAdd({ date, hour });
  };

  const handleQuickSave = async (payloads: NewSchedulePayload[]) => {
    if (payloads.length === 1) await addSchedule(payloads[0]);
    else await addBulk(payloads);
    await refetch();
  };

  const handleDeleteEvent = async (id: string) => {
    await deleteSchedule(id);
    await refetch();
  };

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't fire when typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goPrev();
          break;
        case "ArrowRight":
          e.preventDefault();
          goNext();
          break;
        case "t":
        case "T":
          goToday();
          break;
        case "?":
          setShortcutsOpen((o) => !o);
          break;
        case "Escape":
          setShortcutsOpen(false);
          setQuickAdd(null);
          break;
        case "n":
        case "N":
          if (!quickAdd)
            setQuickAdd({ date: new Date(), hour: new Date().getHours() });
          break;
      }
    },
    [goPrev, goNext, goToday],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex h-full">
      {/* Member legend sidebar */}
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

      {/* Main calendar area */}
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
              onClick={() => setShortcutsOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all font-mono text-xs"
              title="Keyboard shortcuts (?)"
            >
              ?
            </button>
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

        <AllDayBanner days={days} events={allDayEvents} />

        <div className="flex-1 overflow-hidden">
          <CalendarGrid
            days={days}
            members={members}
            visibleIds={effectiveVisible}
            currentUserId={profile?.id}
            onSlotClick={handleSlotClick}
            onDeleteEvent={handleDeleteEvent}
          />
        </div>
      </div>

      {quickAdd && profile && (
        <ScheduleForm
          userId={profile.id}
          prefillDate={quickAdd.date}
          prefillHour={quickAdd.hour}
          onSave={handleQuickSave}
          onClose={() => setQuickAdd(null)}
        />
      )}

      {shortcutsOpen && (
        <ShortcutsModal onClose={() => setShortcutsOpen(false)} />
      )}
    </div>
  );
}
