import { useState, useEffect, useCallback } from "react";
import { supabase, Profile, Schedule } from "@/lib/supabase";
import { expandRepeatingSchedules } from "@/lib/expandRepeatingSchedules";

export interface MemberWithSchedules {
  profile: Profile;
  schedules: Schedule[]; // already expanded for the current week
}

export function useGroupSchedules(rangeStart: Date, rangeEnd: Date) {
  const [members, setMembers] = useState<MemberWithSchedules[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch all profiles
      const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("*")
        .order("display_name");

      if (profilesErr) throw profilesErr;

      // 2. Fetch all schedules that could overlap this week
      //    (we cast a wide net — any schedule starting before rangeEnd
      //     and ending after rangeStart)
      const { data: schedules, error: schedulesErr } = await supabase
        .from("schedules")
        .select("*")
        .lte("starts_at", rangeEnd.toISOString())
        .gte("ends_at", rangeStart.toISOString());

      if (schedulesErr) throw schedulesErr;

      // 3. Group schedules by user_id and expand repeating ones
      const schedulesByUser = new Map<string, Schedule[]>();
      for (const s of schedules ?? []) {
        const arr = schedulesByUser.get(s.user_id) ?? [];
        arr.push(s as Schedule);
        schedulesByUser.set(s.user_id, arr);
      }

      const result: MemberWithSchedules[] = (profiles ?? []).map((p) => ({
        profile: p as Profile,
        schedules: expandRepeatingSchedules(
          schedulesByUser.get(p.id) ?? [],
          rangeStart,
          rangeEnd,
        ),
      }));

      setMembers(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }, [rangeStart.toISOString(), rangeEnd.toISOString()]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { members, loading, error, refetch: fetch };
}
