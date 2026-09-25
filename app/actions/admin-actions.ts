"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
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
  password: string;
  phone?: string;
  parentPhone?: string;
}): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    await verifyAdminAccess();
  } catch (err: any) {
    return { success: false, error: err?.message || "غير مصرح لك" };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return { success: false, error: "Missing Supabase configuration." };
  }

  const fullName = (data.fullName || "").trim();
  const email = (data.email || "").trim().toLowerCase();
  const password = data.password || "";
  if (fullName.length < 2) return { success: false, error: "أدخل اسم الطالب" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, error: "البريد الإلكتروني غير صالح" };
  if (password.length < 6) return { success: false, error: "كلمة المرور 6 أحرف على الأقل" };

  // Admin client bypassing RLS and avoiding local session updates
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, name: fullName },
      // يميّز الحسابات التي أنشأها المدير حتى تُقبل حين يكون التسجيل الذاتي مغلقاً (lib/registration-mode.ts)
      app_metadata: { created_by: "admin" },
    });

    if (authError) {
      console.error("Error creating user:", authError.message);
      const msg = /already|exists|registered/i.test(authError.message) ? "هذا البريد مسجّل بالفعل" : authError.message;
      return { success: false, error: msg };
    }
    if (!authData.user) return { success: false, error: "User creation failed." };

    // trigger on_auth_user_created ينشئ الملف الشخصي؛ نكمل بقية الحقول ونضمن وجوده
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: authData.user.id,
      full_name: fullName,
      role: "student",
      phone: data.phone?.trim() || null,
      parent_phone: data.parentPhone?.trim() || null,
    });
    if (profileError) console.error("Error saving profile:", profileError.message);

    revalidatePath("/admin-khaled-ksa-aws-2026-org/students");
    return { success: true, userId: authData.user.id };
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
