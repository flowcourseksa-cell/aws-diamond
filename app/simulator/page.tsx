"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconShoppingCart, IconUser, IconCheck, IconClock,
  IconBrain, IconTarget, IconChartLine, IconStarFilled,
  IconSparkles, IconArrowDown, IconSearch, IconRocket
} from "@tabler/icons-react";
import CartDrawer from "@/components/modals/cart-drawer";
import { useCartStore } from "@/store/cart";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function useScrolled(threshold = 400) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [threshold]);
  return scrolled;
}

/* ─────────────────────────────────────────────
   Data
───────────────────────────────────────────── */
const STATS = [
  { value: "+٥٠ ألف", label: "طالب متسجل" },
  { value: "%٩٤", label: "نسبة الرضا" },
  { value: "٣", label: "محاكيات واقعية مجاناً" },
  { value: "+٢٠٠٠", label: "سؤال تدريبي" },
  { value: "+٥٠ ألف", label: "طالب متسجل" },
  { value: "%٩٤", label: "نسبة الرضا" },
  { value: "٣", label: "محاكيات واقعية مجاناً" },
  { value: "+٢٠٠٠", label: "سؤال تدريبي" },
];

const FEATURES = [
  {
    icon: IconClock,
    title: "توقيت واقعي صارم",
    desc: "نفس التوقيت المحدد لكل قسم في اختبار STEP الفعلي، تدرب على إدارة الوقت قبل ما تدخل القاعة.",
    gradient: "from-indigo-500 to-purple-600",
    bg: "from-indigo-50 to-purple-50",
    border: "border-indigo-100",
    size: "md:col-span-2",
  },
  {
    icon: IconTarget,
    title: "توزيع دقيق مطابق",
    desc: "نفس توزيع وأوزان الأقسام تماماً.",
    gradient: "from-rose-500 to-pink-600",
    bg: "from-rose-50 to-pink-50",
    border: "border-rose-100",
    size: "",
  },
  {
    icon: IconBrain,
    title: "أسئلة من تسريبات سابقة",
    desc: "مبنية على أحدث أسئلة STEP المتداولة.",
    gradient: "from-amber-500 to-orange-500",
    bg: "from-amber-50 to-orange-50",
    border: "border-amber-100",
    size: "",
  },
  {
    icon: IconChartLine,
    title: "مراجعة ذكية للأخطاء",
    desc: "بعد الاختبار، تقرير شامل بإجاباتك الخاطئة لمراجعتها وتصحيحها فوراً قبل الاختبار الحقيقي.",
    gradient: "from-emerald-500 to-teal-600",
    bg: "from-emerald-50 to-teal-50",
    border: "border-emerald-100",
    size: "md:col-span-2",
  },
];

const REVIEWS = [
  { name: "ريماس فاتح", stars: 5, text: "والله تجربة رهيبة! الجو نفس قاعة الاختبار بالضبط، ساعدني أكسر رهبة اليوم الأول 🔥" },
  { name: "سلمى شلبي", stars: 5, text: "بعد ما تدربت دخلت الاختبار وانا واثقة، الأجزاء والوقت كل شيء كان مألوف. مشكورين يا الأوس الماسية 💙" },
  { name: "بدر الناصر", stars: 5, text: "ميزة مراجعة الأخطاء خرافية. عرفت نقاط ضعفي في Grammar وركزت عليها." },
  { name: "خالد العمري", stars: 5, text: "مجاناً وبجودة عالية؟ مش معقول. أحسن إنتاج شفته على منصة تعليمية عربية 👏" },
  { name: "منيرة السبيعي", stars: 5, text: "قدرت أحدد وقت كل سؤال بدقة بسبب المحاكي. النتيجة: درجة عالية فوق ما توقعت!" },
];

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */
function Navbar() {
  const { items, openCart } = useCartStore();
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 h-18 py-3">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-indigo-500/30 group-hover:rotate-6 transition-transform duration-300">
            F
          </div>
          <span className="font-black text-xl hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">
            منصة الأوس الماسية
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors px-4 py-2 rounded-full hover:bg-indigo-50 hidden sm:flex">
            الرئيسية
          </Link>
          <button
            onClick={openCart}
            className="relative w-11 h-11 rounded-full bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center text-indigo-600 transition-all hover:scale-110"
          >
            <IconShoppingCart size={20} stroke={2} />
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {items.length}
              </span>
            )}
          </button>
          <Link href="/login" className="w-11 h-11 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-all hover:scale-110">
            <IconUser size={20} stroke={2} />
          </Link>
        </div>
      </div>
    </nav>
  );
}

