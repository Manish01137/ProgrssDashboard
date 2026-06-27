"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Briefcase } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Project, ProjectStatus } from "@/types";

const STATUS_META: Record<ProjectStatus, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-blue-500/15 text-blue-500" },
  in_progress: { label: "In Progress", cls: "bg-amber-500/15 text-amber-500" },
  done: { label: "Done", cls: "bg-emerald-500/15 text-emerald-500" },
  paused: { label: "Paused", cls: "bg-neutral-500/15 text-neutral-500" },
};

export function ProjectTracker() {
  const supabase = useMemo(() => createClient(), []);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // new-project form state
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [hours, setHours] = useState("");
  const [earnings, setEarnings] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      setProjects((data ?? []) as Project[]);
      setLoading(false);
    })();
  }, [supabase]);

  async function addProject() {
    if (!name.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: name.trim(),
        deadline: deadline || null,
        hours_logged: Number(hours) || 0,
        earnings: Number(earnings) || 0,
        status: "active",
      })
      .select()
      .single();
    if (data) setProjects((p) => [data as Project, ...p]);
    setName("");
    setDeadline("");
    setHours("");
    setEarnings("");
    setAdding(false);
  }

  async function patch(id: string, patch: Partial<Project>) {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
    await supabase.from("projects").update(patch).eq("id", id);
  }

  async function remove(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    await supabase.from("projects").delete().eq("id", id);
  }

  const totals = useMemo(
    () => ({
      hours: projects.reduce((s, p) => s + Number(p.hours_logged), 0),
      earnings: projects.reduce((s, p) => s + Number(p.earnings), 0),
    }),
    [projects],
  );

  if (loading) {
    return (
      <div className="surface px-4 py-8 text-center text-sm text-neutral-500">
        Loading projects…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* totals */}
      <div className="grid grid-cols-2 gap-3">
        <div className="surface px-4 py-3">
          <p className="text-xs text-neutral-500">Total Hours</p>
          <p className="text-2xl font-bold tabular-nums">{totals.hours}</p>
        </div>
        <div className="surface px-4 py-3">
          <p className="text-xs text-neutral-500">Total Earnings</p>
          <p className="text-2xl font-bold tabular-nums">
            ${totals.earnings.toLocaleString()}
          </p>
        </div>
      </div>

      {/* add button / form */}
      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 py-3 text-sm font-medium text-neutral-500 transition hover:border-ember-500 hover:text-ember-500 dark:border-neutral-700"
        >
          <Plus className="h-4 w-4" /> Add project
        </button>
      ) : (
        <div className="surface space-y-2 px-4 py-4">
          <input
            autoFocus
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-ember-500 dark:border-neutral-800"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-transparent px-2 py-2 text-xs outline-none focus:border-ember-500 dark:border-neutral-800"
            />
            <input
              type="number"
              inputMode="decimal"
              placeholder="Hours"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-transparent px-2 py-2 text-xs outline-none focus:border-ember-500 dark:border-neutral-800"
            />
            <input
              type="number"
              inputMode="decimal"
              placeholder="$ Earned"
              value={earnings}
              onChange={(e) => setEarnings(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-transparent px-2 py-2 text-xs outline-none focus:border-ember-500 dark:border-neutral-800"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addProject}
              className="flex-1 rounded-lg bg-ember-500 py-2 text-sm font-semibold text-white transition hover:bg-ember-600"
            >
              Save
            </button>
            <button
              onClick={() => setAdding(false)}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-500 dark:border-neutral-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* list */}
      {projects.length === 0 ? (
        <div className="surface flex flex-col items-center px-4 py-10 text-center text-sm text-neutral-500">
          <Briefcase className="mb-2 h-6 w-6" />
          No projects yet. Add your first client gig.
        </div>
      ) : (
        projects.map((p) => (
          <div key={p.id} className="surface animate-fade-in px-4 py-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.name}</p>
                {p.deadline && (
                  <p className="text-xs text-neutral-500">
                    Due {format(parseISO(p.deadline), "MMM d, yyyy")}
                  </p>
                )}
              </div>
              <button
                aria-label="Delete project"
                onClick={() => remove(p.id)}
                className="text-neutral-400 transition hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={p.status}
                onChange={(e) =>
                  patch(p.id, { status: e.target.value as ProjectStatus })
                }
                className={`rounded-full px-2.5 py-1 text-xs font-medium outline-none ${STATUS_META[p.status].cls}`}
              >
                {(Object.keys(STATUS_META) as ProjectStatus[]).map((s) => (
                  <option key={s} value={s} className="text-neutral-900">
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-1 text-xs text-neutral-500">
                Hours
                <input
                  type="number"
                  inputMode="decimal"
                  value={p.hours_logged}
                  onChange={(e) =>
                    patch(p.id, { hours_logged: Number(e.target.value) || 0 })
                  }
                  className="w-16 rounded-lg border border-neutral-200 bg-transparent px-2 py-1 text-center text-sm font-semibold outline-none focus:border-ember-500 dark:border-neutral-800"
                />
              </label>

              <label className="flex items-center gap-1 text-xs text-neutral-500">
                $
                <input
                  type="number"
                  inputMode="decimal"
                  value={p.earnings}
                  onChange={(e) =>
                    patch(p.id, { earnings: Number(e.target.value) || 0 })
                  }
                  className="w-20 rounded-lg border border-neutral-200 bg-transparent px-2 py-1 text-center text-sm font-semibold outline-none focus:border-ember-500 dark:border-neutral-800"
                />
              </label>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
