"use client";

import { useMemo, useState } from "react";
import { parseISO, format, getDay } from "date-fns";
import { lastNDates, friendlyDate } from "@/lib/dates";
import { activeHabits, buildEntryIndex, dayAgg } from "@/lib/habits";
import type { Habit, HabitEntry } from "@/types";

const INTENSITY = [
  "bg-neutral-200 dark:bg-neutral-800",
  "bg-ember-500/25",
  "bg-ember-500/45",
  "bg-ember-500/70",
  "bg-ember-500",
];

function bucket(ratio: number, total: number): number {
  if (total === 0 || ratio <= 0) return 0;
  if (ratio >= 0.999) return 4;
  if (ratio >= 0.66) return 3;
  if (ratio >= 0.33) return 2;
  return 1;
}

export function Heatmap({
  habits,
  entries,
}: {
  habits: Habit[];
  entries: HabitEntry[];
}) {
  const [days, setDays] = useState<90 | 180 | 365>(365);
  const [hover, setHover] = useState<string | null>(null);

  const active = useMemo(() => activeHabits(habits), [habits]);
  const idx = useMemo(() => buildEntryIndex(entries), [entries]);

  const { weeks, monthLabels } = useMemo(() => {
    const dates = lastNDates(days);
    const firstDow = getDay(parseISO(dates[0]));
    const padded: (string | null)[] = [
      ...Array<null>(firstDow).fill(null),
      ...dates,
    ];
    const weeks: (string | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));
    const monthLabels = weeks.map((week, wi) => {
      const firstReal = week.find((d) => d) as string | undefined;
      if (!firstReal) return "";
      const d = parseISO(firstReal);
      const prev = weeks[wi - 1]?.find((x) => x) as string | undefined;
      if (wi === 0) return format(d, "MMM");
      if (prev && format(parseISO(prev), "MMM") !== format(d, "MMM"))
        return format(d, "MMM");
      return "";
    });
    return { weeks, monthLabels };
  }, [days]);

  const hovered = hover ? dayAgg(active, idx, hover) : null;

  return (
    <div className="surface px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold">Contribution Heatmap</h2>
        <div className="flex gap-1 rounded-lg bg-neutral-100 p-0.5 text-xs dark:bg-neutral-800">
          {([90, 180, 365] as const).map((d) => (
            <button
              type="button"
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-md px-2 py-1 font-medium transition ${
                days === d
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white"
                  : "text-neutral-500"
              }`}
            >
              {d === 365 ? "1y" : `${d}d`}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-1">
          <div className="flex gap-1">
            {monthLabels.map((m, i) => (
              <div key={i} className="w-3 text-[9px] text-neutral-400">
                {m}
              </div>
            ))}
          </div>
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((date, di) => {
                  if (!date) return <div key={di} className="h-3 w-3" />;
                  const a = dayAgg(active, idx, date);
                  return (
                    <div
                      key={di}
                      onMouseEnter={() => setHover(date)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => setHover(date)}
                      className={`h-3 w-3 rounded-[3px] ${INTENSITY[bucket(a.ratio, a.total)]} cursor-pointer transition hover:ring-1 hover:ring-ember-500`}
                      title={date}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
        <div className="h-4">
          {hover && (
            <span>
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                {friendlyDate(hover)}
              </span>{" "}
              —{" "}
              {hovered && hovered.total > 0
                ? `${hovered.doneCount}/${hovered.total} habits`
                : "rest / no log"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span>Less</span>
          {INTENSITY.map((c, i) => (
            <span key={i} className={`h-3 w-3 rounded-[3px] ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
