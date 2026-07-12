"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(supabaseUrl, supabaseKey);
}

export async function searchStudentToPromote(email: string) {
  const supabase = getAdminClient();
  
  // Search in auth.users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    return { success: false, message: "حدث خطأ أثناء البحث في النظام" };
  }

  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase().trim());
  
  if (!user) {
    return { success: false, message: "لم يتم العثور على طالب بهذا البريد الإلكتروني" };
  }

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, role, admin_level")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { success: false, message: "حساب الطالب غير مكتمل" };
  }

  if (profile.role === "admin") {
    return { success: false, message: "هذا الحساب مشرف بالفعل!" };
  }

  return { 
    success: true, 
    student: {
      id: profile.id,
      full_name: profile.full_name,
      email: user.email,
      role: profile.role
    } 
  };
}

export async function promoteToModerator(userId: string) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: "admin", admin_level: "content" })
    .eq("id", userId);

  if (error) {
    return { success: false, message: "حدث خطأ أثناء ترقية الحساب" };
  }

  revalidatePath("/admin-khaled-ksa-aws-2026-org/settings");
  return { success: true, message: "تمت ترقية الحساب بنجاح" };
}

export async function demoteModerator(userId: string) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: "student", admin_level: "super" })
    .eq("id", userId);

  if (error) {
    return { success: false, message: "حدث خطأ أثناء سحب الصلاحيات" };
  }

  revalidatePath("/admin-khaled-ksa-aws-2026-org/settings");
  return { success: true, message: "تم سحب الصلاحية بنجاح" };
}

export async function fetchModerators() {
  const supabase = getAdminClient();
  
  // Get all content admins
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, admin_level")
    .eq("role", "admin")
    .eq("admin_level", "content");

  if (profilesError || !profiles) {
    return [];
  }

  // Get emails
  const { data: { users } } = await supabase.auth.admin.listUsers();
  
  return profiles.map(p => {
    const u = users.find(user => user.id === p.id);
    return {
      ...p,
      email: u?.email || "غير معروف"
    };
  });
}

export async function changeAdminPassword(newPassword: string) {
  // Wait, updating password needs to happen on the client if it's for the currently logged in user, 
  // OR we can use the Service Role to change password if we know the user ID.
  // Actually, Supabase client side `supabase.auth.updateUser` is much safer because it uses their session.
  // Let's do it client-side in the component.
}
