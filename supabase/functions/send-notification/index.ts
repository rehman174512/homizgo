// Supabase Edge Function: send-notification
// Deploy with: supabase functions deploy send-notification
//
// Required secrets (set via Supabase Dashboard → Edge Functions → Secrets):
//   FIREBASE_SERVER_KEY  — Firebase Cloud Messaging server key (Legacy HTTP API key)
//   (from Firebase Console → Project Settings → Cloud Messaging → Cloud Messaging API (Legacy))

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { token, title, body, data = {} } = await req.json();

    if (!token || !title || !body) {
      return new Response(
        JSON.stringify({ error: "token, title, and body are required" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const serverKey = Deno.env.get("FIREBASE_SERVER_KEY");
    if (!serverKey) {
      return new Response(
        JSON.stringify({ error: "FIREBASE_SERVER_KEY secret not configured" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const fcmPayload = {
      to: token,
      notification: {
        title,
        body,
        icon: "/favicon.ico",
        click_action: "https://homizgo.com",
      },
      data,
    };

    const fcmRes = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${serverKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fcmPayload),
    });

    const fcmData = await fcmRes.json();

    if (fcmData.failure > 0) {
      console.error("[send-notification] FCM delivery failure:", fcmData);
    }

    return new Response(JSON.stringify(fcmData), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-notification] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
