import { useState, useMemo } from "react";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isToday,
  isSameDay,
  format,
} from "date-fns";

export interface CalendarDay {
  date: Date;
  label: string; // "Mon"
  num: string; // "24"
  isToday: boolean;
}

export function useCalendarWeek() {
  const [anchor, setAnchor] = useState(() => new Date());

  const weekStart = useMemo(
    () => startOfWeek(anchor, { weekStartsOn: 1 }), // Monday
    [anchor],
  );
  const weekEnd = useMemo(
    () => endOfWeek(anchor, { weekStartsOn: 1 }),
    [anchor],
  );

  const days: CalendarDay[] = useMemo(
    () =>
      eachDayOfInterval({ start: weekStart, end: weekEnd }).map((date) => ({
        date,
        label: format(date, "EEE"),
        num: format(date, "d"),
        isToday: isToday(date),
      })),
    [weekStart, weekEnd],
  );

  const monthLabel = useMemo(() => {
    const startMonth = format(weekStart, "MMM");
    const endMonth = format(weekEnd, "MMM");
    const year = format(weekEnd, "yyyy");
    return startMonth === endMonth
      ? `${startMonth} ${year}`
      : `${startMonth} – ${endMonth} ${year}`;
  }, [weekStart, weekEnd]);

  const isCurrentWeek = useMemo(
    () => isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 })),
    [weekStart],
  );

  return {
    days,
    weekStart,
    weekEnd,
    monthLabel,
    isCurrentWeek,
    goNext: () => setAnchor((d) => addWeeks(d, 1)),
    goPrev: () => setAnchor((d) => subWeeks(d, 1)),
    goToday: () => setAnchor(new Date()),
  };
}
