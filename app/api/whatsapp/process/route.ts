// ============================================================
// API Route: معالجة قائمة الواتساب (يُشغَّل عبر Cron أو يدوياً)
// POST /api/whatsapp/process
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { processWhatsAppQueue } from "@/lib/whatsapp";
import { isCronAuthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // حماية: تأكد أن الطلب قادم من Supabase Cron أو Admin
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const result = await processWhatsAppQueue();
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
