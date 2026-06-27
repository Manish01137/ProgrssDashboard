import { dayAgg, type EntryIndex } from "@/lib/habits";
import type { Habit } from "@/types";

/** Total XP across every logged day. */
export function totalXp(
  habits: Habit[],
  idx: EntryIndex,
  loggedDates: string[],
): number {
  return loggedDates.reduce((sum, d) => sum + dayAgg(habits, idx, d).xp, 0);
}

/** Cumulative XP required to *reach* a given level (triangular curve). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (100 * (level - 1) * level) / 2;
}

export interface LevelInfo {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  progress: number; // 0..1 toward next level
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const span = next - base;
  return {
    level,
    xpIntoLevel: xp - base,
    xpForNext: span,
    progress: span > 0 ? (xp - base) / span : 0,
  };
}
