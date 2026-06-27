// Weekly Review — server-side only. Reads GEMINI_API_KEY from the environment
// (never exposed to the browser), authenticates the user via Supabase, fetches
// *their own* habits + last 7 days of entries from the database, and asks
// Gemini for a short, actionable review.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildEntryIndex,
  isScheduled,
  isDone,
  targetFor,
  valueFor,
} from "@/lib/habits";
import { lastNDates } from "@/lib/dates";
import type { Habit, HabitEntry } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const GEMINI_MODEL = "gemini-2.0-flash";

export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Weekly Review isn't configured (missing GEMINI_API_KEY)." },
      { status: 500 },
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const dates = lastNDates(7);

  const [habitRes, entryRes] = await Promise.all([
    supabase.from("habits").select("*").eq("archived", false),
    supabase.from("habit_entries").select("*").gte("log_date", dates[0]),
  ]);

  const habits = (habitRes.data ?? []) as Habit[];
  const entries = (entryRes.data ?? []) as HabitEntry[];

  if (habits.length === 0 || entries.length === 0) {
    return NextResponse.json({
      review:
        "Not enough data in the last 7 days yet. Log a few days on the Today screen, then come back for your review.",
    });
  }

  // Build a compact, readable summary the model can reason over.
  const idx = buildEntryIndex(entries);
  const lines = dates.map((d) => {
    const parts = habits
      .filter((h) => isScheduled(h, d))
      .map((h) => {
        const v = valueFor(idx, h.id, d);
        const t = targetFor(h, d);
        const ok = isDone(h, v, d) ? "✓" : "✗";
        return h.type === "boolean"
          ? `${h.name} ${v >= 1 ? "yes" : "no"}${ok}`
          : `${h.name} ${v}/${t}${h.unit ?? ""}${ok}`;
      });
    return `${d}: ${parts.length ? parts.join(", ") : "(rest day)"}`;
  });

  const prompt = `You are a focused, no-nonsense accountability coach for a B.Tech final-year student building discipline before classes start in August.

Here is their habit data for the last 7 days (✓ = target met, ✗ = missed; "/" shows value over target):
${lines.join("\n")}

Write a SHORT review (about 120-160 words, plain text, no markdown headers) with exactly three parts:
1. "Crushing it:" — what they're doing well (be specific with numbers).
2. "Slipping:" — what they're skipping or under-target on.
3. "This week:" — ONE concrete, achievable suggestion for the coming week.

Be direct and motivating, like a war-room briefing. Reference real numbers from the data. Don't invent data that isn't there.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Gemini API error:", res.status, detail);
      return NextResponse.json(
        { error: "Couldn't generate the review right now. Try again shortly." },
        { status: 502 },
      );
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const review =
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("")
        .trim() ?? "";

    if (!review) {
      return NextResponse.json(
        { error: "The model returned an empty review. Try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ review });
  } catch (err) {
    console.error("Weekly Review failed:", err);
    return NextResponse.json(
      { error: "Couldn't generate the review right now. Try again shortly." },
      { status: 502 },
    );
  }
}