function LaptopGraphic() {
  return (
    <div className="relative w-full max-w-2xl mx-auto select-none">
      {/* Glow */}
      <div className="absolute inset-0 bg-indigo-400/20 rounded-full blur-[80px] scale-75 pointer-events-none" />

      {/* Screen */}
      <div className="relative z-10 w-full aspect-[16/10] bg-slate-900 rounded-t-[1.5rem] border-[8px] border-slate-800 shadow-[0_30px_80px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* Camera */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-700 z-20" />

        {/* App UI inside screen */}
        <div className="w-full h-full bg-white flex flex-col">
          {/* Top bar */}
          <div className="h-10 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <span className="text-white text-xs font-bold">محاكي STEP — الأوس الماسية</span>
            <div className="text-white text-xs font-black bg-white/20 px-2 py-0.5 rounded-full">
              00:48:22
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-1/5 border-l border-slate-100 bg-slate-50 p-3 space-y-2 flex-shrink-0 hidden sm:flex flex-col">
              <div className="text-[10px] font-black text-slate-400 mb-3">الأقسام</div>
              {["Vocabulary", "Grammar", "Reading", "Writing"].map((s, i) => (
                <div key={s} className={`text-[10px] font-bold px-2 py-1.5 rounded-lg ${i === 1 ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                  {s}
                </div>
              ))}
              <div className="flex-1" />
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full w-[60%] bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
              </div>
              <div className="text-[9px] text-slate-400 font-bold text-center">٦٠٪ مكتمل</div>
            </div>

            {/* Question Area */}
            <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
              <div className="text-[10px] font-black text-slate-400">السؤال ١٢ من ٤٠</div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="space-y-1.5">
                  <div className="h-2 bg-slate-200 rounded-full w-full" />
                  <div className="h-2 bg-slate-200 rounded-full w-5/6" />
                  <div className="h-2 bg-slate-200 rounded-full w-4/6" />
                </div>
              </div>
              <div className="space-y-2 flex-1">
                {["A", "B", "C", "D"].map((opt, i) => (
                  <div key={opt} className={`flex items-center gap-2 p-2 rounded-xl border text-[10px] font-bold cursor-pointer transition-all ${i === 2 ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "border-slate-200 text-slate-600 hover:border-indigo-200"}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black flex-shrink-0 ${i === 2 ? "bg-white text-indigo-600" : "bg-slate-100"}`}>{opt}</span>
                    <div className={`h-1.5 rounded-full ${i === 2 ? "bg-white/40" : "bg-slate-200"}`} style={{ width: `${60 + i * 10}%` }} />
                  </div>
                ))}
              </div>
              <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black py-2 rounded-xl">
                السؤال التالي ←
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard base */}
      <div className="relative z-10 w-[108%] -ml-[4%] h-5 bg-slate-200 rounded-b-2xl shadow-xl" />
      <div className="relative z-10 w-[40%] mx-auto h-2 bg-slate-300 rounded-b-xl shadow-md" />

      {/* Floating badges */}
      <div className="absolute -top-6 -right-4 z-20 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-lg px-5 py-2 rounded-2xl shadow-xl shadow-rose-500/30 rotate-6 border-2 border-white animate-[wiggle_3s_ease-in-out_infinite]">
        مجاناً! 🎉
      </div>
      <div className="absolute -bottom-2 -left-6 z-20 bg-white border-2 border-indigo-100 text-indigo-700 font-black px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 -rotate-3">
        <IconCheck size={16} className="text-emerald-500" stroke={3} />
        أسئلة واقعية
      </div>
      <div className="absolute top-1/3 -right-8 z-20 bg-white border-2 border-amber-100 text-amber-700 font-black px-3 py-2 rounded-2xl shadow-xl flex items-center gap-2 rotate-2 hidden md:flex">
        <IconClock size={16} className="text-amber-500" />
        توقيت حقيقي
      </div>
    </div>
  );
}

function StatMarquee() {
  return (
    <div className="relative w-full overflow-hidden py-8 border-y border-slate-100 bg-slate-50/50">
      <div className="flex gap-0 animate-[marquee_20s_linear_infinite] whitespace-nowrap will-change-transform">
        {[...STATS, ...STATS].map((s, i) => (
          <div key={i} className="inline-flex items-center gap-4 px-10 border-l border-slate-200 flex-shrink-0">
            <span className="font-black text-3xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              {s.value}
            </span>
            <span className="text-slate-500 font-bold text-lg">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsMarquee() {
  return (
    <div className="relative w-full overflow-hidden py-4">
      <div className="flex gap-6 animate-[marquee_30s_linear_infinite] whitespace-nowrap will-change-transform">
        {[...REVIEWS, ...REVIEWS].map((r, i) => (
          <div key={i} className="inline-flex flex-col gap-3 w-72 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex-shrink-0 whitespace-normal align-top">
            <div className="flex text-amber-400 gap-1">
              {Array(r.stars).fill(0).map((_, j) => <IconStarFilled key={j} size={16} />)}
            </div>
            <p className="text-slate-700 font-semibold leading-relaxed text-sm">{r.text}</p>
            <div className="flex items-center gap-2 mt-auto">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-black text-sm">
                {r.name.charAt(0)}
              </div>
              <span className="font-black text-slate-800 text-sm">{r.name}</span>
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full mr-auto border border-emerald-100">
                <IconCheck size={12} stroke={3} /> موثق
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StickyBar({ onAdd }: { onAdd: () => void }) {
  const scrolled = useScrolled(600);
  return (
    <div className={`fixed bottom-6 inset-x-0 flex justify-center z-50 transition-all duration-500 ${scrolled ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"}`}>
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] px-4 py-3 flex items-center gap-6 mx-4 w-full max-w-sm">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 font-bold">المحاكي المجاني</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-indigo-600">مجاناً</span>
          </div>
        </div>
        <button
          onClick={onAdd}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black py-3 rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 flex items-center justify-center gap-2"
        >
          <IconRocket size={18} />
          ابدأ مجاناً
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function SimulatorPage() {
  const [visible, setVisible] = useState(false);
  const { addItem, openCart } = useCartStore();

  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleAdd = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 overflow-x-hidden">
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes wiggle { 0%,100% { transform: rotate(6deg); } 50% { transform: rotate(10deg) scale(1.05); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
        .fade-up-1 { animation: fadeUp 0.8s ease forwards; }
        .fade-up-2 { animation: fadeUp 0.8s 0.15s ease forwards; opacity:0; }
        .fade-up-3 { animation: fadeUp 0.8s 0.3s ease forwards; opacity:0; }
        .fade-up-4 { animation: fadeUp 0.8s 0.45s ease forwards; opacity:0; }
        .float-anim { animation: float 4s ease-in-out infinite; }
      `}</style>

      <CartDrawer />
      <Navbar />
      <StickyBar onAdd={handleAdd} />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="pt-36 pb-0 px-4 relative overflow-hidden min-h-screen flex flex-col items-center">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-100/60 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[10%] right-0 w-[400px] h-[400px] bg-purple-100/50 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-100/40 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center fade-up-1">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-700 font-bold text-sm mb-8">
            <IconSparkles size={16} className="text-amber-500" />
            متاح الآن • مجاناً بالكامل
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
            تدرب كأنك{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600">
              في قاعة
            </span>
            <br />
            الاختبار الحقيقية
          </h1>

          <p className="text-xl md:text-2xl text-slate-500 font-medium max-w-2xl mx-auto mb-10 leading-relaxed fade-up-2">
            ٣ محاكيات واقعية لـ STEP بنفس التوقيت، التقسيم، وحجم الخط. تجربة كاملة — وبالمجان!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 fade-up-3">
            <button
              onClick={handleAdd}
              className="relative w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xl rounded-2xl shadow-[0_10px_40px_rgba(99,102,241,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(99,102,241,0.45)] flex items-center justify-center gap-3 overflow-hidden group"
            >
              <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-white/10 skew-x-12 transition-transform duration-700" />
              <IconShoppingCart size={26} />
              أضف للسلة الآن — مجاناً!
            </button>
            <Link
              href="/#courses"
              className="text-indigo-600 hover:text-indigo-800 font-bold text-lg flex items-center gap-2 transition-colors"
            >
              اكتشف الكورسات المدفوعة
              <IconArrowDown size={20} className="rotate-[-90deg]" />
            </Link>
          </div>

          {/* Quick checks */}
          <div className="flex flex-wrap justify-center gap-4 mt-8 fade-up-4">
            {["بدون بطاقة ائتمان", "٣ اختبارات كاملة", "نتائج فورية", "مراجعة الأخطاء"].map((t) => (
              <span key={t} className="flex items-center gap-2 text-slate-500 font-semibold text-sm bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                <IconCheck size={16} className="text-emerald-500" stroke={3} />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Laptop Graphic */}
        <div className="relative z-10 w-full max-w-4xl mx-auto mt-20 px-4 float-anim fade-up-4">
          <LaptopGraphic />
        </div>
      </section>

      {/* ═══════════════ STATS MARQUEE ═══════════════ */}
      <div className="mt-32">
        <StatMarquee />
      </div>

      {/* ═══════════════ BENTO FEATURES ═══════════════ */}
      <section className="py-28 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-sm mb-6">
            <IconSparkles size={14} className="text-amber-500" />
            لماذا المحاكي مختلف؟
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-4">
            تجربة الاختبار الحقيقية.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">بدون رسوم.</span>
          </h2>
          <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
            كل تفصيلة في المحاكي صُممت لتحاكي بيئة اختبار STEP الحقيقية.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className={`group relative bg-gradient-to-br ${f.bg} border-2 ${f.border} rounded-[2rem] p-8 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-default ${f.size}`}
              >
                {/* Glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-[0.07] transition-opacity duration-500 rounded-[2rem]`} />

                <div className={`w-16 h-16 bg-gradient-to-br ${f.gradient} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
                  <Icon size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-600 font-medium text-lg leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════ REVIEWS MARQUEE ═══════════════ */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-indigo-50/30 border-y border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-12 text-center">
          <div className="inline-flex items-center gap-4 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm mb-6">
            <div className="flex text-amber-400 gap-1">
              {[1,2,3,4,5].map(i => <IconStarFilled key={i} size={20} />)}
            </div>
            <span className="text-4xl font-black text-slate-900">5.0</span>
            <div className="w-px h-10 bg-slate-200" />
            <span className="text-slate-500 font-bold">من طلاب حقيقيين فعلوا الاختبار</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900">
            الطلاب يتحدثون عن<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">تجربتهم الحقيقية</span>
          </h2>
        </div>
        <ReviewsMarquee />
      </section>

      {/* ═══════════════ UPSELL / NOTES ═══════════════ */}
      <section className="py-28 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Warning / Note cards */}
          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 p-8 rounded-[2rem] hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                  <IconSparkles size={24} />
                </div>
                <h3 className="text-2xl font-black text-amber-900">تنبيه مهم 💡</h3>
              </div>
              <p className="text-amber-800 font-semibold text-lg leading-relaxed">
                دورة الأوس الماسية تغنيك عن أي مصادر أخرى ويمكنك الاكتفاء بها دون تشتت.. للبدء مجاناً والحصول على شرح الأخطاء وسجل الاختبارات الكامل.{" "}
                <Link href="/#courses" className="text-indigo-700 underline font-black">من هنا →</Link>
              </p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200 p-8 rounded-[2rem]">
              <h3 className="text-xl font-black text-rose-900 mb-3">⚠️ ملاحظة قانونية</h3>
              <p className="text-rose-800 font-medium leading-relaxed">
                هذا العمل محمي بالملكية الفكرية السعودية. نسخه أو استخدامه لأغراض تجارية أو غير تعليمية يُعد مخالفة قانونية وشرعية.
              </p>
            </div>
          </div>

          {/* Upsell CTA */}
          <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-10 rounded-[2.5rem] text-white overflow-hidden shadow-[0_30px_80px_rgba(99,102,241,0.4)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl" />

            <div className="relative z-10">
              <div className="inline-block bg-white/20 text-white font-bold text-sm px-4 py-2 rounded-full mb-6">
                الأكثر مبيعاً 🔥
              </div>
              <h3 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
                حاهز تكسر<br />
                حاجز الخوف؟
              </h3>
              <p className="text-indigo-100 font-medium text-lg mb-8 leading-relaxed">
                انضم لأكثر من ٥٠ ألف طالب اختاروا الأوس الماسية واحصل على المحاكي المجاني الآن.
              </p>
              <button
                onClick={handleAdd}
                className="w-full bg-white text-indigo-700 font-black text-xl py-5 rounded-2xl hover:bg-indigo-50 transition-all duration-300 hover:scale-105 shadow-xl flex items-center justify-center gap-3"
              >
                <IconShoppingCart size={26} />
                أضف للسلة — مجاناً
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-slate-100 bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg">
              F
            </div>
            <span className="font-black text-xl text-slate-800">منصة الأوس الماسية</span>
          </div>
          <p className="text-slate-500 font-medium text-center">
            © ٢٠٢٦ منصة الأوس الماسية التعليمية. جميع الحقوق محفوظة.
          </p>
          <div className="flex gap-4">
            <Link href="/" className="text-slate-500 hover:text-indigo-600 font-bold transition-colors">الرئيسية</Link>
            <Link href="/#courses" className="text-slate-500 hover:text-indigo-600 font-bold transition-colors">الكورسات</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

