// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  fetchFinalExamByCourse,
  fetchStudentFinalExamAttempts,
  checkFinalExamUnlock,
  submitFinalExamAttempt,
  type FinalExamWithQuestions,
  type FinalExamQuestion,
  type UnlockStatus,
} from "@/lib/supabase/services/final-exam";
import { fetchCertificateForCourse, fetchStudentCertificates } from "@/lib/supabase/services/certificates";
import { archiveStudentCourse } from "@/app/actions/progress";
import { usePlatformStore } from "@/lib/store";
import {
  IconArrowRight,
  IconTrophy,
  IconLock,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconClock,
  IconStarFilled,
  IconSchool,
  IconDownload,
  IconRefresh,
} from "@tabler/icons-react";

const LETTERS = ["أ", "ب", "ج", "د"];

export default function FinalExamPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [exam, setExam] = useState<FinalExamWithQuestions | null>(null);
  const [unlock, setUnlock] = useState<UnlockStatus | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [hasCert, setHasCert] = useState(false);
  const [certId, setCertId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Exam state
  const [stage, setStage] = useState<"info" | "exam" | "result">("info");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showStartConfirm, setShowStartConfirm] = useState(false);

  // Result state
  const [result, setResult] = useState<{
    scorePct: number; passed: boolean; correct: number; total: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isGraduated, setIsGraduated] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [allCerts, setAllCerts] = useState<any[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetName, setResetName] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const uid = session.user.id;
      if (active) setUserId(uid);

      const [examData, unlockData, cert, allStudentCerts, courseRes] = await Promise.all([
        fetchFinalExamByCourse(courseId),
        checkFinalExamUnlock(uid, courseId),
        fetchCertificateForCourse(uid, courseId),
        fetchStudentCertificates(uid),
        supabase.from("courses").select("title").eq("id", courseId).single(),
      ]);

      if (!active) return;
      
      // BLOCK: If the course is a simulator, it should NEVER have a final exam.
      if (courseRes.data && (courseRes.data.title.includes("محاكي") || courseRes.data.title.includes("STEP") || courseRes.data.title.includes("اختبار الستيب"))) {
        router.replace("/dashboard");
        return;
      }

      setExam(examData);
      setUnlock(unlockData);
      
      const courseCerts = allStudentCerts.filter(c => c.course_id === courseId);
      setAllCerts(courseCerts);

      if (examData) {
        const attemptsData = await fetchStudentFinalExamAttempts(uid, examData.id);
        setAttempts(attemptsData);
        
        const numAttempts = attemptsData.length;
        const bestScore = numAttempts > 0 ? Math.max(...attemptsData.map(a => Math.round(a.score_pct))) : 0;
        const maxAttempts = examData.max_attempts || 3;
        
        const finalized = bestScore === 100 || numAttempts >= maxAttempts;
        if (finalized) {
          if (bestScore >= (examData.passing_score || 70)) {
            setIsGraduated(true);
            const passingCert = cert && cert.score_pct >= (examData.passing_score || 70) ? cert : courseCerts.find(c => c.course_id === courseId && c.score_pct >= (examData.passing_score || 70));
            if (passingCert) {
              setHasCert(true);
              setCertId(passingCert.id);
            }
          } else {
            setIsFailed(true);
          }
        }
      }

      setLoading(false);
    })();
    return () => { active = false; };
  }, [courseId]);

  // Timer countdown
  useEffect(() => {
    if (stage !== "exam") return;
    const interval = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(interval); handleSubmit(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stage]);

  // Cleanup exam mode on unmount
  useEffect(() => {
    return () => {
      window.dispatchEvent(new Event("exam-ended"));
    };
  }, []);

  const handleStart = () => {
    if (!exam) return;
    setAnswers(new Array(exam.questions.length).fill(null));
    setCurrentQ(0);
    setSecondsLeft(exam.time_limit_minutes * 60);
    setStartTime(Date.now());
    setStage("exam");
    
    // Hide AppShell Nav
    window.dispatchEvent(new Event("exam-started"));

    // Enter fullscreen to hide browser chrome
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen();
    }
  };

  const handleAnswer = (idx: number) => {
    setAnswers(prev => {
      const next = [...prev];
      next[currentQ] = idx;
      return next;
    });

    if (autoAdvance) {
      setTimeout(() => {
        if (exam && currentQ < exam.questions.length - 1) {
          setCurrentQ(q => q + 1);
        }
      }, 400);
    }
  };

  const handleNext = () => {
    if (exam && currentQ < exam.questions.length - 1 && answers[currentQ] !== null) {
      setCurrentQ(q => q + 1);
    }
  };

  const canGoToQuestion = (targetQ: number) => {
    if (targetQ <= currentQ) return true;
    for (let i = currentQ; i < targetQ; i++) {
      if (answers[i] === null) return false;
    }
    return true;
  };

  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ(q => q - 1);
  };

  const handleSubmit = async () => {
    if (!exam || !userId || submitting) return;
    setSubmitting(true);
    
    // Restore AppShell Nav
    window.dispatchEvent(new Event("exam-ended"));

    // Exit fullscreen when exam finishes
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if ((document as any).webkitFullscreenElement) {
      (document as any).webkitExitFullscreen();
    }
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const res = await submitFinalExamAttempt(
      userId, exam.id, exam.questions, answers, timeSpent
    );
    setResult(res);
    
    // Refresh attempts
    const updatedAttempts = await fetchStudentFinalExamAttempts(userId, exam.id);
    setAttempts(updatedAttempts);
    
    const numAttempts = updatedAttempts.length;
    const bestScore = numAttempts > 0 ? Math.max(...updatedAttempts.map(a => Math.round(a.score_pct))) : 0;
    const maxAttempts = exam.max_attempts || 3;
    const finalized = bestScore === 100 || numAttempts >= maxAttempts;
    
    if (finalized) {
       if (bestScore >= (exam.passing_score || 70)) {
          setIsGraduated(true);
          const cert = await fetchCertificateForCourse(userId, courseId);
          if (cert && cert.score_pct >= (exam.passing_score || 70)) { setHasCert(true); setCertId(cert.id); }
       } else {
          setIsFailed(true);
       }
    }
    
    setStage("result");
    setSubmitting(false);
  };

  const handleResetCourse = async () => {
    if (!resetName || !resetPassword) {
      setResetError("الرجاء إدخال الاسم وكلمة المرور");
      return;
    }
    setResetting(true);
    setResetError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Verify password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: resetPassword
    });
    
    if (signInError) {
      setResetError("كلمة المرور غير صحيحة");
      setResetting(false);
      return;
    }
    
    // Verify name
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
    if (profile?.full_name !== resetName) {
      setResetError("الاسم غير متطابق مع اسم الطالب المسجل");
      setResetting(false);
      return;
    }
    
    // Call server action
    const res = await archiveStudentCourse(user.id, courseId);
    if (res.success) {
      // Only clear the current course's content (tracks/lessons/exams/files).
      // DO NOT call resetStore() — that would wipe ALL courses' cached data
      // from the store, making other courses appear empty/reset on next visit.
      usePlatformStore.getState().resetCourseData();
      window.location.reload();
    } else {
      setResetError(res.error || "حدث خطأ أثناء التصفير");
      setResetting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // ── No exam published ──────────────────────────────────────────
  if (!exam) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-center p-4 gap-4" dir="rtl">
        <div className="w-24 h-24 rounded-full bg-bg border-2 border-border flex items-center justify-center text-4xl">📋</div>
        <h1 className="text-2xl font-black text-text">الاختبار النهائي غير متاح بعد</h1>
        <p className="text-text-muted font-semibold max-w-sm">لم يتم نشر الاختبار النهائي لهذه الدورة بعد. تابعنا قريباً!</p>
        <Link href="/dashboard" className="mt-2 px-6 py-3 bg-primary text-white font-bold rounded-xl">العودة للوحة التحكم</Link>
      </div>
    );
  }

  const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score_pct ?? 0)) : 0;
  const attemptsUsed = attempts.length;
  const attemptsLeft = exam.max_attempts - attemptsUsed;
  const canAttempt = unlock?.unlocked && attemptsLeft > 0 && !hasCert;

  if (isGraduated) {
    const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score_pct ?? 0)) : 0;
    return (
      <div className="min-h-screen bg-bg p-4 md:p-8" dir="rtl">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-gradient-to-br from-green-500/20 to-teal-500/10 border-2 border-green-500/30 rounded-3xl p-8 text-center shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto bg-green-500 text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                <IconTrophy size={48} />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-text mb-4">تم انتهاء الدورة بنجاح!</h1>
              <p className="text-lg text-text-muted font-semibold mb-8">
                مبروك! لقد أتممت جميع متطلبات الدورة وحصلت على الشهادة النهائية بنسبة {bestScore}%.
              </p>
              
              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                {certId && (
                  <a
                    href={`/api/certificates/generate?id=${certId}`}
                    target="_blank"
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-l from-amber-500 to-yellow-400 text-white font-black text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                  >
                    <IconDownload size={24} /> تحميل الشهادة
                  </a>
                )}
                
                <button
                  onClick={() => setShowResetModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-border text-text font-bold text-lg hover:bg-card transition-all"
                >
                  <IconRefresh size={22} /> إعادة تفعيل الدورة من جديد
                </button>
                <Link href="/dashboard" className="text-text-muted font-bold hover:text-primary mt-2">العودة للوحة التحكم</Link>
              </div>
            </div>
          </div>
          
          {allCerts.length > 0 && (
            <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
              <h3 className="text-xl font-black text-text mb-4 flex items-center gap-2"><IconSchool className="text-primary"/> شهاداتي السابقة لهذه الدورة</h3>
              <div className="grid gap-3">
                {allCerts.map(c => {
                  const isPassingCert = c.score_pct >= (exam?.passing_score || 70);
                  return (
                    <div key={c.id} className="flex items-center justify-between p-4 bg-bg rounded-xl border border-border">
                      <div>
                        <div className="font-bold text-text">
                          شهادة إتمام ({c.score_pct}%) 
                          {!isPassingCert && <span className="text-red-500 text-xs mr-2">(راسب)</span>}
                        </div>
                        <div className="text-xs text-text-muted font-semibold">{new Date(c.issued_at).toLocaleDateString('ar-SA')}</div>
                      </div>
                      {isPassingCert ? (
                        <a href={`/api/certificates/generate?id=${c.id}`} target="_blank" className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors">
                          <IconDownload size={20} />
                        </a>
                      ) : (
                        <span className="text-xs font-bold text-red-500/70 bg-red-500/10 px-3 py-1.5 rounded-lg">لا يمكن التحميل</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
          {showResetModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-3xl p-6 w-full max-w-md border border-border shadow-2xl relative" dir="rtl">
        <button onClick={() => setShowResetModal(false)} className="absolute top-4 left-4 p-2 bg-bg hover:bg-red-500/10 hover:text-red-500 rounded-full text-text-muted transition-colors">
          <IconX size={20} />
        </button>
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <IconAlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-black text-text text-center mb-2">تأكيد تصفير الدورة</h2>
        <p className="text-sm text-text-muted font-semibold text-center mb-6">
          سيتم مسح جميع تقدمك في هذه الدورة بالكامل، وستبدأ من الصفر. سيتم الاحتفاظ بشهاداتك السابقة فقط.
        </p>
        
        {resetError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm font-bold mb-4 text-center">
            {resetError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-text-muted mb-1">اسم الطالب (كما هو مسجل)</label>
            <input 
              type="text" 
              value={resetName} 
              onChange={e => setResetName(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl p-3 outline-none text-text focus:border-primary font-semibold"
              placeholder="الاسم الثلاثي..."
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-text-muted mb-1">كلمة المرور</label>
            <input 
              type="password" 
              value={resetPassword} 
              onChange={e => setResetPassword(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl p-3 outline-none text-text focus:border-primary font-semibold"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button 
          onClick={handleResetCourse}
          disabled={resetting}
          className="w-full mt-6 py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl transition-all disabled:opacity-50"
        >
          {resetting ? "جاري التصفير..." : "نعم، متأكد من التصفير"}
        </button>
      </div>
    </div>
  )}
      </div>
    );
  }

  if (isFailed) {
    const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score_pct ?? 0)) : 0;
    return (
      <div className="min-h-screen bg-bg p-4 md:p-8 flex items-center justify-center" dir="rtl">
        <div className="max-w-md w-full bg-card rounded-3xl p-8 text-center border border-border shadow-xl">
          <div className="w-24 h-24 mx-auto bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
            <IconAlertTriangle size={48} />
          </div>
          <h1 className="text-3xl font-black text-text mb-4">للأسف، لم تجتز الدورة</h1>
          <p className="text-text-muted font-semibold mb-8">
            لقد استنفذت جميع المحاولات المتاحة ولم تحقق درجة النجاح. أعلى درجة حصلت عليها هي {bestScore}%.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowResetModal(true)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-white font-black text-lg hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/30"
            >
              <IconRefresh size={22} /> إعادة تفعيل الدورة من جديد
            </button>
            <Link href="/dashboard" className="text-text-muted font-bold hover:text-text mt-2">العودة للوحة التحكم</Link>
          </div>
        </div>
          {showResetModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-3xl p-6 w-full max-w-md border border-border shadow-2xl relative" dir="rtl">
        <button onClick={() => setShowResetModal(false)} className="absolute top-4 left-4 p-2 bg-bg hover:bg-red-500/10 hover:text-red-500 rounded-full text-text-muted transition-colors">
          <IconX size={20} />
        </button>
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <IconAlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-black text-text text-center mb-2">تأكيد تصفير الدورة</h2>
        <p className="text-sm text-text-muted font-semibold text-center mb-6">
          سيتم مسح جميع تقدمك في هذه الدورة بالكامل، وستبدأ من الصفر. سيتم الاحتفاظ بشهاداتك السابقة فقط.
        </p>
        
        {resetError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm font-bold mb-4 text-center">
            {resetError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-text-muted mb-1">اسم الطالب (كما هو مسجل)</label>
            <input 
              type="text" 
              value={resetName} 
              onChange={e => setResetName(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl p-3 outline-none text-text focus:border-primary font-semibold"
              placeholder="الاسم الثلاثي..."
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-text-muted mb-1">كلمة المرور</label>
            <input 
              type="password" 
              value={resetPassword} 
              onChange={e => setResetPassword(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl p-3 outline-none text-text focus:border-primary font-semibold"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button 
          onClick={handleResetCourse}
          disabled={resetting}
          className="w-full mt-6 py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl transition-all disabled:opacity-50"
        >
          {resetting ? "جاري التصفير..." : "نعم، متأكد من التصفير"}
        </button>
      </div>
    </div>
  )}
      </div>
    );
  }

  // ── RESULT STAGE ──────────────────────────────────────────────
  if (stage === "result" && result) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4" dir="rtl">
        <div className="bg-card rounded-3xl p-8 w-full max-w-lg border border-border shadow-2xl text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl ${result.passed ? "bg-accent-teal/10 text-accent-teal" : "bg-accent-red/10 text-accent-red"}`}>
            {result.passed ? "🎉" : "😔"}
          </div>
          <h2 className={`text-3xl font-black mb-2 ${result.passed ? "text-accent-teal" : "text-accent-red"}`}>
            {result.passed ? "أحسنت! لقد اجتزت الاختبار" : "لم تجتز الاختبار هذه المرة"}
          </h2>
          <p className="text-text-muted font-semibold mb-8">
            {result.passed ? "شهادتك جاهزة للتحميل الآن!" : `درجة النجاح ${exam.passing_score}%. لا تستسلم!`}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "درجتك", value: `${result.scorePct}%`, color: result.passed ? "text-accent-teal" : "text-accent-red" },
              { label: "الإجابات الصحيحة", value: `${result.correct}/${result.total}`, color: "text-text" },
              { label: "المحاولات المتبقية", value: attemptsLeft, color: "text-accent-amber" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-bg rounded-2xl p-4 border border-border">
                <div className={`text-2xl font-black ${color}`}>{value}</div>
                <div className="text-xs font-bold text-text-muted mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {result.passed && certId && (
              <a
                href={`/api/certificates/generate?id=${certId}`}
                target="_blank"
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-l from-amber-500 to-yellow-400 text-white font-black text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              >
                <IconDownload size={22} /> تحميل الشهادة (PDF)
              </a>
            )}
            {!result.passed && attemptsLeft > 0 && (
              <button
                onClick={handleStart}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-white font-black text-lg shadow-primary/30 shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <IconRefresh size={22} /> إعادة المحاولة ({attemptsLeft} متبقية)
              </button>
            )}
            <Link href="/dashboard" className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-border text-text-muted font-bold hover:bg-bg transition-colors">
              <IconArrowRight size={18} /> العودة للوحة التحكم
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── EXAM STAGE ────────────────────────────────────────────────
  if (stage === "exam") {
    const q = exam.questions[currentQ];
    const timePct = (secondsLeft / (exam.time_limit_minutes * 60)) * 100;
    const timeColor = timePct > 40 ? "bg-accent-teal" : timePct > 20 ? "bg-accent-amber" : "bg-accent-red";

    return (
      <div className="fixed inset-0 z-[100] bg-bg flex flex-col" dir="rtl">
        {/* Header (Fixed at top) */}
        <div className="bg-card border-b border-border px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 font-black text-lg ${timePct < 20 ? "text-accent-red animate-pulse" : "text-text"}`}>
              <IconClock size={20} />
              {formatTime(secondsLeft)}
            </div>
          </div>
          <div className="text-center">
            <div className="font-black text-text text-sm md:text-base line-clamp-1">{exam.title}</div>
            <div className="text-xs text-text-muted font-semibold">السؤال {currentQ + 1} من {exam.questions.length}</div>
          </div>
          <button onClick={() => setShowConfirmSubmit(true)} disabled={submitting} className="px-4 py-2 bg-accent-red hover:bg-red-600 text-white font-bold text-sm rounded-xl disabled:opacity-50 transition-colors">
            {submitting ? "جاري..." : "إنهاء الاختبار"}
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-border shrink-0">
          <div
            className={`h-full transition-all duration-1000 ${timeColor}`}
            style={{ width: `${timePct}%` }}
          />
        </div>

        {/* Scrollable Question Area */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center p-4 md:p-6 pb-32">
          <div className="w-full max-w-3xl flex-1 flex flex-col">
            {/* Question Box */}
            <div className="bg-card rounded-3xl p-6 md:p-8 border border-border shadow-sm mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                  {currentQ + 1}
                </div>
                <p className="text-xl font-bold text-text leading-relaxed">{q.text}</p>
              </div>

              <div className="flex flex-col gap-3">
                {q.options.map((opt, idx) => {
                  const selected = answers[currentQ] === idx;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleAnswer(idx)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-right transition-all font-semibold ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-bg hover:border-primary/40 hover:bg-primary/5 text-text"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                        selected ? "bg-primary text-white" : "bg-card border border-border text-text-muted"
                      }`}>
                        {LETTERS[idx]}
                      </div>
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Footer (Fixed at bottom) */}
        <div className="bg-card border-t border-border shrink-0 p-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <button onClick={handlePrev} disabled={currentQ === 0} className="px-5 py-3 rounded-xl border border-border font-bold text-text-muted disabled:opacity-30 hover:bg-bg transition-colors flex-shrink-0">
              ← السابق
            </button>

            {/* Question dots (hidden on very small screens, scrolls if too many) */}
            <div className="hidden sm:flex flex-1 overflow-x-auto gap-1.5 justify-center px-4 py-1 pb-2 no-scrollbar">
              {exam.questions.map((_, i) => {
                const canGo = canGoToQuestion(i);
                return (
                  <button
                    key={i}
                    onClick={() => canGo && setCurrentQ(i)}
                    disabled={!canGo}
                    className={`w-8 h-8 flex-shrink-0 rounded-full text-xs font-black transition-all ${
                      i === currentQ
                        ? "bg-primary text-white scale-110 shadow-md"
                        : answers[i] !== null
                        ? "bg-accent-teal/20 text-accent-teal border border-accent-teal/40"
                        : "bg-bg border border-border text-text-muted"
                    } ${!canGo ? "opacity-30 cursor-not-allowed" : "hover:border-primary/30"}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {currentQ < exam.questions.length - 1 ? (
              <button 
                onClick={handleNext} 
                disabled={answers[currentQ] === null}
                className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي →
              </button>
            ) : (
              <button onClick={() => setShowConfirmSubmit(true)} disabled={submitting} className="px-6 py-3 rounded-xl bg-accent-teal text-white font-bold disabled:opacity-50 hover:bg-accent-teal/90 transition-colors shadow-md shadow-accent-teal/20 flex-shrink-0">
                {submitting ? "جاري..." : "تسليم الاختبار ✓"}
              </button>
            )}
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-border text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-accent-amber/10 text-accent-amber flex items-center justify-center mb-4 border border-accent-amber/20">
                <IconAlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-text mb-2">تأكيد التسليم</h3>
              {answers.includes(null) ? (
                <p className="text-sm font-semibold text-text-muted mb-6">
                  هناك {answers.filter(a => a === null).length} أسئلة لم تقم بالإجابة عليها بعد. هل أنت متأكد أنك تريد إنهاء الاختبار الآن؟
                </p>
              ) : (
                <p className="text-sm font-semibold text-text-muted mb-6">
                  لقد أجبت على جميع الأسئلة. هل أنت متأكد من رغبتك في تسليم الاختبار؟ لا يمكن التراجع عن هذه الخطوة.
                </p>
              )}
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 py-3 rounded-xl border border-border text-text font-bold hover:bg-bg transition-colors"
                >
                  مراجعة الأسئلة
                </button>
                <button 
                  onClick={() => { setShowConfirmSubmit(false); handleSubmit(); }}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {submitting ? "جاري التسليم..." : "نعم، تسليم"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── INFO STAGE (default) ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg text-text font-sans pb-24" dir="rtl">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-bg/80 backdrop-blur-lg border-b border-border mb-8">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-text-muted hover:text-text transition-colors font-bold text-sm">
            <IconArrowRight size={18} /> العودة للوحة التحكم
          </Link>
          <div className="font-black text-text border-r border-border pr-4">الاختبار النهائي</div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-purple-700 to-indigo-900 p-8 md:p-12 text-white mb-8 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.05),transparent)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl">🏆</div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest opacity-60">الاختبار النهائي</div>
                <h1 className="text-2xl font-black">{exam.title}</h1>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: "⏱️", label: "المدة", value: `${exam.time_limit_minutes} دقيقة` },
                { icon: "📊", label: "درجة النجاح", value: `${exam.passing_score}%` },
                { icon: "🔄", label: "المحاولات المتاحة", value: `${exam.max_attempts}` },
                { icon: "❓", label: "عدد الأسئلة", value: `${exam.questions.length}` },
              ].map(({ icon, label, value }) => (
                <div key={label} className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-xs opacity-60 font-semibold mb-1">{label}</div>
                  <div className="font-black text-lg">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Status Card */}
          <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
            <h2 className="font-black text-lg text-text mb-4">حالتك الحالية</h2>

            {/* Unlock progress */}
            {unlock && (
              <div className="flex flex-col gap-4 mb-5">
                {unlock.requiredLessonsPct > 0 && (
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-text-muted flex items-center gap-1.5">
                        {unlock.lessonsPct >= unlock.requiredLessonsPct ? <IconCheck size={16} className="text-accent-teal" /> : null}
                        إكمال الدروس
                      </span>
                      <span className={unlock.lessonsPct >= unlock.requiredLessonsPct ? "text-accent-teal font-black" : "text-accent-amber"}>
                        {unlock.lessonsPct >= unlock.requiredLessonsPct ? "مكتمل" : `${unlock.lessonsPct}% / ${unlock.requiredLessonsPct}% مطلوب`}
                      </span>
                    </div>
                    <div className="h-2.5 bg-bg rounded-full overflow-hidden border border-border">
                      <div
                        className={`h-full rounded-full transition-all ${unlock.lessonsPct >= unlock.requiredLessonsPct ? "bg-accent-teal" : "bg-accent-amber"}`}
                        style={{ width: `${Math.min(unlock.lessonsPct, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-text-muted mt-1">
                      <span>{unlock.lessonsCompleted} درس مكتمل</span>
                      <span>من {unlock.lessonsTotal} درس</span>
                    </div>
                  </div>
                )}
                
                {unlock.requiredSkillsPct > 0 && (
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-text-muted flex items-center gap-1.5">
                        {unlock.skillsAvgPct >= unlock.requiredSkillsPct ? <IconCheck size={16} className="text-accent-teal" /> : null}
                        إتقان المهارات
                      </span>
                      <span className={unlock.skillsAvgPct >= unlock.requiredSkillsPct ? "text-accent-teal font-black" : "text-accent-amber"}>
                        {unlock.skillsAvgPct >= unlock.requiredSkillsPct ? "مكتمل" : `${unlock.skillsAvgPct}% / ${unlock.requiredSkillsPct}% مطلوب`}
                      </span>
                    </div>
                    <div className="h-2.5 bg-bg rounded-full overflow-hidden border border-border">
                      <div
                        className={`h-full rounded-full transition-all ${unlock.skillsAvgPct >= unlock.requiredSkillsPct ? "bg-accent-teal" : "bg-accent-amber"}`}
                        style={{ width: `${Math.min(unlock.skillsAvgPct, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {unlock.requiredExamsPassed && (
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-text-muted flex items-center gap-1.5">
                        {unlock.examsPassed >= unlock.examsTotal ? <IconCheck size={16} className="text-accent-teal" /> : null}
                        اجتياز اختبارات المسارات
                      </span>
                      <span className={unlock.examsPassed >= unlock.examsTotal ? "text-accent-teal font-black" : "text-accent-amber"}>
                        {unlock.examsPassed >= unlock.examsTotal ? "مكتمل" : `${unlock.examsPassed} / ${unlock.examsTotal}`}
                      </span>
                    </div>
                    <div className="h-2.5 bg-bg rounded-full overflow-hidden border border-border">
                      <div
                        className={`h-full rounded-full transition-all ${unlock.examsPassed >= unlock.examsTotal ? "bg-accent-teal" : "bg-accent-amber"}`}
                        style={{ width: `${unlock.examsTotal > 0 ? Math.min((unlock.examsPassed / unlock.examsTotal) * 100, 100) : 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attempts */}
            <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-border mb-4">
              <span className="text-sm font-bold text-text-muted">المحاولات المستخدمة</span>
              <span className="font-black text-text">{attemptsUsed} / {exam.max_attempts}</span>
            </div>

            {/* Best score */}
            {attemptsUsed > 0 && (
              <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-border mb-4">
                <span className="text-sm font-bold text-text-muted">أفضل درجة</span>
                <span className={`font-black text-xl ${bestScore >= exam.passing_score ? "text-accent-teal" : "text-accent-red"}`}>
                  {bestScore}%
                </span>
              </div>
            )}

            {/* Certificate status */}
            {hasCert && (
              <div className="flex items-center gap-3 p-4 bg-accent-teal/10 border border-accent-teal/30 rounded-2xl">
                <IconTrophy size={24} className="text-accent-teal shrink-0" />
                <div>
                  <div className="font-black text-accent-teal text-sm">لديك شهادة!</div>
                  <div className="text-xs text-text-muted font-semibold">يمكنك تحميلها في أي وقت</div>
                </div>
              </div>
            )}
          </div>

          {/* Action Card */}
          <div className="bg-card rounded-3xl p-6 border border-border shadow-sm flex flex-col gap-4">
            <h2 className="font-black text-lg text-text">الإجراءات</h2>

            {/* Download Certificate Buttons (if passed) */}
            {hasCert && certId && (
              <div className="flex flex-col gap-3 pb-4 mb-2 border-b border-border">
                <a
                  href={`/api/certificates/generate?id=${certId}`}
                  target="_blank"
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-l from-amber-500 to-yellow-400 text-white font-black text-lg shadow-amber-200 dark:shadow-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  <IconDownload size={22} /> تحميل الشهادة (PDF)
                </a>
                <a
                  href={`/verify/${certId}`}
                  target="_blank"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-border font-bold text-text-muted hover:bg-bg transition-colors text-sm"
                >
                  🔗 مشاركة رابط الشهادة
                </a>
              </div>
            )}

            {!unlock?.unlocked ? (
              <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                <div className="w-16 h-16 rounded-full bg-bg border-2 border-border flex items-center justify-center">
                  <IconLock size={28} className="text-text-muted" />
                </div>
                <div className="font-black text-text">الاختبار مقفل</div>
                <div className="text-sm text-text-muted font-semibold max-w-xs">
                  {unlock.lessonsPct < unlock.requiredLessonsPct 
                    ? `يجب إكمال ${unlock.requiredLessonsPct}% من دروس الدورة لفتح الاختبار النهائي` 
                    : unlock.skillsAvgPct < unlock.requiredSkillsPct 
                      ? `يجب تحقيق نسبة إتقان ${unlock.requiredSkillsPct}% للمهارات لفتح الاختبار` 
                      : `يجب اجتياز جميع اختبارات المسارات لفتح الاختبار`}
                </div>
                <Link href="/dashboard" className="mt-2 px-5 py-2 bg-primary text-white font-bold rounded-xl text-sm">
                  {unlock.lessonsPct < unlock.requiredLessonsPct 
                    ? "أكمل الدروس أولاً" 
                    : unlock.skillsAvgPct < unlock.requiredSkillsPct 
                      ? "ارفع نسبة إتقان المهارات" 
                      : "اجتز اختبارات المسارات"}
                </Link>
              </div>
            ) : attemptsLeft <= 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                <div className="w-16 h-16 rounded-full bg-accent-red/10 border-2 border-accent-red/30 flex items-center justify-center">
                  <IconAlertTriangle size={28} className="text-accent-red" />
                </div>
                <div className="font-black text-text">استنفذت جميع المحاولات</div>
                <div className="text-sm text-text-muted font-semibold">
                  تواصل مع الإدارة إذا كنت تحتاج مزيداً من المحاولات
                </div>
              </div>
            ) : (bestScore >= 100) ? (
              <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                <div className="w-16 h-16 rounded-full bg-accent-teal/10 border-2 border-accent-teal/30 flex items-center justify-center">
                  <IconTrophy size={28} className="text-accent-teal" />
                </div>
                <div className="font-black text-text">علامة كاملة! 🏆</div>
                <div className="text-sm text-text-muted font-semibold">
                  لقد حصلت على 100%، لا توجد حاجة لإعادة الاختبار.
                </div>
              </div>
            ) : (
              <>
                {exam.description && !hasCert && (
                  <p className="text-sm text-text-muted font-semibold leading-relaxed bg-bg p-4 rounded-xl border border-border">
                    {exam.description}
                  </p>
                )}
                
                {/* NEW INSTRUCTIONS CARD */}
                <div className="bg-bg border border-border rounded-2xl p-5 my-2">
                  <h3 className="font-black text-text mb-3 flex items-center gap-2">
                    <IconAlertTriangle size={18} className="text-accent-amber" />
                    تعليمات هامة قبل البدء
                  </h3>
                  <ul className="flex flex-col gap-3 text-sm font-semibold text-text-muted list-none p-0 m-0">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 shrink-0">•</span>
                      <span>الاختبار سيظهر بوضعية ملء الشاشة (Fullscreen) لضمان التركيز التام.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 shrink-0">•</span>
                      <span>الاختبار يعمل بمؤقت زمني، ولا يمكن إيقاف الوقت بعد البدء. تأكد من استقرار الإنترنت.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 shrink-0">•</span>
                      <span>لا يمكنك تخطي أي سؤال دون اختيار إجابة أولاً (يمكنك الرجوع لتعديل الإجابة لاحقاً).</span>
                    </li>
                  </ul>
                  
                  {/* Auto Advance Toggle */}
                  <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                    <div>
                      <div className="font-bold text-text text-sm mb-0.5">الانتقال التلقائي</div>
                      <div className="text-xs text-text-muted">الذهاب للسؤال التالي فور الإجابة</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer" dir="ltr">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={autoAdvance}
                        onChange={(e) => setAutoAdvance(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => setShowStartConfirm(true)}
                  className="mt-auto w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-white font-black text-lg shadow-primary/30 shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  {attemptsUsed > 0 ? "🔄 إعادة الاختبار للتحسين" : "🚀 ابدأ الاختبار النهائي"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Start Confirmation Modal */}
        {showStartConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-2xl border border-border text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 border border-primary/20">
                <IconAlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-text mb-2">تأكيد بدء الاختبار</h3>
              <p className="text-sm font-semibold text-text-muted mb-4 leading-relaxed">
                هل أنت مستعد للبدء؟ بمجرد دخولك الاختبار سيتم احتساب هذه المحاولة، وحتى إذا قمت بالخروج أو إغلاق الصفحة ستحتسب المحاولة ولن تتمكن من إيقاف المؤقت.
              </p>
              <div className="bg-accent-teal/10 text-accent-teal text-xs font-bold px-4 py-2 rounded-lg mb-6 w-full text-center border border-accent-teal/20">
                ملاحظة: سيتم دائمًا اعتماد "الدرجة الأعلى" من بين محاولاتك.
              </div>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowStartConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-border text-text font-bold hover:bg-bg transition-colors"
                >
                  إلغاء الأمر
                </button>
                <button 
                  onClick={() => { setShowStartConfirm(false); handleStart(); }}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors"
                >
                  موافق، ابدأ الآن
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
