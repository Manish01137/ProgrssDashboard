"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { lastNDates, todayStr } from "@/lib/dates";
import { DEFAULT_HABITS } from "@/lib/habits";
import type { Habit, HabitDraft, HabitEntry, Profile } from "@/types";

interface DashboardState {
  loading: boolean;
  userId: string | null;
  email: string | null;
  habits: Habit[];
  entries: HabitEntry[];
  profile: Profile | null;
  loggedDates: string[];
  refetch: () => Promise<void>;
  saveEntry: (habitId: string, date: string, value: number) => Promise<void>;
  createHabit: (draft: HabitDraft) => Promise<void>;
  updateHabit: (id: string, patch: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  setFreezeTokens: (n: number) => Promise<void>;
  updateGoal: (goal: string, goalDate: string | null) => Promise<void>;
  logFocus: (habitId: string | null, minutes: number, addValue: number) => Promise<void>;
}

const HISTORY_DAYS = 366;

export function useDashboard(): DashboardState {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.id);
    setEmail(user.email ?? null);

    const since = lastNDates(HISTORY_DAYS)[0];

    const [habitRes, entryRes, profileRes] = await Promise.all([
      supabase.from("habits").select("*").order("sort_order", { ascending: true }),
      supabase.from("habit_entries").select("*").gte("log_date", since),
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    ]);

    let loadedHabits = (habitRes.data ?? []) as Habit[];

    // First sign-in: seed the default habit set.
    if (loadedHabits.length === 0) {
      const rows = DEFAULT_HABITS.map((h, i) => ({
        ...h,
        user_id: user.id,
        sort_order: i,
      }));
      const { data: seeded } = await supabase
        .from("habits")
        .insert(rows)
        .select();
      loadedHabits = ((seeded ?? []) as Habit[]).sort(
        (a, b) => a.sort_order - b.sort_order,
      );
    }

    setHabits(loadedHabits);
    setEntries((entryRes.data ?? []) as HabitEntry[]);

    if (profileRes.data) {
      setProfile(profileRes.data as Profile);
    } else {
      const { data: created } = await supabase
        .from("profiles")
        .upsert({ id: user.id, email: user.email })
        .select()
        .maybeSingle();
      setProfile((created as Profile) ?? null);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const saveEntry = useCallback(
    async (habitId: string, date: string, value: number) => {
      if (!userId) return;
      const { data } = await supabase
        .from("habit_entries")
        .upsert(
          { user_id: userId, habit_id: habitId, log_date: date, value },
          { onConflict: "habit_id,log_date" },
        )
        .select()
        .single();
      if (!data) return;
      const saved = data as HabitEntry;
      setEntries((prev) => {
        const idx = prev.findIndex(
          (e) => e.habit_id === habitId && e.log_date === date,
        );
        if (idx === -1) return [...prev, saved];
        const next = [...prev];
        next[idx] = saved;
        return next;
      });
    },
    [supabase, userId],
  );

  const createHabit = useCallback(
    async (draft: HabitDraft) => {
      if (!userId) return;
      const sort_order = habits.length;
      const { data } = await supabase
        .from("habits")
        .insert({ ...draft, sort_order, user_id: userId })
        .select()
        .single();
      if (data) setHabits((prev) => [...prev, data as Habit]);
    },
    [supabase, userId, habits.length],
  );

  const updateHabit = useCallback(
    async (id: string, patch: Partial<Habit>) => {
      setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)));
      await supabase.from("habits").update(patch).eq("id", id);
    },
    [supabase],
  );

  const deleteHabit = useCallback(
    async (id: string) => {
      setHabits((prev) => prev.filter((h) => h.id !== id));
      setEntries((prev) => prev.filter((e) => e.habit_id !== id));
      await supabase.from("habits").delete().eq("id", id);
    },
    [supabase],
  );

  const setFreezeTokens = useCallback(
    async (n: number) => {
      if (!userId) return;
      const clamped = Math.max(0, n);
      const { data } = await supabase
        .from("profiles")
        .update({ freeze_tokens: clamped })
        .eq("id", userId)
        .select()
        .single();
      if (data) setProfile(data as Profile);
    },
    [supabase, userId],
  );

  const updateGoal = useCallback(
    async (goal: string, goalDate: string | null) => {
      if (!userId) return;
      const { data } = await supabase
        .from("profiles")
        .update({ goal, goal_date: goalDate })
        .eq("id", userId)
        .select()
        .single();
      if (data) setProfile(data as Profile);
    },
    [supabase, userId],
  );

  const logFocus = useCallback(
    async (habitId: string | null, minutes: number, addValue: number) => {
      if (!userId) return;
      const date = todayStr();
      await supabase
        .from("focus_sessions")
        .insert({ user_id: userId, habit_id: habitId, minutes, log_date: date });
      if (habitId && addValue > 0) {
        const current =
          entries.find((e) => e.habit_id === habitId && e.log_date === date)
            ?.value ?? 0;
        await saveEntry(habitId, date, Number(current) + addValue);
      }
    },
    [supabase, userId, entries, saveEntry],
  );

  const loggedDates = useMemo(() => {
    const set = new Set(entries.filter((e) => e.value > 0).map((e) => e.log_date));
    return [...set].sort();
  }, [entries]);

  return {
    loading,
    userId,
    email,
    habits,
    entries,
    profile,
    loggedDates,
    refetch: load,
    saveEntry,
    createHabit,
    updateHabit,
    deleteHabit,
    setFreezeTokens,
    updateGoal,
    logFocus,
  };
}
