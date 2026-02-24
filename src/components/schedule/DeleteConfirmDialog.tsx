interface DeleteConfirmProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DeleteConfirmDialog({
  onConfirm,
  onCancel,
  loading,
}: DeleteConfirmProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-xs bg-bg-surface border border-border-warm rounded-2xl shadow-2xl animate-fade-in p-5">
        <div className="text-3xl text-center mb-3">🗑️</div>
        <h3 className="font-display font-extrabold text-center text-text-primary mb-1">
          Delete event?
        </h3>
        <p className="font-mono text-text-muted text-xs text-center mb-5">
          This can't be undone. Hopefully it wasn't important.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 font-display font-bold text-sm py-2.5 px-5 rounded-lg
                       bg-red/10 text-red border border-red/30
                       hover:bg-red/20 transition-all duration-150
                       disabled:opacity-40"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
