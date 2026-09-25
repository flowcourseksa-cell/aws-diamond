/**
 * أصل الموقع العام (مثل https://tkhsas.com) للروابط المطلقة التي يبنيها السيرفر
 * (حالياً: رابط التحقق المطبوع في QR الشهادة).
 *
 * لا تعتمد على `request.url` أو `nextUrl.origin` لهذا الغرض: على استضافة ذاتية
 * (next start أو server.js خلف Passenger) يبنيهما Next.js من اسم المضيف الداخلي
 * (http://localhost:PORT) وليس من ترويسة Host، ولا يكونان صحيحين إلا على Vercel.
 *
 * الترتيب: NEXT_PUBLIC_SITE_URL (تُدمج وقت البناء) ← ترويسات الطلب (x-forwarded-* على Vercel فقط، وإلا host) ← request.url.
 * ملاحظة: تحويلات ما بعد المصادقة لا تحتاج هذا المساعد؛ تستخدم Location نسبياً (انظر app/auth/callback/route.ts).
 */
const configuredSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
const hasValidSiteUrl = /^https?:\/\/[^/\s]+$/i.test(configuredSiteUrl);

// إغلاق آمن: على استضافة ذاتية في الإنتاج يجب ضبط المتغير وقت البناء، وإلا فشل البناء برسالة واضحة
// بدل الاعتماد الصامت على ترويسات يتحكم بها العميل. على Vercel تُستخدم ترويسات x-forwarded-* الموثوقة.
if (!hasValidSiteUrl && process.env.NODE_ENV === "production" && !process.env.VERCEL) {
  throw new Error(
    "NEXT_PUBLIC_SITE_URL must be set to https://<domain> (scheme + host only, no path, no trailing slash) at build time. See .env.example."
  );
}

let warnedAboutFallback = false;

export function getPublicOrigin(headers: Headers, requestUrl: string): string {
  if (hasValidSiteUrl) return configuredSiteUrl;

  const onVercel = process.env.VERCEL === "1";
  const host = (onVercel ? firstValue(headers.get("x-forwarded-host")) : undefined) ?? firstValue(headers.get("host"));
  if (host) {
    const forwardedProto = onVercel ? firstValue(headers.get("x-forwarded-proto")) : undefined;
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host);
    const proto = forwardedProto ?? (isLocal ? "http" : "https");
    if (!warnedAboutFallback && process.env.NODE_ENV === "production") {
      warnedAboutFallback = true;
      console.error("[public-origin] NEXT_PUBLIC_SITE_URL is not set; deriving the public origin from request headers");
    }
    return `${proto}://${host}`;
  }

  return new URL(requestUrl).origin;
}

function firstValue(value: string | null): string | undefined {
  const first = value?.split(",")[0]?.trim();
  return first ? first : undefined;
}
