import { timingSafeEqual } from "node:crypto";

/**
 * تفويض مسارات المهام المجدولة (/api/cron/*, /api/whatsapp/process).
 * يُغلق عند غياب الإعداد: إن لم يُضبط CRON_SECRET فلا أحد مخوّل (بدل السماح للجميع)،
 * والمقارنة بزمن ثابت حتى لا يُستنتج السر من فروق التوقيت.
 */
export function isCronAuthorized(request: Request): boolean {
  return isCronAuthorizedHeader(request.headers.get("authorization"));
}

/** النسخة نفسها لقيمة ترويسة Authorization مباشرة (لإجراءات الخادم التي تقرأ headers()). */
export function isCronAuthorizedHeader(header: string | null | undefined): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const provided = Buffer.from(header ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
