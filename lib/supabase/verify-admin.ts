import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * حراسة إجراءات الخادم (Server Actions). أي دالة مُصدَّرة من ملف "use server" يمكن استدعاؤها من أي متصفح
 * بمعرّفها (المعرّفات موجودة في حزم العميل العامة)، فلا يجوز الاعتماد على كون الصفحة إدارية أو على معرّف
 * طالب مرسل من العميل. استخدم:
 * - verifyAdminAccess(): للعمليات الإدارية فقط (يرمي خطأً إن لم يكن المستدعي مديراً).
 * - requireUserId(): للعمليات الخاصة بالطالب؛ تعيد معرّف صاحب الجلسة وتتجاهل أي معرّف قادم من العميل.
 */
export async function verifyAdminAccess() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("غير مصرح لك");
  
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    throw new Error("غير مصرح لك للقيام بهذه العملية");
  }
}

export async function requireUserId(): Promise<string> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("غير مصرح لك");
  return user.id;
}

/** يعيد معرّف صاحب الجلسة أو null دون رمي خطأ (للقراءات التي تعمل للزوار أيضاً). */
export async function currentUserId(): Promise<string | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * للعمليات المحجوزة للمدير الأعلى فقط (إدارة المشرفين، اعتماد التفعيلات): يرفض مشرفي المحتوى
 * (admin_level = "content") الذين تمنعهم الواجهة أصلاً من هذه الصفحات.
 */
export async function verifySuperAdminAccess() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("غير مصرح لك");

  const { data: profile } = await supabase.from("profiles").select("role, admin_level").eq("id", user.id).single();
  if (profile?.role !== "admin" || profile?.admin_level === "content") {
    throw new Error("غير مصرح لك للقيام بهذه العملية");
  }
}
