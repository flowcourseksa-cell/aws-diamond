// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { type Course } from "@/lib/store";
import { fetchCourses } from "@/lib/supabase/services/courses";
import { fetchUserEnrollments, countCourseEnrollments } from "@/lib/supabase/services/enrollments";
import { type DbTrack } from "@/lib/supabase/services/hierarchy";
import { fetchHierarchyByCourseAdmin, fetchLessonsByTracksAdmin } from "@/lib/supabase/services/public-queries";
import { requestCourseActivation } from "@/lib/supabase/services/activations";
import { fetchDiscountCodes, validateDiscountCode, type DiscountCode } from "@/lib/supabase/services/pricing";
import {
  IconArrowRight, IconCheck, IconStarFilled, IconX,
  IconClock, IconUsers, IconCalendar, IconDeviceLaptop,
  IconBook, IconRosetteDiscountCheckFilled, IconSchool
} from "@tabler/icons-react";
import { NotificationsDropdown } from "@/components/layout/notifications-dropdown";

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  
  const [isMounted, setIsMounted] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [studentInfo, setStudentInfo] = useState<{ name: string; code: string } | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'loading' | 'none' | 'pending' | 'active'>('loading');
  const [tracks, setTracks] = useState<DbTrack[]>([]);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [realStudentsCount, setRealStudentsCount] = useState(0);

  // Discount / Checkout State
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [isCheckingDiscount, setIsCheckingDiscount] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [publicCodes, setPublicCodes] = useState<DiscountCode[]>([]);
  // BUG-30: track whether WhatsApp was clicked before allowing confirm
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const coursesData = await fetchCourses();
        if (!active) return;
        setCourses(coursesData);

        const tracksData = await fetchHierarchyByCourseAdmin(courseId);
        if (active) setTracks(tracksData);

        const trackIds = tracksData.map(t => t.id);
        const lessons = await fetchLessonsByTracksAdmin(trackIds);
        const secs = lessons.reduce((acc, l) => acc + (l.duration_seconds || 0), 0);
        if (active) setTotalSeconds(secs);

        const count = await countCourseEnrollments(courseId);
        if (active) setRealStudentsCount(count);

        // Fetch public discount codes for floating cards
        const allCodes = await fetchDiscountCodes();
        const activePublicCodes = allCodes.filter(c => 
          c.isPublic && 
          (!c.expiryDate || new Date(c.expiryDate) >= new Date(new Date().toDateString())) &&
          (c.maxUses === 0 || c.uses < c.maxUses)
        );
        if (active) setPublicCodes(activePublicCodes);

        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          const enrollments = await fetchUserEnrollments(session.user.id);
          const enrollment = enrollments.find((e: any) => e.course_id === courseId);

          if (active) {
            if (enrollment) {
              setEnrollmentStatus(enrollment.is_active ? 'active' : 'pending');
            } else {
              setEnrollmentStatus('none');
            }
          }
        } else {
          if (active) setEnrollmentStatus('none');
        }
      } catch (e) {
        console.error("Error loading course data", e);
        if (active) setEnrollmentStatus('none');
      } finally {
        if (active) setIsMounted(true);
      }
    };
    load();
    return () => { active = false; };
  }, [courseId]);

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

  let totalHoursStr = "لم تُحدد بعد";
  if (totalSeconds >= 60) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    if (hrs > 0 && mins > 0) totalHoursStr = `${hrs} ساعة و ${mins} دقيقة`;
    else if (hrs > 0) totalHoursStr = `${hrs} ساعة`;
    else totalHoursStr = `${mins} دقيقة`;
  } else if (totalSeconds > 0) {
    totalHoursStr = "أقل من دقيقة";
  }

  const handleSubscribe = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      if (typeof window !== 'undefined') {
        localStorage.setItem("flow-redirect-after-login", `/course/${course.id}`);
      }
      router.push("/login");
      return;
    }

    // Get profile data
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, id")
      .eq("id", session.user.id)
      .single();

    if (profile) {
      const studentCode = `TKH-${profile.id.split('-')[0].toUpperCase()}`;
      setStudentInfo({ name: profile.full_name, code: studentCode });
      setShowPopup(true);
    } else {
      const studentCode = `TKH-${session.user.id.split('-')[0].toUpperCase()}`;
      setStudentInfo({ name: "طالب جديد", code: studentCode });
      setShowPopup(true);
    }
  };

  const handleConfirmSent = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const shouldActivateImmediately = isFree && course.requireWhatsappActivation === false;

    const res = await requestCourseActivation(
      session.user.id,
      course.id,
      studentInfo?.name || '',
      course.title,
      !isFree, // isPaid
      finalPrice,
      appliedDiscount?.code,
      shouldActivateImmediately // activateImmediately
    );

    if (res.success) {
      if (shouldActivateImmediately) {
        setEnrollmentStatus('active');
        setShowPopup(false);
        localStorage.setItem('active_course_id', course.id);
        router.push("/dashboard");
      } else {
        setEnrollmentStatus('pending');
        setShowPopup(false);
        router.push("/");
      }
    } else {
      alert("حدث خطأ أثناء إرسال الطلب: " + res.error);
    }
  };

  const handleWhatsApp = () => {
    if (!studentInfo) return;
    
    let message = "";
    if (isFree) {
      message = `مرحباً، أنا الطالب ${studentInfo.name}.\nلقد قمت بالتسجيل في الكورس الآتي: "${course.title}".\nالرقم التعريفي الخاص بي (ID) هو: ${studentInfo.code}\nبرجاء تفعيل اشتراكي.`;
    } else {
      if (appliedDiscount) {
        message = `مرحباً، أنا الطالب ${studentInfo.name}.\nأرغب بالاشتراك للكورس الآتي: "${course.title}".\nالرقم التعريفي (ID) الخاص بي: ${studentInfo.code}\n\n🏷️ لقد استخدمت كود الخصم: (${appliedDiscount.code})\n💰 السعر النهائي المطلوب: ${finalPrice} ${course.currency}\n\nمرفق إيصال التحويل، برجاء تفعيل اشتراكي.`;
      } else {
        message = `مرحباً، أنا الطالب ${studentInfo.name}.\nأرغب بالاشتراك للكورس الآتي: "${course.title}".\nالرقم التعريفي (ID) الخاص بي: ${studentInfo.code}\n\n💰 السعر المطلوب: ${finalPrice} ${course.currency}\n\nمرفق إيصال التحويل، برجاء تفعيل اشتراكي.`;
      }
    }
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/966507806516?text=${encodedMessage}`, "_blank");
    setWhatsappSent(true);
  };

  const handleApplyDiscount = async (overrideCode?: string) => {
    const codeToApply = (overrideCode || discountCodeInput).trim();
    if (!codeToApply) return;
    setIsCheckingDiscount(true);
    setDiscountError("");
    
    try {
      const discount = await validateDiscountCode(codeToApply);
      if (discount) {
        setAppliedDiscount(discount);
        setDiscountCodeInput("");
      } else {
        setDiscountError("كود الخصم غير صالح أو منتهي الصلاحية.");
      }
    } catch (e) {
      setDiscountError("حدث خطأ أثناء التحقق من الكود.");
    } finally {
      setIsCheckingDiscount(false);
    }
  };

  const currentPrice = course.discountedPrice;
  const finalPrice = appliedDiscount 
    ? currentPrice - (currentPrice * appliedDiscount.discountPercent / 100)
    : currentPrice;

  return (
    <div className="min-h-screen bg-bg text-text font-sans pb-24" dir="rtl">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-amber/10 text-accent-amber hover:bg-accent-amber hover:text-white transition-all font-bold text-sm shadow-sm hover:shadow-md">
            <IconArrowRight size={20} stroke={2.5} />
            العودة للرئيسية
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-black text-xl tracking-tight text-text">منصة الأوس الماسية</span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent-amber to-orange-500 text-white flex items-center justify-center font-black shadow-lg shadow-accent-amber/30">
              <IconSchool size={26} stroke={2} />
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className={`pt-32 pb-16 px-4 relative overflow-hidden ${!course.coverImageUrl ? `bg-gradient-to-br ${course.coverGradient || "from-indigo-600 to-purple-800"}` : "bg-black"}`}>
        {course.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={course.coverImageUrl} 
            alt={course.title} 
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="max-w-4xl mx-auto relative z-10 text-center flex flex-col items-center">
          {course.isFeatured && (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent-amber text-white font-black text-sm mb-6 shadow-lg shadow-accent-amber/20">
              <IconStarFilled size={16} /> الدورة الأقوى
            </span>
          )}
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
            {course.title || "الدورة المدفوعة"}
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl font-medium leading-relaxed">
            {course.subtitle || course.description || "دورة شاملة من الصفر للاحتراف"}
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/90 font-bold bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-2">
              <IconUsers className="text-accent-amber" />
              <span>{(course.studentsCount + realStudentsCount).toLocaleString("ar")} منضم</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/50" />
            <div className="flex items-center gap-2">
              <IconClock className="text-accent-teal" />
              <span>{totalHoursStr}</span>
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
              {(course.features.length > 0 ? course.features : [
                "تأسيس شامل للمبتدئين",
                "شرح وتوضيح المهارات الضعيفة",
                "تدريب عملي وتطبيقات مكثفة",
                "متابعة دورية وتقييم مستمر"
              ]).map((feat, i) => (
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
                {tracks.map(t => (
                  <span key={t.id} className="px-4 py-2 bg-white rounded-xl border border-primary/20 font-bold text-sm text-primary shadow-sm">
                    {t.name}
                  </span>
                ))}
                {tracks.length === 0 && (
                  <span className="text-sm font-bold text-text-muted">لم يتم إضافة مسارات بعد.</span>
                )}
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

            {course.examDate && (
              <ul className="flex flex-col gap-4 mb-8">
                <li className="flex items-center justify-between font-bold text-sm">
                  <span className="text-text-muted flex items-center gap-2"><IconCalendar size={18}/> موعد الاختبار</span>
                  <span className="text-accent-amber" dir="ltr">{course.examDate}</span>
                </li>
              </ul>
            )}

            {enrollmentStatus === 'loading' ? (
              <button disabled className="w-full py-4 rounded-2xl font-black text-lg text-white bg-slate-300 shadow-xl cursor-wait">
                جاري التحقق...
              </button>
            ) : enrollmentStatus === 'active' ? (
              <button
                onClick={() => {
                  localStorage.setItem('active_course_id', course.id);
                  router.push("/dashboard");
                }}
                className="w-full py-4 rounded-2xl font-black text-lg text-white shadow-xl bg-accent-teal hover:bg-accent-teal/90 transition-all duration-300"
              >
                الدخول للدورة
              </button>
            ) : enrollmentStatus === 'pending' ? (
              <button
                disabled
                className="w-full py-4 rounded-2xl font-black text-lg text-white shadow-xl bg-accent-amber opacity-80 cursor-not-allowed"
              >
                في انتظار التفعيل
              </button>
            ) : (
              <button
                onClick={handleSubscribe}
                className={`w-full py-4 rounded-2xl font-black text-lg text-white shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                  isFree ? "bg-accent-teal shadow-accent-teal/30 hover:bg-accent-teal/90" : "bg-primary shadow-primary/30 hover:bg-primary-dark"
                }`}
              >
                {isFree ? "سجل الآن مجاناً وابدأ" : "اشترك في الدورة الآن"}
              </button>
            )}
            
            {enrollmentStatus === 'none' && (
              <p className="text-center text-xs text-text-muted mt-4 font-semibold">
                بمجرد الضغط سيتم توجيهك إلى رسالة التفعيل
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Popup Modal ── */}
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 gap-6">
          <div className="bg-card w-full max-w-xl rounded-3xl p-6 md:p-8 border border-border shadow-2xl flex flex-col relative shrink-0">
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-text">
                {isFree ? "تفعيل الدورة المجانية" : "تأكيد الاشتراك والدفع"}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPopup(false)}
                  className="w-10 h-10 rounded-full hover:bg-bg text-text-muted flex items-center justify-center transition-colors"
                >
                  <IconX size={24} stroke={2} />
                </button>
              </div>
            </div>

            {!isFree && (
              <div className="mb-6 space-y-4">
                <div className="bg-bg rounded-2xl p-4 border border-border flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm font-bold text-text-muted">
                    <span>سعر الدورة:</span>
                    <span>{currentPrice} {course.currency}</span>
                  </div>
                  
                  {appliedDiscount && (
                    <div className="flex justify-between items-center text-sm font-bold text-accent-teal">
                      <span>الخصم ({appliedDiscount.code}):</span>
                      <span>- {appliedDiscount.discountPercent}%</span>
                    </div>
                  )}

                  <div className="border-t border-border pt-2 mt-1 flex justify-between items-center font-black text-lg text-primary">
                    <span>الإجمالي المطلوب:</span>
                    <span>{finalPrice} {course.currency}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="لديك كود خصم؟" 
                    value={discountCodeInput}
                    onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
                    className="flex-1 bg-bg border border-border rounded-xl px-4 text-sm font-bold outline-none focus:border-primary text-center"
                    dir="ltr"
                  />
                  <button 
                    onClick={() => handleApplyDiscount()}
                    disabled={isCheckingDiscount || !discountCodeInput}
                    className="px-4 py-3 bg-primary text-white font-bold rounded-xl text-sm disabled:opacity-50"
                  >
                    {isCheckingDiscount ? "جاري..." : "تطبيق"}
                  </button>
                </div>
                {discountError && <p className="text-accent-red text-xs font-bold px-2">{discountError}</p>}
                {appliedDiscount && <p className="text-accent-teal text-xs font-bold px-2">تم تطبيق الخصم بنجاح!</p>}
              </div>
            )}

            <div className="bg-bg/50 border border-border rounded-xl p-4 mb-6 hover:border-primary/50 transition-colors">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative shrink-0 flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    className="absolute opacity-0 w-0 h-0" 
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                    agreedToTerms ? 'bg-primary border-primary text-white scale-110 shadow-sm shadow-primary/30' : 'border-slate-300 dark:border-slate-600 bg-card group-hover:border-primary/50'
                  }`}>
                    {agreedToTerms && <IconCheck size={14} stroke={3} />}
                  </div>
                </div>
                <div className="text-[13px] font-bold text-text-muted leading-relaxed select-none pt-0.5">
                  بالنقر هنا أنت تؤكد قراءتك وموافقتك على {" "}
                  <button type="button" className="text-primary hover:underline font-black" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveModal('terms'); }}>شروط الاستخدام</button>
                  {" "} و {" "}
                  <button type="button" className="text-primary hover:underline font-black" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveModal('privacy'); }}>سياسة الخصوصية</button>
                  {" "} لمنصة الأوس الماسية وتتعهد بالالتزام بقواعد الدورة.
                </div>
              </label>
            </div>
            
            <div className="w-full space-y-3 mb-2">
              {(course.requireWhatsappActivation !== false || !isFree) ? (
                <>
                  <button
                    onClick={handleWhatsApp}
                    disabled={!agreedToTerms}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-black text-lg transition-colors relative ${
                      agreedToTerms ? "bg-[#25D366] shadow-lg hover:bg-[#20bd5a]" : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <span className="absolute right-4 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm">1</span>
                    {isFree ? "إرسال طلب التفعيل للواتساب" : "إرسال الإيصال للإدارة (واتساب)"}
                  </button>
                  
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-4 text-xs font-bold text-text-muted">ثم بعد إرسال الرسالة</span>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmSent}
                    disabled={!whatsappSent}
                    title={!whatsappSent ? "يجب إرسال رسالة الواتساب أولاً" : ""}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 font-black text-lg shadow-sm transition-colors relative ${
                      whatsappSent
                        ? "bg-bg border-primary text-primary hover:bg-primary/5"
                        : "bg-bg border-border text-text-muted cursor-not-allowed opacity-50"
                    }`}
                  >
                    <span className="absolute right-4 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm">2</span>
                    {whatsappSent ? "تم إرسال الرسالة ، تأكيد الطلب" : "أرسل رسالة الواتساب أولاً ↑"}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConfirmSent}
                  disabled={!agreedToTerms}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-black text-lg transition-all ${
                    agreedToTerms ? "bg-primary shadow-xl shadow-primary/30 hover:bg-primary-dark hover:-translate-y-1" : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60"
                  }`}
                >
                  تأكيد الاشتراك الآن
                </button>
              )}
            </div>
            
            <button
              onClick={() => setShowPopup(false)}
              className="mt-6 text-text-muted font-bold text-sm hover:underline w-full text-center"
            >
              إلغاء والتراجع
            </button>
          </div>

          {/* Floating Public Promo Cards */}
          {!isFree && publicCodes.length > 0 && (
            <div className="hidden lg:flex w-60 flex-col gap-3 animate-in slide-in-from-right-8 duration-500 shrink-0">
              <div className="bg-primary text-white text-xs font-black px-4 py-2 rounded-t-xl text-center shadow-lg uppercase tracking-wide">
                🔥 عروض حصرية متاحة لك!
              </div>
              {publicCodes.map(code => (
                <div key={code.id} onClick={() => { setDiscountCodeInput(code.code); handleApplyDiscount(code.code); }} 
                  className="group bg-card rounded-2xl p-4 shadow-xl border-2 border-dashed border-primary/40 hover:border-primary cursor-pointer transition-all hover:scale-105 hover:rotate-2 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <IconRosetteDiscountCheckFilled size={24} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-text-muted uppercase">كود الخصم</div>
                      <div className="text-sm font-black text-primary">{code.code}</div>
                    </div>
                  </div>
                  <div className="text-center font-black text-lg text-accent-teal mt-1">
                    خصم {code.discountPercent}%
                  </div>
                  <div className="text-[10px] text-center text-text-muted font-bold mt-2 bg-bg py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    اضغط للتطبيق فوراً 👆
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}
      {/* ── Terms / Privacy Modal ── */}
      {activeModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-2xl rounded-3xl p-6 border border-border shadow-2xl flex flex-col max-h-[85vh] relative shrink-0 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border shrink-0">
              <h3 className="text-xl font-black text-text">
                {activeModal === 'terms' ? 'شروط الاستخدام والأحكام' : 'سياسة الخصوصية'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="w-10 h-10 rounded-full hover:bg-bg text-text-muted flex items-center justify-center transition-colors"
              >
                <IconX size={24} stroke={2} />
              </button>
            </div>
            
            <div className="overflow-y-auto pr-2 space-y-4 text-sm font-semibold text-text-muted leading-loose pb-4 custom-scrollbar">
              {activeModal === 'terms' ? (
                <>
                  <p>مرحباً بك في منصة الأوس الماسية. باستخدامك لهذه المنصة، فإنك توافق على الالتزام بالشروط والأحكام التالية:</p>
                  <ul className="list-disc list-inside space-y-2 text-text">
                    <li><span className="font-bold text-primary">المحتوى المجاني:</span> جميع محتويات المنصة من دورات وتدريبات مقدمة بشكل مجاني بالكامل دعماً للطلاب.</li>
                    <li><span className="font-bold text-primary">حقوق الملكية الفكرية:</span> جميع محتويات المنصة من دورات، فيديوهات، أسئلة وملفات هي ملكية حصرية لمنصة الأوس الماسية. يُمنع منعاً باتاً نسخها أو توزيعها أو مشاركتها أو استخدامها لأي غرض تجاري خارج المنصة.</li>
                    <li><span className="font-bold text-primary">الاستخدام الشخصي:</span> الحساب المُسجل في المنصة هو للاستخدام الشخصي فقط. لا يُسمح بمشاركة بيانات الدخول مع أي شخص آخر، ويحق للمنصة إيقاف أي حساب يخالف ذلك للحفاظ على جودة الخدمة المجانية للجميع.</li>
                    <li><span className="font-bold text-primary">الالتزام والمواظبة:</span> يتعهد المشترك بالالتزام بمشاهدة الدروس وأداء الاختبارات حسب الخطة الدراسية لتحقيق الاستفادة القصوى من هذه المنحة المجانية.</li>
                    <li><span className="font-bold text-primary">التعديلات:</span> تحتفظ منصة الأوس الماسية بالحق في تعديل الشروط والأحكام في أي وقت، وسيتم إشعار المستخدمين بأي تغييرات جوهرية.</li>
                  </ul>
                  <p>بموافقتك على هذه الشروط، فإنك تقر بأنك قد قرأتها وفهمتها وتتعهد بالالتزام بها كاملةً.</p>
                </>
              ) : (
                <>
                  <p>نحن في منصة الأوس الماسية نولي أهمية قصوى لخصوصية بياناتك وسريتها.</p>
                  <ul className="list-disc list-inside space-y-2 text-text">
                    <li><span className="font-bold text-primary">جمع البيانات:</span> نقوم بجمع المعلومات الأساسية مثل الاسم، البريد الإلكتروني، ورقم الجوال لغرض تسجيل الدخول والتواصل وإرسال التحديثات.</li>
                    <li><span className="font-bold text-primary">استخدام البيانات:</span> تُستخدم بياناتك لتقديم خدمات المنصة، تقييم أدائك، تحسين تجربة التعلم، وإرسال التقارير الدورية (مثلاً لولي الأمر إذا تم تقديم الرقم).</li>
                    <li><span className="font-bold text-primary">حماية البيانات:</span> نتخذ كافة الإجراءات التقنية والأمنية اللازمة لحماية بياناتك من الوصول غير المصرح به أو الفقدان أو التعديل.</li>
                    <li><span className="font-bold text-primary">مشاركة البيانات:</span> لا نقوم ببيع أو تأجير أو مشاركة بياناتك الشخصية مع أطراف ثالثة لأغراض تسويقية. قد نشارك بعض البيانات مع مزودي خدمات موثوقين (مثل بوابات الدفع أو خدمات الرسائل) بالقدر اللازم لتقديم الخدمة فقط.</li>
                    <li><span className="font-bold text-primary">حقوقك:</span> يحق لك طلب الوصول إلى بياناتك الشخصية، أو تعديلها، أو حذفها من خلال التواصل مع فريق الدعم الفني.</li>
                  </ul>
                </>
              )}
            </div>
            
            <div className="pt-4 border-t border-border shrink-0">
              <button
                onClick={() => {
                  setAgreedToTerms(true);
                  setActiveModal(null);
                }}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-black hover:bg-primary-dark transition-colors"
              >
                موافق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}