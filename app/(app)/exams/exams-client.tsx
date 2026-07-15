"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePlatformStore } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { ExamList } from "./exam-list";
import { ExamRunner } from "./exam-runner";
import { TrackExamResult } from "../tracks/track-exam-result";
import { IconClipboardText } from "@tabler/icons-react";
import { useAuth } from "@/hooks/use-auth";
import { submitSecureExamAttempt } from "@/app/actions/exams";
import { fetchAllExamsStatsMap, fetchUserProgress } from "@/lib/supabase/services/progress";
import { useSearchParams } from "next/navigation";
import { useSyncStore } from "@/lib/sync-store";

type FilterValue = "all" | string;

type ViewState =
  | { view: "list" }
  | { view: "exam"; examId: string; stats: { bestScore: number; attemptsCount: number; maxAttempts: number } }
  | { 
      view: "result"; 
      examId: string; 
      answers: (number | null)[]; 
      attemptsCount: number; 
      maxAttempts: number;
      isTraining: boolean;
      evaluatedResult?: { scorePct: number; evaluatedAnswers: any[]; isPendingSync: boolean };
    };

type ExamStatsMap = Record<string, { bestScore: number; attemptsCount: number; maxAttempts: number }>;

export function ExamsClient() {
  const searchParams = useSearchParams();
  const pulseExamId = searchParams.get("pulse");

  const [filter, setFilter]   = useState<FilterValue>("all");
  const [state, setState]     = useState<ViewState>({ view: "list" });
  const [stats, setStats]     = useState<ExamStatsMap>({});
  const { showToast }         = useToast();
  const { user }              = useAuth();
  // BUG-3: wire hasSub to real enrollment (not hardcoded true)
  const { exams: storeExams, tracks: storeTracks, lessons: storeLessons, enrolledCourses, isDataLoading, applyUserProgress } = usePlatformStore();
  const { pendingExams } = useSyncStore();
  const hasSub = enrolledCourses.length > 0;

  const lastStatsFetchRef = useRef<number>(0);

  useEffect(() => {
    if (!user) return;
    const loadStats = () => {
      const now = Date.now();
      // Throttle: only re-fetch from server if 5 minutes have passed
      if (now - lastStatsFetchRef.current < 5 * 60 * 1000) return;
      lastStatsFetchRef.current = now;
      fetchAllExamsStatsMap(user.id).then(setStats).catch(console.error);
    };
    loadStats();
    window.addEventListener("focus", loadStats);
    window.addEventListener("exams-synced", loadStats);
    return () => {
      window.removeEventListener("focus", loadStats);
      window.removeEventListener("exams-synced", loadStats);
    };
  }, [user]);

  const activeTracks = storeTracks;
  const allExams = storeExams;

  const filtered = useMemo(() =>
    allExams.filter(e => filter === "all" || e.trackId === filter),
    [filter, allExams]
  );

  const FILTERS = [
    { value: "all", label: "الكل" },
    ...activeTracks.map(t => ({ value: t.id, label: t.name }))
  ];

  function getTrueExamStats(examId: string) {
    const s = stats[examId] || { bestScore: 0, attemptsCount: 0, maxAttempts: 5 };
    const pendingCount = pendingExams.filter(p => p.examId === examId).length;
    return {
      ...s,
      attemptsCount: s.attemptsCount + pendingCount
    };
  }

  const activeExam = state.view !== "list"
    ? allExams.find(e => e.id === state.examId)
    : null;

  // ── Helper: compute weak skills for a given exam inline ──────
  function computeWeakSkills(examId: string) {
    const exam = allExams.find(e => e.id === examId);
    if (!exam) return [];
    const weakSkillsMap = new Map<string, { id: string; name: string; lessonId: string | null }>();
    exam.questions.forEach(q => {
      if (!q.skillId) return;
      let mastery = 0;
      let sectionId = "";
      storeTracks.forEach(t => t.sections.forEach(sec => sec.skills.forEach(sk => {
        if (sk.id === q.skillId) { mastery = sk.masteryScore ?? 0; sectionId = sec.id; }
      })));
      if (mastery < 100) {
        const lesson = storeLessons.find(l => l.sectionId === sectionId);
        weakSkillsMap.set(q.skillId, {
          id: q.skillId,
          name: q.skillName || "مهارة",
          lessonId: lesson ? lesson.id : null
        });
      }
    });
    return Array.from(weakSkillsMap.values());
  }

  // ── examsForList — computed BEFORE any early return ──────────
  const examsForList = useMemo(() => filtered.map(e => {
    let prerequisiteLessons: typeof storeLessons = [];
    if (e.sectionId) {
      prerequisiteLessons = storeLessons.filter(l => l.sectionId === e.sectionId);
    } else {
      prerequisiteLessons = storeLessons.filter(l => l.trackId === e.trackId);
    }
    const uncompleted = prerequisiteLessons.filter(l => l.status !== "completed");

    const examStats = getTrueExamStats(e.id);
    const isExhausted = examStats.attemptsCount >= examStats.maxAttempts;

    let weakSkills: any[] = [];
    if (isExhausted && examStats.bestScore < 100) {
      const weakSkillsMap = new Map<string, any>();
      e.questions.forEach(q => {
        let mastery = 0;
        let sectionId = "";
        let foundLessonId: string | null = null;
        storeTracks.forEach(t => t.sections.forEach(sec => sec.skills.forEach(sk => {
          if (sk.id === q.skillId) { mastery = sk.masteryScore ?? 0; foundLessonId = sk.lessonId ?? null; }
        })));
        if (mastery < 100) {
          weakSkillsMap.set(q.skillId, {
            id: q.skillId,
            name: q.skillName || "مهارة",
            lessonId: foundLessonId
          });
        }
      });
      weakSkills = Array.from(weakSkillsMap.values());
    }

    return {
      id:             e.id,
      trackId:        e.trackId,
      sectionId:      e.sectionId,
      name:           e.name,
      timeMinutes:    e.timeMinutes,
      accessType:     e.accessType,
      questionsCount: e.questions.length,
      bestScore:      examStats.bestScore,
      attemptsCount:  examStats.attemptsCount,
      maxAttempts:    examStats.maxAttempts,
      isLocked:       uncompleted.length > 0,
      isExhausted,
      weakSkills
    };
  }), [filtered, stats, pendingExams, storeLessons, storeTracks]);

  // ── handleStart ──────────────────────────────────────────────
  function handleStart(id: string) {
    const exam = allExams.find(e => e.id === id);
    if (!exam) return;

    let prerequisiteLessons: typeof storeLessons = [];
    if (exam.sectionId) {
      prerequisiteLessons = storeLessons.filter(l => l.sectionId === exam.sectionId);
    } else {
      prerequisiteLessons = storeLessons.filter(l => l.trackId === exam.trackId);
    }
    const uncompleted = prerequisiteLessons.filter(l => l.status !== "completed");
    if (uncompleted.length > 0) {
      showToast(`يجب عليك إنهاء جميع دروس هذا ${exam.sectionId ? 'القسم' : 'المسار'} أولاً. متبقي ${uncompleted.length} درس/دروس.`, "error");
      return;
    }

    const examStats = getTrueExamStats(exam.id);
    const isExhausted = examStats.attemptsCount >= examStats.maxAttempts;

    const examDetails = examsForList.find(e => e.id === id);
    const hasWeakSkills = examDetails && examDetails.weakSkills && examDetails.weakSkills.length > 0;

    if (isExhausted && examStats.attemptsCount < 10 && examStats.bestScore < 100 && hasWeakSkills) {
      showToast("لقد استنفذت محاولاتك! يجب عليك رفع إتقان مهاراتك بمراجعة الدروس من نتيجة الاختبار للحصول على محاولة إضافية.", "error");
      return;
    }

    setState({ view: "exam", examId: id, stats: examStats });
  }

  const { addPendingExam } = useSyncStore();

  // ── handleFinish ─────────────────────────────────────────────
  async function handleFinish(answers: (number | null)[]) {
    if (!activeExam) return;
    const examId = activeExam.id;
    const examQuestions = activeExam.questions;

    const currentStats = getTrueExamStats(examId);
    const nextAttemptCount = currentStats.attemptsCount + 1;

    // Show loading state while syncing (simulated by not updating state yet or showing a spinner)
    // For simplicity, we directly transition.

    let finalAttemptsCount = nextAttemptCount;
    let evaluatedResult = undefined;
    let isTraining = finalAttemptsCount > currentStats.maxAttempts || currentStats.bestScore >= 100;

    if (user) {
      const rawAnswers = examQuestions.map((q, i) => {
        const selIdx = answers[i];
        return {
          question_id: q.id,
          selected_option_id: selIdx !== null && q.optionIds ? q.optionIds[selIdx] ?? null : null,
          micro_skill_id: q.skillId,
        };
      });

      if (navigator.onLine) {
        const response = await submitSecureExamAttempt(user.id, examId, rawAnswers);
        if (!response || !response.success) {
          showToast("حدث خطأ أثناء حفظ النتيجة. يرجى المحاولة لاحقاً.", "error");
        } else {
          finalAttemptsCount = response.attemptsCount ?? nextAttemptCount;
          evaluatedResult = {
            scorePct: response.scorePct ?? 0,
            evaluatedAnswers: response.evaluatedAnswers ?? [],
            isPendingSync: false,
          };
          
          // DO NOT AWAIT THIS - run in background to transition UI instantly
          (async () => {
            try {
              const { skills: updatedSkills, lessons: updatedLessons } = await fetchUserProgress(user.id);
              applyUserProgress(updatedSkills, updatedLessons);
            } catch (e) {
              console.error("Failed to re-sync user progress after exam:", e);
            }
          })();

          setStats(prev => ({
            ...prev,
            [examId]: {
              bestScore: !response.isTraining ? Math.max(prev[examId]?.bestScore ?? 0, response.scorePct ?? 0) : (prev[examId]?.bestScore ?? 0),
              attemptsCount: finalAttemptsCount,
              maxAttempts: currentStats.maxAttempts
            }
          }));
          isTraining = response.isTraining ?? isTraining;
          showToast(!isTraining ? `تم حفظ نتيجتك (ضمن المحاولات الرسمية) وتحديث مستوى إتقانك!` : `هذه محاولة تدريبية إضافية ولن تغير نتيجتك المعتمدة!`, "success");
        }
      } else {
        // Offline: Queue it!
        addPendingExam({
          userId: user.id,
          examId,
          rawAnswers
        });
        evaluatedResult = { scorePct: 0, evaluatedAnswers: [], isPendingSync: true };
        showToast("أنت غير متصل بالإنترنت. تم حفظ إجاباتك محلياً وستُزامن عند عودة الاتصال.", "warning");
      }
    }

    setState({ 
      view: "result", 
      examId, 
      answers, 
      attemptsCount: finalAttemptsCount, 
      maxAttempts: currentStats.maxAttempts,
      isTraining,
      evaluatedResult 
    });
  }

  // ── Views ─────────────────────────────────────────────────────
  if (state.view === "exam" && activeExam) {
    return (
      <ExamRunner
        examId={activeExam.id}
        examTitle={activeExam.name}
        questions={activeExam.questions}
        timeMinutes={activeExam.timeMinutes}
        stats={state.stats}
        onFinish={handleFinish}
        onExit={() => setState({ view: "list" })}
      />
    );
  }

  if (state.view === "result" && activeExam) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <TrackExamResult
          exam={activeExam}
          answers={state.answers}
          attemptsCount={state.attemptsCount}
          maxAttempts={state.maxAttempts}
          isTraining={state.isTraining}
          evaluatedResult={state.evaluatedResult}
          onRetry={() => {
            const examStats = getTrueExamStats(activeExam.id);
            const isExhausted = examStats.attemptsCount >= examStats.maxAttempts;
            const examDetails = examsForList.find(e => e.id === activeExam.id);
            const hasWeakSkills = examDetails?.weakSkills && examDetails.weakSkills.length > 0;
            if (isExhausted && examStats.bestScore < 100 && hasWeakSkills) {
              showToast("لقد استنفذت محاولاتك! يجب عليك رفع إتقان مهاراتك بمراجعة الدروس من نتيجة الاختبار للحصول على محاولة إضافية.", "error");
              return;
            }
            setState({ view: "exam", examId: activeExam.id, stats: examStats });
          }}
          onBack={() => setState({ view: "list" })}
        />
      </div>
    );
  }

  if (isDataLoading && allExams.length === 0) {
    return <div className="p-8 text-center text-text-muted font-bold">جاري التحميل...</div>;
  }

  // ── List View ─────────────────────────────────────────────────
  return (
    <>
      {/* Header */}
      <section className="fade-up rounded-2xl bg-sidebar px-7 py-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <IconClipboardText size={26} />
          <h2 className="text-xl font-black">الاختبارات</h2>
        </div>
        <p className="text-white/55 text-sm">
          اختبارات مرتبطة بكل مسار وقسم — حل واكتشف نقاط قوتك وضعفك بشكل فوري
        </p>
      </section>

      {/* Filters */}
      <section className="fade-up flex flex-wrap gap-2.5">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`whitespace-nowrap rounded-[10px] border px-4.5 py-2.25 text-[13px] font-bold transition-colors duration-200 ${
              filter === f.value
                ? "border-primary bg-primary text-white"
                : "border-border bg-card text-text-muted hover:border-primary hover:text-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </section>

      {/* Grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ExamList
          exams={examsForList}
          hasActiveSubscription={hasSub}
          onStart={handleStart}
          pulseExamId={pulseExamId}
        />
      </section>
    </>
  );
}
