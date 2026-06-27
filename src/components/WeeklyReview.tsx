"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface ReviewResponse {
  review?: string;
  error?: string;
}

export function WeeklyReview() {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runReview() {
    setLoading(true);
    setError(null);
    setReview(null);
    try {
      const res = await fetch("/api/weekly-review", { method: "POST" });
      const data: ReviewResponse = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong. Try again.");
      } else {
        setReview(data.review ?? "");
      }
    } catch {
      setError("Network error. Check your connection and retry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="surface bg-gradient-to-br from-ember-500/10 to-transparent px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ember-500/15 ring-1 ring-ember-500/30">
            <Sparkles className="h-4 w-4 text-ember-500" />
          </span>
          <div>
            <h2 className="text-sm font-bold leading-tight">Weekly Review</h2>
            <p className="text-xs text-neutral-500">
              AI analysis of your last 7 days
            </p>
          </div>
        </div>
        <button
          onClick={runReview}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-ember-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember-600 active:scale-95 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </>
          ) : (
            "Generate"
          )}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </p>
      )}

      {review && (
        <div className="animate-fade-in mt-3 whitespace-pre-wrap rounded-xl bg-white/60 px-4 py-3 text-sm leading-relaxed dark:bg-neutral-950/40">
          {review}
        </div>
      )}
    </div>
  );
}
