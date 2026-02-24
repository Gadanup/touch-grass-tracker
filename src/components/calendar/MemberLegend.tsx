import { MemberWithSchedules } from "@/hooks/useGroupSchedules";

interface MemberLegendProps {
  members: MemberWithSchedules[];
  visibleIds: Set<string>;
  onToggle: (userId: string) => void;
  onToggleAll: () => void;
}

export function MemberLegend({
  members,
  visibleIds,
  onToggle,
  onToggleAll,
}: MemberLegendProps) {
  const allVisible = members.every((m) => visibleIds.has(m.profile.id));

  return (
    <div className="flex flex-col gap-1 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
          Members
        </span>
        <button
          onClick={onToggleAll}
          className="font-mono text-[10px] text-text-muted hover:text-grass transition-colors"
        >
          {allVisible ? "hide all" : "show all"}
        </button>
      </div>

      {members.map(({ profile }) => {
        const visible = visibleIds.has(profile.id);
        return (
          <button
            key={profile.id}
            onClick={() => onToggle(profile.id)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-elevated transition-colors text-left w-full group"
          >
            {/* Color dot / avatar */}
            <div
              className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] transition-opacity"
              style={{
                background: visible ? profile.avatar_color + "30" : "#3a302820",
                border: `1.5px solid ${visible ? profile.avatar_color : "#3a3028"}`,
                opacity: visible ? 1 : 0.45,
              }}
            >
              {profile.avatar_emoji}
            </div>

            <span
              className={`font-mono text-xs truncate transition-colors ${
                visible ? "text-text-secondary" : "text-text-muted"
              }`}
            >
              {profile.display_name}
            </span>

            {/* Checkmark */}
            <span
              className={`ml-auto text-[10px] transition-opacity ${visible ? "opacity-100" : "opacity-0"}`}
              style={{ color: profile.avatar_color }}
            >
              ✓
            </span>
          </button>
        );
      })}
    </div>
  );
}
