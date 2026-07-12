// ============================================================
// WhatsApp Service — الأوس الماسية
// يُستخدم هذا الملف من Supabase Edge Function أو API Route
// ============================================================

const ULTRAMSG_INSTANCE = process.env.ULTRAMSG_INSTANCE_ID!;
const ULTRAMSG_TOKEN    = process.env.ULTRAMSG_TOKEN!;

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * إرسال رسالة واتساب فعلية عبر UltraMsg API
 */
export async function sendWhatsApp(
  phone: string,
  message: string
): Promise<WhatsAppSendResult> {
  // تنظيف رقم الهاتف (إزالة + وإضافة رمز السعودية إذا لزم)
  const cleanPhone = formatSaudiPhone(phone);

  try {
    const response = await fetch(
      `https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token: ULTRAMSG_TOKEN,
          to:    cleanPhone,
          body:  message,
        }),
      }
    );

    const result = await response.json();

    if (result.sent === "true" || result.id) {
      return { success: true, messageId: result.id };
    } else {
      return { success: false, error: result.error || "إرسال فاشل" };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * تنسيق رقم الهاتف السعودي
 * يقبل: 05xxxxxxxx أو +9665xxxxxxxx أو 9665xxxxxxxx
 * يُرجع: 9665xxxxxxxx@c.us (صيغة UltraMsg)
 */
function formatSaudiPhone(phone: string): string {
  // إزالة المسافات والشرطات والرمز +
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, "");

  // إزالة الأصفار الأولى إذا بدأ بـ 0
  if (cleaned.startsWith("0")) {
    cleaned = "966" + cleaned.slice(1);
  }

  // إضافة رمز السعودية إذا بدأ بـ 5
  if (cleaned.startsWith("5")) {
    cleaned = "966" + cleaned;
  }

  // صيغة WhatsApp
  return cleaned.includes("@c.us") ? cleaned : `${cleaned}@c.us`;
}

// ── Edge Function Handler ─────────────────────────────────────
// هذه الدالة تُشغَّل كـ Supabase Edge Function (Cron Job أسبوعي)
// أو تُستدعى من API Route

export async function processWhatsAppQueue(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  // استيراد Supabase داخل الدالة لتجنب مشاكل البيئة
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // جلب الإشعارات المعلقة
  const { data: pending } = await db
    .from("whatsapp_notifications")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .limit(50);  // معالجة 50 رسالة في كل دورة

  if (!pending?.length) return { processed: 0, sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const notification of pending) {
    const result = await sendWhatsApp(notification.parent_phone, notification.message_body);

    await db
      .from("whatsapp_notifications")
      .update({
        status:        result.success ? "sent" : "failed",
        sent_at:       result.success ? new Date().toISOString() : null,
        attempt_count: (notification.attempt_count || 0) + 1,
        error_message: result.error || null,
      })
      .eq("id", notification.id);

    if (result.success) sent++;
    else failed++;
  }

  return { processed: pending.length, sent, failed };
}
