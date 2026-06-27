import { dayAgg, type EntryIndex } from "@/lib/habits";
import { computeStreak } from "@/lib/streaks";
import { totalXp } from "@/lib/xp";
import { levelInfo } from "@/lib/xp";
import type { Habit } from "@/types";

export interface Aggregate {
  daysLogged: number;
  perfectDays: number;
  totalCompletions: number; // habit targets hit, all-time
  totalEarnings: number;
  bestStreak: number;
  level: number;
  totalXp: number;
}

/**
 * Build the aggregate stats badges are evaluated against.
 * `loggedDates` is every date that has at least one entry.
 */
export function aggregate(
  habits: Habit[],
  idx: EntryIndex,
  loggedDates: string[],
  totalEarnings = 0,
): Aggregate {
  const perfectDates = new Set<string>();
  let perfectDays = 0;
  let totalCompletions = 0;

  for (const d of loggedDates) {
    const a = dayAgg(habits, idx, d);
    totalCompletions += a.doneCount;
    if (a.perfect) {
      perfectDays++;
      perfectDates.add(d);
    }
  }

  const xp = totalXp(habits, idx, loggedDates);

  return {
    daysLogged: loggedDates.length,
    perfectDays,
    totalCompletions,
    totalEarnings,
    bestStreak: computeStreak(perfectDates).best,
    level: levelInfo(xp).level,
    totalXp: xp,
  };
}

export interface BadgeDef {
  id: string;
  label: string;
  description: string;
  emoji: string;
  earned: (a: Aggregate) => boolean;
  progress: (a: Aggregate) => number;
}

const ratio = (value: number, target: number) =>
  Math.max(0, Math.min(1, value / target));

export const BADGES: BadgeDef[] = [
  {
    id: "streak-7",
    label: "Week Warrior",
    description: "7-day perfect streak",
    emoji: "🔥",
    earned: (a) => a.bestStreak >= 7,
    progress: (a) => ratio(a.bestStreak, 7),
  },
  {
    id: "streak-30",
    label: "Iron Month",
    description: "30-day perfect streak",
    emoji: "🏆",
    earned: (a) => a.bestStreak >= 30,
    progress: (a) => ratio(a.bestStreak, 30),
  },
  {
    id: "perfect-10",
    label: "Flawless Ten",
    description: "10 perfect days",
    emoji: "💎",
    earned: (a) => a.perfectDays >= 10,
    progress: (a) => ratio(a.perfectDays, 10),
  },
  {
    id: "completions-100",
    label: "Centurion",
    description: "100 habits completed",
    emoji: "⚔️",
    earned: (a) => a.totalCompletions >= 100,
    progress: (a) => ratio(a.totalCompletions, 100),
  },
  {
    id: "completions-500",
    label: "Relentless",
    description: "500 habits completed",
    emoji: "🥷",
    earned: (a) => a.totalCompletions >= 500,
    progress: (a) => ratio(a.totalCompletions, 500),
  },
  {
    id: "logged-50",
    label: "Consistent",
    description: "50 days logged",
    emoji: "📈",
    earned: (a) => a.daysLogged >= 50,
    progress: (a) => ratio(a.daysLogged, 50),
  },
  {
    id: "level-5",
    label: "Ascendant",
    description: "Reach level 5",
    emoji: "⚡",
    earned: (a) => a.level >= 5,
    progress: (a) => ratio(a.level, 5),
  },
  {
    id: "earn-500",
    label: "First Bag",
    description: "$500 earned",
    emoji: "💰",
    earned: (a) => a.totalEarnings >= 500,
    progress: (a) => ratio(a.totalEarnings, 500),
  },
  {
    id: "earn-2000",
    label: "Pro Hustler",
    description: "$2,000 earned",
    emoji: "🤑",
    earned: (a) => a.totalEarnings >= 2000,
    progress: (a) => ratio(a.totalEarnings, 2000),
  },
];
