import {
  addMinutes,
  areIntervalsOverlapping,
  eachDayOfInterval,
  startOfDay,
  endOfDay,
} from "date-fns";
import { Schedule } from "@/lib/supabase";

export interface FreeWindow {
  start: Date;
  end: Date;
  durationMs: number;
}

interface MemberSchedule {
  userId: string;
  schedules: Schedule[];
}

/**
 * Finds contiguous time windows where ALL selected members are free
 * (i.e. have no "busy" or "maybe" blocks — "available" is fine).
 *
 * Scans in `slotMinutes` increments across [rangeStart, rangeEnd],
 * then merges adjacent free slots into windows of at least `minDurationMs`.
 */
export function findFreeWindows(
  members: MemberSchedule[],
  selectedUserIds: string[],
  rangeStart: Date,
  rangeEnd: Date,
  minDurationMs: number,
  slotMinutes = 30,
): FreeWindow[] {
  if (selectedUserIds.length === 0) return [];

  const selected = members.filter((m) => selectedUserIds.includes(m.userId));

  // Only "busy" and "maybe" block time — "available" does not
  const blockers: { start: Date; end: Date }[] = [];
  for (const member of selected) {
    for (const s of member.schedules) {
      if (s.type === "available") continue;
      blockers.push({ start: new Date(s.starts_at), end: new Date(s.ends_at) });
    }
  }

  // Walk the range in slot increments, testing each slot
  const freeSlots: { start: Date; end: Date }[] = [];
  let cursor = new Date(rangeStart);

  while (cursor < rangeEnd) {
    const slotEnd = addMinutes(cursor, slotMinutes);
    const slotInterval = { start: cursor, end: slotEnd };

    const blocked = blockers.some((b) =>
      areIntervalsOverlapping(
        slotInterval,
        { start: b.start, end: b.end },
        { inclusive: false },
      ),
    );

    if (!blocked) {
      freeSlots.push({ start: new Date(cursor), end: new Date(slotEnd) });
    }

    cursor = slotEnd;
  }

  if (freeSlots.length === 0) return [];

  // Merge adjacent free slots into contiguous windows
  const windows: FreeWindow[] = [];
  let winStart = freeSlots[0].start;
  let winEnd = freeSlots[0].end;

  for (let i = 1; i < freeSlots.length; i++) {
    const slot = freeSlots[i];
    if (slot.start.getTime() === winEnd.getTime()) {
      // Adjacent — extend window
      winEnd = slot.end;
    } else {
      // Gap — save previous window if long enough
      const durationMs = winEnd.getTime() - winStart.getTime();
      if (durationMs >= minDurationMs) {
        windows.push({ start: winStart, end: winEnd, durationMs });
      }
      winStart = slot.start;
      winEnd = slot.end;
    }
  }
  // Flush last window
  const durationMs = winEnd.getTime() - winStart.getTime();
  if (durationMs >= minDurationMs) {
    windows.push({ start: winStart, end: winEnd, durationMs });
  }

  return windows;
}

/** Helper: generate day-bounded search ranges (08:00–23:00) for each day */
export function buildDayRanges(
  rangeStart: Date,
  rangeEnd: Date,
): { start: Date; end: Date }[] {
  return eachDayOfInterval({
    start: startOfDay(rangeStart),
    end: startOfDay(rangeEnd),
  }).map((day) => {
    const s = new Date(day);
    s.setHours(8, 0, 0, 0);
    const e = new Date(day);
    e.setHours(23, 0, 0, 0);
    return { start: s, end: e };
  });
}
