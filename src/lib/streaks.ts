import { shiftDateStr, todayStr } from "@/lib/dates";

const MAX_LOOKBACK = 2000; // safety bound for the walk-back loop

export interface StreakResult {
  current: number; // consecutive completed days (freeze-bridged) ending today
  best: number; // longest consecutive completed run ever
  freezesUsed: number; // how many freeze tokens the current streak relied on
}

/**
 * Compute a streak from a set of "completed" date strings.
 *
 * The current streak walks backwards from today. A missed day can be bridged
 * by spending a freeze token (Duolingo-style) so a single slip doesn't reset
 * everything. Today not being logged yet does NOT break the streak — the day
 * isn't over.
 *
 * Freeze tokens only contribute to the *current* streak; `best` is the longest
 * unbroken run of actual completions.
 */
export function computeStreak(
  completed: Set<string>,
  freezeTokens = 0,
  endDateStr = todayStr(),
): StreakResult {
  // ── current streak (with optional freeze bridging) ──
  let current = 0;
  let freezesUsed = 0;
  let cursor = endDateStr;

  // If today isn't logged yet, start counting from yesterday (no penalty).
  if (!completed.has(cursor)) {
    cursor = shiftDateStr(cursor, -1);
  }

  for (let i = 0; i < MAX_LOOKBACK; i++) {
    if (completed.has(cursor)) {
      current++;
      cursor = shiftDateStr(cursor, -1);
    } else if (freezesUsed < freezeTokens) {
      freezesUsed++;
      cursor = shiftDateStr(cursor, -1);
    } else {
      break;
    }
  }

  // ── best streak (pure consecutive completions, no freeze) ──
  const best = longestRun(completed);

  return { current, best, freezesUsed };
}

function longestRun(completed: Set<string>): number {
  if (completed.size === 0) return 0;
  const sorted = [...completed].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const expectedPrev = shiftDateStr(sorted[i], -1);
    if (sorted[i - 1] === expectedPrev) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}
