"use client";

import { daysUntil } from "@/lib/dates";
import { CalendarClock } from "lucide-react";

// Target: August 1 of the current year (rolls to next year once it passes).
function nextAugustFirst(): string {
  const now = new Date();
  const year = now.getMonth() > 7 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}-08-01`;
}

export function CountdownBanner() {
  const target = nextAugustFirst();
  const days = daysUntil(target);

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
          {days > 0 ? (
            <>
              <span className="text-ember-500">{days}</span> days until classes
              start
            </>
          ) : days === 0 ? (
            <span className="text-ember-500">It&apos;s August 1 — game on.</span>
          ) : (
            <span>Classes have started. Keep the discipline.</span>
          )}
        </p>
      </div>
    </div>
  );
}
