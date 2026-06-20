"use client";

import { useMemo, useState } from "react";
import { usePlatformStore } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { ExamList } from "./exam-list";
import { ExamRunner } from "./exam-runner";
import { TrackExamResult } from "../tracks/track-exam-result";
import { IconClipboardText } from "@tabler/icons-react";
import { useAuth } from "@/hooks/use-auth";
import { submitExamAttempt } from "@/lib/supabase/services/progress";

type FilterValue = "all" | string; // trackId or "all"

type ViewState =
  | { view: "list" }
  | { view: "exam"; examId: string }
  | { view: "result"; examId: string; answers: (number | null)[] };

// نحتفظ بأعلى نتيجة لكل اختبار (client-side فقط)
type ScoreMap = Record<string, number>;

export function ExamsClient() {
  const [filter, setFilter]   = useState<FilterValue>("all");
  const [state, setState]     = useState<ViewState>({ view: "list" });
  const [scores, setScores]   = useState<ScoreMap>({});
  const { showToast }         = useToast();
  const { user }              = useAuth();
  const hasSub = true;
  const { exams: storeExams, tracks: storeTracks } = usePlatformStore();

  // Use ALL tracks directly (free platform - no enrollment needed)
  const activeTracks = storeTracks;
  
  // Directly use store exams
  const allExams = storeExams;

  const filtered = useMemo(() =>
    allExams.filter(e => filter === "all" || e.trackId === filter),
    [filter, allExams]
  );

  const FILTERS = [
    { value: "all", label: "الكل" },
    ...activeTracks.map(t => ({ value: t.id, label: t.name }))
  ];

  // اختبار نشط
  const activeExam = state.view !== "list"
    ? allExams.find(e => e.id === state.examId)
    : null;

  function handleStart(id: string) {
    const exam = allExams.find(e => e.id === id);
    if (!exam) return;
    setState({ view: "exam", examId: id });
  }

  async function handleFinish(answers: (number | null)[]) {
    if (!activeExam) return;
    const correct = activeExam.questions.filter((q, i) => answers[i] === q.correctIndex).length;
    const percent = Math.round((correct / activeExam.questions.length) * 100);
    setScores(prev => ({ ...prev, [activeExam.id]: Math.max(prev[activeExam.id] ?? 0, percent) }));
    setState({ view: "result", examId: activeExam.id, answers });

    showToast(`تم حفظ نتيجة الاختبار (${percent}%) وتحديث مستوى إتقانك!`, "success");

    if (user) {
      const mappedAnswers = activeExam.questions.map((q, i) => ({
        question_id: q.id,
        selected_option_id: null, // Note: We don't have option IDs in local state, only index. For analytics, we skip it or mock it.
        is_correct: answers[i] === q.correctIndex,
        micro_skill_id: q.skillId
      }));
      await submitExamAttempt(user.id, activeExam.id, mappedAnswers);
    }
  }

  // ── Views ───────────────────────────────────────────────────
  if (state.view === "exam" && activeExam) {
    return (
      <ExamRunner
        examTitle={activeExam.name}
        questions={activeExam.questions}
        timeMinutes={activeExam.timeMinutes}
        onFinish={handleFinish}
      />
    );
  }

  if (state.view === "result" && activeExam) {
    return (
      <TrackExamResult
        exam={activeExam}
        answers={state.answers}
        onRetry={() => setState({ view: "exam", examId: activeExam.id })}
        onBack={() => setState({ view: "list" })}
      />
    );
  }

  // ── List View ───────────────────────────────────────────────
  const examsForList = filtered.map(e => ({
    id:             e.id,
    trackId:        e.trackId,
    sectionId:      e.sectionId,
    name:           e.name,
    timeMinutes:    e.timeMinutes,
    accessType:     e.accessType,
    questionsCount: e.questions.length,
    bestScore:      scores[e.id],
  }));

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
        />
      </section>
    </>
  );
}
