import { useState, useEffect, useMemo } from "react";
import { format, formatDuration, intervalToDuration, addDays } from "date-fns";
import { useFindTime } from "@/hooks/useFindTime";
import { FreeWindow } from "@/lib/findFreeWindows";

const MIN_DURATION_OPTIONS = [
  { label: "30 min", ms: 30 * 60 * 1000 },
  { label: "1 hour", ms: 60 * 60 * 1000 },
  { label: "2 hours", ms: 120 * 60 * 1000 },
  { label: "3 hours", ms: 180 * 60 * 1000 },
  { label: "Half day", ms: 240 * 60 * 1000 },
];

function formatWindow(w: FreeWindow): {
  day: string;
  time: string;
  duration: string;
} {
  const day = format(w.start, "EEE, MMM d");
  const time = `${format(w.start, "HH:mm")} – ${format(w.end, "HH:mm")}`;
  const dur = intervalToDuration({ start: w.start, end: w.end });
  const duration = formatDuration(dur, { format: ["hours", "minutes"] });
  return { day, time, duration };
}

// Group windows by day label
function groupByDay(
  windows: FreeWindow[],
): { day: string; date: Date; windows: FreeWindow[] }[] {
  const map = new Map<string, { date: Date; windows: FreeWindow[] }>();
  for (const w of windows) {
    const key = format(w.start, "yyyy-MM-dd");
    if (!map.has(key)) map.set(key, { date: w.start, windows: [] });
    map.get(key)!.windows.push(w);
  }
  return Array.from(map.entries()).map(([, v]) => ({
    day: format(v.date, "EEEE, MMM d"),
    date: v.date,
    windows: v.windows,
  }));
}

