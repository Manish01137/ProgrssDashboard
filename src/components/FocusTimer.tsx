"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import type { Habit } from "@/types";
import { isBoolean } from "@/lib/habits";

const DURATIONS = [15, 25, 50];

export function FocusTimer({
  habits,
  onComplete,
}: {
  habits: Habit[];
  onComplete: (
    habitId: string | null,
    minutes: number,
    addValue: number,
  ) => Promise<void>;
}) {
  // Only quantity habits can accumulate a logged amount.
  const quantityHabits = habits.filter((h) => !isBoolean(h));

  const [minutes, setMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [habitId, setHabitId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const selected = quantityHabits.find((h) => h.id === habitId) ?? null;
  const addValue = selected ? selected.step || 1 : 0;

  useEffect(() => {
    if (!running) return;
    interval.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          finish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  async function finish() {
    if (interval.current) clearInterval(interval.current);
    setRunning(false);
    setJustFinished(true);
    setTimeout(() => setJustFinished(false), 4000);
    if (typeof Audio !== "undefined") {
      try {
        // Short beep via Web Audio — no asset needed.
        const ctx = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.frequency.value = 880;
        osc.connect(ctx.destination);
        osc.start();
        setTimeout(() => {
          osc.stop();
          ctx.close();
        }, 250);
      } catch {
        /* ignore */
      }
    }
    await onComplete(habitId, minutes, addValue);
    setSecondsLeft(minutes * 60);
  }

  function reset() {
    if (interval.current) clearInterval(interval.current);
    setRunning(false);
    setSecondsLeft(minutes * 60);
  }

  function pickDuration(m: number) {
    setMinutes(m);
    setSecondsLeft(m * 60);
    setRunning(false);
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const progress = 1 - secondsLeft / (minutes * 60);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="surface flex w-full items-center gap-3 px-4 py-3 text-left transition active:scale-[0.99]"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ember-500/15">
          <Timer className="h-4 w-4 text-ember-500" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold">Focus Timer</p>
          <p className="text-xs text-neutral-500">
            Pomodoro that logs straight into a habit
          </p>
        </div>
        <span className="text-xs font-medium text-ember-500">Open</span>
      </button>
    );
  }

  return (
    <div className="surface px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Timer className="h-4 w-4 text-ember-500" /> Focus Timer
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
        >
          Hide
        </button>
      </div>

      {/* timer face */}
      <div className="flex flex-col items-center py-2">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="6"
              className="stroke-neutral-200 dark:stroke-neutral-800"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className="stroke-ember-500 transition-all duration-500"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress)}`}
            />
          </svg>
          <span className="text-4xl font-bold tabular-nums">
            {mm}:{ss}
          </span>
        </div>

        {justFinished && (
          <p className="animate-pop mt-2 text-sm font-semibold text-ember-500">
            🎉 Session complete{selected ? ` · +${addValue} ${selected.unit ?? ""}` : ""}
          </p>
        )}
      </div>

      {/* duration picker */}
      <div className="mt-2 flex justify-center gap-2">
        {DURATIONS.map((m) => (
          <button
            type="button"
            key={m}
            onClick={() => pickDuration(m)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              minutes === m
                ? "bg-ember-500 text-white"
                : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
            }`}
          >
            {m}m
          </button>
        ))}
      </div>

      {/* habit attribution */}
      <div className="mt-3">
        <label className="text-xs text-neutral-500">Log this session into:</label>
        <select
          value={habitId ?? ""}
          onChange={(e) => setHabitId(e.target.value || null)}
          className="mt-1 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-ember-500 dark:border-neutral-800"
        >
          <option value="">Just focus (no habit)</option>
          {quantityHabits.map((h) => (
            <option key={h.id} value={h.id}>
              {h.emoji} {h.name} (+{h.step || 1} {h.unit ?? ""} on finish)
            </option>
          ))}
        </select>
      </div>

      {/* controls */}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ember-500 py-2.5 text-sm font-semibold text-white transition hover:bg-ember-600 active:scale-95"
        >
          {running ? (
            <>
              <Pause className="h-4 w-4" /> Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> Start
            </>
          )}
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex items-center justify-center rounded-xl border border-neutral-200 px-4 text-neutral-600 transition hover:bg-neutral-100 active:scale-95 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
