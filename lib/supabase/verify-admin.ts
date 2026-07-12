import { createClient as createServerClient } from "@/lib/supabase/server";

export async function verifyAdminAccess() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("غير مصرح لك");
  
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    throw new Error("غير مصرح لك للقيام بهذه العملية");
  }
}
