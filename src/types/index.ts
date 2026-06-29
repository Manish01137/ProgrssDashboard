// Shared domain types for the Discipline Dashboard.

export type HabitType = "quantity" | "boolean";

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  type: HabitType;
  unit: string | null;
  target: number;
  step: number;
  xp: number;
  active_days: number[]; // 0 = Sunday … 6 = Saturday
  day_targets: Record<string, number> | null; // per-weekday target overrides
  sort_order: number;
  archived: boolean;
  created_at?: string;
  updated_at?: string;
}

// What the editor form produces (no id/user_id/sort_order yet — those are
// assigned by the system on insert).
export type HabitDraft = Omit<
  Habit,
  "id" | "user_id" | "sort_order" | "created_at" | "updated_at"
>;

export interface HabitEntry {
  id?: string;
  user_id: string;
  habit_id: string;
  log_date: string; // YYYY-MM-DD
  value: number;
}

export interface FocusSession {
  id?: string;
  user_id: string;
  habit_id: string | null;
  minutes: number;
  log_date: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  email: string | null;
  freeze_tokens: number;
  goal: string | null;
  goal_date: string | null; // YYYY-MM-DD
}

export type ProjectStatus = "active" | "in_progress" | "done" | "paused";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  deadline: string | null;
  status: ProjectStatus;
  hours_logged: number;
  earnings: number;
  created_at?: string;
  updated_at?: string;
}
