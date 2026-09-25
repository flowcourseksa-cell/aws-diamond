import { createClient } from "@supabase/supabase-js";

/**
 * طريقة إنشاء الحسابات (يضبطها المدير من صفحة الإعدادات):
 * - مفتوح (الافتراضي): الطالب ينشئ حسابه بنفسه عبر جوجل أو البريد الإلكتروني.
 * - عبر المدير فقط: يُغلق التسجيل الذاتي؛ لا يُنشأ أي حساب جديد إلا من صفحة الطلاب في لوحة الإدارة.
 *
 * التخزين: platform_settings بالمفتاح registration_admin_only (قيمة boolean).
 * التنفيذ الفعلي على مستوى قاعدة البيانات (supabase/registration_mode.sql): trigger على auth.users
 * يرفض أي حساب جديد لا يحمل app_metadata.created_by = "admin" بينما الإغلاق مفعّل، فلا يمكن
 * تجاوزه بالاتصال المباشر بـ Supabase. هذا الملف يخدم الواجهة فقط (إظهار/إخفاء نموذج التسجيل).
 */
export const REGISTRATION_SETTING_KEY = "registration_admin_only";

export type RegistrationMode = {
  adminOnly: boolean;
  changedAt: string | null;
};

const CACHE_TTL_MS = 30_000;
let cache: { mode: RegistrationMode; at: number } | null = null;

export async function fetchRegistrationMode(opts?: { fresh?: boolean }): Promise<RegistrationMode> {
  if (!opts?.fresh && cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.mode;

  let mode: RegistrationMode = { adminOnly: false, changedAt: null };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("[registration-mode] SUPABASE_SERVICE_ROLE_KEY is missing; the login page will show the open-registration UI");
    return mode;
  }

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase
      .from("platform_settings")
      .select("value, updated_at")
      .eq("key", REGISTRATION_SETTING_KEY)
      .maybeSingle();
    if (error) {
      console.error("[registration-mode] failed to read setting:", error.message);
    } else if (data) {
      mode = { adminOnly: data.value === true || data.value === "true", changedAt: data.updated_at ?? null };
    }
  } catch (err) {
    console.error("[registration-mode] failed to read setting", err);
  }

  cache = { mode, at: Date.now() };
  return mode;
}

export function invalidateRegistrationModeCache() {
  cache = null;
}
