interface ShortcutsModalProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "←", desc: "Previous week" },
  { key: "→", desc: "Next week" },
  { key: "T", desc: "Jump to today" },
  { key: "N", desc: "New event" },
  { key: "N", desc: "New event" },
  { key: "?", desc: "Show this modal" },
];

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-base/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-bg-elevated border border-border-warm rounded-2xl p-6 w-full max-w-xs shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-extrabold text-lg text-text-primary">
            Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {SHORTCUTS.map(({ key, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="font-mono text-sm text-text-secondary">
                {desc}
              </span>
              <kbd className="font-mono text-xs bg-bg-card border border-border rounded-md px-2.5 py-1 text-text-primary min-w-[32px] text-center">
                {key}
              </kbd>
            </div>
          ))}
        </div>

        <p className="font-mono text-[10px] text-text-muted mt-5 text-center">
          Press{" "}
          <kbd className="bg-bg-card border border-border rounded px-1">
            Esc
          </kbd>{" "}
          or click outside to close
        </p>
      </div>
    </div>
  );
}
