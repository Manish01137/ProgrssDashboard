"use client";

import { Minus, Plus, Check } from "lucide-react";
import type { Habit } from "@/types";
import { isBoolean } from "@/lib/habits";

export function HabitCard({
  habit,
  value,
  target,
  done,
  onChange,
}: {
  habit: Habit;
  value: number;
  target: number;
  done: boolean;
  onChange: (value: number) => void;
}) {
  if (isBoolean(habit)) {
    const checked = value >= 1;
    return (
      <button
        onClick={() => onChange(checked ? 0 : 1)}
        className={`surface animate-fade-in flex w-full items-center gap-3 px-4 py-4 text-left transition active:scale-[0.99] ${
          checked ? "ring-2 ring-ember-500/60" : ""
        }`}
      >
        <span className="text-2xl">{habit.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight">{habit.name}</p>
          <p className="text-xs text-neutral-500">
            {checked ? "Done — nice." : "Tap to mark done"}
          </p>
        </div>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition ${
            checked
              ? "border-ember-500 bg-ember-500 text-white"
              : "border-neutral-300 dark:border-neutral-700"
          }`}
        >
          {checked && <Check className="h-4 w-4" />}
        </span>
      </button>
    );
  }

  const step = habit.step || 1;
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const setValue = (v: number) => onChange(Math.max(0, round1(v)));

  return (
    <div
      className={`surface animate-fade-in px-4 py-4 transition ${
        done ? "ring-2 ring-ember-500/60" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{habit.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight">{habit.name}</p>
          <p className="text-xs text-neutral-500">
            Target: {target} {habit.unit}
            {done && <span className="ml-1 text-ember-500">· hit ✓</span>}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold tabular-nums">{value}</span>
          <span className="ml-1 text-xs text-neutral-500">{habit.unit}</span>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-full rounded-full bg-ember-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          aria-label={`Decrease ${habit.name}`}
          onClick={() => setValue(value - step)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100 active:scale-95 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          inputMode="decimal"
          value={value === 0 ? "" : value}
          placeholder="0"
          onChange={(e) => setValue(Number(e.target.value))}
          className="h-9 w-full rounded-lg border border-neutral-200 bg-white text-center text-sm font-semibold outline-none focus:border-ember-500 dark:border-neutral-800 dark:bg-neutral-900"
        />
        <button
          aria-label={`Increase ${habit.name}`}
          onClick={() => setValue(value + step)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100 active:scale-95 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
