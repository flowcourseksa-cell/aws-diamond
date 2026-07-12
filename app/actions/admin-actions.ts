"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

async function verifyAdminAccess() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("غير مصرح لك");
  
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    throw new Error("غير مصرح لك للقيام بهذه العملية");
  }
}

export async function createStudentByAdmin(data: {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
}) {
  await verifyAdminAccess();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return { success: false, error: "Missing Supabase configuration." };
  }

  // Create an admin client bypassing RLS and avoiding local session updates
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password || "123456", // default simple password if none provided
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
      },
    });

    if (authError) {
      console.error("Error creating user:", authError.message);
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: "User creation failed." };
    }

    // The trigger automatically inserts into profiles.
    // If phone number is provided, update the profile.
    if (data.phone) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ phone: data.phone })
        .eq("id", authData.user.id);
        
      if (profileError) {
        console.error("Error updating phone:", profileError.message);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error("Server action error:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
}

export async function broadcastInAppNotification(title: string, message: string) {
  await verifyAdminAccess();
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  
  try {
    const { data: students } = await supabaseAdmin.from("profiles").select("id").eq("role", "student");
    if (!students || students.length === 0) return { success: true, count: 0 };

    // 1️⃣ Insert in-app notification for each student (bell icon in app)
    const notifications = students.map(s => ({
      user_id: s.id,
      title,
      message,
      type: "system",
      is_read: false
    }));
    const { error: insertError } = await supabaseAdmin.from("notifications").insert(notifications);
    if (insertError) throw insertError;

    // 2️⃣ Send Web Push to all subscribed devices (phone native notification)
    const { data: subs } = await supabaseAdmin.from("push_subscriptions").select("*");

    let pushSent = 0;
    let pushFailed = 0;
    const deadEndpoints: string[] = [];

    if (subs && subs.length > 0) {
      const webpush = (await import("web-push")).default;
      webpush.setVapidDetails(
        process.env.VAPID_EMAIL!,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!
      );

      const payload = JSON.stringify({
        title,
        body: message,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        url: "/dashboard",
        timestamp: Date.now(),
      });

      await Promise.allSettled(
        subs.map(async (sub: any) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload,
              { TTL: 86400 }
            );
            pushSent++;
          } catch (err: any) {
            pushFailed++;
            if (err.statusCode === 410 || err.statusCode === 404) {
              deadEndpoints.push(sub.endpoint);
            }
          }
        })
      );

      // Clean up expired subscriptions
      if (deadEndpoints.length > 0) {
        await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", deadEndpoints);
      }
    }

    // 3️⃣ Log the broadcast
    await supabaseAdmin.from("push_notifications_log").insert({
      title,
      body: message,
      url: "",
      recipient_count: students.length
    });

    return { success: true, count: students.length, pushSent, pushFailed };
  } catch (err: any) {
    console.error("Broadcast error:", err);
    return { success: false, error: err.message };
  }
}


export async function deleteBroadcastNotification(logId: string, title: string, body: string) {
  await verifyAdminAccess();
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // Delete from user notifications
    await supabaseAdmin.from("notifications").delete().match({ title, message: body, type: "system" });
    
    // Delete the log
    await supabaseAdmin.from("push_notifications_log").delete().eq("id", logId);

    return { success: true };
  } catch (err: any) {
    console.error("Delete broadcast error:", err);
    return { success: false, error: err.message };
  }
}

export async function getBroadcastLogs() {
  await verifyAdminAccess();
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const { data } = await supabaseAdmin.from("push_notifications_log").select("*").order("sent_at", { ascending: false }).limit(20);
    return { success: true, logs: data || [] };
  } catch (err: any) {
    console.error("Fetch logs error:", err);
    return { success: false, logs: [] };
  }
}