export function FindTimePage() {
  const { members, results, loading, error, booted, loadMembers, search } =
    useFindTime();

  // Form state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  );
  const [dateTo, setDateTo] = useState(() =>
    format(addDays(new Date(), 6), "yyyy-MM-dd"),
  );
  const [minDuration, setMinDuration] = useState(MIN_DURATION_OPTIONS[1]); // 1 hour default
  const [hasSearched, setHasSearched] = useState(false);

  // Load members on mount
  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Auto-select all members once loaded
  useEffect(() => {
    if (members.length > 0 && selectedIds.size === 0) {
      setSelectedIds(new Set(members.map((m) => m.profile.id)));
    }
  }, [members]);

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSearch = async () => {
    setHasSearched(true);
    await search(
      Array.from(selectedIds),
      new Date(dateFrom + "T00:00:00"),
      new Date(dateTo + "T23:59:59"),
      minDuration.ms,
    );
  };

  const grouped = useMemo(
    () => (results ? groupByDay(results) : []),
    [results],
  );

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-text-primary">
          Find a Time
        </h1>
        <p className="font-mono text-sm text-text-muted mt-1">
          When is everyone actually free?
        </p>
      </div>

      {/* ── Search form ─────────────────────────────────────────────────── */}
      <div className="card flex flex-col gap-5">
        {/* Member selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label">Who's joining?</label>
            <button
              className="font-mono text-[10px] text-text-muted hover:text-grass transition-colors"
              onClick={() => {
                if (selectedIds.size === members.length)
                  setSelectedIds(new Set());
                else setSelectedIds(new Set(members.map((m) => m.profile.id)));
              }}
            >
              {selectedIds.size === members.length
                ? "deselect all"
                : "select all"}
            </button>
          </div>

          {!booted ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 rounded-lg bg-bg-elevated animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {members.map(({ profile }) => {
                const on = selectedIds.has(profile.id);
                return (
                  <button
                    key={profile.id}
                    onClick={() => toggleMember(profile.id)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-150 text-left
                      ${
                        on
                          ? "border-[var(--mc)] bg-[var(--mc)]/10"
                          : "border-border bg-bg-elevated hover:border-border-warm"
                      }
                    `}
                    style={
                      { "--mc": profile.avatar_color } as React.CSSProperties
                    }
                  >
                    <div
                      className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-sm"
                      style={{
                        background: profile.avatar_color + "25",
                        border: `1.5px solid ${on ? profile.avatar_color : "#3a3028"}`,
                      }}
                    >
                      {profile.avatar_emoji}
                    </div>
                    <span
                      className={`font-mono text-sm flex-1 ${on ? "text-text-primary" : "text-text-muted"}`}
                    >
                      {profile.display_name}
                    </span>
                    <span
                      className={`font-mono text-xs transition-opacity ${on ? "opacity-100" : "opacity-0"}`}
                      style={{ color: profile.avatar_color }}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Date range */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="label">From</label>
            <input
              type="date"
              value={dateFrom}
              min={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => {
                setDateFrom(e.target.value);
                if (e.target.value > dateTo) setDateTo(e.target.value);
              }}
              className="input"
            />
          </div>
          <div className="flex-1">
            <label className="label">To</label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => setDateTo(e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Min duration */}
        <div>
          <label className="label">Minimum session length</label>
          <div className="flex gap-2 flex-wrap mt-1">
            {MIN_DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setMinDuration(opt)}
                className={`
                  font-mono text-xs px-3 py-1.5 rounded-lg border transition-all duration-150
                  ${
                    minDuration.ms === opt.ms
                      ? "bg-amber/15 border-amber/40 text-amber"
                      : "bg-bg-elevated border-border text-text-muted hover:border-border-warm hover:text-text-secondary"
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search button */}
        <button
          onClick={handleSearch}
          disabled={loading || selectedIds.size === 0}
          className="btn-primary w-full"
        >
          {loading
            ? "Searching..."
            : `Find windows for ${selectedIds.size} member${selectedIds.size !== 1 ? "s" : ""} →`}
        </button>

        {error && <p className="font-mono text-xs text-red">⚠ {error}</p>}
      </div>

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {hasSearched && !loading && results !== null && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {grouped.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 py-10 text-center">
              <span className="text-4xl">💀</span>
              <p className="font-display font-extrabold text-lg text-text-primary">
                There is literally no time.
              </p>
              <p className="font-mono text-sm text-text-muted">
                GG. Get new friends.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm text-text-secondary">
                  <span className="text-grass font-semibold">
                    {results.length}
                  </span>{" "}
                  window{results.length !== 1 ? "s" : ""} found
                </p>
                <p className="font-mono text-xs text-text-muted">
                  {selectedIds.size} members · {minDuration.label} min
                </p>
              </div>

              {grouped.map(({ day, windows }) => (
                <div key={day} className="flex flex-col gap-2">
                  {/* Day header */}
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-sm text-text-secondary">
                      {day}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                    <span className="font-mono text-[10px] text-text-muted">
                      {windows.length} slot{windows.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Window cards */}
                  {windows.map((w, i) => {
                    const { time, duration } = formatWindow(w);
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl border border-border bg-bg-surface hover:border-grass/30 hover:bg-grass/[0.03] transition-all duration-150 group"
                      >
                        {/* Green bar */}
                        <div className="w-1 self-stretch rounded-full bg-grass/40 group-hover:bg-grass transition-colors" />

                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm text-text-primary">
                            {time}
                          </p>
                          <p className="font-mono text-xs text-text-muted">
                            {duration}
                          </p>
                        </div>

                        {/* Member dots */}
                        <div className="flex -space-x-1.5 shrink-0">
                          {Array.from(selectedIds).map((id) => {
                            const m = members.find((m) => m.profile.id === id);
                            if (!m) return null;
                            return (
                              <div
                                key={id}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] border border-bg-base"
                                style={{
                                  background: m.profile.avatar_color + "30",
                                  borderColor: m.profile.avatar_color + "60",
                                }}
                                title={m.profile.display_name}
                              >
                                {m.profile.avatar_emoji}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
