import { getToken, onMessage } from "firebase/messaging";
import { createClient } from "./supabase";

const supabase = createClient();

// ─── Lazily get messaging instance ────────────────────────────────────────────
async function getMessagingInstance() {
  const { messagingPromise } = await import("./firebase");
  return await messagingPromise;
}

// ─── Request Permission & Save FCM Token ──────────────────────────────────────
export async function requestNotificationPermission() {
  if (typeof Notification === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey || vapidKey.length < 20) {
      console.warn("[FCM] VAPID key missing or too short. Add it to .env to enable push tokens.");
      return null;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const token = await getToken(messaging, { vapidKey });
    if (token) {
      await saveFcmToken(token);
      return token;
    }

    return null;
  } catch (err) {
    console.warn("[FCM] Permission request error:", err.message);
    return null;
  }
}

// ─── Listen for Foreground Messages ───────────────────────────────────────────
export async function onMessageListener(callback) {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
}

// ─── Save FCM Token to Supabase Users Table ───────────────────────────────────
async function saveFcmToken(token) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const { error } = await supabase
    .from("users")
    .update({ fcm_token: token })
    .eq("id", session.user.id);

  if (error) {
    console.warn("[FCM] Could not save token:", error.message);
  }
}

// ─── Send Notification to Property Owner ──────────────────────────────────────
/**
 * Fetches the owner's FCM token from Supabase, then calls our Edge Function
 * to deliver the push notification via Firebase Cloud Messaging.
 *
 * @param {string} ownerId       – UUID of the owner user
 * @param {string} title         – Notification title
 * @param {string} body          – Notification body
 * @param {object} [data]        – Optional extra data payload
 */
export async function sendNotificationToOwner(ownerId, title, body, data = {}) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data: ownerRow, error: fetchErr } = await supabase
      .from("users")
      .select("fcm_token")
      .eq("id", ownerId)
      .single();

    if (fetchErr || !ownerRow?.fcm_token) return;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        token: ownerRow.fcm_token,
        title,
        body,
        data,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn("[FCM] Edge function error:", text);
    }
  } catch (_) {
    // Non-critical; never crash the UI
  }
}
