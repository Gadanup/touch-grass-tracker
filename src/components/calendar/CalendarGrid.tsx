import { useRef, useEffect, useMemo } from "react";
import { format, isToday, isSameDay } from "date-fns";
import { CalendarDay } from "@/hooks/useCalendarWeek";
import { MemberWithSchedules } from "@/hooks/useGroupSchedules";
import { Schedule, Profile } from "@/lib/supabase";
import { ScheduleEventBlock } from "./ScheduleEventBlock";

export const HOUR_START = 0; // midnight — full day visible
export const HOUR_END = 23;
export const ROW_HEIGHT = 56;

const HOURS = Array.from(
  { length: HOUR_END - HOUR_START + 1 },
  (_, i) => HOUR_START + i,
);

interface CalendarGridProps {
  days: CalendarDay[];
  members: MemberWithSchedules[];
  visibleIds: Set<string>;
}

interface PositionedEvent {
  schedule: Schedule;
  profile: Profile;
  topPx: number;
  heightPx: number;
  leftPct: number;
  widthPct: number;
}

function layoutDayEvents(
  events: { schedule: Schedule; profile: Profile }[],
): PositionedEvent[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort(
    (a, b) =>
      new Date(a.schedule.starts_at).getTime() -
      new Date(b.schedule.starts_at).getTime(),
  );

  const columns: { schedule: Schedule; profile: Profile }[][] = [];
  for (const ev of sorted) {
    const start = new Date(ev.schedule.starts_at).getTime();
    let placed = false;
    for (const col of columns) {
      const lastEnd = new Date(col[col.length - 1].schedule.ends_at).getTime();
      if (start >= lastEnd) {
        col.push(ev);
        placed = true;
        break;
      }
    }
    if (!placed) columns.push([ev]);
  }

  const totalCols = columns.length;
  const positioned: PositionedEvent[] = [];

  columns.forEach((col, colIdx) => {
    for (const ev of col) {
      const s = new Date(ev.schedule.starts_at);
      const e = new Date(ev.schedule.ends_at);
      const top = Math.max(
        (s.getHours() - HOUR_START + s.getMinutes() / 60) * ROW_HEIGHT,
        0,
      );
      const bot = Math.min(
        (e.getHours() - HOUR_START + e.getMinutes() / 60) * ROW_HEIGHT,
        HOURS.length * ROW_HEIGHT,
      );
      positioned.push({
        schedule: ev.schedule,
        profile: ev.profile,
        topPx: top,
        heightPx: Math.max(bot - top, 14),
        leftPct: (colIdx / totalCols) * 100,
        widthPct: (1 / totalCols) * 100,
      });
    }
  });

  return positioned;
}

export function CalendarGrid({ days, members, visibleIds }: CalendarGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to 8am on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (8 - HOUR_START) * ROW_HEIGHT - 24;
    }
  }, []);

  const now = new Date();
  const nowTopPx =
    (now.getHours() - HOUR_START + now.getMinutes() / 60) * ROW_HEIGHT;

  const allEvents = useMemo(() => {
    const out: { schedule: Schedule; profile: Profile }[] = [];
    for (const { profile, schedules } of members) {
      if (!visibleIds.has(profile.id)) continue;
      for (const s of schedules) {
        if (!s.is_all_day) out.push({ schedule: s, profile });
      }
    }
    return out;
  }, [members, visibleIds]);

  const eventsByDay = useMemo(
    () =>
      days.map((day) =>
        layoutDayEvents(
          allEvents.filter((e) =>
            isSameDay(new Date(e.schedule.starts_at), day.date),
          ),
        ),
      ),
    [days, allEvents],
  );

  return (
    <div className="flex flex-col overflow-hidden h-full">
      {/* Day headers — compact */}
      <div className="flex shrink-0 border-b border-border bg-bg-surface">
        <div className="w-16 shrink-0" />
        {days.map((day) => (
          <div
            key={day.date.toISOString()}
            className="flex-1 flex flex-col items-center py-1.5 gap-0.5 border-l border-border first:border-l-0"
          >
            <span className="font-mono text-xs text-text-muted uppercase tracking-widest ">
              {day.label}
            </span>
            <span
              className={`font-display font-extrabold text-sm leading-none w-8 h-8 flex items-center justify-center rounded-full transition-colors ${day.isToday ? "bg-grass text-bg-base" : "text-text-primary"}`}
            >
              {day.num}
            </span>
          </div>
        ))}
      </div>

      {/* Scrollable grid — fills remaining height exactly */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex" style={{ height: HOURS.length * ROW_HEIGHT }}>
          {/* Time gutter */}
          <div className="w-16 shrink-0 relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full flex items-start justify-end pr-3"
                style={{
                  top: (hour - HOUR_START) * ROW_HEIGHT,
                  height: ROW_HEIGHT,
                }}
              >
                <span className="font-mono text-xs text-text-secondary -mt-[9px] select-none tabular-nums">
                  {format(new Date(2000, 0, 1, hour, 0), "HH:mm")}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex flex-1">
            {days.map((day, di) => (
              <div
                key={day.date.toISOString()}
                className={`flex-1 relative border-l border-border ${isToday(day.date) ? "bg-grass/[0.02]" : ""}`}
              >
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-border/50"
                    style={{ top: (hour - HOUR_START) * ROW_HEIGHT }}
                  />
                ))}
                {HOURS.map((hour) => (
                  <div
                    key={`${hour}-half`}
                    className="absolute w-full border-t border-border/20 border-dashed"
                    style={{
                      top: (hour - HOUR_START) * ROW_HEIGHT + ROW_HEIGHT / 2,
                    }}
                  />
                ))}
                {isToday(day.date) && (
                  <div
                    className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                    style={{ top: nowTopPx }}
                  >
                    <div className="w-2 h-2 rounded-full bg-grass shrink-0 -ml-1" />
                    <div className="flex-1 h-px bg-grass opacity-80" />
                  </div>
                )}
                {eventsByDay[di].map((ev) => (
                  <ScheduleEventBlock
                    key={ev.schedule.id}
                    schedule={ev.schedule}
                    topPx={ev.topPx}
                    heightPx={ev.heightPx}
                    leftPct={ev.leftPct}
                    widthPct={ev.widthPct}
                    memberColor={ev.profile.avatar_color}
                    memberName={ev.profile.display_name}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
