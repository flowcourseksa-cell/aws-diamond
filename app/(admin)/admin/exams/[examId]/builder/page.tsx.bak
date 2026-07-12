"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowRight, IconPlus, IconTrash, IconCheck,
  IconGripVertical, IconAlertCircle, IconDeviceFloppy,
} from "@tabler/icons-react";

import { fetchExamBuilderData, saveQuestionWithOptions, deleteQuestion, type ExamWithDetails, type DbQuestion, type DbQuestionOption } from "@/lib/supabase/services/exams";
import { fetchHierarchyByCourse, type DbTrack } from "@/lib/supabase/services/hierarchy";

// Local types for the builder UI state
type OptionState = { id?: string; text: string; is_correct: boolean };
type QuestionState = {
  id?: string;
  exam_id: string;
  micro_skill_id: string;
  text: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  order_index: number;
  options: OptionState[];
  isExpanded: boolean;
};

const EMPTY_OPTION = (): OptionState => ({ text: "", is_correct: false });

export default function ExamBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [isMounted, setIsMounted] = useState(false);
  const [exam, setExam] = useState<ExamWithDetails | null>(null);
  const [hierarchy, setHierarchy] = useState<DbTrack[]>([]); // To get the micro-skills

  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!examId) return;

    fetchExamBuilderData(examId).then(data => {
      if (data) {
        setExam(data);
        
        // Map DB questions to our UI state
        const loadedQuestions: QuestionState[] = data.questions.map((q, i) => ({
          id: q.id,
          exam_id: q.exam_id,
          micro_skill_id: q.micro_skill_id,
          text: q.text,
          explanation: q.explanation || "",
          difficulty: q.difficulty,
          order_index: q.order_index,
          isExpanded: false, // Collapse by default
          options: q.options.map(o => ({
            id: o.id,
            text: o.text,
            is_correct: o.is_correct
          }))
        }));
        
        // If empty, add a default open question
        if (loadedQuestions.length === 0) {
          loadedQuestions.push(createNewQuestionState(data.id, 0));
        }

        setQuestions(loadedQuestions);

        // Fetch hierarchy using the track's course_id to get the micro-skills
        // BUT wait, we don't have course_id in exam. We only have track_id.
        // Let's fetch the hierarchy for all tracks... Wait, `fetchHierarchyByCourse` takes courseId.
        // I need a way to get courseId from track.
      } else {
        setIsLoading(false);
      }
    });
  }, [examId]);

  // Secondary effect to fetch hierarchy once we know the exam
  // We need to fetch the course details or just fetch the tracks directly.
  // Actually, we can just fetch the hierarchy if we know the courseId.
  // To avoid circular dependency or complex queries, let's fetch all courses, find the one that has this track, and fetch its hierarchy.
  useEffect(() => {
    if (!exam) return;
    const fetchMicroSkills = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      // Get the courseId for this track
      const { data: trackData } = await supabase.from("tracks").select("course_id").eq("id", exam.track_id).single();
      
      if (trackData?.course_id) {
        const h = await fetchHierarchyByCourse(trackData.course_id);
        setHierarchy(h);
      }
      setIsLoading(false);
    };
    fetchMicroSkills();
  }, [exam]);

  function createNewQuestionState(examId: string, index: number): QuestionState {
    return {
      exam_id: examId,
      micro_skill_id: "",
      text: "",
      explanation: "",
      difficulty: "medium",
      order_index: index,
      isExpanded: true,
      options: [EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION()],
    };
  }

  function handleAddQuestion() {
    setQuestions(prev => [
      ...prev.map(q => ({ ...q, isExpanded: false })), // collapse others
      createNewQuestionState(examId, prev.length)
    ]);
  }

  async function handleRemoveQuestion(index: number) {
    const q = questions[index];
    if (q.id) {
      // It exists in DB, delete it
      if (confirm("هل أنت متأكد من حذف هذا السؤال من قاعدة البيانات؟")) {
        await deleteQuestion(q.id);
      } else {
        return;
      }
    }
    setQuestions(prev => prev.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, updates: Partial<QuestionState>) {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, ...updates } : q));
  }

  function updateOption(qIndex: number, oIndex: number, text: string) {
    setQuestions(prev => prev.map((q, i) => 
      i === qIndex 
        ? { ...q, options: q.options.map((o, j) => j === oIndex ? { ...o, text } : o) } 
        : q
    ));
  }

  function setCorrectOption(qIndex: number, oIndex: number) {
    setQuestions(prev => prev.map((q, i) => 
      i === qIndex 
        ? { ...q, options: q.options.map((o, j) => ({ ...o, is_correct: j === oIndex })) } 
        : q
    ));
  }

  async function handleSaveAll() {
    setIsSaving(true);
    
    // Validation
    for (const [i, q] of questions.entries()) {
      if (!q.text.trim()) { alert(`السؤال رقم ${i + 1} لا يحتوي على نص.`); setIsSaving(false); return; }
      if (!q.micro_skill_id) { alert(`السؤال رقم ${i + 1} غير مربوط بأي مهارة.`); setIsSaving(false); return; }
      if (q.options.some(o => !o.text.trim())) { alert(`السؤال رقم ${i + 1} يحتوي على خيارات فارغة.`); setIsSaving(false); return; }
      if (!q.options.some(o => o.is_correct)) { alert(`السؤال رقم ${i + 1} ليس له إجابة صحيحة محددة.`); setIsSaving(false); return; }
    }

    try {
      for (const [i, q] of questions.entries()) {
        const qPayload: Partial<DbQuestion> = {
          id: q.id,
          exam_id: q.exam_id,
          micro_skill_id: q.micro_skill_id,
          text: q.text,
          explanation: q.explanation,
          difficulty: q.difficulty,
          order_index: i,
        };
        const oPayload: Partial<DbQuestionOption>[] = q.options.map(o => ({
          text: o.text,
          is_correct: o.is_correct
        }));

        await saveQuestionWithOptions(qPayload, oPayload);
      }
      alert("تم حفظ جميع الأسئلة بنجاح!");
      
      // Reload to get generated IDs
      window.location.reload();
      
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء الحفظ.");
    } finally {
      setIsSaving(false);
    }
  }

  // Helper to get all skills as a flat list with path for the dropdown
  const allSkills = hierarchy.flatMap(t => 
    (t.sections || []).flatMap(s => 
      (s.micro_skills || []).map(ms => ({
        id: ms.id,
        path: `${t.name} > ${s.name}`,
        name: ms.name
      }))
    )
  );

  if (!isMounted || isLoading) return <div className="p-8 text-center font-bold text-text-muted">جاري تحميل المصمم...</div>;
  if (!exam) return <div className="p-8 text-center text-red-500 font-bold">الاختبار غير موجود</div>;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-20" dir="rtl">
      
      {/* Header bar */}
      <div className="flex items-center justify-between bg-card border border-border rounded-2xl p-4 shadow-sm sticky top-4 z-10">
        <div className="flex items-center gap-4">
          <Link href="/admin/exams" className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg hover:bg-border transition-colors">
            <IconArrowRight size={20} className="text-text-muted" />
          </Link>
          <div>
            <h1 className="text-[16px] font-black text-text">مصمم الأسئلة: {exam.title}</h1>
            <p className="text-[12px] text-text-muted">
              اربط كل سؤال بمهارة دقيقة ليتمكن النظام من تحليل ضعف الطالب.
            </p>
          </div>
        </div>
        <button 
          onClick={handleSaveAll} 
          disabled={isSaving || questions.length === 0}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {isSaving ? "جاري الحفظ..." : <><IconDeviceFloppy size={18} /> حفظ جميع التغييرات</>}
        </button>
      </div>

      {/* Questions List */}
      <div className="flex flex-col gap-4">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className={`rounded-2xl border transition-all ${q.isExpanded ? "border-primary shadow-lg shadow-primary/5 bg-card" : "border-border bg-card/50 hover:border-primary/40"} overflow-hidden`}>
            
            {/* Question Header (Collapsible) */}
            <div 
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => updateQuestion(qIndex, { isExpanded: !q.isExpanded })}
            >
              <div className="flex items-center gap-3">
                <IconGripVertical size={16} className="text-border" />
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                  {qIndex + 1}
                </div>
                <div className="font-bold text-sm text-text line-clamp-1 max-w-md">
                  {q.text || <span className="text-text-muted italic">سؤال جديد فارغ...</span>}
                </div>
                {!q.micro_skill_id && (
                  <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                    <IconAlertCircle size={10} /> مهارة مفقودة
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleRemoveQuestion(qIndex); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <IconTrash size={16} />
                </button>
              </div>
            </div>

            {/* Expanded Body */}
            {q.isExpanded && (
              <div className="p-5 pt-0 border-t border-border mt-1">
                
                <div className="flex flex-col gap-4 mt-4">
                  {/* Skill & Difficulty */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="text-xs font-black text-text-muted mb-1.5 block">المهارة المرتبطة (Micro-Skill) <span className="text-red-500">*</span></label>
                      <select 
                        value={q.micro_skill_id} 
                        onChange={(e) => updateQuestion(qIndex, { micro_skill_id: e.target.value })}
                        className="w-full rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary text-primary"
                      >
                        <option value="">-- اختر المهارة التي يختبرها هذا السؤال --</option>
                        {allSkills.map(s => (
                          <option key={s.id} value={s.id}>
                            [{s.path}] — {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-black text-text-muted mb-1.5 block">الصعوبة</label>
                      <select 
                        value={q.difficulty} 
                        onChange={(e) => updateQuestion(qIndex, { difficulty: e.target.value as any })}
                        className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary"
                      >
                        <option value="easy">سهل</option>
                        <option value="medium">متوسط</option>
                        <option value="hard">صعب</option>
                      </select>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div>
                    <label className="text-xs font-black text-text-muted mb-1.5 block">نص السؤال <span className="text-red-500">*</span></label>
                    <textarea 
                      value={q.text} 
                      onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                      placeholder="اكتب نص السؤال هنا..."
                      className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm font-bold outline-none focus:border-primary min-h-[80px] resize-y"
                    />
                  </div>

                  {/* Options */}
                  <div>
                    <label className="text-xs font-black text-text-muted mb-1.5 block">الخيارات (حدد الإجابة الصحيحة) <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className={`flex items-center gap-3 rounded-xl border p-2 ${opt.is_correct ? "border-emerald-500 bg-emerald-50" : "border-border bg-bg"}`}>
                          <button 
                            onClick={() => setCorrectOption(qIndex, oIndex)}
                            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${opt.is_correct ? "border-emerald-500 bg-emerald-500 text-white" : "border-border text-transparent hover:border-emerald-300"}`}
                          >
                            <IconCheck size={14} />
                          </button>
                          <input 
                            value={opt.text} 
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            placeholder={`الخيار ${["أ","ب","ج","د"][oIndex]}`}
                            className="flex-1 bg-transparent text-sm font-semibold outline-none min-w-0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div>
                    <label className="text-xs font-black text-text-muted mb-1.5 block">شرح الإجابة (يظهر للطالب بعد الحل)</label>
                    <input 
                      value={q.explanation} 
                      onChange={(e) => updateQuestion(qIndex, { explanation: e.target.value })}
                      placeholder="اشرح لماذا هذه الإجابة هي الصحيحة..."
                      className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary"
                    />
                  </div>

                </div>
              </div>
            )}
          </div>
        ))}

        <button 
          onClick={handleAddQuestion}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 py-6 text-sm font-bold text-primary hover:bg-primary/10 transition-colors mt-2"
        >
          <IconPlus size={18} /> إضافة سؤال جديد
        </button>

      </div>
    </div>
  );
}
