"use client";

import { HabitEditor } from "@/components/HabitEditor";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Habits & Settings</h1>
        <p className="text-sm text-neutral-500">
          Add your own habits, set targets, and choose which days each one is
          scheduled.
        </p>
      </div>
      <HabitEditor />
    </div>
  );
}
