"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Snowflake } from "lucide-react";
import { WEEKDAYS, ALL_DAYS } from "@/lib/habits";
import { useDashboard } from "@/lib/useDashboard";
import type { Habit, HabitDraft, HabitType } from "@/types";

const BLANK: HabitDraft = {
  name: "",
  emoji: "✅",
  type: "quantity",
  unit: "",
  target: 1,
  step: 1,
  xp: 15,
  active_days: ALL_DAYS,
  day_targets: null,
  archived: false,
};

export function HabitEditor() {
  const {
    loading,
    habits,
    profile,
    createHabit,
    updateHabit,
    deleteHabit,
    setFreezeTokens,
  } = useDashboard();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const active = habits.filter((h) => !h.archived);

  if (loading) {
    return (
      <div className="surface px-4 py-8 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Freeze tokens control */}
      <div className="surface flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Snowflake className="h-4 w-4 text-sky-500" />
          <span className="text-sm font-medium">Freeze tokens</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFreezeTokens((profile?.freeze_tokens ?? 0) - 1)}
            className="h-7 w-7 rounded-lg border border-neutral-200 text-neutral-600 dark:border-neutral-800 dark:text-neutral-300"
          >
            −
          </button>
          <span className="w-6 text-center font-bold tabular-nums">
            {profile?.freeze_tokens ?? 0}
          </span>
          <button
            type="button"
            onClick={() => setFreezeTokens((profile?.freeze_tokens ?? 0) + 1)}
            className="h-7 w-7 rounded-lg border border-neutral-200 text-neutral-600 dark:border-neutral-800 dark:text-neutral-300"
          >
            +
          </button>
        </div>
      </div>

      {/* Habit list */}
      <div className="space-y-3">
        {active.map((habit) =>
          editingId === habit.id ? (
            <HabitForm
              key={habit.id}
              initial={habit}
              submitLabel="Save"
              onCancel={() => setEditingId(null)}
              onSubmit={async (draft) => {
                await updateHabit(habit.id, draft);
                setEditingId(null);
              }}
            />
          ) : (
            <div
              key={habit.id}
              className="surface flex items-center gap-3 px-4 py-3"
            >
              <span className="text-2xl">{habit.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{habit.name}</p>
                <p className="text-xs text-neutral-500">
                  {habit.type === "boolean"
                    ? "Yes / No"
                    : `Target ${habit.target} ${habit.unit ?? ""}`}{" "}
                  · {scheduleLabel(habit.active_days)} · {habit.xp} XP
                </p>
              </div>
              <button
                type="button"
                aria-label="Edit"
                onClick={() => setEditingId(habit.id)}
                className="text-neutral-400 transition hover:text-ember-500"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Delete"
                onClick={() => {
                  if (confirm(`Delete "${habit.name}"? Its history is removed too.`))
                    deleteHabit(habit.id);
                }}
                className="text-neutral-400 transition hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ),
        )}
      </div>

      {/* Add habit */}
      {adding ? (
        <HabitForm
          initial={BLANK}
          submitLabel="Create"
          onCancel={() => setAdding(false)}
          onSubmit={async (draft) => {
            await createHabit(draft);
            setAdding(false);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 py-3 text-sm font-medium text-neutral-500 transition hover:border-ember-500 hover:text-ember-500 dark:border-neutral-700"
        >
          <Plus className="h-4 w-4" /> Add habit
        </button>
      )}
    </div>
  );
}

function scheduleLabel(days: number[]): string {
  if (days.length === 7) return "Every day";
  if (days.length === 0) return "Never";
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => WEEKDAYS[d])
    .join(" ");
}

function HabitForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: HabitDraft | Habit;
  submitLabel: string;
  onSubmit: (draft: HabitDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [emoji, setEmoji] = useState(initial.emoji);
  const [type, setType] = useState<HabitType>(initial.type);
  const [unit, setUnit] = useState(initial.unit ?? "");
  const [target, setTarget] = useState(String(initial.target));
  const [step, setStep] = useState(String(initial.step));
  const [xp, setXp] = useState(String(initial.xp));
  const [days, setDays] = useState<number[]>(initial.active_days);
  const [busy, setBusy] = useState(false);

  function toggleDay(d: number) {
    setDays((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort(),
    );
  }

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    await onSubmit({
      name: name.trim(),
      emoji: emoji || "✅",
      type,
      unit: type === "boolean" ? null : unit || null,
      target: type === "boolean" ? 1 : Number(target) || 1,
      step: type === "boolean" ? 1 : Number(step) || 1,
      xp: Number(xp) || 10,
      active_days: days,
      day_targets: null,
      archived: false,
    });
    setBusy(false);
  }

  return (
    <div className="surface space-y-3 px-4 py-4">
      <div className="flex gap-2">
        <input
          aria-label="Emoji"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          maxLength={2}
          className="w-12 rounded-lg border border-neutral-200 bg-transparent px-2 py-2 text-center text-lg outline-none focus:border-ember-500 dark:border-neutral-800"
        />
        <input
          autoFocus
          placeholder="Habit name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-ember-500 dark:border-neutral-800"
        />
      </div>

      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as HabitType)}
          className="flex-1 rounded-lg border border-neutral-200 bg-transparent px-2 py-2 text-sm outline-none focus:border-ember-500 dark:border-neutral-800"
        >
          <option value="quantity">Quantity</option>
          <option value="boolean">Yes / No</option>
        </select>
        <label className="flex items-center gap-1 text-xs text-neutral-500">
          XP
          <input
            type="number"
            value={xp}
            onChange={(e) => setXp(e.target.value)}
            className="w-16 rounded-lg border border-neutral-200 bg-transparent px-2 py-2 text-center text-sm outline-none focus:border-ember-500 dark:border-neutral-800"
          />
        </label>
      </div>

      {type === "quantity" && (
        <div className="grid grid-cols-3 gap-2">
          <label className="text-xs text-neutral-500">
            Target
            <input
              type="number"
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-transparent px-2 py-2 text-center text-sm outline-none focus:border-ember-500 dark:border-neutral-800"
            />
          </label>
          <label className="text-xs text-neutral-500">
            Step
            <input
              type="number"
              inputMode="decimal"
              value={step}
              onChange={(e) => setStep(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-transparent px-2 py-2 text-center text-sm outline-none focus:border-ember-500 dark:border-neutral-800"
            />
          </label>
          <label className="text-xs text-neutral-500">
            Unit
            <input
              placeholder="hrs"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-transparent px-2 py-2 text-center text-sm outline-none focus:border-ember-500 dark:border-neutral-800"
            />
          </label>
        </div>
      )}

      {/* weekday scheduler */}
      <div>
        <p className="mb-1 text-xs text-neutral-500">Scheduled on</p>
        <div className="flex gap-1">
          {WEEKDAYS.map((label, d) => {
            const on = days.includes(d);
            return (
              <button
                type="button"
                key={d}
                onClick={() => toggleDay(d)}
                className={`flex-1 rounded-lg py-1.5 text-[11px] font-medium transition ${
                  on
                    ? "bg-ember-500 text-white"
                    : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                }`}
              >
                {label[0]}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-[11px] text-neutral-400">
          Days left off are rest days — they don&apos;t break your streak.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={busy || !name.trim()}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-ember-500 py-2 text-sm font-semibold text-white transition hover:bg-ember-600 disabled:opacity-50"
        >
          <Check className="h-4 w-4" /> {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center justify-center gap-1 rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-500 dark:border-neutral-800"
        >
          <X className="h-4 w-4" /> Cancel
        </button>
      </div>
    </div>
  );
}
