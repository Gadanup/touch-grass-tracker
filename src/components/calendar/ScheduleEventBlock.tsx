import { useState } from "react";
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
  leftPct: number;
  widthPct: number;
  memberColor: string;
  memberName: string;
  isOwn: boolean; // only show delete for own events
  onDelete?: (id: string) => void; // called after confirmation
}

export function ScheduleEventBlock({
  schedule,
  topPx,
  heightPx,
  leftPct,
  widthPct,
  memberColor,
  memberName,
  isOwn,
  onDelete,
}: ScheduleEventBlockProps) {
  const colors = TYPE_COLORS[schedule.type];
  const isShort = heightPx < 32;
  const [confirming, setConfirming] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirming(true);
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(schedule.id);
    setConfirming(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirming(false);
  };

  return (
    <div
      className="absolute rounded-md overflow-visible group cursor-default select-none transition-all duration-100 hover:z-30 hover:brightness-110"
      style={{
        top: topPx + 1,
        height: Math.max(heightPx - 2, 14),
        left: `${leftPct + 1}%`,
        width: `${widthPct - 2}%`,
        background: colors.bg,
        borderLeft: `3px solid ${memberColor}`,
        zIndex: 10,
      }}
    >
      {/* ── Confirm delete popover ─────────────────────────────────────── */}
      {confirming && (
        <div
          className="absolute left-full top-0 ml-1.5 z-50 flex flex-col gap-2 min-w-max bg-bg-card border border-red/30 rounded-xl px-3 py-2.5 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="font-mono text-xs text-text-primary">
            Delete this event?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-bg-elevated border border-border text-text-muted hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-red/15 border border-red/30 text-red hover:bg-red/25 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* ── Hover tooltip ─────────────────────────────────────────────── */}
      {!confirming && (
        <div className="absolute left-full top-0 ml-1 z-50 hidden group-hover:flex flex-col gap-0.5 min-w-max bg-bg-card border border-border-warm rounded-lg px-2.5 py-2 shadow-xl pointer-events-none">
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
          {isOwn && (
            <span className="font-mono text-[10px] text-text-muted mt-1 border-t border-border pt-1">
              click to delete
            </span>
          )}
        </div>
      )}

      {/* ── Block body ────────────────────────────────────────────────── */}
      <div
        className="h-full w-full overflow-hidden rounded-md"
        onClick={isOwn ? handleDeleteClick : undefined}
        style={{ cursor: isOwn ? "pointer" : "default" }}
      >
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
    </div>
  );
}
