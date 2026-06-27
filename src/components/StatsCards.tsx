"use client";

import { useMemo } from "react";
import { Flame, Trophy, CalendarCheck, Percent, Zap } from "lucide-react";
import type { Habit, HabitEntry, Profile } from "@/types";
import {
  activeHabits,
  buildEntryIndex,
  dayAgg,
  isScheduled,
  isDone,
  valueFor,
} from "@/lib/habits";
import { computeStreak } from "@/lib/streaks";
import { levelInfo, totalXp } from "@/lib/xp";
import { lastNDates } from "@/lib/dates";

export function StatsCards({
  habits,
  entries,
  profile,
}: {
  habits: Habit[];
  entries: HabitEntry[];
  profile: Profile | null;
}) {
  const stats = useMemo(() => {
    const active = activeHabits(habits);
    const idx = buildEntryIndex(entries);
    const loggedDates = [...new Set(entries.map((e) => e.log_date))];

    // Overall streak = perfect days, freeze-bridged.
    const perfectDates = new Set(
      loggedDates.filter((d) => dayAgg(active, idx, d).perfect),
    );
    const streak = computeStreak(perfectDates, profile?.freeze_tokens ?? 0);

    // Weekly completion %: scheduled habits done / scheduled habits, last 7 days.
    let done = 0;
    let scheduled = 0;
    for (const d of lastNDates(7)) {
      for (const h of active) {
        if (!isScheduled(h, d)) continue;
        scheduled++;
        if (isDone(h, valueFor(idx, h.id, d), d)) done++;
      }
    }
    const weeklyPct = scheduled > 0 ? Math.round((done / scheduled) * 100) : 0;

    const xp = totalXp(active, idx, loggedDates);
    return {
      current: streak.current,
      best: streak.best,
      weeklyPct,
      daysLogged: loggedDates.length,
      xp,
      level: levelInfo(xp),
    };
  }, [habits, entries, profile]);

  const cards = [
    { label: "Current Streak", value: `${stats.current}`, suffix: stats.current === 1 ? "day" : "days", icon: Flame, accent: true },
    { label: "Best Streak", value: `${stats.best}`, suffix: stats.best === 1 ? "day" : "days", icon: Trophy },
    { label: "This Week", value: `${stats.weeklyPct}`, suffix: "%", icon: Percent },
    { label: "Days Logged", value: `${stats.daysLogged}`, suffix: "total", icon: CalendarCheck },
  ];

  return (
    <div className="space-y-3">
      <div className="surface bg-gradient-to-br from-ember-500/10 to-transparent px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ember-500/15 ring-1 ring-ember-500/30">
              <Zap className="h-4 w-4 text-ember-500" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Level
              </p>
              <p className="text-xl font-bold leading-none">
                {stats.level.level}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold tabular-nums">
              {stats.xp.toLocaleString()} XP
            </p>
            <p className="text-xs text-neutral-500">
              {Math.round(stats.level.xpForNext - stats.level.xpIntoLevel)} XP to
              level {stats.level.level + 1}
            </p>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-ember-500 transition-all"
            style={{ width: `${Math.round(stats.level.progress * 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="surface px-4 py-3">
              <div className="flex items-center gap-2 text-neutral-500">
                <Icon className={`h-4 w-4 ${c.accent ? "text-ember-500" : ""}`} />
                <span className="text-xs">{c.label}</span>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {c.value}
                <span className="ml-1 text-xs font-normal text-neutral-500">
                  {c.suffix}
                </span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
