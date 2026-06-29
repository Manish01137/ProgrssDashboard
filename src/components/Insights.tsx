"use client";

import { useMemo } from "react";
import { parseISO, getDay, isSameMonth } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  CalendarRange,
  Sparkles,
  Award,
  AlertTriangle,
} from "lucide-react";
import {
  activeHabits,
  buildEntryIndex,
  dayAgg,
  isScheduled,
  isDone,
  valueFor,
} from "@/lib/habits";
import { lastNDates } from "@/lib/dates";
import type { Habit, HabitEntry } from "@/types";

interface Insight {
  icon: typeof TrendingUp;
  tone: "good" | "bad" | "neutral";
  text: string;
}

export function Insights({
  habits,
  entries,
}: {
  habits: Habit[];
  entries: HabitEntry[];
}) {
  const insights = useMemo<Insight[]>(() => {
    const active = activeHabits(habits);
    const idx = buildEntryIndex(entries);
    const logged = [...new Set(entries.map((e) => e.log_date))].sort();
    if (active.length === 0 || logged.length < 2) return [];

    const out: Insight[] = [];

    // ── Best / worst weekday by average completion ──
    const sum = Array(7).fill(0);
    const cnt = Array(7).fill(0);
    for (const d of logged) {
      const a = dayAgg(active, idx, d);
      if (a.total === 0) continue;
      const dow = getDay(parseISO(d));
      sum[dow] += a.ratio;
      cnt[dow] += 1;
    }
    const avgByDow = sum.map((s, i) => (cnt[i] > 0 ? s / cnt[i] : -1));
    const rated = avgByDow
      .map((v, i) => ({ i, v }))
      .filter((x) => x.v >= 0);
    if (rated.length >= 2) {
      const best = rated.reduce((a, b) => (b.v > a.v ? b : a));
      const worst = rated.reduce((a, b) => (b.v < a.v ? b : a));
      if (best.i !== worst.i) {
        out.push({
          icon: Award,
          tone: "good",
          text: `${fullDay(best.i)} is your strongest day (${Math.round(best.v * 100)}% avg completion).`,
        });
        out.push({
          icon: AlertTriangle,
          tone: "bad",
          text: `${fullDay(worst.i)} is where you slip most (${Math.round(worst.v * 100)}% avg). Plan lighter or protect it.`,
        });
      }
    }

    // ── Week over week trend ──
    const thisWeek = avgRatio(active, idx, lastNDates(7));
    const prevWeek = avgRatio(active, idx, lastNDates(7, lastNDates(8)[0]));
    if (thisWeek !== null && prevWeek !== null) {
      const delta = Math.round((thisWeek - prevWeek) * 100);
      if (Math.abs(delta) >= 3) {
        out.push({
          icon: delta >= 0 ? TrendingUp : TrendingDown,
          tone: delta >= 0 ? "good" : "bad",
          text:
            delta >= 0
              ? `You're up ${delta}% vs last week — momentum is building.`
              : `You're down ${Math.abs(delta)}% vs last week. Time to refocus.`,
        });
      }
    }

    // ── This month ──
    const now = new Date();
    const monthDates = logged.filter((d) => isSameMonth(parseISO(d), now));
    if (monthDates.length > 0) {
      const perfect = monthDates.filter(
        (d) => dayAgg(active, idx, d).perfect,
      ).length;
      out.push({
        icon: CalendarRange,
        tone: "neutral",
        text: `This month: ${perfect} perfect ${perfect === 1 ? "day" : "days"} across ${monthDates.length} logged.`,
      });
    }

    // ── Most consistent / most skipped habit ──
    const rates = active
      .map((h) => {
        let sched = 0;
        let done = 0;
        for (const d of logged) {
          if (!isScheduled(h, d)) continue;
          sched++;
          if (isDone(h, valueFor(idx, h.id, d), d)) done++;
        }
        return { h, rate: sched > 0 ? done / sched : -1, sched };
      })
      .filter((x) => x.sched >= 3);
    if (rates.length >= 2) {
      const top = rates.reduce((a, b) => (b.rate > a.rate ? b : a));
      const low = rates.reduce((a, b) => (b.rate < a.rate ? b : a));
      out.push({
        icon: Sparkles,
        tone: "good",
        text: `Most consistent: ${top.h.emoji} ${top.h.name} (${Math.round(top.rate * 100)}%).`,
      });
      if (low.h.id !== top.h.id) {
        out.push({
          icon: AlertTriangle,
          tone: "bad",
          text: `Needs work: ${low.h.emoji} ${low.h.name} (${Math.round(low.rate * 100)}%).`,
        });
      }
    }

    return out;
  }, [habits, entries]);

  if (insights.length === 0) {
    return (
      <div className="surface px-4 py-6 text-center text-sm text-neutral-500">
        Log a few more days to unlock pattern insights.
      </div>
    );
  }

  return (
    <div className="surface px-4 py-4">
      <h2 className="mb-3 text-sm font-bold">Patterns &amp; Insights</h2>
      <div className="space-y-2.5">
        {insights.map((ins, i) => {
          const Icon = ins.icon;
          const color =
            ins.tone === "good"
              ? "text-emerald-500"
              : ins.tone === "bad"
                ? "text-amber-500"
                : "text-ember-500";
          return (
            <div key={i} className="flex items-start gap-2.5">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
              <p className="text-sm leading-snug text-neutral-700 dark:text-neutral-300">
                {ins.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function fullDay(dow: number): string {
  return [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][dow];
}

function avgRatio(
  habits: Habit[],
  idx: ReturnType<typeof buildEntryIndex>,
  dates: string[],
): number | null {
  let sum = 0;
  let n = 0;
  for (const d of dates) {
    const a = dayAgg(habits, idx, d);
    if (a.total === 0) continue;
    sum += a.ratio;
    n++;
  }
  return n > 0 ? sum / n : null;
}
