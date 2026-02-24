import { format, isSameDay } from "date-fns";
import { Schedule } from "@/lib/supabase";
import { ScheduleTypeTag } from "./ScheduleTypeTag";

interface ScheduleBlockProps {
  schedule: Schedule;
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
}

const TYPE_LEFT_BORDER: Record<string, string> = {
  busy: "border-l-red",
  available: "border-l-grass",
  maybe: "border-l-amber",
};

export function ScheduleBlock({
  schedule,
  onEdit,
  onDelete,
}: ScheduleBlockProps) {
  const start = new Date(schedule.starts_at);
  const end = new Date(schedule.ends_at);

  const timeLabel = schedule.is_all_day
    ? "All day"
    : isSameDay(start, end)
      ? `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`
      : `${format(start, "MMM d, HH:mm")} – ${format(end, "MMM d, HH:mm")}`;

  const dateLabel = schedule.is_all_day
    ? format(start, "EEE, MMM d")
    : format(start, "EEE, MMM d");

  return (
    <div
      className={`
        card !p-0 flex overflow-hidden
        border-l-4 ${TYPE_LEFT_BORDER[schedule.type]}
        hover:border-border-warm transition-colors duration-150 group
      `}
    >
      <div className="flex-1 px-4 py-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {schedule.title && (
              <p className="font-display font-bold text-sm text-text-primary truncate">
                {schedule.title}
              </p>
            )}
            <p className="font-mono text-xs text-text-muted mt-0.5">
              {dateLabel} · {timeLabel}
            </p>
            {schedule.note && (
              <p className="font-mono text-xs text-text-secondary mt-1 line-clamp-2">
                {schedule.note}
              </p>
            )}
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <ScheduleTypeTag type={schedule.type} size="sm" />
            {schedule.repeat_rule && (
              <span className="font-mono text-[10px] text-text-muted">
                ↻ {schedule.repeat_rule}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons — visible on hover */}
      <div className="flex flex-col border-l border-border opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={() => onEdit(schedule)}
          className="flex-1 px-3 text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors text-sm"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(schedule.id)}
          className="flex-1 px-3 text-text-muted hover:text-red hover:bg-red/5 transition-colors text-sm border-t border-border"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
