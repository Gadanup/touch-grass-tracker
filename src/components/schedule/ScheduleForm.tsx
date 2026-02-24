import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Schedule, ScheduleType, NewSchedulePayload } from "@/lib/supabase";
import { ScheduleTypeTag } from "./ScheduleTypeTag";

interface ScheduleFormProps {
  userId: string;
  initial?: Schedule; // if provided → edit mode
  onSave: (payload: NewSchedulePayload, id?: string) => Promise<void>;
  onClose: () => void;
}

const TYPES: ScheduleType[] = ["busy", "available", "maybe"];
const REPEAT_OPTIONS = [
  { value: "", label: "No repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

// Format a Date to the value format datetime-local expects: "YYYY-MM-DDTHH:mm"
function toInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

function roundToNext30(date: Date): Date {
  const ms = 1000 * 60 * 30;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

export function ScheduleForm({
  userId,
  initial,
  onSave,
  onClose,
}: ScheduleFormProps) {
  const isEdit = !!initial;

  const defaultStart = roundToNext30(new Date());
  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000); // +1h

  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<ScheduleType>(initial?.type ?? "busy");
  const [isAllDay, setIsAllDay] = useState(initial?.is_all_day ?? false);
  const [startStr, setStartStr] = useState(
    initial
      ? toInputValue(new Date(initial.starts_at))
      : toInputValue(defaultStart),
  );
  const [endStr, setEndStr] = useState(
    initial
      ? toInputValue(new Date(initial.ends_at))
      : toInputValue(defaultEnd),
  );
  const [repeatRule, setRepeatRule] = useState(initial?.repeat_rule ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Ensure end is always after start when start changes
  useEffect(() => {
    if (!isAllDay && startStr && endStr && endStr <= startStr) {
      const newEnd = new Date(new Date(startStr).getTime() + 60 * 60 * 1000);
      setEndStr(toInputValue(newEnd));
    }
  }, [startStr]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!isAllDay) {
      if (!startStr || !endStr) {
        setError("Start and end times are required.");
        return;
      }
      if (endStr <= startStr) {
        setError("End must be after start.");
        return;
      }
    }

    setSaving(true);
    try {
      // For all-day events, use date only (midnight UTC)
      const starts_at = isAllDay
        ? new Date(startStr.split("T")[0] + "T00:00:00").toISOString()
        : new Date(startStr).toISOString();
      const ends_at = isAllDay
        ? new Date(startStr.split("T")[0] + "T23:59:59").toISOString()
        : new Date(endStr).toISOString();

      const payload: NewSchedulePayload = {
        user_id: userId,
        title: title.trim() || null,
        type,
        is_all_day: isAllDay,
        starts_at,
        ends_at,
        repeat_rule: repeatRule || null,
        note: note.trim() || null,
      };

      await onSave(payload, initial?.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed.");
      setSaving(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-bg-surface border border-border-warm rounded-2xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display font-extrabold text-lg text-text-primary">
            {isEdit ? "Edit event" : "New event"}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-4">
          {/* Type selector */}
          <div>
            <label className="label">Type</label>
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`
                    flex-1 py-2 rounded-lg border transition-all duration-150 font-mono text-xs
                    ${
                      type === t
                        ? "border-border-warm bg-bg-card scale-[1.02]"
                        : "border-border bg-bg-base hover:border-border-warm"
                    }
                  `}
                >
                  <ScheduleTypeTag type={t} />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="sf-title" className="label">
              Title{" "}
              <span className="text-text-muted font-normal normal-case">
                (optional)
              </span>
            </label>
            <input
              id="sf-title"
              type="text"
              placeholder="e.g. Raid night, Work shift, Gym…"
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
            />
          </div>

          {/* All day toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="font-mono text-sm text-text-secondary">
              All day
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isAllDay}
              onClick={() => setIsAllDay(!isAllDay)}
              style={{ width: 44, height: 24 }}
              className={`
                relative rounded-full transition-colors duration-200 shrink-0
                ${isAllDay ? "bg-grass" : "bg-bg-card border border-border"}
              `}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: isAllDay ? 23 : 3,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "white",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  transition: "left 0.2s",
                }}
              />
            </button>
          </div>

          {/* Date / time inputs */}
          {isAllDay ? (
            <div>
              <label htmlFor="sf-date" className="label">
                Date
              </label>
              <input
                id="sf-date"
                type="date"
                value={startStr.split("T")[0]}
                onChange={(e) => setStartStr(e.target.value + "T00:00")}
                className="input"
                required
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sf-start" className="label">
                  Start
                </label>
                <input
                  id="sf-start"
                  type="datetime-local"
                  value={startStr}
                  onChange={(e) => setStartStr(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label htmlFor="sf-end" className="label">
                  End
                </label>
                <input
                  id="sf-end"
                  type="datetime-local"
                  value={endStr}
                  min={startStr}
                  onChange={(e) => setEndStr(e.target.value)}
                  className="input"
                  required
                />
              </div>
            </div>
          )}

          {/* Repeat rule */}
          <div>
            <label htmlFor="sf-repeat" className="label">
              Repeat
            </label>
            <select
              id="sf-repeat"
              value={repeatRule}
              onChange={(e) => setRepeatRule(e.target.value)}
              className="input"
            >
              {REPEAT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label htmlFor="sf-note" className="label">
              Note{" "}
              <span className="text-text-muted font-normal normal-case">
                (optional)
              </span>
            </label>
            <textarea
              id="sf-note"
              rows={2}
              placeholder="Any extra context…"
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input resize-none"
            />
          </div>

          {error && (
            <p className="font-mono text-red text-xs animate-fade-in">
              ⚠ {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
