/**
 * أصل الموقع العام (مثل https://tkhsas.com) للروابط المطلقة التي يبنيها السيرفر:
 * تحويلات ما بعد المصادقة في /auth/callback ورابط التحقق المطبوع في الشهادة.
 *
 * لا تعتمد على `request.url` أو `nextUrl.origin` لهذا الغرض: على استضافة ذاتية
 * (next start أو server.js خلف Passenger) يبنيهما Next.js من اسم المضيف الداخلي
 * (http://localhost:PORT) وليس من ترويسة Host، ولا يكونان صحيحين إلا على Vercel.
 *
 * الترتيب: NEXT_PUBLIC_SITE_URL (تُدمج وقت البناء) ← ترويسات x-forwarded-host/host ← request.url.
 */
export function getPublicOrigin(headers: Headers, requestUrl: string): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  if (/^https?:\/\/[^/\s]+$/i.test(configured)) return configured;

  const host = firstValue(headers.get("x-forwarded-host")) ?? firstValue(headers.get("host"));
  if (host) {
    const forwardedProto = firstValue(headers.get("x-forwarded-proto"));
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
