/**
 * أصل الموقع العام (مثل https://tkhsas.com) للروابط المطلقة التي يبنيها السيرفر
 * (حالياً: رابط التحقق المطبوع في QR الشهادة).
 *
 * لا تعتمد على `request.url` أو `nextUrl.origin` لهذا الغرض: على استضافة ذاتية
 * (next start أو server.js خلف Passenger) يبنيهما Next.js من اسم المضيف الداخلي
 * (http://localhost:PORT) وليس من ترويسة Host، ولا يكونان صحيحين إلا على Vercel.
 *
 * الترتيب:
 *   1. SITE_URL — متغير خادم يُقرأ وقت التشغيل (من .env.production أو متغيرات Passenger في cPanel).
 *      هذا ما تستخدمه الحزمة المبنية مسبقاً: يمكن تغيير الدومين دون إعادة بناء.
 *   2. NEXT_PUBLIC_SITE_URL — يُدمج وقت البناء (Vercel، أو البناء على السيرفر).
 *   3. ترويسات الطلب (x-forwarded-* على Vercel فقط، وإلا Host) ثم request.url، مع تسجيل خطأ مرة واحدة.
 * ملاحظة: تحويلات ما بعد المصادقة لا تحتاج هذا المساعد؛ تستخدم Location نسبياً (انظر app/auth/callback/route.ts).
 */
const SITE_URL_PATTERN = /^https?:\/\/[^/\s]+$/i;

function normalizeOrigin(value: string | undefined): string {
  return (value || "").trim().replace(/\/+$/, "");
}

// تُدمج وقت البناء (NEXT_PUBLIC_*)، بينما SITE_URL يُقرأ من process.env عند كل استدعاء لأنه متغير خادم عادي.
const buildTimeSiteUrl = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);

let warnedAboutConfig = false;

function configuredSiteUrl(): string | null {
  const runtime = normalizeOrigin(process.env.SITE_URL);
  if (SITE_URL_PATTERN.test(runtime)) return runtime;
  if (SITE_URL_PATTERN.test(buildTimeSiteUrl)) return buildTimeSiteUrl;
  if (!warnedAboutConfig && process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    warnedAboutConfig = true;
    console.error(
      runtime || buildTimeSiteUrl
        ? `[public-origin] SITE_URL / NEXT_PUBLIC_SITE_URL must be https://<domain> (scheme + host only, no path, no trailing slash); got "${runtime || buildTimeSiteUrl}". Falling back to request headers.`
        : "[public-origin] SITE_URL is not set; deriving the public origin from request headers. Set SITE_URL=https://<domain> in the server environment (see .env.example)."
    );
  }
  return null;
}

export function getPublicOrigin(headers: Headers, requestUrl: string): string {
  const configured = configuredSiteUrl();
  if (configured) return configured;

  const onVercel = process.env.VERCEL === "1";
  const host = (onVercel ? firstValue(headers.get("x-forwarded-host")) : undefined) ?? firstValue(headers.get("host"));
  if (host) {
    const forwardedProto = onVercel ? firstValue(headers.get("x-forwarded-proto")) : undefined;
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host);
    const proto = forwardedProto ?? (isLocal ? "http" : "https");
    return `${proto}://${host}`;
  }

  return new URL(requestUrl).origin;
}

function firstValue(value: string | null): string | undefined {
  const first = value?.split(",")[0]?.trim();
  return first ? first : undefined;
}
