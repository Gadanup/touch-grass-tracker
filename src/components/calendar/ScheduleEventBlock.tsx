import { format } from "date-fns";
import { Schedule, ScheduleType } from "@/lib/supabase";

const TYPE_COLORS: Record<
  ScheduleType,
  { bg: string; border: string; text: string }
> = {
  busy: { bg: "rgba(192,57,43,0.18)", border: "#c0392b", text: "#e57373" },
  available: {
    bg: "rgba(127,196,122,0.18)",
    border: "#7fc47a",
    text: "#a3e49e",
  },
  maybe: { bg: "rgba(245,158,11,0.18)", border: "#f59e0b", text: "#fbbf24" },
};

interface ScheduleEventBlockProps {
  schedule: Schedule;
  topPx: number;
  heightPx: number;
  leftPct: number; // 0–100, for overlap offsetting
  widthPct: number; // 0–100
  memberColor: string; // avatar_color of the owner
  memberName: string;
}

export function ScheduleEventBlock({
  schedule,
  topPx,
  heightPx,
  leftPct,
  widthPct,
  memberColor,
  memberName,
}: ScheduleEventBlockProps) {
  const colors = TYPE_COLORS[schedule.type];
  const isShort = heightPx < 32;

  return (
    <div
      className="absolute rounded-md overflow-hidden group cursor-default select-none transition-all duration-100 hover:z-30 hover:brightness-110"
      style={{
        top: topPx + 1,
        height: Math.max(heightPx - 2, 14),
        left: `${leftPct + 1}%`,
        width: `${widthPct - 2}%`,
        background: colors.bg,
        borderLeft: `3px solid ${memberColor}`,
        zIndex: 10,
      }}
      title={`${memberName}: ${schedule.title ?? schedule.type} (${format(new Date(schedule.starts_at), "HH:mm")}–${format(new Date(schedule.ends_at), "HH:mm")})`}
    >
      {/* Tooltip on hover */}
      <div
        className="
        absolute left-full top-0 ml-1 z-50 hidden group-hover:flex
        flex-col gap-0.5 min-w-max
        bg-bg-card border border-border-warm rounded-lg px-2.5 py-2
        shadow-xl pointer-events-none
      "
      >
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: memberColor }}
          />
          <span className="font-mono text-xs text-text-primary font-semibold">
            {memberName}
          </span>
        </div>
        {schedule.title && (
          <span className="font-mono text-xs text-text-secondary">
            {schedule.title}
          </span>
        )}
        <span className="font-mono text-[10px] text-text-muted">
          {format(new Date(schedule.starts_at), "HH:mm")} –{" "}
          {format(new Date(schedule.ends_at), "HH:mm")}
        </span>
        {schedule.note && (
          <span className="font-mono text-[10px] text-text-muted italic mt-0.5 max-w-[160px] line-clamp-2">
            {schedule.note}
          </span>
        )}
        <span
          style={{ color: colors.text }}
          className="font-mono text-[10px] capitalize mt-0.5"
        >
          {schedule.type}
        </span>
      </div>

      {!isShort && (
        <div className="px-1.5 py-1 h-full flex flex-col justify-start overflow-hidden">
          <span
            className="font-mono text-[10px] leading-tight"
            style={{ color: colors.text }}
          >
            {schedule.title ?? schedule.type}
          </span>
          {heightPx > 44 && (
            <span className="font-mono text-[9px] text-text-muted leading-tight mt-0.5">
              {format(new Date(schedule.starts_at), "HH:mm")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
