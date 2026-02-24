export function LoadingScreen() {
  return (
    <div className="h-screen w-screen bg-bg-base flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-16 h-16">
          {/* Outer ring spins */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-grass animate-spin" />
          {/* Logo sits still inside */}
          <img
            src="/logo.png"
            alt="TouchGrass Tracker"
            className="absolute inset-1 rounded-full opacity-90"
          />
        </div>
        <span className="font-mono text-text-muted text-xs tracking-widest animate-pulse">
          loading...
        </span>
      </div>
    </div>
  );
}
