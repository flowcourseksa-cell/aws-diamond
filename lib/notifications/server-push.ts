import { SupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Initialize web-push only once per server runtime
let webPushInitialized = false;

function initWebPush() {
  if (webPushInitialized) return;
  
  if (process.env.VAPID_EMAIL && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    webPushInitialized = true;
  }
}

type NotificationPayload = {
  userIds: string[];
  title: string;
  message: string;
  type?: "success" | "error" | "rejected" | "system" | "default";
  url?: string;
};

/**
 * Sends a notification both to the in-app bell (DB) and to the user's phone via Web Push.
 */
export async function sendPlatformNotification(
  supabaseAdmin: SupabaseClient,
  payload: NotificationPayload
) {
  const { userIds, title, message, type = "default", url = "/dashboard" } = payload;
  if (!userIds || userIds.length === 0) return { success: true, sent: 0 };

  // 1. Insert In-App Notifications
  const dbNotifications = userIds.map((id) => ({
    user_id: id,
    title,
    message,
    type,
    is_read: false,
  }));

  const { error: insertError } = await supabaseAdmin.from("notifications").insert(dbNotifications);
  if (insertError) {
    console.error("Failed to insert in-app notifications:", insertError);
  }

  // 2. Send Web Push Notifications
  try {
    initWebPush();
    if (!webPushInitialized) {
      console.warn("VAPID keys not configured, skipping web push");
      return { success: true, inAppOnly: true };
    }

    const { data: subs, error: subError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .in("student_id", userIds);

    if (subError || !subs || subs.length === 0) {
      return { success: true, sent: 0 };
    }

    const pushPayload = JSON.stringify({
      title,
      body: message,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      url,
      timestamp: Date.now(),
    });

    let sent = 0;
    const deadEndpoints: string[] = [];

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            pushPayload,
            { TTL: 86400 } // 24 hours
          );
          sent++;
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            deadEndpoints.push(sub.endpoint);
          }
        }
      })
    );

    // Clean up expired push subscriptions
    if (deadEndpoints.length > 0) {
      await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", deadEndpoints);
    }

    // Log the push
    if (sent > 0) {
      await supabaseAdmin.from("push_notifications_log").insert({
        title,
        body: message,
        url,
        recipient_count: sent,
      });
    }

    return { success: true, sent, dead: deadEndpoints.length };
  } catch (error) {
    console.error("Error sending web push:", error);
    return { success: false, error };
  }
}
