// وحدة خادم داخلية (ليست "use server"): لا يمكن استدعاؤها من المتصفح بمعرّف إجراء.
// إصدار الشهادة يتم فقط بعد تصحيح الاختبار على الخادم (app/actions/simulator.ts).
import { createClient } from "@supabase/supabase-js";
import type { Certificate } from "@/lib/supabase/services/certificates";

export async function insertCertificate(data: Omit<Certificate, "id" | "issued_at">): Promise<Certificate | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data: newCert, error } = await supabase
    .from("certificates")
    .insert([{ ...data, issued_at: new Date().toISOString() }])
    .select()
    .single();
  if (error) {
    console.error("Error creating certificate:", error);
    return null;
  }
  return newCert as Certificate;
}
