import {
  addDays,
  addWeeks,
  isBefore,
  isAfter,
  differenceInMilliseconds,
} from "date-fns";
import { Schedule } from "@/lib/supabase";

/**
 * Expands repeating schedules into concrete instances within [rangeStart, rangeEnd].
 * Returns a flat array of Schedule-like objects (with synthetic ids for repeated instances).
 */
export function expandRepeatingSchedules(
  schedules: Schedule[],
  rangeStart: Date,
  rangeEnd: Date,
): Schedule[] {
  const result: Schedule[] = [];

  for (const s of schedules) {
    const start = new Date(s.starts_at);
    const end = new Date(s.ends_at);
    const duration = differenceInMilliseconds(end, start);

    if (!s.repeat_rule) {
      // Non-repeating: include if it overlaps the range at all
      if (!isAfter(start, rangeEnd) && !isBefore(end, rangeStart)) {
        result.push(s);
      }
      continue;
    }

    // Generate repeated instances
    let cursor = new Date(start);
    let i = 0;

    while (!isAfter(cursor, rangeEnd) && i < 500) {
      i++;
      const instanceEnd = new Date(cursor.getTime() + duration);

      // Include if overlaps range
      if (!isBefore(instanceEnd, rangeStart)) {
        result.push({
          ...s,
          id: `${s.id}_r${i}`,
          starts_at: cursor.toISOString(),
          ends_at: instanceEnd.toISOString(),
        });
      }

      if (s.repeat_rule === "daily") {
        cursor = addDays(cursor, 1);
        continue;
      }
      if (s.repeat_rule === "weekly") {
        cursor = addWeeks(cursor, 1);
        continue;
      }
      break; // unknown rule — don't loop forever
    }
  }

  return result;
}
