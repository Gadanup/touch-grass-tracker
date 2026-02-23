import { Profile } from "@/lib/supabase";

interface AvatarProps {
  profile: Pick<
    Profile,
    "display_name" | "avatar_url" | "avatar_emoji" | "avatar_color"
  >;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE = {
  xs: { wrap: "w-6 h-6 text-xs", img: "w-6 h-6" },
  sm: { wrap: "w-8 h-8 text-sm", img: "w-8 h-8" },
  md: { wrap: "w-10 h-10 text-lg", img: "w-10 h-10" },
  lg: { wrap: "w-16 h-16 text-3xl", img: "w-16 h-16" },
};

export function Avatar({ profile, size = "md", className = "" }: AvatarProps) {
  const { wrap, img } = SIZE[size];

  // Priority 1 — uploaded image
  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.display_name}
        className={`${img} rounded-full object-cover border border-border-warm shrink-0 ${className}`}
      />
    );
  }

  // Priority 2 — emoji  |  Priority 3 — initials + color
  const initials = profile.display_name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`${wrap} rounded-full flex items-center justify-center shrink-0 border-2 select-none ${className}`}
      style={{
        backgroundColor: profile.avatar_color + "30",
        borderColor: profile.avatar_color,
      }}
      aria-label={profile.display_name}
    >
      {profile.avatar_emoji ? (
        <span role="img" aria-hidden="true">
          {profile.avatar_emoji}
        </span>
      ) : (
        <span
          className="font-display font-bold leading-none"
          style={{ color: profile.avatar_color, fontSize: "0.65em" }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
