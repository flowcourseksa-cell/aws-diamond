"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { sendPlatformNotification } from "@/lib/notifications/server-push";

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

    // 1️⃣ Send to all students using the unified platform notification system
    const result = await sendPlatformNotification(supabaseAdmin, {
      userIds: students.map(s => s.id),
      title,
      message,
      type: "system",
      url: "/dashboard"
    });

    return { success: true, count: students.length, pushSent: result.sent || 0, pushFailed: result.dead || 0 };
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
