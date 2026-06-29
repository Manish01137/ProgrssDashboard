"use client";

import { daysUntil } from "@/lib/dates";
import { Target, CalendarClock } from "lucide-react";

function nextAugustFirst(): string {
  const now = new Date();
  const year = now.getMonth() > 7 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}-08-01`;
}

/**
 * Shows the user's north-star goal with a live countdown to its target date.
 * Falls back to the August 1 countdown when no goal is set yet.
 */
export function GoalBanner({
  goal,
  goalDate,
}: {
  goal?: string | null;
  goalDate?: string | null;
}) {
  const target = goalDate || nextAugustFirst();
  const days = daysUntil(target);

  if (!goal) {
    return (
      <div className="surface flex items-center gap-3 overflow-hidden bg-gradient-to-r from-ember-500/10 to-transparent px-4 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ember-500/15 ring-1 ring-ember-500/30">
          <CalendarClock className="h-5 w-5 text-ember-500" />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Countdown to August 1
          </p>
          <p className="text-lg font-bold leading-tight">
            <span className="text-ember-500">{Math.max(days, 0)}</span> days until
            classes start
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="surface flex items-center gap-3 overflow-hidden bg-gradient-to-r from-ember-500/10 to-transparent px-4 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ember-500/15 ring-1 ring-ember-500/30">
        <Target className="h-5 w-5 text-ember-500" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold leading-tight">{goal}</p>
        <p className="text-xs text-neutral-500">
          {days > 0 ? (
            <>
              <span className="font-semibold text-ember-500">{days}</span> days
              left — make them count
            </>
          ) : days === 0 ? (
            <span className="font-semibold text-ember-500">
              Target day is here. Execute.
            </span>
          ) : (
            <>Target date passed — set a new mission in Settings</>
          )}
        </p>
      </div>
    </div>
  );
}
