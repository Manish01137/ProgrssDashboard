"use client";

import { useState } from "react";
import { Flame, Target, ArrowRight } from "lucide-react";
import { bigConfetti, haptic } from "@/lib/celebrate";

function defaultGoalDate(): string {
  const now = new Date();
  const year = now.getMonth() > 7 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}-08-01`;
}

const SUGGESTIONS = [
  "Crack placements by August",
  "Become interview-ready in DSA",
  "Build an unbreakable daily routine",
  "Land my first ₹50k freelance month",
];

export function Onboarding({
  onComplete,
}: {
  onComplete: (goal: string, goalDate: string | null) => Promise<void>;
}) {
  const [goal, setGoal] = useState("");
  const [date, setDate] = useState(defaultGoalDate());
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!goal.trim()) return;
    setBusy(true);
    haptic(20);
    await onComplete(goal.trim(), date || null);
    bigConfetti();
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-neutral-950/80 p-4 backdrop-blur-sm">
      <div className="animate-fade-in w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ember-500/15 ring-1 ring-ember-500/30">
          <Flame className="h-6 w-6 text-ember-500" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome to the War Room.</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Every command center needs a mission. What are you building discipline
          for?
        </p>

        <label className="mt-5 block text-xs font-medium text-neutral-500">
          <span className="mb-1 flex items-center gap-1">
            <Target className="h-3.5 w-3.5" /> Your north-star goal
          </span>
          <input
            autoFocus
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Crack placements by August"
            className="w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-ember-500 dark:border-neutral-800"
          />
        </label>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setGoal(s)}
              className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] text-neutral-600 transition hover:bg-ember-500/10 hover:text-ember-500 dark:bg-neutral-800 dark:text-neutral-300"
            >
              {s}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-xs font-medium text-neutral-500">
          Target date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-ember-500 dark:border-neutral-800"
          />
        </label>

        <button
          type="button"
          onClick={save}
          disabled={busy || !goal.trim()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-ember-500 py-3 text-sm font-semibold text-white transition hover:bg-ember-600 active:scale-95 disabled:opacity-50"
        >
          {busy ? "Locking it in…" : "Lock in my mission"}
          {!busy && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
