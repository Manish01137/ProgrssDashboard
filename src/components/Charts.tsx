"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { parseISO, format } from "date-fns";
import { lastNDates } from "@/lib/dates";
import {
  activeHabits,
  buildEntryIndex,
  dayAgg,
  isScheduled,
  isDone,
  valueFor,
} from "@/lib/habits";
import type { Habit, HabitEntry } from "@/types";

const EMBER = "#f97316";

export function Charts({
  habits,
  entries,
}: {
  habits: Habit[];
  entries: HabitEntry[];
}) {
  const active = useMemo(() => activeHabits(habits), [habits]);
  const idx = useMemo(() => buildEntryIndex(entries), [entries]);

  // 1. Completion % per day, last 30 days.
  const trend = useMemo(() => {
    return lastNDates(30).map((d) => {
      const a = dayAgg(active, idx, d);
      return {
        date: format(parseISO(d), "MMM d"),
        pct: Math.round(a.ratio * 100),
      };
    });
  }, [active, idx]);

  // 2. Per-habit: scheduled days completed in the last 7 days.
  const weekly = useMemo(() => {
    const last7 = lastNDates(7);
    return active.map((h) => {
      let scheduled = 0;
      let done = 0;
      for (const d of last7) {
        if (!isScheduled(h, d)) continue;
        scheduled++;
        if (isDone(h, valueFor(idx, h.id, d), d)) done++;
      }
      return { name: shortName(h.name), done, scheduled };
    });
  }, [active, idx]);

  return (
    <div className="space-y-3">
      <div className="surface px-4 py-4">
        <h2 className="mb-3 text-sm font-bold">Completion Trend · 30 days</h2>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="ember" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={EMBER} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={EMBER} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#88888822" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} interval={6} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 10, fill: "#888" }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip unit="% complete" />} />
              <Area type="monotone" dataKey="pct" stroke={EMBER} strokeWidth={2} fill="url(#ember)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="surface px-4 py-4">
        <h2 className="mb-3 text-sm font-bold">Per-Habit · this week</h2>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#88888822" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#888" }} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={40} />
              <YAxis domain={[0, 7]} ticks={[0, 7]} tick={{ fontSize: 10, fill: "#888" }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip unit=" days done" />} cursor={{ fill: "#88888811" }} />
              <Bar dataKey="done" fill={EMBER} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function shortName(name: string): string {
  return name.length > 8 ? name.slice(0, 8) + "…" : name;
}

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md dark:border-neutral-700 dark:bg-neutral-900">
      <p className="font-semibold">{label}</p>
      <p className="text-ember-500">
        {payload[0].value}
        {unit}
      </p>
    </div>
  );
}
