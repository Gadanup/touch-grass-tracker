import { useEffect, useState } from "react";
import { isPast, isFuture, isToday } from "date-fns";
import { useAuthStore } from "@/stores/authStore";
import { useScheduleStore } from "@/stores/scheduleStore";
import { Schedule } from "@/lib/supabase";
import { ScheduleBlock } from "@/components/schedule/ScheduleBlock";
import { ScheduleForm } from "@/components/schedule/ScheduleForm";
import { DeleteConfirmDialog } from "@/components/schedule/DeleteConfirmDialog";

type Tab = "upcoming" | "past" | "all";

export function MySchedulePage() {
  const { session } = useAuthStore();
  const {
    schedules,
    loading,
    error,
    fetchSchedules,
    addSchedule,
    addBulk,
    updateSchedule,
    deleteSchedule,
  } = useScheduleStore();

  const [tab, setTab] = useState<Tab>("upcoming");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Schedule | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (session?.user.id) fetchSchedules(session.user.id);
  }, [session?.user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = schedules.filter((s) => {
    const start = new Date(s.starts_at);
    if (tab === "upcoming") return isFuture(start) || isToday(start);
    if (tab === "past") return isPast(start) && !isToday(start);
    return true;
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSave = async (payloads: NewSchedulePayload[], id?: string) => {
    if (id && payloads.length === 1) {
      await updateSchedule(id, payloads[0]);
    } else if (payloads.length === 1) {
      await addSchedule(payloads[0]);
    } else {
      await addBulk(payloads);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteSchedule(deleteTarget);
    setDeleting(false);
    setDeleteTarget(null);
  };

  const openEdit = (schedule: Schedule) => {
    setEditTarget(schedule);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(undefined);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-text-primary">
            My Schedule
          </h1>
          <p className="font-mono text-text-muted text-sm mt-0.5">
            {schedules.length === 0
              ? "Nothing here yet."
              : `${schedules.length} event${schedules.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <button
          onClick={() => {
            setEditTarget(undefined);
            setShowForm(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          <span>Add event</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-bg-surface border border-border rounded-lg p-1 mb-5 w-fit">
        {(
          [
            ["upcoming", "Upcoming"],
            ["past", "Past"],
            ["all", "All"],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`
              px-4 py-1.5 rounded-md font-mono text-sm transition-all duration-150
              ${
                tab === t
                  ? "bg-bg-elevated text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="card !border-red/30 !bg-red/5 mb-4">
          <p className="font-mono text-red text-sm">⚠ {error}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-16 animate-pulse bg-bg-elevated" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          tab={tab}
          onAdd={() => {
            setEditTarget(undefined);
            setShowForm(true);
          }}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((s) => (
            <ScheduleBlock
              key={s.id}
              schedule={s}
              onEdit={openEdit}
              onDelete={(id) => setDeleteTarget(id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && session && (
        <ScheduleForm
          userId={session.user.id}
          initial={editTarget}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmDialog
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ tab, onAdd }: { tab: Tab; onAdd: () => void }) {
  const messages: Record<Tab, { emoji: string; title: string; body: string }> =
    {
      upcoming: {
        emoji: "🌿",
        title: "No upcoming events",
        body: "You have no events. Legend. Now go touch grass.",
      },
      past: {
        emoji: "📜",
        title: "No past events",
        body: "Nothing here. Either you're new, or disturbingly consistent.",
      },
      all: {
        emoji: "🕹️",
        title: "No events yet",
        body: "Add your first event and let the squad know when you are busy.",
      },
    };
  const { emoji, title, body } = messages[tab];

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <span className="text-5xl">{emoji}</span>
      <div>
        <h3 className="font-display font-extrabold text-text-primary text-lg">
          {title}
        </h3>
        <p className="font-mono text-text-muted text-sm mt-1 max-w-xs">
          {body}
        </p>
      </div>
      {tab !== "past" && (
        <button onClick={onAdd} className="btn-primary mt-2">
          + Add event
        </button>
      )}
    </div>
  );
}
