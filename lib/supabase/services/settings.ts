"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function getReadClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export type PlatformSettings = {
  global_interactive_book: boolean;
  global_study_plan: boolean;
  global_library: boolean;
};

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const supabase = getReadClient();
  const { data, error } = await supabase.from("platform_settings").select("*");

  const settings: PlatformSettings = {
    global_interactive_book: true,
    global_study_plan: true,
    global_library: true,
  };

  if (!error && data) {
    data.forEach((row) => {
      if (row.key in settings) {
        settings[row.key as keyof PlatformSettings] = row.value === 'true' || row.value === true;
      }
    });
  }

  return settings;
}

export async function fetchWhatsappSettings() {
  return {
    useWhatsapp: false,
    autoWeekly: false,
    weeklyDay: "الجمعة",
    autoExam: false,
    weeklyTemplate: "تقرير أسبوعي للطالب {name}",
    examTemplate: "نتيجة اختبار الطالب {name}",
    monthlyTemplate: "تقرير شهري للطالب {name}",
    autoMonthly: false,
    monthlyDay: "1",
  };
}

export async function updatePlatformSetting(key: keyof PlatformSettings, value: boolean) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key);

  if (error) {
    console.error("Error updating platform setting:", error);
    return false;
  }

  revalidatePath("/", "layout");
  return true;
}

export async function updateCourseFeatureOverrides(courseId: string, overrides: Record<string, boolean | null>) {
  const supabase = getAdminClient();
  
  // Clean null values from overrides (null means inherit global)
  const cleanedOverrides: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(overrides)) {
    if (v !== null) {
      cleanedOverrides[k] = v;
    }
  }

  const { error } = await supabase
    .from("courses")
    .update({ features_override: cleanedOverrides })
    .eq("id", courseId);

  if (error) {
    console.error("Error updating course feature overrides:", error);
    return false;
  }

  revalidatePath("/", "layout");
  return true;
}
