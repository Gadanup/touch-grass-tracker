import { useState, useCallback } from "react";
import { addDays, startOfDay, endOfDay } from "date-fns";
import { supabase, Profile, Schedule } from "@/lib/supabase";
import { expandRepeatingSchedules } from "@/lib/expandRepeatingSchedules";
import { findFreeWindows, FreeWindow } from "@/lib/findFreeWindows";

export interface FindTimeMember {
  profile: Profile;
  schedules: Schedule[];
}

export interface FindTimeResult {
  windows: FreeWindow[];
  members: FindTimeMember[];
}

export function useFindTime() {
  const [members, setMembers] = useState<FindTimeMember[]>([]);
  const [results, setResults] = useState<FreeWindow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booted, setBooted] = useState(false);

  /** Initial load — fetch all profiles */
  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("display_name");
      if (error) throw error;
      setMembers(
        (data ?? []).map((p) => ({ profile: p as Profile, schedules: [] })),
      );
      setBooted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, []);

  /** Run the search */
  const search = useCallback(
    async (
      selectedUserIds: string[],
      dateFrom: Date,
      dateTo: Date,
      minDurationMs: number,
    ) => {
      if (selectedUserIds.length === 0) return;
      setLoading(true);
      setError(null);
      setResults(null);

      try {
        const rangeStart = startOfDay(dateFrom);
        const rangeEnd = endOfDay(dateTo);

        // Fetch schedules for selected users only, in the date range
        const { data: schedules, error: sErr } = await supabase
          .from("schedules")
          .select("*")
          .in("user_id", selectedUserIds)
          .lte("starts_at", rangeEnd.toISOString())
          .gte("ends_at", rangeStart.toISOString());

        if (sErr) throw sErr;

        // Group + expand repeating schedules
        const byUser = new Map<string, Schedule[]>();
        for (const s of schedules ?? []) {
          const arr = byUser.get(s.user_id) ?? [];
          arr.push(s as Schedule);
          byUser.set(s.user_id, arr);
        }

        const memberSchedules = selectedUserIds.map((id) => ({
          userId: id,
          schedules: expandRepeatingSchedules(
            byUser.get(id) ?? [],
            rangeStart,
            rangeEnd,
          ),
        }));

        // Search day-by-day 08:00–23:00
        const allWindows: FreeWindow[] = [];
        let dayCursor = new Date(rangeStart);

        while (dayCursor <= rangeEnd) {
          const dayStart = new Date(dayCursor);
          dayStart.setHours(8, 0, 0, 0);
          const dayEnd = new Date(dayCursor);
          dayEnd.setHours(23, 0, 0, 0);

          const wins = findFreeWindows(
            memberSchedules,
            selectedUserIds,
            dayStart,
            dayEnd,
            minDurationMs,
          );
          allWindows.push(...wins);
          dayCursor = addDays(dayCursor, 1);
        }

        setResults(allWindows);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { members, results, loading, error, booted, loadMembers, search };
}
