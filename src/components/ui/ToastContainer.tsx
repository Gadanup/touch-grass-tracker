import { useToastStore } from "@/stores/toastStore";

export function ToastContainer() {
  const { toasts, remove } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            pointer-events-auto flex items-center gap-3
            px-4 py-3 rounded-xl border shadow-xl
            font-mono text-sm animate-slide-up max-w-xs
            ${
              t.type === "success"
                ? "bg-bg-card border-grass/30 text-grass"
                : t.type === "error"
                  ? "bg-bg-card border-red/30   text-red"
                  : "bg-bg-card border-border-warm text-text-secondary"
            }
          `}
        >
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            className="text-text-muted hover:text-text-primary transition-colors shrink-0 text-xs"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
