"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CountdownBanner } from "@/components/CountdownBanner";
import { DayNavigator } from "@/components/DayNavigator";
import { HabitCard } from "@/components/HabitCard";
import { FocusTimer } from "@/components/FocusTimer";
import {
  activeHabits,
  buildEntryIndex,
  dayAgg,
  isScheduled,
  isDone,
  targetFor,
  valueFor,
} from "@/lib/habits";
import { computeStreak } from "@/lib/streaks";
import { todayStr } from "@/lib/dates";
import { useDashboard } from "@/lib/useDashboard";
import { Flame, Snowflake, Check, Cloud, CloudOff, Moon } from "lucide-react";

export default function HomePage() {
  const { loading, habits, entries, profile, saveEntry, logFocus } =
    useDashboard();
  const [date, setDate] = useState(todayStr());
  const [values, setValues] = useState<Record<string, number>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const idx = useMemo(() => buildEntryIndex(entries), [entries]);
  const active = useMemo(() => activeHabits(habits), [habits]);
  const scheduled = useMemo(
    () => active.filter((h) => isScheduled(h, date)),
    [active, date],
  );

  // Sync local editable values from stored entries when date/data changes.
  useEffect(() => {
    const next: Record<string, number> = {};
    for (const h of active) next[h.id] = valueFor(idx, h.id, date);
    setValues(next);
    setSaveState("idle");
  }, [idx, active, date]);

  function update(habitId: string, value: number) {
    setValues((v) => ({ ...v, [habitId]: value }));
    setSaveState("saving");
    if (timers.current[habitId]) clearTimeout(timers.current[habitId]);
    timers.current[habitId] = setTimeout(async () => {
      await saveEntry(habitId, date, value);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1200);
    }, 500);
  }

  // Overall streak = consecutive perfect days (freeze-bridged).
  const perfectDates = useMemo(() => {
    const set = new Set<string>();
    const dates = new Set(entries.map((e) => e.log_date));
    for (const d of dates) if (dayAgg(active, idx, d).perfect) set.add(d);
    return set;
  }, [entries, active, idx]);
  const streak = computeStreak(perfectDates, profile?.freeze_tokens ?? 0);

  // Live aggregate for the selected day using local (unsaved) values.
  const liveIdx = useMemo(() => {
    const m = new Map(idx);
    for (const [hid, v] of Object.entries(values)) m.set(`${hid}|${date}`, v);
    return m;
  }, [idx, values, date]);
  const agg = dayAgg(active, liveIdx, date);

  if (loading) return <SkeletonHome />;

  return (
    <div className="space-y-4">
      <CountdownBanner />

      <div className="grid grid-cols-2 gap-3">
        <div className="surface flex items-center gap-3 px-4 py-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ember-500/15">
            <Flame className="h-5 w-5 text-ember-500" />
          </span>
          <div>
            <p className="text-xs text-neutral-500">Current streak</p>
            <p className="text-xl font-bold leading-none">
              {streak.current}
              <span className="ml-1 text-xs font-normal text-neutral-500">
                {streak.current === 1 ? "day" : "days"}
              </span>
            </p>
          </div>
        </div>
        <div className="surface flex items-center gap-3 px-4 py-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15">
            <Snowflake className="h-5 w-5 text-sky-500" />
          </span>
          <div>
            <p className="text-xs text-neutral-500">Freeze tokens</p>
            <p className="text-xl font-bold leading-none">
              {profile?.freeze_tokens ?? 0}
            </p>
          </div>
        </div>
      </div>

      <div className="surface px-4 py-3">
        <DayNavigator date={date} onChange={setDate} />
        <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {agg.doneCount}/{agg.total} habits
            </span>
            {agg.perfect && (
              <span className="animate-pop rounded-full bg-ember-500/15 px-2 py-0.5 text-xs font-bold text-ember-500">
                ⚡ Perfect day +30
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span className="font-bold text-ember-500">{agg.xp} XP</span>
            <SaveIndicator state={saveState} />
          </div>
        </div>
      </div>

      {/* Focus timer — only meaningful for the current day */}
      {date === todayStr() && (
        <FocusTimer habits={active} onComplete={logFocus} />
      )}

      {/* Habit cards (only those scheduled for this day) */}
      {scheduled.length === 0 ? (
        <div className="surface flex flex-col items-center px-4 py-10 text-center text-sm text-neutral-500">
          <Moon className="mb-2 h-6 w-6" />
          Rest day — nothing scheduled. Enjoy it (your streak is safe).
        </div>
      ) : (
        <div className="space-y-3">
          {scheduled.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              value={values[habit.id] ?? 0}
              target={targetFor(habit, date)}
              done={isDone(habit, values[habit.id] ?? 0, date)}
              onChange={(v) => update(habit.id, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" }) {
  if (state === "saving")
    return (
      <span className="flex items-center gap-1 text-neutral-400">
        <Cloud className="h-3.5 w-3.5 animate-pulse" /> Saving
      </span>
    );
  if (state === "saved")
    return (
      <span className="flex items-center gap-1 text-emerald-500">
        <Check className="h-3.5 w-3.5" /> Saved
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-neutral-400">
      <CloudOff className="h-3.5 w-3.5" /> Synced
    </span>
  );
}

function SkeletonHome() {
  return (
    <div className="space-y-4">
      <div className="surface h-16 animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        <div className="surface h-16 animate-pulse" />
        <div className="surface h-16 animate-pulse" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="surface h-24 animate-pulse" />
      ))}
    </div>
  );
}
