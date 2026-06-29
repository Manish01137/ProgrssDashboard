"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDashboard } from "@/lib/useDashboard";
import { StatsCards } from "@/components/StatsCards";
import { WeeklyReview } from "@/components/WeeklyReview";
import { Insights } from "@/components/Insights";
import { Heatmap } from "@/components/Heatmap";
import { Charts } from "@/components/Charts";
import { Badges } from "@/components/Badges";

export default function StatsPage() {
  const { loading, habits, entries, profile } = useDashboard();
  const supabase = useMemo(() => createClient(), []);
  const [earnings, setEarnings] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("projects").select("earnings");
      if (data) {
        setEarnings(
          data.reduce(
            (s, p) => s + Number((p as { earnings: number }).earnings),
            0,
          ),
        );
      }
    })();
  }, [supabase]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="surface h-24 animate-pulse" />
        <div className="surface h-40 animate-pulse" />
        <div className="surface h-40 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight">Command Center</h1>
      <StatsCards habits={habits} entries={entries} profile={profile} />
      <WeeklyReview />
      <Insights habits={habits} entries={entries} />
      <Heatmap habits={habits} entries={entries} />
      <Charts habits={habits} entries={entries} />
      <Badges habits={habits} entries={entries} totalEarnings={earnings} />
    </div>
  );
}
