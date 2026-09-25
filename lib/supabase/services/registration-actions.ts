"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { verifyAdminAccess } from "@/lib/supabase/verify-admin";
import {
  REGISTRATION_SETTING_KEY,
  fetchRegistrationMode,
  invalidateRegistrationModeCache,
  type RegistrationMode,
} from "@/lib/registration-mode";

/** يقرأ الوضع الحالي (بلا كاش) — تستخدمه صفحة الدخول وصفحة إعدادات المدير. */
export async function getRegistrationMode(): Promise<RegistrationMode> {
  return fetchRegistrationMode({ fresh: true });
}

/** يغيّر طريقة إنشاء الحسابات. للمدير فقط. */
export async function setRegistrationAdminOnly(adminOnly: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminAccess();

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from("platform_settings")
      .select("key")
      .eq("key", REGISTRATION_SETTING_KEY)
      .maybeSingle();

    const { error } = existing
      ? await supabase.from("platform_settings").update({ value: adminOnly, updated_at: now }).eq("key", REGISTRATION_SETTING_KEY)
      : await supabase.from("platform_settings").insert({ key: REGISTRATION_SETTING_KEY, value: adminOnly, updated_at: now });

    if (error) return { success: false, error: error.message };

    invalidateRegistrationModeCache();
    revalidatePath("/login");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "فشل حفظ الإعداد" };
  }
}
