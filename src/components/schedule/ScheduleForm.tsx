import { useState } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { Schedule, ScheduleType, NewSchedulePayload } from "@/lib/supabase";
import { ScheduleTypeTag } from "./ScheduleTypeTag";

interface ScheduleFormProps {
  userId: string;
  initial?: Schedule; // edit mode
  prefillDate?: Date; // quick-add from calendar click
  prefillHour?: number; // quick-add from calendar click
  onSave: (payloads: NewSchedulePayload[], id?: string) => Promise<void>;
  onClose: () => void;
}

const TYPES: ScheduleType[] = ["busy", "available", "maybe"];

const TYPE_META: Record<
  ScheduleType,
  { label: string; icon: string; desc: string }
> = {
  busy: { icon: "🔴", label: "Busy", desc: "Not available" },
  available: { icon: "🟢", label: "Available", desc: "Free to play" },
  maybe: { icon: "🟡", label: "Maybe", desc: "Possibly around" },
};

// Generate 24h time options in 30-min steps
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
    .toString()
    .padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

function getWeekDays(anchor: Date): Date[] {
  const monday = startOfWeek(anchor, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function ScheduleForm({
  userId,
  initial,
  prefillDate,
  prefillHour,
  onSave,
  onClose,
}: ScheduleFormProps) {
  const isEdit = !!initial;

  // ── Defaults ──────────────────────────────────────────────────────────────
  const defaultDate =
    prefillDate ?? (initial ? new Date(initial.starts_at) : new Date());
  const defaultStart = initial
    ? format(new Date(initial.starts_at), "HH:mm")
    : prefillHour != null
      ? `${String(prefillHour).padStart(2, "0")}:00`
      : "09:00";
  const defaultEnd = initial
    ? format(new Date(initial.ends_at), "HH:mm")
    : prefillHour != null
      ? `${String(Math.min(prefillHour + 1, 23)).padStart(2, "0")}:00`
      : "17:00";

  // ── State ──────────────────────────────────────────────────────────────────
  const [type, setType] = useState<ScheduleType>(initial?.type ?? "busy");
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [isAllDay, setIsAllDay] = useState(initial?.is_all_day ?? false);
  const [selectedDays, setSelectedDays] = useState<Date[]>([defaultDate]);
  const [weekAnchor, setWeekAnchor] = useState(defaultDate);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [repeatRule, setRepeatRule] = useState(initial?.repeat_rule ?? "");
  const [showAdvanced, setShowAdvanced] = useState(
    !!(initial?.title || initial?.note || initial?.repeat_rule),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const weekDays = getWeekDays(weekAnchor);

  // ── Day selection ──────────────────────────────────────────────────────────
  const toggleDay = (day: Date) => {
    if (isEdit) return; // edit mode: single day only
    setSelectedDays((prev) => {
      const already = prev.some((d) => isSameDay(d, day));
      if (already)
        return prev.length === 1
          ? prev
          : prev.filter((d) => !isSameDay(d, day));
      return [...prev, day];
    });
  };

  const isSelected = (day: Date) => selectedDays.some((d) => isSameDay(d, day));

  // Prev/next week navigation for the day picker
  const shiftWeek = (dir: -1 | 1) => setWeekAnchor((a) => addDays(a, dir * 7));

  // ── Validation ────────────────────────────────────────────────────────────
  const endAfterStart = isAllDay || startTime < endTime;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isAllDay && startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }
    if (selectedDays.length === 0) {
      setError("Select at least one day.");
      return;
    }

    setSaving(true);
    try {
      const payloads: NewSchedulePayload[] = selectedDays.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        return {
          user_id: userId,
          title: title.trim() || null,
          type,
          is_all_day: isAllDay,
          starts_at: isAllDay
            ? new Date(`${dateStr}T00:00:00`).toISOString()
            : new Date(`${dateStr}T${startTime}:00`).toISOString(),
          ends_at: isAllDay
            ? new Date(`${dateStr}T23:59:59`).toISOString()
            : new Date(`${dateStr}T${endTime}:00`).toISOString(),
          repeat_rule: repeatRule || null,
          note: note.trim() || null,
        };
      });

      await onSave(payloads, initial?.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed.");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-md bg-bg-surface border border-border-warm rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-bg-surface z-10">
          <h2 className="font-display font-extrabold text-lg text-text-primary">
            {isEdit ? "Edit event" : "New event"}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-elevated text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-5 py-5">
          {/* ── Step 1: Type ───────────────────────────────────────────── */}
          <div className="flex gap-2">
            {TYPES.map((t) => {
              const meta = TYPE_META[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`
                    flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all duration-150
                    ${
                      type === t
                        ? "border-border-warm bg-bg-card scale-[1.03]"
                        : "border-transparent bg-bg-elevated hover:border-border hover:scale-[1.01]"
                    }
                  `}
                >
                  <span className="text-xl leading-none">{meta.icon}</span>
                  <span className="font-mono text-xs font-semibold text-text-primary">
                    {meta.label}
                  </span>
                  <span className="font-mono text-[10px] text-text-muted">
                    {meta.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Step 2: Time ───────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-xs text-text-muted uppercase tracking-wider">
                Time
              </p>
              {/* All day toggle inline */}
              <button
                type="button"
                onClick={() => setIsAllDay((v) => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono transition-all duration-150 ${
                  isAllDay
                    ? "bg-grass/15 border-grass/40 text-grass"
                    : "bg-bg-elevated border-border text-text-muted hover:border-border-warm"
                }`}
              >
                <span>{isAllDay ? "✓" : "○"}</span>
                All day
              </button>
            </div>

            {!isAllDay && (
              <div className="flex items-center gap-2">
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input flex-1 !py-2.5 font-mono text-sm"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <span className="text-text-muted font-mono text-sm shrink-0">
                  →
                </span>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`input flex-1 !py-2.5 font-mono text-sm ${!endAfterStart ? "border-red" : ""}`}
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {!endAfterStart && (
              <p className="font-mono text-[11px] text-red mt-1">
                End must be after start
              </p>
            )}
          </div>

          {/* ── Step 3: Day picker ─────────────────────────────────────── */}
          {!isEdit && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-mono text-xs text-text-muted uppercase tracking-wider">
                  {selectedDays.length > 1
                    ? `${selectedDays.length} days selected`
                    : "Day"}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => shiftWeek(-1)}
                    className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-text-primary font-mono text-sm rounded hover:bg-bg-elevated transition-colors"
                  >
                    ‹
                  </button>
                  <span className="font-mono text-[11px] text-text-muted px-1">
                    {format(weekDays[0], "MMM d")} – {format(weekDays[6], "d")}
                  </span>
                  <button
                    type="button"
                    onClick={() => shiftWeek(1)}
                    className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-text-primary font-mono text-sm rounded hover:bg-bg-elevated transition-colors"
                  >
                    ›
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day) => {
                  const today = isSameDay(day, new Date());
                  const selected = isSelected(day);
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`
                        flex flex-col items-center gap-0.5 py-2 rounded-lg border-2 transition-all duration-100
                        ${
                          selected
                            ? "border-grass bg-grass/15 scale-[1.05]"
                            : "border-transparent bg-bg-elevated hover:border-border hover:scale-[1.02]"
                        }
                      `}
                    >
                      <span className="font-mono text-[9px] text-text-muted uppercase">
                        {format(day, "EEE")[0]}
                      </span>
                      <span
                        className={`
                        font-display font-bold text-sm leading-none w-6 h-6 flex items-center justify-center rounded-full
                        ${selected ? "text-grass" : today ? "bg-grass/20 text-grass" : "text-text-secondary"}
                      `}
                      >
                        {format(day, "d")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Edit mode: show the single date */}
          {isEdit && (
            <div>
              <p className="font-mono text-xs text-text-muted uppercase tracking-wider mb-2">
                Date
              </p>
              <div className="input !py-2.5 font-mono text-sm text-text-secondary bg-bg-card">
                {format(new Date(initial!.starts_at), "EEEE, MMM d yyyy")}
              </div>
            </div>
          )}

          {/* ── Advanced (collapsed by default) ───────────────────────── */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-2 font-mono text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              <span
                className={`transition-transform duration-200 ${showAdvanced ? "rotate-90" : ""}`}
              >
                ›
              </span>
              Advanced options
            </button>

            {showAdvanced && (
              <div className="flex flex-col gap-4 mt-3 animate-fade-in">
                {/* Title */}
                <div>
                  <label className="label">
                    Title{" "}
                    <span className="text-text-muted font-normal normal-case">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Work shift, Raid night, Gym…"
                    maxLength={80}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input"
                  />
                </div>

                {/* Repeat */}
                <div>
                  <label className="label">Repeat</label>
                  <div className="flex gap-2">
                    {[
                      ["", "None"],
                      ["daily", "Daily"],
                      ["weekly", "Weekly"],
                    ].map(([val, lbl]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setRepeatRule(val)}
                        className={`flex-1 py-2 rounded-lg border font-mono text-xs transition-all duration-150 ${
                          repeatRule === val
                            ? "border-amber/40 bg-amber/10 text-amber"
                            : "border-border bg-bg-elevated text-text-muted hover:border-border-warm"
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="label">
                    Note{" "}
                    <span className="text-text-muted font-normal normal-case">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Any extra context…"
                    maxLength={200}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="input resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="font-mono text-red text-xs animate-fade-in">
              ⚠ {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !endAfterStart}
              className="btn-primary flex-1"
            >
              {saving
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : selectedDays.length > 1
                    ? `Add ${selectedDays.length} events`
                    : "Add event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
