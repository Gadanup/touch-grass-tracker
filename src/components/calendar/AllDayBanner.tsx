import { isSameDay } from "date-fns";
import { Schedule, Profile } from "@/lib/supabase";
import { CalendarDay } from "@/hooks/useCalendarWeek";

interface AllDayBannerProps {
  days: CalendarDay[];
  events: { schedule: Schedule; profile: Profile }[];
}

export function AllDayBanner({ days, events }: AllDayBannerProps) {
  if (events.length === 0) return null;

  return (
    <div className="flex border-b border-border bg-bg-surface shrink-0">
      <div className="w-14 shrink-0 flex items-center justify-end pr-2">
        <span className="font-mono text-[9px] text-text-muted uppercase tracking-wider">
          all day
        </span>
      </div>
      {days.map((day) => {
        const dayEvents = events.filter((e) =>
          isSameDay(new Date(e.schedule.starts_at), day.date),
        );
        return (
          <div
            key={day.date.toISOString()}
            className="flex-1 border-l border-border py-0.5 px-0.5 flex flex-col gap-0.5 min-h-[24px]"
          >
            {dayEvents.map(({ schedule, profile }) => (
              <div
                key={schedule.id}
                className="rounded px-1.5 py-0.5 font-mono text-[10px] leading-tight truncate"
                style={{
                  background: profile.avatar_color + "28",
                  borderLeft: `2px solid ${profile.avatar_color}`,
                  color: profile.avatar_color,
                }}
                title={`${profile.display_name}: ${schedule.title ?? schedule.type}`}
              >
                {schedule.title ?? schedule.type}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
