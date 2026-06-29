"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { useToast } from "@/components/Toast";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function ReminderToggle() {
  const toast = useToast();
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window &&
      !!VAPID;
    setSupported(ok);
    if (!ok) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEnabled(!!sub))
      .catch(() => {});
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission denied.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID!),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("save failed");
      setEnabled(true);
      toast.success("Daily reminders on. We've got your back. 🔔");
    } catch {
      toast.error("Couldn't enable reminders. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEnabled(false);
      toast.info("Reminders turned off.");
    } catch {
      toast.error("Couldn't turn off reminders.");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <div className="surface px-4 py-3 text-xs text-neutral-500">
        Daily reminders aren&apos;t available in this browser. Install the app to
        your home screen (or use Chrome/Edge) to enable push notifications.
      </div>
    );
  }

  return (
    <div className="surface flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        {enabled ? (
          <Bell className="h-4 w-4 text-ember-500" />
        ) : (
          <BellOff className="h-4 w-4 text-neutral-400" />
        )}
        <div>
          <p className="text-sm font-medium">Daily reminder</p>
          <p className="text-xs text-neutral-500">
            Nightly nudge if you haven&apos;t logged
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={enabled ? disable : enable}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
          enabled
            ? "border border-neutral-200 text-neutral-600 dark:border-neutral-800 dark:text-neutral-300"
            : "bg-ember-500 text-white hover:bg-ember-600"
        }`}
      >
        {busy ? "…" : enabled ? "Turn off" : "Enable"}
      </button>
    </div>
  );
}
