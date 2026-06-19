// ============================================================
// API Route: معالجة قائمة الواتساب (يُشغَّل عبر Cron أو يدوياً)
// POST /api/whatsapp/process
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { processWhatsAppQueue } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // حماية: تأكد أن الطلب قادم من Supabase Cron أو Admin
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const result = await processWhatsAppQueue();
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
