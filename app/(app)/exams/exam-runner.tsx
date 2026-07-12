"use client";

import { useEffect, useRef, useState } from "react";
import type { SkillQuestion as ExamQuestion } from "@/lib/store";
import { ProgressBar } from "@/components/ui/progress-bar";
import { IconAlertTriangle, IconInfoCircle, IconX, IconClock, IconTarget } from "@tabler/icons-react";
import {
  saveExamSession,
  loadExamSession,
  clearExamSession,
  getRemainingSeconds,
  type ActiveExamSession,
} from "@/lib/exam-session-store";

const LETTERS = ["أ", "ب", "ج", "د"];

type ExamRunnerProps = {
  examId: string;
  examTitle: string;
  questions: ExamQuestion[];
  timeMinutes: number;
  stats?: { bestScore: number; attemptsCount: number; maxAttempts: number };
  onFinish: (answers: (number | null)[]) => void;
  onExit?: () => void;
};

export function ExamRunner({
  examId,
  examTitle,
  questions,
  timeMinutes,
  stats = { bestScore: 0, attemptsCount: 0, maxAttempts: 5 },
  onFinish,
  onExit,
}: ExamRunnerProps) {
  const isTraining = stats.attemptsCount > stats.maxAttempts || stats.bestScore >= 100;

  // ── Check for a saved session on mount ──────────────────────
  const savedSession = useRef<ActiveExamSession | null>(null);
  const [stage, setStage] = useState<"intro" | "exam" | "exit_confirm">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => new Array(questions.length).fill(null)
  );
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState(timeMinutes * 60);
  const startedAtRef = useRef<string | null>(null);

  // On mount: check localStorage for a saved session for THIS exam
  useEffect(() => {
    const session = loadExamSession();
    if (session && session.examId === examId) {
      const remaining = getRemainingSeconds(session);
      if (remaining > 0) {
        savedSession.current = session;
        // Restore state directly into exam stage
        setAnswers(session.answers);
        setCurrentQ(session.currentQ);
        setRemainingSeconds(remaining);
        startedAtRef.current = session.startedAt;
        setStage("exam");
      } else {
        clearExamSession();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-close sidebar when exam starts ──────────────────────
  useEffect(() => {
    if (stage === "exam") {
      window.dispatchEvent(new CustomEvent("exam-started"));
      // Request fullscreen to hide browser chrome
      const el = document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {/* user may deny */});
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      }
    } else if (stage !== "exit_confirm") {
      window.dispatchEvent(new CustomEvent("exam-ended"));
      // Exit fullscreen when exam ends
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitFullscreenElement) {
        (document as any).webkitExitFullscreen();
      }
    }
  }, [stage]);

  // ── Block navigation / beforeunload during exam ──────────────
  useEffect(() => {
    if (stage !== "exam") return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "الاختبار جارٍ — هل تريد المغادرة؟ سيتم استئناف الاختبار عند عودتك.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [stage]);

  // ── Persist session every time answers/question/time changes ─
  useEffect(() => {
    if (stage !== "exam") return;
    if (!startedAtRef.current) return;

    const session: ActiveExamSession = {
      examId,
      startedAt: startedAtRef.current,
      totalSeconds: timeMinutes * 60,
      currentQ,
      answers,
    };
    saveExamSession(session);
  }, [stage, currentQ, answers, examId, timeMinutes]);

  // ── Countdown timer ──────────────────────────────────────────
  useEffect(() => {
    if (stage !== "exam") return;
    if (remainingSeconds <= 0) {
      clearExamSession();
      window.dispatchEvent(new CustomEvent("exam-ended"));
      // Exit fullscreen when time is up
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else if ((document as any).webkitFullscreenElement) (document as any).webkitExitFullscreen();
      onFinish(answers);
      return;
    }
    const interval = setInterval(() => {
      setRemainingSeconds((s) => s - 1);
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, stage]);

  const question = questions[currentQ];
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isDanger = remainingSeconds <= 120;
  const isLast = currentQ === questions.length - 1;

  function selectOption(optionIndex: number) {
    setAnswers((prev) => prev.map((a, i) => (i === currentQ ? optionIndex : a)));
    
    if (autoAdvance && !isLast) {
      setTimeout(() => {
        setCurrentQ((q) => q + 1);
      }, 400);
    }
  }

  function handleNext() {
    if (isLast) {
      clearExamSession();
      window.dispatchEvent(new CustomEvent("exam-ended"));
      // Exit fullscreen when exam finishes normally
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else if ((document as any).webkitFullscreenElement) (document as any).webkitExitFullscreen();
      onFinish(answers);
    } else {
      setCurrentQ((q) => q + 1);
    }
  }

  function handleStartExam() {
    // Record wall-clock start time
    startedAtRef.current = new Date().toISOString();
    // Save immediately so it exists even if first tick hasn't fired
    saveExamSession({
      examId,
      startedAt: startedAtRef.current,
      totalSeconds: timeMinutes * 60,
      currentQ: 0,
      answers: new Array(questions.length).fill(null),
    });
    setStage("exam");
    // Enter fullscreen to hide browser chrome
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen();
    }
  }

  function handleConfirmExit() {
    clearExamSession();
    window.dispatchEvent(new CustomEvent("exam-ended"));
    // Exit fullscreen when user chooses to exit
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if ((document as any).webkitFullscreenElement) (document as any).webkitExitFullscreen();
    onFinish(answers);
  }

  // ── INTRO SCREEN ─────────────────────────────────────────────
  if (stage === "intro") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/80 backdrop-blur-xl p-4 overflow-y-auto">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-card p-8 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner">
              {isTraining ? <IconInfoCircle size={40} /> : <IconAlertTriangle size={40} />}
            </div>
            <h2 className="text-3xl font-black text-text">{examTitle}</h2>
            <div className="mt-3 flex items-center gap-3 text-sm font-bold text-text-muted">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg"><IconClock size={16} /> {timeMinutes} دقيقة</span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg"><IconTarget size={16} /> {questions.length} أسئلة</span>
            </div>
          </div>

          <div className="mb-8 space-y-4">
            {!isTraining ? (
              <div className="rounded-2xl border border-border bg-bg p-5 space-y-4">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className="text-text-muted">المحاولة الحالية:</span>
                  <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary">{stats.attemptsCount + 1} من {stats.maxAttempts}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className="text-text-muted">أعلى درجة سابقة:</span>
                  <span className="px-3 py-1 rounded-lg bg-accent-teal/10 text-accent-teal">{stats.bestScore}%</span>
                </div>
                <p className="mt-4 rounded-xl bg-accent-teal/5 p-3 text-center text-[13px] font-bold text-accent-teal/80 leading-relaxed border border-accent-teal/20">
                  سيتم اعتماد الدرجة الأعلى دائماً من بين المحاولات لتحديد مستواك.
                </p>
                <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                  <IconAlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[13px] font-bold text-amber-600 leading-relaxed text-right">
                    أثناء الاختبار سيتم قفل الشاشة بالكامل. لا تحاول الخروج. في حال انقطاع الإنترنت يمكنك استئناف الاختبار لاحقاً ما دام الوقت لم ينته.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-bg p-6 text-center space-y-4">
                <p className={`text-[15px] font-bold leading-relaxed ${stats.bestScore < 100 ? "text-accent-red" : "text-accent-amber"}`}>
                  لقد استنفذت محاولاتك الرسمية ({stats.maxAttempts}) في هذا الاختبار.
                </p>
                {stats.bestScore < 100 && stats.attemptsCount < 10 ? (
                  <p className="rounded-xl bg-accent-red/10 border border-accent-red/20 p-4 text-[14px] font-bold text-accent-red leading-relaxed">
                    يجب عليك مراجعة الدروس الضعيفة لتفعيل محاولة جديدة. لا يمكنك دخول التدريب الآن!
                  </p>
                ) : (
                  <p className="rounded-xl bg-accent-amber/10 border border-accent-amber/20 p-4 text-[14px] font-bold text-accent-amber leading-relaxed">
                    هذه المحاولة هي بغرض التدريب والمراجعة فقط، ولن تؤثر على تقييمك النهائي.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Auto Advance Toggle */}
          <div className="mb-8 pt-4 border-t border-white/5 flex items-center justify-between">
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
              <div className="w-11 h-6 bg-white/10 border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleStartExam}
              disabled={(isTraining && stats.bestScore < 100 && stats.attemptsCount < 10) || questions.length === 0}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-[16px] font-black text-white shadow-lg shadow-primary/30 transition-all hover:-translate-y-1 hover:shadow-xl disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
            >
              {questions.length === 0
                ? "لا توجد أسئلة مضافة"
                : isTraining && stats.bestScore < 100 && stats.attemptsCount < 10
                ? "مغلق للمراجعة"
                : "بدء الاختبار الآن"}
            </button>
            {onExit && (
              <button
                onClick={onExit}
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-bg text-[15px] font-bold text-text-muted transition-colors hover:bg-white/5 hover:text-text"
              >
                تراجع والعودة للدرس
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── EXIT CONFIRM ─────────────────────────────────────────────
  if (stage === "exit_confirm") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/80 backdrop-blur-xl p-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-card p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
          <div className="mb-5 mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-red/10 text-accent-red border border-accent-red/20 shadow-inner">
            <IconAlertTriangle size={40} />
          </div>
          <h2 className="mb-4 text-2xl font-black">هل أنت متأكد من الإنهاء؟</h2>
          <p className="mb-8 text-[15px] font-bold text-text-muted leading-relaxed">
            {!isTraining 
              ? `سيتم إنهاء المحاولة الحالية (${stats.attemptsCount + 1}) وإرسال إجاباتك للتقييم فوراً.`
              : `سيتم إنهاء الجلسة التدريبية والعودة للدرس.`}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleConfirmExit}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-accent-red text-[16px] font-black text-white shadow-lg shadow-accent-red/30 transition-all hover:-translate-y-1"
            >
              نعم، قم بإنهاء الاختبار
            </button>
            <button
              onClick={() => setStage("exam")}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-bg text-[15px] font-bold text-text transition-colors hover:bg-white/5"
            >
              تراجع وإكمال الاختبار
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── NO QUESTION GUARD ─────────────────────────────────────────
  if (!question) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/80 backdrop-blur-xl p-4">
        <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl text-center font-bold text-text-muted">
          حدث خطأ: لا يمكن تحميل هذا السؤال.
          {onExit && (
            <button onClick={onExit} className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-white">العودة</button>
          )}
        </div>
      </div>
    );
  }

  // ── EXAM SCREEN ───────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-bg overflow-hidden animate-in fade-in duration-500">
      {/* Premium subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      
      {/* Top Glass Bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <IconTarget size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black text-text">{examTitle}</h1>
            <div className="text-sm font-bold text-text-muted mt-0.5">
              سؤال <span className="text-primary font-black">{currentQ + 1}</span> من {questions.length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-3 rounded-2xl px-5 py-2.5 border transition-all duration-300 shadow-inner ${
            isDanger ? "bg-accent-red/10 border-accent-red/30 text-accent-red animate-pulse" : "bg-bg border-border text-text"
          }`}>
            <IconClock size={22} className={isDanger ? "text-accent-red" : "text-primary"} />
            <span className="text-2xl font-black tabular-nums tracking-wider">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>

          <button
            onClick={() => setStage("exit_confirm")}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-bg text-text-muted transition-colors hover:bg-accent-red hover:text-white hover:border-accent-red group"
            title="إنهاء الاختبار"
          >
            <IconX size={24} className="transition-transform group-hover:rotate-90" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 py-8 sm:p-8">
        <div className="mx-auto max-w-4xl">
          {/* Progress Bar (sleek) */}
          <div className="mb-10 w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" 
              style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} 
            />
          </div>

          {/* Question Card */}
          <div key={currentQ} className="animate-in slide-in-from-right-8 fade-in duration-500">
            <div className="mb-10 text-[26px] sm:text-[32px] font-black text-text leading-tight sm:leading-snug drop-shadow-sm">
              {question.questionText}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.options.map((opt, i) => {
                const isSelected = answers[currentQ] === i;
                return (
                  <button
                    key={i}
                    onClick={() => selectOption(i)}
                    className={`group relative flex items-center gap-5 overflow-hidden rounded-3xl border-2 px-6 py-5 text-right transition-all duration-300 ease-out outline-none focus-visible:ring-4 focus-visible:ring-primary/30 ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-[0_8px_30px_rgba(var(--primary-rgb),0.15)] -translate-y-1"
                        : "border-white/5 bg-card hover:border-white/15 hover:bg-white/5 hover:-translate-y-1"
                    }`}
                  >
                    {/* Background glow when selected */}
                    {isSelected && <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />}
                    
                    <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[17px] font-black transition-all duration-300 ${
                      isSelected 
                        ? "bg-primary text-white shadow-lg shadow-primary/40 scale-110" 
                        : "bg-bg text-text-muted group-hover:bg-white/10 group-hover:text-text"
                    }`}>
                      {LETTERS[i]}
                    </div>
                    
                    <span className={`relative z-10 text-[18px] sm:text-[20px] font-bold leading-relaxed transition-colors ${
                      isSelected ? "text-primary" : "text-text group-hover:text-white"
                    }`}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <footer className="relative z-10 border-t border-white/5 bg-card/80 backdrop-blur-xl p-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <button
            onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
            disabled={currentQ === 0}
            className="flex h-14 items-center justify-center rounded-2xl border border-white/5 bg-bg px-8 text-[16px] font-bold text-text-muted transition-all hover:bg-white/5 hover:text-text disabled:opacity-30 disabled:pointer-events-none"
          >
            السؤال السابق
          </button>
          
          <button
            onClick={handleNext}
            className="flex h-14 items-center justify-center rounded-2xl bg-primary px-10 text-[17px] font-black text-white shadow-lg shadow-primary/30 transition-all hover:-translate-y-1 hover:shadow-xl hover:bg-primary-dark"
          >
            {isLast ? "تأكيد الإجابة وإرسال" : "التالي"}
          </button>
        </div>
      </footer>
    </div>
  );
}