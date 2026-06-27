"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  friendlyDate,
  isToday,
  shiftDateStr,
  isFutureDate,
  todayStr,
} from "@/lib/dates";

export function DayNavigator({
  date,
  onChange,
}: {
  date: string;
  onChange: (next: string) => void;
}) {
  const nextDate = shiftDateStr(date, 1);
  const canGoForward = !isFutureDate(nextDate);

  return (
    <div className="flex items-center justify-between">
      <button
        aria-label="Previous day"
        onClick={() => onChange(shiftDateStr(date, -1))}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100 active:scale-95 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="text-center">
        <p className="text-lg font-bold leading-tight">{friendlyDate(date)}</p>
        {!isToday(date) && (
          <button
            onClick={() => onChange(todayStr())}
            className="text-xs text-ember-500 hover:underline"
          >
            Jump to today
          </button>
        )}
      </div>

      <button
        aria-label="Next day"
        onClick={() => canGoForward && onChange(nextDate)}
        disabled={!canGoForward}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100 active:scale-95 disabled:opacity-30 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
