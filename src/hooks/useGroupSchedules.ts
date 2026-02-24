import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, Profile, Schedule } from "@/lib/supabase";
import { expandRepeatingSchedules } from "@/lib/expandRepeatingSchedules";
import { useToastStore } from "@/stores/toastStore";
import { useAuthStore } from "@/stores/authStore";

export interface MemberWithSchedules {
  profile: Profile;
  schedules: Schedule[];
}

const REALTIME_MSGS = (
  name: string,
  action: "added" | "updated" | "deleted",
) => {
  const msgs = {
    added: [
      `${name} just blocked out some time. Rude.`,
      `${name} added an event. There goes the weekend.`,
      `${name} updated their schedule. As if on purpose.`,
    ],
    updated: [
      `${name} changed something. Classic.`,
      `${name} moved their schedule around. Chaotic.`,
      `${name} updated an event. No warning. None.`,
    ],
    deleted: [
      `${name} freed up some time. Suspicious.`,
      `${name} deleted an event. Who knows why.`,
      `${name} cleared a block. Unplanned availability detected.`,
    ],
  };
  const list = msgs[action];
  return list[Math.floor(Math.random() * list.length)];
};

export function useGroupSchedules(rangeStart: Date, rangeEnd: Date) {
  const [members, setMembers] = useState<MemberWithSchedules[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pushToast = useToastStore((s) => s.push);
  const currentUser = useAuthStore((s) => s.profile);
  const membersRef = useRef<MemberWithSchedules[]>([]);
  membersRef.current = members;

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .order("display_name");
      if (pErr) throw pErr;

      const { data: schedules, error: sErr } = await supabase
        .from("schedules")
        .select("*")
        .lte("starts_at", rangeEnd.toISOString())
        .gte("ends_at", rangeStart.toISOString());
      if (sErr) throw sErr;

      const byUser = new Map<string, Schedule[]>();
      for (const s of schedules ?? []) {
        const arr = byUser.get(s.user_id) ?? [];
        arr.push(s as Schedule);
        byUser.set(s.user_id, arr);
      }

      setMembers(
        (profiles ?? []).map((p) => ({
          profile: p as Profile,
          schedules: expandRepeatingSchedules(
            byUser.get(p.id) ?? [],
            rangeStart,
            rangeEnd,
          ),
        })),
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }, [rangeStart.toISOString(), rangeEnd.toISOString()]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch();
  }, [fetch]);

  // ── Realtime ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("schedules-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "schedules" },
        (payload) => {
          const record = (payload.new ?? payload.old) as Schedule | null;
          const userId = record?.user_id;

          if (userId && userId !== currentUser?.id) {
            const name =
              membersRef.current.find((m) => m.profile.id === userId)?.profile
                .display_name ?? "Someone";
            const action =
              payload.eventType === "INSERT"
                ? "added"
                : payload.eventType === "DELETE"
                  ? "deleted"
                  : "updated";
            pushToast(REALTIME_MSGS(name, action));
          }
          fetch();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetch, currentUser?.id, pushToast]);

  return { members, loading, error, refetch: fetch };
}
