"use client";

import { useMemo, useState } from "react";
import { usePlatformStore } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { ExamList } from "./exam-list";
import { ExamRunner } from "./exam-runner";
import { TrackExamResult } from "../tracks/track-exam-result";
import { IconClipboardText, IconAlertTriangle } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

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
  const hasSub = true;
  const { exams: storeExams, tracks: storeTracks, enrolledCourseId, courses } = usePlatformStore();
  const router = useRouter();

  const activeTracks = storeTracks.filter(t => 
    enrolledCourseId ? courses.find(c => c.id === enrolledCourseId)?.trackIds.includes(t.id) : false
  );
  
  const activeExams = storeExams.filter(e => 
    enrolledCourseId ? courses.find(c => c.id === enrolledCourseId)?.trackIds.includes(e.trackId) : false
  );

  const filtered = useMemo(() =>
    activeExams.filter(e => filter === "all" || e.trackId === filter),
    [filter, activeExams]
  );

  const FILTERS = [
    { value: "all", label: "الكل" },
    ...activeTracks.map(t => ({ value: t.id, label: t.name }))
  ];

  // اختبار نشط
  const activeExam = state.view !== "list"
    ? storeExams.find(e => e.id === state.examId)
    : null;

  function handleStart(id: string) {
    const exam = storeExams.find(e => e.id === id);
    if (!exam) return;
    if (exam.accessType === "paid" && !hasSub) {
      showToast("هذا الاختبار مدفوع — يرجى الاشتراك للوصول إليه", "warning");
      return;
    }
    setState({ view: "exam", examId: id });
  }

  function handleFinish(answers: (number | null)[]) {
    if (!activeExam) return;
    const correct = activeExam.questions.filter((q, i) => answers[i] === q.correctIndex).length;
    const percent = Math.round((correct / activeExam.questions.length) * 100);
    setScores(prev => ({ ...prev, [activeExam.id]: Math.max(prev[activeExam.id] ?? 0, percent) }));
    setState({ view: "result", examId: activeExam.id, answers });

    // Send WhatsApp notification
    const studentName = "أحمد"; // In a real app this comes from user profile
    const phoneNumber = "966500000000"; // Parent's phone number
    const message = `تم الانتهاء من اختبار ${activeExam.name} بنسبة ${percent}%. التفاصيل والمراجعة متاحة في حساب الطالب.`;
    
    // We would make an API call here to send the WhatsApp message
    // fetch('/api/whatsapp/send', { method: 'POST', body: JSON.stringify({ phone: phoneNumber, message }) });
    showToast(`تم إرسال نتيجة الاختبار (${percent}%) عبر الواتساب لولي الأمر بنجاح!`, "success");
  }

  const currentCourse = courses.find(c => c.id === enrolledCourseId);

  if (!enrolledCourseId || !currentCourse) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center bg-card rounded-2xl border border-border mt-10 shadow-lg" dir="rtl">
        <IconAlertTriangle size={64} className="text-amber-500 mb-4" />
        <h2 className="text-2xl font-black mb-3">أنت غير مشترك في أي دورة حالياً</h2>
        <p className="text-text-muted font-medium mb-6">يرجى الاشتراك في دورة للوصول إلى الاختبارات.</p>
        <button onClick={() => router.push("/#courses")} className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-colors">
          تصفح الدورات المتاحة
        </button>
      </div>
    );
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
