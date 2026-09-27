import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // لا تخزّن مسبقاً كل محتويات public/ (نحو 20MB صوتيات وصور) عند أول زيارة؛
  // يكفي هيكل الـ PWA، وبقية الأصول تُخزَّن عند الاستخدام عبر قواعد التخزين وقت التشغيل.
  globPublicPatterns: ["manifest.json", "icon-*.png", "hero-book*.png", "hero-child.png"],
});

// على استضافة مشتركة اضبط NEXT_BUILD_CPUS=1 أثناء البناء لتقليل الذاكرة (الافتراضي: عدد أنوية المضيف - 1).
const buildCpus = Number(process.env.NEXT_BUILD_CPUS);

const nextConfig: NextConfig = {
  // NEXT_OUTPUT_STANDALONE=1 أثناء البناء ينتج .next/standalone (حزمة تشغيل مستقلة للاستضافة الذاتية على cPanel،
  // انظر DEPLOY_CPANEL.md). لا يُفعَّل على Vercel ولا في البناء العادي على السيرفر.
  ...(process.env.NEXT_OUTPUT_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  // جذر تتبع الملفات = مجلد المشروع دائماً؛ بدونه قد يستنتج Next جذراً أعلى إذا وُجد package-lock.json آخر
  // في مجلد أب (يحدث على أجهزة التطوير) فتخرج حزمة standalone بمسارات متداخلة.
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tdzzsmwvmddhypaoequv.supabase.co',
      },
    ],
    // الاستخدام الوحيد لـ next/image صورة مصغّرة صغيرة؛ التعطيل يزيل الاعتماد على sharp
    // وعلى مسار /_next/image عند الاستضافة الذاتية بلا أي خسارة ملموسة.
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // لا تكتب نتائج unstable_cache (أسئلة الاختبار النهائي) على القرص: إبطالها بالوسوم يعيش في
    // ذاكرة العملية فقط، وعلى استضافة ذاتية كانت النسخة القديمة على القرص تعود بعد كل إعادة تشغيل.
    isrFlushToDisk: false,
    ...(Number.isFinite(buildCpus) && buildCpus > 0 ? { cpus: buildCpus } : {}),
  },
};

export default withSerwist(nextConfig);
