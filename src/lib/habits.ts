import { getDay, parseISO } from "date-fns";
import type { Habit, HabitDraft, HabitEntry } from "@/types";

// (HabitDraft now excludes sort_order — assigned on insert.)

export const PERFECT_DAY_BONUS = 30;

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

// ── Default habits seeded for a new user (fully editable afterwards) ────────
// Includes a Saturday-only "DSA Revision" habit to demonstrate scheduling.
export const DEFAULT_HABITS: HabitDraft[] = [
  {
    name: "DSA (Love Babbar)",
    emoji: "🧠",
    type: "quantity",
    unit: "videos",
    target: 2,
    step: 1,
    xp: 25,
    active_days: [1, 2, 3, 4, 5],
    day_targets: null,
    archived: false,
  },
  {
    name: "DSA Revision",
    emoji: "🔁",
    type: "boolean",
    unit: null,
    target: 1,
    step: 1,
    xp: 20,
    active_days: [6], // Saturday only
    day_targets: null,
    archived: false,
  },
  {
    name: "Gym / Workout",
    emoji: "💪",
    type: "quantity",
    unit: "min",
    target: 45,
    step: 15,
    xp: 20,
    active_days: [1, 2, 3, 4, 5, 6],
    day_targets: null,
    archived: false,
  },
  {
    name: "Freelancing",
    emoji: "💼",
    type: "quantity",
    unit: "hrs",
    target: 2,
    step: 0.5,
    xp: 20,
    active_days: ALL_DAYS,
    day_targets: null,
    archived: false,
  },
  {
    name: "Sleep",
    emoji: "😴",
    type: "quantity",
    unit: "hrs",
    target: 7,
    step: 0.5,
    xp: 15,
    active_days: ALL_DAYS,
    day_targets: null,
    archived: false,
  },
  {
    name: "Clean Eating",
    emoji: "🥗",
    type: "boolean",
    unit: null,
    target: 1,
    step: 1,
    xp: 10,
    active_days: ALL_DAYS,
    day_targets: null,
    archived: false,
  },
  {
    name: "Overall Discipline",
    emoji: "🎯",
    type: "boolean",
    unit: null,
    target: 1,
    step: 1,
    xp: 10,
    active_days: ALL_DAYS,
    day_targets: null,
    archived: false,
  },
];

// ── Scheduling helpers ──────────────────────────────────────────────────────

export function dow(dateStr: string): number {
  return getDay(parseISO(dateStr));
}

/** Is this habit scheduled (active) on the given date? */
export function isScheduled(habit: Habit, dateStr: string): boolean {
  return habit.active_days.includes(dow(dateStr));
}

/** The target for this habit on a specific date (honours per-weekday overrides). */
export function targetFor(habit: Habit, dateStr: string): number {
  const override = habit.day_targets?.[String(dow(dateStr))];
  return override ?? habit.target;
}

export function isBoolean(habit: Habit): boolean {
  return habit.type === "boolean";
}

/** Is the habit's target met on this date, given a logged value? */
export function isDone(habit: Habit, value: number, dateStr: string): boolean {
  if (!isScheduled(habit, dateStr)) return false;
  if (isBoolean(habit)) return value >= 1;
  return value >= targetFor(habit, dateStr);
}

// ── Entry index: fast lookup of a value by (habitId, date) ──────────────────

export type EntryIndex = Map<string, number>;

export function entryKey(habitId: string, dateStr: string): string {
  return `${habitId}|${dateStr}`;
}

export function buildEntryIndex(entries: HabitEntry[]): EntryIndex {
  const idx: EntryIndex = new Map();
  for (const e of entries) idx.set(entryKey(e.habit_id, e.log_date), Number(e.value));
  return idx;
}

export function valueFor(
  idx: EntryIndex,
  habitId: string,
  dateStr: string,
): number {
  return idx.get(entryKey(habitId, dateStr)) ?? 0;
}

// ── Per-day aggregates ──────────────────────────────────────────────────────

export interface DayAgg {
  scheduled: Habit[];
  doneCount: number;
  total: number;
  perfect: boolean;
  xp: number;
  ratio: number; // 0..1 completion
}

export function dayAgg(
  habits: Habit[],
  idx: EntryIndex,
  dateStr: string,
): DayAgg {
  const scheduled = habits.filter((h) => isScheduled(h, dateStr));
  let doneCount = 0;
  let xp = 0;
  for (const h of scheduled) {
    const v = valueFor(idx, h.id, dateStr);
    if (isDone(h, v, dateStr)) {
      doneCount++;
      xp += h.xp;
    }
  }
  const total = scheduled.length;
  const perfect = total > 0 && doneCount === total;
  if (perfect) xp += PERFECT_DAY_BONUS;
  return {
    scheduled,
    doneCount,
    total,
    perfect,
    xp,
    ratio: total > 0 ? doneCount / total : 0,
  };
}

/** Largest possible XP in one day (every habit scheduled & done + bonus). */
export function maxDayXp(habits: Habit[]): number {
  const active = habits.filter((h) => !h.archived);
  return active.reduce((s, h) => s + h.xp, 0) + PERFECT_DAY_BONUS || 1;
}

export function activeHabits(habits: Habit[]): Habit[] {
  return habits
    .filter((h) => !h.archived)
    .sort((a, b) => a.sort_order - b.sort_order);
}
