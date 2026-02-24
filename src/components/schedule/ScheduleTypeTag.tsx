import { ScheduleType } from "@/lib/supabase";

interface ScheduleTypeTagProps {
  type: ScheduleType;
  size?: "sm" | "md";
}

const CONFIG: Record<
  ScheduleType,
  { label: string; icon: string; classes: string }
> = {
  busy: {
    label: "Busy",
    icon: "🔴",
    classes: "bg-red/10 text-red border-red/30",
  },
  available: {
    label: "Available",
    icon: "🟢",
    classes: "bg-grass/10 text-grass border-grass/30",
  },
  maybe: {
    label: "Maybe",
    icon: "🟡",
    classes: "bg-amber/10 text-amber border-amber/30",
  },
};

export function ScheduleTypeTag({ type, size = "md" }: ScheduleTypeTagProps) {
  const { label, icon, classes } = CONFIG[type];
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-mono border rounded-full
        ${size === "sm" ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-0.5"}
        ${classes}
      `}
    >
      <span className="text-[10px]" aria-hidden="true">
        {icon}
      </span>
      {label}
    </span>
  );
}
