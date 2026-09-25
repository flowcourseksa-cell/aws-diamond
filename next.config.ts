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
