// Daily reminder cron. Triggered by Vercel Cron (see vercel.json), which sends
// "Authorization: Bearer $CRON_SECRET". Sends a push to every subscribed user
// who hasn't logged anything today. Uses the service-role client to read across
// all users (bypasses RLS).
import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayStr } from "@/lib/dates";

export const runtime = "nodejs";
export const maxDuration = 60;

interface SubRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function GET(request: Request) {
  // 1. Authorize: only Vercel Cron (or someone with the secret) may run this.
  const auth = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    auth !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  if (!publicKey || !privateKey || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Push not configured (VAPID / service-role key missing)." },
      { status: 500 },
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const admin = createAdminClient();

  // 2. Who already logged today? Skip nudging them.
  const today = todayStr();
  const { data: loggedRows } = await admin
    .from("habit_entries")
    .select("user_id")
    .eq("log_date", today)
    .gt("value", 0);
  const loggedToday = new Set((loggedRows ?? []).map((r) => r.user_id));

  // 3. All subscriptions.
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth");
  const subscriptions = (subs ?? []) as SubRow[];

  const payload = JSON.stringify({
    title: "🔥 War Room",
    body: "You haven't logged today. Keep the streak alive.",
    url: "/",
  });

  let sent = 0;
  let pruned = 0;
  const deadIds: string[] = [];

  await Promise.all(
    subscriptions
      .filter((s) => !loggedToday.has(s.user_id))
      .map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
          sent++;
        } catch (err: unknown) {
          const code = (err as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) deadIds.push(s.id); // expired
        }
      }),
  );

  // 4. Clean up expired subscriptions.
  if (deadIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", deadIds);
    pruned = deadIds.length;
  }

  return NextResponse.json({ ok: true, sent, pruned, today });
}
