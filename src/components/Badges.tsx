"use client";

import { useMemo } from "react";
import { aggregate, BADGES } from "@/lib/badges";
import { activeHabits, buildEntryIndex } from "@/lib/habits";
import type { Habit, HabitEntry } from "@/types";

export function Badges({
  habits,
  entries,
  totalEarnings = 0,
}: {
  habits: Habit[];
  entries: HabitEntry[];
  totalEarnings?: number;
}) {
  const agg = useMemo(() => {
    const active = activeHabits(habits);
    const idx = buildEntryIndex(entries);
    const loggedDates = [...new Set(entries.map((e) => e.log_date))];
    return aggregate(active, idx, loggedDates, totalEarnings);
  }, [habits, entries, totalEarnings]);

  const earnedCount = BADGES.filter((b) => b.earned(agg)).length;

  return (
    <div className="surface px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold">Milestone Badges</h2>
        <span className="text-xs text-neutral-500">
          {earnedCount}/{BADGES.length} unlocked
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {BADGES.map((badge) => {
          const earned = badge.earned(agg);
          const progress = Math.round(badge.progress(agg) * 100);
          return (
            <div
              key={badge.id}
              className={`flex flex-col items-center rounded-xl border p-3 text-center transition ${
                earned
                  ? "border-ember-500/40 bg-ember-500/10"
                  : "border-neutral-200 bg-neutral-50 opacity-70 dark:border-neutral-800 dark:bg-neutral-900/50"
              }`}
            >
              <span className={`text-3xl ${earned ? "animate-pop" : "grayscale"}`}>
                {badge.emoji}
              </span>
              <p className="mt-1.5 text-[11px] font-semibold leading-tight">
                {badge.label}
              </p>
              <p className="mt-0.5 text-[10px] leading-tight text-neutral-500">
                {badge.description}
              </p>
              {!earned && (
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-ember-500/60"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
