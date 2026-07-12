"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconShoppingCart, IconUser, IconCheck, IconClock,
  IconBrain, IconTarget, IconChartLine, IconStarFilled,
  IconSparkles, IconArrowDown, IconSearch, IconRocket, IconSchool,
  IconX, IconSettings, IconBolt
} from "@tabler/icons-react";
import { useCartStore } from "@/store/cart";
import { createClient } from "@/lib/supabase/client";
import CartDrawer from "@/components/modals/cart-drawer";
import { fetchHighestScoreForCourse, Certificate } from "@/lib/supabase/services/certificates";
import { fetchFinalExamByCourse } from "@/lib/supabase/services/final-exam";
import { IconAward } from "@tabler/icons-react";
import { REVIEWS } from "./reviews";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";

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
  { value: "٩٩%", label: "نسبة الرضا" },
  { value: "محاكيات", label: "مجانية حقيقية" },
  { value: "+٢٠٠٠", label: "سؤال تدريبي" },
  { value: "١٠٠%", label: "تغطية شاملة للمنهج" },
  { value: "٢٤/٧", label: "دعم فني متواصل" },
  { value: "تحديث", label: "مستمر للتسريبات" },
  { value: "تقارير", label: "ونتائج فورية" },
];

const FEATURES = [
  {
    icon: IconClock,
    title: "توقيت واقعي صارم",
    desc: "نفس التوقيت المحدد لكل قسم في اختبار STEP الفعلي، تدرب على إدارة الوقت قبل ما تدخل القاعة.",
    gradient: "from-purple-500 to-indigo-600",
    bg: "from-purple-50 to-indigo-50",
    border: "border-purple-100",
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



/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */
function Navbar() {
  const { items, openCart } = useCartStore();
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 h-18 py-3">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center font-black text-white text-xl shadow-lg shadow-orange-500/30 group-hover:rotate-6 transition-transform duration-300">
            <IconSchool size={24} stroke={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl hidden sm:block text-slate-800 leading-none">
              الأوس الماسية
            </span>
            <span className="text-[11px] text-[#f97316] font-bold leading-none mt-1.5 hidden sm:block">المنصة التعليمية</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors px-4 py-2 rounded-full hover:bg-orange-50 hidden sm:flex">
            الرئيسية
          </Link>
          <ProfileDropdown 
            customTrigger={
              <button className="w-11 h-11 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-all hover:scale-110">
                <IconUser size={20} stroke={2} />
              </button>
            } 
          />
        </div>
      </div>
    </nav>
  );
}

function LaptopGraphic() {
  return (
    <div className="relative w-full max-w-2xl mx-auto select-none">
      {/* Glow */}
      <div className="absolute inset-0 bg-orange-400/20 rounded-full blur-[80px] scale-75 pointer-events-none" />

      {/* Screen */}
      <div className="relative z-10 w-full aspect-[16/10] bg-slate-900 rounded-t-[1.5rem] border-[8px] border-slate-800 shadow-[0_30px_80px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* Camera */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-700 z-20" />

        {/* App UI inside screen */}
        <div className="w-full h-full bg-white flex flex-col">
          {/* Top bar */}
          <div className="h-10 bg-gradient-to-r from-orange-600 to-amber-600 flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <span className="text-white text-xs font-bold">محاكي — الأوس الماسية</span>
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
                <div key={s} className={`text-[10px] font-bold px-2 py-1.5 rounded-lg ${i === 1 ? "bg-orange-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                  {s}
                </div>
              ))}
              <div className="flex-1" />
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full w-[60%] bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" />
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
                  <div key={opt} className={`flex items-center gap-2 p-2 rounded-xl border text-[10px] font-bold cursor-pointer transition-all ${i === 2 ? "bg-orange-600 border-orange-600 text-white shadow-md" : "border-slate-200 text-slate-600 hover:border-orange-200"}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black flex-shrink-0 ${i === 2 ? "bg-white text-orange-600" : "bg-slate-100"}`}>{opt}</span>
                    <div className={`h-1.5 rounded-full ${i === 2 ? "bg-white/40" : "bg-slate-200"}`} style={{ width: `${60 + i * 10}%` }} />
                  </div>
                ))}
              </div>
              <button className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[10px] font-black py-2 rounded-xl">
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
      <div className="absolute -bottom-2 -left-6 z-20 bg-white border-2 border-orange-100 text-orange-700 font-black px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 -rotate-3">
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
      <div className="flex w-max gap-0 animate-[marquee_80s_linear_infinite] whitespace-nowrap will-change-transform">
        {[...STATS, ...STATS, ...STATS, ...STATS].map((s, i) => (
          <div key={i} className="inline-flex items-center gap-4 px-10 border-l border-slate-200 flex-shrink-0">
            <span className="font-black text-3xl text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
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
      <div className="flex w-max gap-6 animate-[marquee_2000s_linear_infinite] whitespace-nowrap will-change-transform">
        {[...REVIEWS, ...REVIEWS, ...REVIEWS, ...REVIEWS].map((r, i) => (
          <div key={i} className="inline-flex flex-col gap-3 w-72 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex-shrink-0 whitespace-normal align-top">
            <div className="flex text-amber-400 gap-1">
              {Array(r.stars).fill(0).map((_, j) => <IconStarFilled key={j} size={16} />)}
            </div>
            <p className="text-slate-700 font-semibold leading-relaxed text-sm">{r.text}</p>
            <div className="flex items-center gap-2 mt-auto">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-sm">
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
  const [reachedBottom, setReachedBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      
      // Hide the bar if we are within 450px of the bottom (approaching the footer)
      if (scrollY + windowHeight >= documentHeight - 450) {
        setReachedBottom(true);
      } else {
        setReachedBottom(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isVisible = scrolled && !reachedBottom;

  return (
    <div className={`fixed bottom-6 inset-x-0 flex justify-center z-50 transition-all duration-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"}`}>
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] px-4 py-3 flex items-center gap-6 mx-4 w-full max-w-sm">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 font-bold">المحاكي المجاني</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-purple-600">مجاناً</span>
          </div>
        </div>
        <button
          onClick={onAdd}
          className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black py-3 rounded-xl shadow-lg shadow-purple-500/25 transition-all hover:scale-105 flex items-center justify-center gap-2"
        >
          <IconRocket size={18} />
          ابدأ مجاناً
        </button>
      </div>
    </div>
  );
}

function StepGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-[fadeUp_0.4s_ease-out]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <IconBrain size={28} stroke={2} />
            </div>
            <div>
              <h2 className="text-xl font-black">الدليل الشامل لاختبار ستيب (STEP)</h2>
              <p className="text-orange-100 text-sm font-semibold">كل ما تحتاج معرفته عن الاختبار</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <IconArrowDown className="rotate-[135deg]" size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-8 text-slate-700">
          
          <section>
            <h3 className="text-lg font-black text-orange-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center">١</span>
              ما هو اختبار STEP؟
            </h3>
            <p className="text-sm font-medium leading-relaxed text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              هو اختبار كفايات اللغة الإنجليزية (Standardized Test of English Proficiency)، وهو اختبار يقيس مستوى إتقان الشخص للغة الإنجليزية بطريقة موضوعية، ويُعتمد عليه في القبول بالجامعات السعودية، وبرامج الدراسات العليا، والتوظيف العسكري والمدني.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-black text-amber-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center">٢</span>
              أقسام الاختبار الأربعة
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 border border-slate-100 rounded-xl bg-white shadow-sm flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 font-black">40%</div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">فهم المقروء (Reading)</h4>
                  <p className="text-xs text-slate-500 font-medium">قراءة نصوص متنوعة والإجابة على أسئلة حولها.</p>
                </div>
              </div>
              <div className="p-3 border border-slate-100 rounded-xl bg-white shadow-sm flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-black">30%</div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">التراكيب النحوية (Grammar)</h4>
                  <p className="text-xs text-slate-500 font-medium">القواعد الإنجليزية وتكوين الجمل.</p>
                </div>
              </div>
              <div className="p-3 border border-slate-100 rounded-xl bg-white shadow-sm flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-black">20%</div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">فهم المسموع (Listening)</h4>
                  <p className="text-xs text-slate-500 font-medium">الاستماع لمقاطع صوتية واستنتاج المعنى.</p>
                </div>
              </div>
              <div className="p-3 border border-slate-100 rounded-xl bg-white shadow-sm flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-black">10%</div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">التحليل الكتابي (Writing)</h4>
                  <p className="text-xs text-slate-500 font-medium">تمييز الأخطاء الإملائية والترقيمية.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-rose-600 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center">٣</span>
              معلومات إضافية سريعة
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <li className="flex items-center gap-2 text-sm font-semibold text-slate-600"><IconCheck size={16} className="text-emerald-500" /> إجمالي عدد الأسئلة: 100 سؤال</li>
              <li className="flex items-center gap-2 text-sm font-semibold text-slate-600"><IconCheck size={16} className="text-emerald-500" /> مدة الاختبار: ساعتان ونصف</li>
              <li className="flex items-center gap-2 text-sm font-semibold text-slate-600"><IconCheck size={16} className="text-emerald-500" /> الدرجة القصوى: 100 درجة</li>
              <li className="flex items-center gap-2 text-sm font-semibold text-slate-600"><IconCheck size={16} className="text-emerald-500" /> لا يوجد نجاح ورسوب (يعتمد على الجهة)</li>
            </ul>
          </section>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
          <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors">
            حسناً، فهمت
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function SimulatorPage({ params }: { params: Promise<{ courseId: string }> }) {
  const unwrappedParams = React.use(params as any) as { courseId: string };
  const courseId = unwrappedParams.courseId;
  const [visible, setVisible] = useState(false);
  const [showStepGuide, setShowStepGuide] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [autoNextEnabled, setAutoNextEnabled] = useState(true);
  const [highestCert, setHighestCert] = useState<Certificate | null>(null);
  const [exam, setExam] = useState<any>(null);
  const { addItem, openCart } = useCartStore();

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      // Fetch exam details
      const fetchedExam = await fetchFinalExamByCourse(courseId);
      if (fetchedExam) {
        setExam(fetchedExam);
      }

      // Fetch user's score if logged in
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        const cert = await fetchHighestScoreForCourse(userData.user.id, courseId);
        if (cert) setHighestCert(cert);
      }
    };
    fetchData();
  }, [courseId]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleAdd = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data?.user) {
      router.push(`/login?redirect=/simulator/${courseId}`);
      return;
    }
    setShowStartModal(true);
  };

  const startExam = () => {
    router.push(`/simulator-app/${courseId}?autoNext=${autoNextEnabled}`);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 overflow-x-hidden">
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(25%); } }
        @keyframes wiggle { 0%,100% { transform: rotate(6deg); } 50% { transform: rotate(10deg) scale(1.05); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
        .fade-up-1 { animation: fadeUp 0.8s ease forwards; }
        .fade-up-2 { animation: fadeUp 0.8s 0.15s ease forwards; opacity:0; }
        .fade-up-3 { animation: fadeUp 0.8s 0.3s ease forwards; opacity:0; }
        .fade-up-4 { animation: fadeUp 0.8s 0.45s ease forwards; opacity:0; }
        .float-anim { animation: float 4s ease-in-out infinite; }
      `}</style>

      {showStepGuide && <StepGuideModal onClose={() => setShowStepGuide(false)} />}
      
      {/* ─────────────────────────────────────────────
         START EXAM MODAL
      ───────────────────────────────────────────── */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
          <div 
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-orange-50/50">
              <h2 className="text-xl font-black text-orange-950 flex items-center gap-2">
                <IconRocket className="text-orange-600" />
                جاهز لبدء الاختبار؟
              </h2>
              <button 
                onClick={() => setShowStartModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <IconX size={18} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 space-y-4 text-slate-600 font-medium leading-relaxed">
                <p>
                  <strong className="text-slate-800 block mb-1">مدة الاختبار:</strong>
                  الاختبار مصمم ليحاكي الوقت الفعلي لاختبار ستيب (حوالي ساعتين ونصف).
                </p>
                <p>
                  <strong className="text-slate-800 block mb-1">طبيعة الأسئلة:</strong>
                  يتكون من 100 سؤال (استيعاب مقروء، تراكيب نحوية، فهم المسموع، وتحليل كتابي).
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${autoNextEnabled ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
                    <IconBolt size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-slate-800">الانتقال التلقائي (Auto-Next)</h3>
                      {/* Toggle Switch */}
                      <button 
                        onClick={() => setAutoNextEnabled(!autoNextEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${autoNextEnabled ? 'bg-amber-500' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoNextEnabled ? '-translate-x-6' : '-translate-x-1'}`} />
                      </button>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      إذا كان مفعّلاً، سيتم انتقالك للسؤال التالي تلقائياً بمجرد اختيارك للإجابة لتسريع حلك. يمكنك دائماً العودة للسابق لتعديل إجابتك.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={startExam}
                className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-black text-lg rounded-xl shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                توكلت على الله، ابدأ الاختبار
                <IconArrowDown size={20} className="rotate-90" />
              </button>
            </div>
          </div>
        </div>
      )}

      <CartDrawer />
      <Navbar />
      <StickyBar onAdd={handleAdd} />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="pt-36 pb-12 px-4 relative overflow-hidden flex flex-col items-center">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-100/60 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[10%] right-0 w-[400px] h-[400px] bg-amber-100/50 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-100/40 rounded-full blur-[100px] pointer-events-none" />

        {/* Highest Score Floating Card (Desktop only, absolutely positioned) */}
        {highestCert && (
          <div className="absolute top-[52%] right-4 xl:right-[6%] z-40 bg-white border-2 border-orange-100 rounded-3xl p-6 shadow-2xl shadow-orange-500/20 max-w-[260px] animate-[float_5s_ease-in-out_infinite] hidden lg:block">
            <div className="absolute -top-5 -right-5 w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white">
              <IconAward size={28} />
            </div>
            <h4 className="text-orange-600 font-bold text-sm mb-1">أعلى نتيجة حققتها</h4>
            <div className="text-5xl font-black text-slate-800 mb-3">{highestCert.score_pct}%</div>
            
            {highestCert.score_pct < 50 ? (
              <p className="text-xs text-slate-500 font-medium mb-4 leading-relaxed">
                حاول التدرب أكثر لتصل للمئوية! أنت قادر عليها 💪
              </p>
            ) : (
              <p className="text-xs text-emerald-600 font-bold mb-4 bg-emerald-50 p-2 rounded-lg border border-emerald-100 text-center">
                عمل رائع! جاهز للاختبار الحقيقي.
              </p>
            )}

            {highestCert.score_pct >= 50 && (
              <Link 
                href={`/certificate/${highestCert.id}`}
                className="block w-full py-2.5 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700 text-center text-sm font-bold rounded-xl transition-all border border-orange-200"
              >
                الذهاب للشهادة
              </Link>
            )}
          </div>
        )}

        <div className="relative z-10 max-w-4xl mx-auto text-center fade-up-1">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-orange-700 font-bold text-sm mb-8">
            <IconSparkles size={16} className="text-amber-500" />
            متاح الآن • مجاناً بالكامل
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
            تدرب كأنك{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600">
              في قاعة
            </span>
            <br />
            الاختبار الحقيقية
          </h1>

          <p className="text-xl md:text-2xl text-slate-500 font-medium max-w-2xl mx-auto mb-10 leading-relaxed fade-up-2">
            محاكي واقعي لـ <span className="font-bold text-slate-700">"{exam?.title || 'الاختبار'}"</span> بنفس التوقيت، التقسيم، وحجم الخط. تجربة كاملة — وبالمجان!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 fade-up-3">
            <button
              onClick={handleAdd}
              className="relative w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-xl rounded-2xl shadow-[0_10px_40px_rgba(99,102,241,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(99,102,241,0.45)] flex items-center justify-center gap-3 overflow-hidden group"
            >
              <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-white/10 skew-x-12 transition-transform duration-700" />
              <IconRocket size={26} />
              ابدأ الاختبار الآن — مجاناً!
            </button>
            <button
              onClick={() => setShowStepGuide(true)}
              className="text-orange-600 hover:text-orange-800 font-bold text-lg flex items-center gap-2 transition-colors bg-orange-50 px-6 py-3 rounded-2xl hover:bg-orange-100"
            >
              دليل اختبار ستيب الشامل
              <IconArrowDown size={20} className="rotate-[-90deg]" />
            </button>
          </div>

          {/* Quick checks */}
          <div className="flex flex-wrap justify-center gap-4 mt-8 fade-up-4">
            {["بدون بطاقة ائتمان", "اختبار كامل ومحاكي", "نتائج فورية", "مراجعة الأخطاء"].map((t) => (
              <span key={t} className="flex items-center gap-2 text-slate-500 font-semibold text-sm bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                <IconCheck size={16} className="text-emerald-500" stroke={3} />
                {t}
              </span>
            ))}
          </div>

          {/* Highest Score Floating Card (Mobile/Tablet inline block) */}
          {highestCert && (
            <div className="mt-8 z-40 bg-white border-2 border-orange-100 rounded-3xl p-6 shadow-xl shadow-orange-500/10 w-full max-w-sm mx-auto lg:hidden relative fade-up-4 text-center">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white">
                <IconAward size={28} />
              </div>
              <h4 className="text-orange-600 font-bold text-sm mb-1 mt-4">أعلى نتيجة حققتها</h4>
              <div className="text-5xl font-black text-slate-800 mb-3">{highestCert.score_pct}%</div>
              
              {highestCert.score_pct < 50 ? (
                <p className="text-xs text-slate-500 font-medium mb-4 leading-relaxed">
                  حاول التدرب أكثر لتصل للمئوية! أنت قادر عليها 💪
                </p>
              ) : (
                <p className="text-xs text-emerald-600 font-bold mb-4 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                  عمل رائع! جاهز للاختبار الحقيقي.
                </p>
              )}

              {highestCert.score_pct >= 50 && (
                <Link 
                  href={`/certificate/${highestCert.id}`}
                  className="block w-full py-2.5 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700 text-sm font-bold rounded-xl transition-all border border-orange-200"
                >
                  الذهاب للشهادة
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ STATS MARQUEE ═══════════════ */}
      <StatMarquee />

      {/* ═══════════════ BENTO FEATURES ═══════════════ */}
      <section className="py-28 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-orange-700 font-bold text-sm mb-6">
            <IconSparkles size={14} className="text-amber-500" />
            لماذا المحاكي مختلف؟
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-4">
            تجربة الاختبار الحقيقية.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">بدون رسوم.</span>
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
      <section className="py-20 bg-gradient-to-br from-slate-50 to-orange-50/30 border-y border-slate-100 overflow-hidden">
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
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">تجربتهم الحقيقية</span>
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
                دورات الأوس الماسية تغنيك عن أي مصادر أخرى ويمكنك الاكتفاء بها دون تشتت.. للاشتراك والحصول على شرح الأخطاء بالذكاء الاصطناعي وسجل الاختبارات الكامل.{" "}
                <Link href="/#courses" className="text-purple-700 underline font-black">من هنا →</Link>
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
          <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-10 rounded-[2.5rem] text-white overflow-hidden shadow-[0_30px_80px_rgba(99,102,241,0.4)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl" />

            <div className="relative z-10">
              <div className="inline-block bg-white/20 text-white font-bold text-sm px-4 py-2 rounded-full mb-6">
                الأكثر انتشاراً 🔥
              </div>
              <h3 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
                جاهز تكسر<br />
                حاجز الخوف؟
              </h3>
              <p className="text-purple-100 font-medium text-lg mb-8 leading-relaxed">
                انضم لأكثر من ٥٠ ألف طالب اختاروا الأوس الماسية واحصل على المحاكي المجاني الآن.
              </p>
              <button
                onClick={handleAdd}
                className="w-full bg-white text-purple-700 font-black text-xl py-5 rounded-2xl hover:bg-purple-50 transition-all duration-300 hover:scale-105 shadow-xl flex items-center justify-center gap-3"
              >
                <IconRocket size={26} />
                ابدأ الاختبار الآن — مجاناً
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-slate-100 bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <IconSchool size={22} stroke={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl text-slate-800 leading-none">الأوس الماسية</span>
              <span className="text-[11px] text-[#f97316] font-bold leading-none mt-1">المنصة التعليمية</span>
            </div>
          </div>
          <p className="text-slate-500 font-medium text-center">
            © ٢٠٢٦ الأوس الماسية التعليمية. جميع الحقوق محفوظة.
          </p>
          <div className="flex gap-4">
            <Link href="/" className="text-slate-500 hover:text-orange-600 font-bold transition-colors">الرئيسية</Link>
            <Link href="/#courses" className="text-slate-500 hover:text-orange-600 font-bold transition-colors">الكورسات</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
