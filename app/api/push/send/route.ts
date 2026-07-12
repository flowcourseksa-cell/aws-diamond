// app/api/push/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { title, body, url, icon, studentIds } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: "title and body are required" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Fetch subscriptions — filter by studentIds if provided, else send to all
    let query = supabase.from("push_subscriptions").select("*");
    if (studentIds && studentIds.length > 0) {
      query = query.in("student_id", studentIds);
    }

    const { data: subs, error } = await query;
    if (error || !subs) {
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || "/icon-192x192.png",
      badge: "/icon-192x192.png",
      url: url || "/dashboard",
      timestamp: Date.now(),
    });

    let sent = 0;
    let failed = 0;
    const deadEndpoints: string[] = [];

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
            { TTL: 86400 } // 24 hours
          );
          sent++;
        } catch (err: any) {
          failed++;
          // 410 Gone = subscription expired, delete it
          if (err.statusCode === 410 || err.statusCode === 404) {
            deadEndpoints.push(sub.endpoint);
          }
        }
      })
    );

    // Clean up dead subscriptions
    if (deadEndpoints.length > 0) {
      await supabase.from("push_subscriptions").delete().in("endpoint", deadEndpoints);
    }

    // Log notification
    await supabase.from("push_notifications_log").insert({
      title,
      body,
      url: url || "/dashboard",
      recipient_count: sent,
    });

    return NextResponse.json({ success: true, sent, failed, cleaned: deadEndpoints.length });
  } catch (err) {
    console.error("Push send error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
