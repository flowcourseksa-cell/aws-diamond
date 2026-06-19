"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePlatformStore } from "@/lib/store";
import {
  IconArrowRight, IconCheck, IconStarFilled,
  IconClock, IconUsers, IconCalendar, IconDeviceLaptop,
  IconBook, IconRosetteDiscountCheckFilled
} from "@tabler/icons-react";

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  
  const [isMounted, setIsMounted] = useState(false);
  const { courses, setEnrolledCourseId } = usePlatformStore();
  
  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const course = courses.find(c => c.id === courseId);
  if (!course) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-3xl font-black mb-4">الدورة غير موجودة</h1>
        <Link href="/" className="px-6 py-3 bg-primary text-white font-bold rounded-xl">العودة للرئيسية</Link>
      </div>
    );
  }

  const isFree = course.discountedPrice === 0;
  const discountPct = course.price > 0 ? Math.round((1 - course.discountedPrice / course.price) * 100) : 0;

  const handleSubscribe = () => {
    // التحقق من تسجيل الدخول (استخدام حالة بسيطة من الـ localStorage)
    const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem("flow-logged-in") === "true";
    
    if (!isLoggedIn) {
      // توجيه لصفحة تسجيل الدخول مع حفظ مسار العودة
      if (typeof window !== 'undefined') {
        localStorage.setItem("flow-redirect-after-login", `/course/${course.id}`);
      }
      router.push("/login");
      return;
    }

    // الفعل الحقيقي: تسجيل الطالب في الدورة
    setEnrolledCourseId(course.id);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-bg text-text font-sans pb-24" dir="rtl">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <IconArrowRight size={24} className="text-text-muted" />
            <span className="font-bold text-text-muted">العودة</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-amber text-white flex items-center justify-center font-black text-lg">
              ف
            </div>
            <span className="font-black text-xl tracking-tight">منصة فلو</span>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className={`pt-32 pb-16 px-4 bg-gradient-to-br ${course.coverGradient} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="max-w-4xl mx-auto relative z-10 text-center flex flex-col items-center">
          {course.isFeatured && (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent-amber text-white font-black text-sm mb-6 shadow-lg shadow-accent-amber/20">
              <IconStarFilled size={16} /> الدورة الأقوى
            </span>
          )}
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
            {course.title}
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl font-medium leading-relaxed">
            {course.subtitle || course.description}
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/90 font-bold bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-2">
              <IconUsers className="text-accent-amber" />
              <span>{course.studentsCount.toLocaleString("ar")} منضم</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/50" />
            <div className="flex items-center gap-2">
              <IconClock className="text-accent-teal" />
              <span>{course.totalHours}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/50" />
            <div className="flex items-center gap-2">
              <IconDeviceLaptop className="text-blue-400" />
              <span>أونلاين مسجلة</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-20">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Main Content */}
          <div className="flex-1 bg-card rounded-3xl p-6 md:p-10 border border-border shadow-xl">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <IconRosetteDiscountCheckFilled className="text-accent-teal" size={28} />
              ماذا ستتعلم في هذه الدورة؟
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              {course.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-bg border border-border">
                  <div className="w-8 h-8 rounded-full bg-accent-teal/15 text-accent-teal flex items-center justify-center flex-shrink-0 mt-0.5">
                    <IconCheck size={18} stroke={3} />
                  </div>
                  <span className="font-bold text-sm leading-relaxed">{feat}</span>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <IconBook className="text-primary" size={28} />
              تفاصيل المحتوى
            </h2>
            <p className="text-text-muted leading-relaxed font-medium mb-8">
              {course.description}
            </p>
            
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
              <h3 className="font-black text-primary mb-4">المسارات التي تغطيها الدورة:</h3>
              <div className="flex flex-wrap gap-2">
                {course.trackIds.map(tId => (
                  <span key={tId} className="px-4 py-2 bg-white rounded-xl border border-primary/20 font-bold text-sm text-primary shadow-sm">
                    {tId === "qudrat-komi" ? "القدرات كمي" :
                     tId === "qudrat-lafzi" ? "القدرات لفظي" :
                     tId === "nafis" ? "نافس" :
                     tId === "tasis" ? "التأسيس الشامل" : tId}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Sidebar */}
          <div className="w-full lg:w-96 bg-card rounded-3xl p-6 md:p-8 border border-border shadow-2xl sticky top-28">
            <div className="mb-6 pb-6 border-b border-border">
              {isFree ? (
                <div className="text-4xl font-black text-accent-teal mb-2">مجانـاً!</div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-black text-primary">{course.discountedPrice}</span>
                    <span className="text-lg font-bold text-text-muted">{course.currency}</span>
                  </div>
                  {discountPct > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted line-through font-bold">{course.price} {course.currency}</span>
                      <span className="bg-accent-teal/15 text-accent-teal px-2 py-0.5 rounded-md text-xs font-black">
                        وفر {discountPct}%
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            <ul className="flex flex-col gap-4 mb-8">
              <li className="flex items-center justify-between font-bold text-sm">
                <span className="text-text-muted flex items-center gap-2"><IconBook size={18}/> ضمان التحديث</span>
                <span>لمدة عام</span>
              </li>
              <li className="flex items-center justify-between font-bold text-sm">
                <span className="text-text-muted flex items-center gap-2"><IconUsers size={18}/> دعم المدرب</span>
                <span>متوفر يومياً</span>
              </li>
              {course.examDate && (
                <li className="flex items-center justify-between font-bold text-sm">
                  <span className="text-text-muted flex items-center gap-2"><IconCalendar size={18}/> موعد الاختبار</span>
                  <span className="text-accent-amber" dir="ltr">{course.examDate}</span>
                </li>
              )}
            </ul>

            <button
              onClick={handleSubscribe}
              className={`w-full py-4 rounded-2xl font-black text-lg text-white shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                isFree ? "bg-accent-teal shadow-accent-teal/30 hover:bg-accent-teal/90" : "bg-primary shadow-primary/30 hover:bg-primary-dark"
              }`}
            >
              {isFree ? "سجل الآن مجاناً وابدأ" : "اشترك في الدورة الآن"}
            </button>
            <p className="text-center text-xs text-text-muted mt-4 font-semibold">
              بمجرد الضغط سيتم تسجيلك في الدورة فوراً كنسخة تجريبية
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
