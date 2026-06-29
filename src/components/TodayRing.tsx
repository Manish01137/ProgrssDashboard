"use client";

import { CountUp } from "@/components/CountUp";

/** Big animated completion ring for the selected day. */
export function TodayRing({
  doneCount,
  total,
  perfect,
  xp,
}: {
  doneCount: number;
  total: number;
  perfect: boolean;
  xp: number;
}) {
  const ratio = total > 0 ? doneCount / total : 0;
  const pct = Math.round(ratio * 100);
  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <div className="surface flex items-center gap-5 px-5 py-5">
      <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            strokeWidth="9"
            className="stroke-neutral-200 dark:stroke-neutral-800"
          />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            className={`transition-all duration-700 ease-out ${
              perfect ? "stroke-emerald-500" : "stroke-ember-500"
            }`}
            strokeDasharray={C}
            strokeDashoffset={C * (1 - ratio)}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <CountUp
            value={pct}
            className="text-3xl font-bold tabular-nums"
          />
          <span className="text-xs text-neutral-500">%</span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          Today&apos;s progress
        </p>
        <p className="text-2xl font-bold leading-tight">
          {doneCount}
          <span className="text-neutral-400">/{total}</span>{" "}
          <span className="text-sm font-normal text-neutral-500">habits</span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-ember-500/15 px-2.5 py-1 text-xs font-bold text-ember-500">
            <CountUp value={xp} /> XP today
          </span>
          {perfect && (
            <span className="animate-pop rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-500">
              ⚡ Perfect day
            </span>
          )}
          {!perfect && total > 0 && (
            <span className="text-xs text-neutral-500">
              {total - doneCount} to go
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
