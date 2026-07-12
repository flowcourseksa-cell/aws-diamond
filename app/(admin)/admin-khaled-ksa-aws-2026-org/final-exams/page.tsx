// @ts-nocheck
"use client";

import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  fetchAllFinalExams,
  upsertFinalExam,
  saveFinalExamQuestion,
  deleteFinalExamQuestion,
  deleteFinalExam,
  bulkSaveFinalExamQuestions,
  fetchFinalExamByCourse,
  fetchCourseExamsWithQuestions,
  type FinalExam,
  type FinalExamQuestion,
  type CourseTrackExam,
} from "@/lib/supabase/services/final-exam";
import { fetchCourses } from "@/lib/supabase/services/courses";
import { type Course } from "@/lib/store";
import {
  IconPlus, IconTrash, IconCheck, IconSettings, IconEye,
  IconChevronDown, IconChevronUp, IconUpload, IconDownload,
  IconClock, IconTarget, IconRefresh, IconX,
  IconFileSpreadsheet, IconAlertTriangle, IconToggleLeft,
  IconToggleRight, IconBulb, IconArrowsTransferDown,
} from "@tabler/icons-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = {
  id?: string;
  course_id: string;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_score: number;
  max_attempts: number;
  is_published: boolean;
  unlock_lessons_pct: number;
  unlock_skills_pct: number;
  unlock_require_exams: boolean;
};

type ExamWithMeta = FinalExam & { course_title: string };

const EMPTY_FORM: FormData = {
  course_id: "",
  title: "الاختبار النهائي",
  description: "",
  time_limit_minutes: 60,
  passing_score: 70,
  max_attempts: 3,
  is_published: false,
  unlock_lessons_pct: 80,
  unlock_skills_pct: 0,
  unlock_require_exams: false,
};

const DIFFICULTY_MAP = {
  easy:   { label: "سهل",    color: "text-emerald-600 bg-emerald-500/10 border-emerald-200" },
  medium: { label: "متوسط", color: "text-amber-600 bg-amber-500/10 border-amber-200" },
  hard:   { label: "صعب",    color: "text-rose-600 bg-rose-500/10 border-rose-200" },
};

// ─── Excel helpers ─────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type ParsedQuestion = {
  text: string;
  difficulty: string;
  options: { text: string; is_correct: boolean }[];
};

function parseExcelFile(file: File): Promise<ParsedQuestion[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        const questions: ParsedQuestion[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const text          = String(row[0] || "").trim();
          const correctAnswer = String(row[1] || "").trim();
          const opt2          = String(row[2] || "").trim();
          const opt3          = String(row[3] || "").trim();
          const opt4          = String(row[4] || "").trim();
          const rawDiff       = String(row[5] || "medium").trim().toLowerCase();
          const difficulty    = ["easy", "medium", "hard"].includes(rawDiff) ? rawDiff : "medium";
          if (!text || !correctAnswer) continue;
          const rawOptions = [
            { text: correctAnswer, is_correct: true },
            ...(opt2 ? [{ text: opt2, is_correct: false }] : []),
            ...(opt3 ? [{ text: opt3, is_correct: false }] : []),
            ...(opt4 ? [{ text: opt4, is_correct: false }] : []),
          ];
          questions.push({ text, difficulty, options: shuffleArray(rawOptions) });
        }
        resolve(questions);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error("فشل قراءة الملف"));
    reader.readAsArrayBuffer(file);
  });
}

function downloadTemplate() {
  const ws_data = [
    ["السؤال", "الإجابة الصحيحة", "الخيار 2", "الخيار 3", "الخيار 4", "الصعوبة (easy/medium/hard)"],
    ["ما هو الغاز المسؤول عن عملية التنفس في الإنسان؟", "الأكسجين", "ثاني أكسيد الكربون", "النيتروجين", "الهيدروجين", "easy"],
    ["ما هي عاصمة المملكة العربية السعودية؟", "الرياض", "جدة", "مكة المكرمة", "الدمام", "easy"],
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  ws["!cols"] = [{ wch: 50 }, { wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, ws, "الأسئلة");
  XLSX.writeFile(wb, "قالب_أسئلة_الاختبار.xlsx");
}

// ─── Settings Form ─────────────────────────────────────────────────────────────

function SettingsForm({ form, setForm, courses, exams, showCourse }: {
  form: FormData;
  setForm: (fn: (f: FormData) => FormData) => void;
  courses: Course[];
  exams: ExamWithMeta[];
  showCourse: boolean;
}) {
  // Courses that already have a final exam (can't create another)
  const occupiedCourseIds = new Set(exams.map(e => e.course_id));
  const availableCourses = courses.filter(c => !occupiedCourseIds.has(c.id));

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      {showCourse && (
        <div>
          <label className="text-xs font-black text-text-muted mb-1.5 block">الدورة *</label>
          {availableCourses.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-200 rounded-xl text-xs font-bold text-amber-700">
              ⚠️ جميع الدورات لديها اختبار نهائي بالفعل
            </div>
          ) : (
            <select
              value={form.course_id}
              onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}
              className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary transition-colors"
            >
              <option value="">-- اختر الدورة --</option>
              {availableCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          )}
          {courses.length > availableCourses.length && availableCourses.length > 0 && (
            <p className="text-xs text-text-muted mt-1.5 font-semibold">
              {courses.length - availableCourses.length} دورة لديها اختبار نهائي مسبقاً (غير معروضة)
            </p>
          )}
        </div>
      )}
      <div>
        <label className="text-xs font-black text-text-muted mb-1.5 block">عنوان الاختبار</label>
        <input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary transition-colors"
        />
      </div>
      <div>
        <label className="text-xs font-black text-text-muted mb-1.5 block">الوصف (اختياري)</label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={2}
          className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      <div className="border-t border-border pt-3">
        <p className="text-xs font-black text-text-muted mb-2">⚙️ إعدادات الاختبار</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "المدة (د)", key: "time_limit_minutes", min: 5, max: 240 },
            { label: "النجاح %", key: "passing_score", min: 1, max: 100 },
            { label: "المحاولات", key: "max_attempts", min: 1, max: 10 },
          ].map(({ label, key, min, max }) => (
            <div key={key}>
              <label className="text-xs font-bold text-text-muted mb-1 block">{label}</label>
              <input
                type="number" min={min} max={max}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                className="w-full rounded-xl border border-border bg-bg px-2 py-2 text-sm font-black outline-none focus:border-primary transition-colors text-center"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-3">
        <p className="text-xs font-black text-text-muted mb-2">🔒 شروط فتح الاختبار</p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-xs font-bold text-text-muted mb-1 block">إكمال الدروس %</label>
            <input
              type="number" min={0} max={100}
              value={form.unlock_lessons_pct}
              onChange={e => setForm(f => ({ ...f, unlock_lessons_pct: Number(e.target.value) }))}
              className="w-full rounded-xl border border-border bg-bg px-2 py-2 text-sm font-black outline-none focus:border-primary transition-colors text-center"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-text-muted mb-1 block">إتقان المهارات %</label>
            <input
              type="number" min={0} max={100}
              value={form.unlock_skills_pct}
              onChange={e => setForm(f => ({ ...f, unlock_skills_pct: Number(e.target.value) }))}
              className="w-full rounded-xl border border-border bg-bg px-2 py-2 text-sm font-black outline-none focus:border-primary transition-colors text-center"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, unlock_require_exams: !f.unlock_require_exams }))}
          className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors w-full text-right ${form.unlock_require_exams ? "border-amber-300 bg-amber-500/5" : "border-border bg-bg"}`}
        >
          <div className={`w-9 h-5 rounded-full border-2 relative transition-all shrink-0 ${form.unlock_require_exams ? "bg-amber-500 border-amber-500" : "bg-bg border-border"}`}>
            <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all ${form.unlock_require_exams ? "right-0.5" : "left-0.5"}`} />
          </div>
          <span className="text-xs font-bold text-text">إلزام باجتياز اختبارات المسارات أولاً</span>
        </button>
      </div>

      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, is_published: !f.is_published }))}
          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors w-full text-right ${form.is_published ? "border-emerald-300 bg-emerald-500/5" : "border-border bg-bg"}`}
        >
          <div className={`w-11 h-6 rounded-full border-2 relative transition-all shrink-0 ${form.is_published ? "bg-emerald-500 border-emerald-500" : "bg-bg border-border"}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.is_published ? "right-0.5" : "left-0.5"}`} />
          </div>
          <div>
            <div className="font-black text-text text-sm">{form.is_published ? "✓ منشور للطلاب" : "غير منشور"}</div>
            <div className="text-xs text-text-muted">{form.is_published ? "يمكن للطلاب رؤية هذا الاختبار" : "لن يظهر الاختبار للطلاب"}</div>
          </div>
        </button>
      </div>
    </div>
  );
}

const SIMULATOR_NAMES = ["محاكي الأوس الماسية", "STEP Simulator", "اختبار الستيب", "محاكي"];
function isSimulatorCourse(title: string) {
  return SIMULATOR_NAMES.some(name => title?.includes(name));
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminFinalExamsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<ExamWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedExam, setSelectedExam] = useState<ExamWithMeta | null>(null);
  const [examQuestions, setExamQuestions] = useState<FinalExamQuestion[]>([]);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  // panels
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddQ, setShowAddQ] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showPullExams, setShowPullExams] = useState(false);

  // Pull-from-exams state
  const [courseExams, setCourseExams] = useState<CourseTrackExam[]>([]);
  const [courseExamsLoading, setCourseExamsLoading] = useState(false);
  const [pullSelections, setPullSelections] = useState<Record<string, number>>({}); // examId -> count
  const [pullLoading, setPullLoading] = useState(false);
  const [pullResult, setPullResult] = useState<{ success: number; failed: number } | null>(null);

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [qForm, setQForm] = useState({
    text: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    options: [
      { text: "", is_correct: true },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
    ],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ParsedQuestion[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  useEffect(() => {
    (async () => {
      const [c, e] = await Promise.all([fetchCourses(), fetchAllFinalExams()]);
      setCourses(c.filter(course => !isSimulatorCourse(course.title)));
      setExams(e.filter(exam => !isSimulatorCourse(exam.course_title)));
      setLoading(false);
    })();
  }, []);

  const refreshExams = async () => {
    const e = await fetchAllFinalExams();
    const filtered = e.filter(exam => !isSimulatorCourse(exam.course_title));
    setExams(filtered);
    return filtered;
  };

  const refreshQuestions = async (exam: ExamWithMeta) => {
    const full = await fetchFinalExamByCourse(exam.course_id);
    setExamQuestions(full?.questions ?? []);
  };

  const handleUpsertExam = async () => {
    if (!form.course_id) return alert("اختر الدورة أولاً");
    setSaving(true);
    const created = await upsertFinalExam(form);
    if (created) {
      const updated = await refreshExams();
      const found = updated.find(e => e.id === created.id) ?? { ...created, course_title: courses.find(c => c.id === created.course_id)?.title ?? "" };
      setSelectedExam(found as ExamWithMeta);
      setShowCreateModal(false);
      setShowSettingsModal(false);
      setForm(EMPTY_FORM);
    } else {
      alert("هذه الدورة لديها اختبار نهائي بالفعل! لا يمكن إنشاء أكثر من اختبار نهائي واحد لكل دورة.");
    }
    setSaving(false);
  };

  const handleSelectExam = async (exam: ExamWithMeta) => {
    setSelectedExam(exam);
    setShowAddQ(false);
    setShowImport(false);
    setShowPullExams(false);
    setCourseExams([]);
    setPullResult(null);
    setImportResult(null);
    await refreshQuestions(exam);
  };

  const handleTogglePublish = async (exam: ExamWithMeta) => {
    setSaving(true);
    const res = await upsertFinalExam({ ...exam, is_published: !exam.is_published });
    if (res) {
      const updated = { ...exam, is_published: !exam.is_published };
      setExams(prev => prev.map(e => e.id === exam.id ? updated : e));
      if (selectedExam?.id === exam.id) setSelectedExam(updated);
    }
    setSaving(false);
  };

  const handleDeleteExam = async () => {
    if (!selectedExam) return;
    setSaving(true);
    const ok = await deleteFinalExam(selectedExam.id);
    if (ok) {
      await refreshExams();
      setSelectedExam(null);
      setExamQuestions([]);
      setShowDeleteConfirm(false);
    }
    setSaving(false);
  };

  const handleAddQuestion = async () => {
    if (!selectedExam) return;
    if (!qForm.text.trim()) return alert("أدخل نص السؤال");
    if (qForm.options.some(o => !o.text.trim())) return alert("أدخل جميع الخيارات");
    setSaving(true);
    const shuffledOptions = [...qForm.options].sort(() => Math.random() - 0.5);
    const ok = await saveFinalExamQuestion(selectedExam.id, {
      text: qForm.text,
      explanation: null,
      difficulty: qForm.difficulty,
      order_index: examQuestions.length,
      options: shuffledOptions,
    });
    if (ok) {
      await refreshQuestions(selectedExam);
      setShowAddQ(false);
      setQForm({ text: "", difficulty: "medium", options: [{ text: "", is_correct: true }, { text: "", is_correct: false }, { text: "", is_correct: false }, { text: "", is_correct: false }] });
    }
    setSaving(false);
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm("حذف هذا السؤال؟")) return;
    await deleteFinalExamQuestion(qId);
    setExamQuestions(prev => prev.filter(q => q.id !== qId));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportResult(null);
    setImportLoading(true);
    try {
      const parsed = await parseExcelFile(file);
      setImportPreview(parsed.slice(0, 3));
    } catch {
      alert("تعذر قراءة الملف، تأكد من أنه Excel أو CSV صحيح");
      setImportFile(null);
    }
    setImportLoading(false);
    e.target.value = "";
  };

  const handleImport = async () => {
    if (!selectedExam || !importFile) return;
    setImportLoading(true);
    try {
      const parsed = await parseExcelFile(importFile);
      const result = await bulkSaveFinalExamQuestions(selectedExam.id, parsed);
      setImportResult(result);
      await refreshQuestions(selectedExam);
      setImportFile(null);
      setImportPreview([]);
    } catch {
      alert("فشل استيراد الأسئلة");
    }
    setImportLoading(false);
  };

  const openSettings = (exam: ExamWithMeta) => {
    setForm({
      id: exam.id,
      course_id: exam.course_id,
      title: exam.title,
      description: exam.description || "",
      time_limit_minutes: exam.time_limit_minutes,
      passing_score: exam.passing_score,
      max_attempts: exam.max_attempts,
      is_published: exam.is_published,
      unlock_lessons_pct: (exam as any).unlock_lessons_pct ?? 80,
      unlock_skills_pct: (exam as any).unlock_skills_pct ?? 0,
      unlock_require_exams: (exam as any).unlock_require_exams ?? false,
    });
    setShowSettingsModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex items-center gap-3 text-text-muted">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-semibold text-sm">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  // ─── Rendered ────────────────────────────────────────────────────────────────
  return (
    <div dir="rtl">

      {/* Page title + actions */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-black text-text">الاختبارات النهائية</h1>
          <p className="text-sm text-text-muted font-semibold">إنشاء وإدارة الاختبارات النهائية للدورات</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs font-black text-primary">{exams.length} اختبار</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-black text-emerald-600">{exams.filter(e => e.is_published).length} منشور</span>
          </div>
          <button
            onClick={() => { setForm(EMPTY_FORM); setShowCreateModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-black rounded-xl shadow-md shadow-primary/25 hover:bg-primary/90 transition-all text-sm"
          >
            <IconPlus size={16} /> اختبار جديد
          </button>
        </div>
      </div>

      {/* Two-column layout: list | detail */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">

        {/* ── Column 1: Exams list ── */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-xs font-black text-text-muted uppercase tracking-wider">قائمة الاختبارات</span>
            <span className="text-xs font-bold bg-bg border border-border text-text-muted px-2 py-0.5 rounded-full">{exams.length}</span>
          </div>

          {exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2 px-4">
              <div className="text-2xl">📋</div>
              <div className="font-black text-text text-sm">لا توجد اختبارات بعد</div>
              <div className="text-xs text-text-muted">ابدأ بإنشاء أول اختبار</div>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {exams.map(exam => (
                <div
                  key={exam.id}
                  onClick={() => handleSelectExam(exam)}
                  className={`relative px-4 py-3.5 cursor-pointer transition-colors ${
                    selectedExam?.id === exam.id ? "bg-primary/5" : "hover:bg-bg"
                  }`}
                >
                  {selectedExam?.id === exam.id && (
                    <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-primary rounded-l-full" />
                  )}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-text text-sm truncate">{exam.title}</div>
                      <div className="text-xs text-text-muted font-semibold truncate mt-0.5">{exam.course_title}</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleTogglePublish(exam); }}
                      className={`shrink-0 text-xs font-black px-2 py-0.5 rounded-md transition-colors ${
                        exam.is_published
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-bg text-text-muted border border-border"
                      }`}
                    >
                      {exam.is_published ? "منشور" : "مسودة"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-text-muted font-semibold">
                    <span className="flex items-center gap-1"><IconClock size={10} />{exam.time_limit_minutes}د</span>
                    <span className="flex items-center gap-1"><IconTarget size={10} />{exam.passing_score}%</span>
                    <span className="flex items-center gap-1"><IconRefresh size={10} />{exam.max_attempts}×</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Column 2: Detail panel ── */}
        {!selectedExam ? (
          <div className="flex flex-col items-center justify-center bg-card border border-dashed border-border rounded-2xl py-16 text-center gap-3">
            <div className="text-4xl">📋</div>
            <div className="font-black text-text">اختر اختباراً من القائمة</div>
            <div className="text-sm text-text-muted">اضغط على أي اختبار لعرض تفاصيله وأسئلته</div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">

            {/* Exam summary card */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-primary mb-0.5 truncate">{selectedExam.course_title}</div>
                  <h2 className="text-lg font-black text-text leading-tight">{selectedExam.title}</h2>
                  {selectedExam.description && (
                    <p className="text-sm text-text-muted mt-0.5">{selectedExam.description}</p>
                  )}
                </div>
                <span className={`shrink-0 text-xs font-black px-2.5 py-1 rounded-lg ${selectedExam.is_published ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                  {selectedExam.is_published ? "● منشور" : "● مسودة"}
                </span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: "أسئلة", value: examQuestions.length, icon: "❓" },
                  { label: "المدة", value: `${selectedExam.time_limit_minutes}د`, icon: "⏱️" },
                  { label: "النجاح", value: `${selectedExam.passing_score}%`, icon: "🎯" },
                  { label: "محاولات", value: selectedExam.max_attempts, icon: "🔄" },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="bg-bg border border-border rounded-xl p-2.5 text-center">
                    <div className="text-base mb-0.5">{icon}</div>
                    <div className="font-black text-text text-sm">{value}</div>
                    <div className="text-xs text-text-muted">{label}</div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => openSettings(selectedExam)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-bg border border-border rounded-xl text-xs font-bold text-text-muted hover:text-primary hover:border-primary/40 transition-colors"
                >
                  <IconSettings size={14} /> الإعدادات
                </button>
                <button
                  onClick={() => handleTogglePublish(selectedExam)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    selectedExam.is_published
                      ? "border-amber-300 text-amber-600 bg-amber-500/10 hover:bg-amber-500/20"
                      : "border-emerald-300 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
                  }`}
                >
                  {selectedExam.is_published
                    ? <><IconToggleLeft size={14} />إلغاء النشر</>
                    : <><IconToggleRight size={14} />نشر الاختبار</>}
                </button>
                <a
                  href={`/final-exam/${selectedExam.course_id}`}
                  target="_blank"
                  className="flex items-center gap-1.5 px-3 py-2 bg-bg border border-border rounded-xl text-xs font-bold text-text-muted hover:text-text transition-colors"
                >
                  <IconEye size={14} /> معاينة
                </a>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 border border-rose-200 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-500/20 transition-colors mr-auto"
                >
                  <IconTrash size={14} /> حذف الاختبار
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { setShowAddQ(v => !v); setShowImport(false); setShowPullExams(false); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${showAddQ ? "bg-primary/10 text-primary border border-primary/30" : "bg-primary text-white shadow-sm shadow-primary/30"}`}
              >
                <IconPlus size={14} /> إضافة سؤال
              </button>
              <button
                onClick={async () => {
                  setShowImport(false);
                  setShowAddQ(false);
                  const next = !showPullExams;
                  setShowPullExams(next);
                  if (next && selectedExam && courseExams.length === 0) {
                    setCourseExamsLoading(true);
                    const data = await fetchCourseExamsWithQuestions(selectedExam.course_id);
                    setCourseExams(data);
                    // Default: pull 5 questions from each exam
                    const defaults: Record<string, number> = {};
                    data.forEach(e => { defaults[e.id] = Math.min(5, e.questions.length); });
                    setPullSelections(defaults);
                    setCourseExamsLoading(false);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${showPullExams ? "border-violet-400 text-violet-600 bg-violet-500/5" : "border-border text-text-muted hover:border-violet-400 hover:text-violet-600 bg-card"}`}
              >
                <IconArrowsTransferDown size={14} /> سحب من الاختبارات
              </button>
              <button
                onClick={() => { setShowImport(v => !v); setShowAddQ(false); setShowPullExams(false); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${showImport ? "border-primary/40 text-primary bg-primary/5" : "border-border text-text-muted hover:border-primary/40 hover:text-primary bg-card"}`}
              >
                <IconFileSpreadsheet size={14} /> رفع Excel
              </button>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border text-text-muted font-bold rounded-xl text-xs hover:border-emerald-400 hover:text-emerald-600 transition-colors"
              >
                <IconDownload size={14} /> تحميل القالب
              </button>
              <div className="mr-auto text-xs font-bold text-text-muted">{examQuestions.length} سؤال إجمالاً</div>
            </div>

            {/* Import Panel */}
            {showImport && (
              <div className="bg-card border-2 border-dashed border-primary/25 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-text text-sm flex items-center gap-2">
                    <IconFileSpreadsheet size={16} className="text-primary" /> استيراد من Excel
                  </h3>
                  <button onClick={() => { setShowImport(false); setImportFile(null); setImportPreview([]); setImportResult(null); }} className="p-1 rounded-lg hover:bg-bg text-text-muted">
                    <IconX size={14} />
                  </button>
                </div>
                {importResult ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-200 rounded-xl">
                      <IconCheck size={18} className="text-emerald-500 shrink-0" />
                      <div>
                        <div className="font-black text-emerald-700 text-sm">تم الاستيراد بنجاح!</div>
                        <div className="text-xs text-emerald-600">{importResult.success} سؤال{importResult.failed > 0 ? `، ${importResult.failed} فشل` : ""}</div>
                      </div>
                    </div>
                    <button onClick={() => { setShowImport(false); setImportResult(null); }} className="px-3 py-1.5 bg-primary text-white font-bold rounded-xl text-xs w-fit">إغلاق</button>
                  </div>
                ) : (
                  <>
                    <div className="text-xs text-text-muted mb-3 bg-bg border border-border rounded-xl p-2.5">
                      <span className="font-black text-text">التنسيق: </span>
                      A: السؤال | B: الإجابة الصحيحة | C-E: الخيارات | F: الصعوبة
                      <div className="mt-1 text-amber-600 font-bold">⚠️ سيتم خلط الإجابات تلقائياً</div>
                    </div>
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
                    {!importFile ? (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-8 rounded-xl border-2 border-dashed border-border text-center font-bold hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-2 text-text-muted text-xs"
                      >
                        <IconUpload size={24} />
                        اضغط لاختيار ملف Excel أو CSV
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 p-2.5 bg-bg border border-border rounded-xl">
                          <IconFileSpreadsheet size={16} className="text-emerald-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-text text-xs truncate">{importFile.name}</div>
                            <div className="text-xs text-text-muted">{importPreview.length}+ أسئلة</div>
                          </div>
                          <button onClick={() => { setImportFile(null); setImportPreview([]); }} className="p-1 text-text-muted hover:text-rose-500"><IconX size={12} /></button>
                        </div>
                        {importPreview.length > 0 && (
                          <div className="bg-bg border border-border rounded-xl overflow-hidden">
                            <div className="px-3 py-1.5 border-b border-border text-xs font-black text-text-muted bg-card">معاينة ({importPreview.length} أسئلة أولى):</div>
                            {importPreview.map((q, i) => (
                              <div key={i} className="px-3 py-2 border-b border-border last:border-none">
                                <div className="font-bold text-text text-xs truncate">{q.text}</div>
                                <div className="text-xs text-text-muted">{q.options.length} خيارات مخلوطة</div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button onClick={handleImport} disabled={importLoading} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary text-white font-bold rounded-xl text-xs disabled:opacity-50">
                            {importLoading ? "جاري الاستيراد..." : <><IconUpload size={13} /> استيراد الأسئلة</>}
                          </button>
                          <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-card border border-border text-text-muted font-bold rounded-xl text-xs hover:bg-bg">تغيير</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Add Question Form */}
            {showAddQ && (
              <div className="bg-card border border-primary/20 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-text text-sm flex items-center gap-2"><IconBulb size={15} className="text-primary" /> سؤال جديد</h3>
                  <button onClick={() => setShowAddQ(false)} className="p-1 rounded-lg hover:bg-bg text-text-muted"><IconX size={14} /></button>
                </div>
                <div className="flex flex-col gap-3">
                  <textarea
                    value={qForm.text}
                    onChange={e => setQForm(f => ({ ...f, text: e.target.value }))}
                    placeholder="اكتب نص السؤال هنا..."
                    rows={2}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary resize-none transition-colors"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {qForm.options.map((opt, idx) => (
                      <div key={idx} className={`flex items-center gap-2 p-2.5 rounded-xl border transition-colors ${opt.is_correct ? "border-emerald-300 bg-emerald-500/5" : "border-border bg-bg"}`}>
                        <button
                          onClick={() => setQForm(f => ({ ...f, options: f.options.map((o, i) => ({ ...o, is_correct: i === idx })) }))}
                          className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${opt.is_correct ? "border-emerald-500 bg-emerald-500" : "border-border hover:border-emerald-400"}`}
                        >
                          {opt.is_correct && <IconCheck size={8} className="text-white" />}
                        </button>
                        <input
                          value={opt.text}
                          onChange={e => setQForm(f => ({ ...f, options: f.options.map((o, i) => i === idx ? { ...o, text: e.target.value } : o) }))}
                          placeholder={`الخيار ${idx + 1}${idx === 0 ? " ✓" : ""}`}
                          className="flex-1 bg-transparent text-xs font-semibold outline-none min-w-0"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {(["easy", "medium", "hard"] as const).map(d => (
                        <button
                          key={d}
                          onClick={() => setQForm(f => ({ ...f, difficulty: d }))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all border ${qForm.difficulty === d ? DIFFICULTY_MAP[d].color : "bg-bg text-text-muted border-border"}`}
                        >
                          {DIFFICULTY_MAP[d].label}
                        </button>
                      ))}
                    </div>
                    <div className="mr-auto flex gap-2">
                      <button onClick={() => setShowAddQ(false)} className="px-3 py-1.5 text-xs font-bold text-text-muted hover:text-text">إلغاء</button>
                      <button onClick={handleAddQuestion} disabled={saving} className="px-4 py-1.5 bg-primary text-white font-bold rounded-xl text-xs disabled:opacity-50">
                        {saving ? "جاري..." : "إضافة"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pull from exams panel */}
            {showPullExams && (
              <div className="bg-card border-2 border-dashed border-violet-400/30 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-text text-sm flex items-center gap-2">
                    <IconArrowsTransferDown size={16} className="text-violet-500" /> سحب أسئلة من اختبارات الدورة
                  </h3>
                  <button onClick={() => { setShowPullExams(false); setPullResult(null); }} className="p-1 rounded-lg hover:bg-bg text-text-muted">
                    <IconX size={14} />
                  </button>
                </div>

                {pullResult ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-200 rounded-xl">
                      <IconCheck size={18} className="text-emerald-500 shrink-0" />
                      <div>
                        <div className="font-black text-emerald-700 text-sm">تم السحب بنجاح!</div>
                        <div className="text-xs text-emerald-600">{pullResult.success} سؤال تم إضافته{pullResult.failed > 0 ? `، ${pullResult.failed} فشل` : ""}</div>
                      </div>
                    </div>
                    <button onClick={() => { setShowPullExams(false); setPullResult(null); }} className="px-3 py-1.5 bg-primary text-white font-bold rounded-xl text-xs w-fit">إغلاق</button>
                  </div>
                ) : courseExamsLoading ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-text-muted">
                    <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold">جاري تحميل الاختبارات...</span>
                  </div>
                ) : courseExams.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                    <div className="text-2xl">📋</div>
                    <div className="font-black text-text text-sm">لا توجد اختبارات منشورة</div>
                    <div className="text-xs text-text-muted">لا توجد اختبارات منشورة في مسارات هذه الدورة بعد</div>
                  </div>
                ) : (
                  <>
                    <div className="text-xs text-text-muted bg-bg border border-border rounded-xl p-2.5 mb-3 font-semibold">
                      حدد عدد الأسئلة المطلوبة من كل اختبار. سيتم خلط ترتيب الإجابات تلقائياً عند السحب.
                      <span className="text-violet-600 font-bold mr-1">اضبط على 0 لتجاهل الاختبار.</span>
                    </div>
                    <div className="flex flex-col gap-2 mb-3 max-h-64 overflow-y-auto">
                      {courseExams.map(exam => {
                        const count = pullSelections[exam.id] ?? 0;
                        const maxQ = exam.questions.length;
                        return (
                          <div key={exam.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                            count > 0 ? "border-violet-300 bg-violet-500/5" : "border-border bg-bg"
                          }`}>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-text text-xs truncate">{exam.title}</div>
                              <div className="text-xs text-text-muted">
                                <span className="text-violet-500 font-bold">{exam.track_name}</span>
                                {" • "}{maxQ} سؤال متاح
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => setPullSelections(s => ({ ...s, [exam.id]: Math.max(0, (s[exam.id] ?? 0) - 1) }))}
                                className="w-7 h-7 rounded-lg border border-border bg-card hover:bg-bg flex items-center justify-center font-black text-text-muted text-sm transition-colors"
                              >−</button>
                              <span className={`w-8 text-center font-black text-sm ${
                                count > 0 ? "text-violet-600" : "text-text-muted"
                              }`}>{count}</span>
                              <button
                                onClick={() => setPullSelections(s => ({ ...s, [exam.id]: Math.min(maxQ, (s[exam.id] ?? 0) + 1) }))}
                                className="w-7 h-7 rounded-lg border border-border bg-card hover:bg-bg flex items-center justify-center font-black text-text-muted text-sm transition-colors"
                              >+</button>
                              <span className="text-xs text-text-muted w-12 text-center">/ {maxQ}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-text-muted font-semibold">
                        إجمالي محدد: <span className="font-black text-violet-600">{Object.values(pullSelections).reduce((a, b) => a + b, 0)} سؤال</span>
                      </div>
                      <button
                        onClick={async () => {
                          if (!selectedExam) return;
                          const total = Object.values(pullSelections).reduce((a, b) => a + b, 0);
                          if (total === 0) return alert("حدد على الأقل سؤالاً واحداً");
                          setPullLoading(true);
                          // Collect random questions from each exam per count
                          const toImport: { text: string; difficulty: string; options: { text: string; is_correct: boolean }[] }[] = [];
                          for (const exam of courseExams) {
                            const count = pullSelections[exam.id] ?? 0;
                            if (count === 0) continue;
                            const shuffled = [...exam.questions].sort(() => Math.random() - 0.5);
                            const picked = shuffled.slice(0, count);
                            for (const q of picked) {
                              if (q.options.length === 0) continue;
                              // Shuffle options too
                              const opts = [...q.options].sort(() => Math.random() - 0.5).map(o => ({ text: o.text, is_correct: o.is_correct }));
                              toImport.push({ text: q.text, difficulty: q.difficulty, options: opts });
                            }
                          }
                          const result = await bulkSaveFinalExamQuestions(selectedExam.id, toImport);
                          setPullResult(result);
                          await refreshQuestions(selectedExam);
                          setPullLoading(false);
                        }}
                        disabled={pullLoading || Object.values(pullSelections).reduce((a, b) => a + b, 0) === 0}
                        className="mr-auto flex items-center gap-1.5 px-4 py-2 bg-violet-500 text-white font-bold rounded-xl text-xs disabled:opacity-50 hover:bg-violet-600 transition-colors"
                      >
                        {pullLoading
                          ? <>جاري السحب...</>
                          : <><IconArrowsTransferDown size={13} /> سحب الأسئلة ({Object.values(pullSelections).reduce((a, b) => a + b, 0)})</>}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Empty questions state */}
            {examQuestions.length === 0 && !showAddQ && !showImport && !showPullExams && (
              <div className="flex flex-col items-center justify-center py-10 bg-card border border-dashed border-border rounded-2xl text-center gap-2">
                <div className="text-2xl">❓</div>
                <div className="font-black text-text text-sm">لا توجد أسئلة بعد</div>
                <div className="text-xs text-text-muted">أضف أسئلة يدوياً أو ارفع ملف Excel</div>
              </div>
            )}

            {/* Questions list */}
            <div className="flex flex-col gap-2">
              {examQuestions.map((q, qi) => {
                const diff = DIFFICULTY_MAP[q.difficulty as keyof typeof DIFFICULTY_MAP] ?? DIFFICULTY_MAP.medium;
                return (
                  <div key={q.id} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}>
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">{qi + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-text text-sm leading-tight line-clamp-1">{q.text}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md border ${diff.color}`}>{diff.label}</span>
                          <span className="text-xs text-text-muted">{q.options.length} خيارات</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteQuestion(q.id); }}
                          className="p-1.5 rounded-lg text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <IconTrash size={13} />
                        </button>
                        {expandedQ === q.id ? <IconChevronUp size={14} className="text-text-muted" /> : <IconChevronDown size={14} className="text-text-muted" />}
                      </div>
                    </div>
                    {expandedQ === q.id && (
                      <div className="px-3 pb-3 border-t border-border bg-bg/50">
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {q.options.map(opt => (
                            <div
                              key={opt.id}
                              className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold border ${opt.is_correct ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" : "text-text-muted border-border bg-card"}`}
                            >
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${opt.is_correct ? "border-emerald-500 bg-emerald-500" : "border-border"}`}>
                                {opt.is_correct && <IconCheck size={8} className="text-white" />}
                              </div>
                              <span className="line-clamp-2">{opt.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh]" dir="rtl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h2 className="text-base font-black text-text">اختبار نهائي جديد</h2>
              <button onClick={() => { setShowCreateModal(false); setForm(EMPTY_FORM); }} className="p-1.5 rounded-xl hover:bg-bg text-text-muted">
                <IconX size={16} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
              <SettingsForm form={form} setForm={setForm} courses={courses} exams={exams} showCourse />
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border shrink-0">
              <button onClick={() => { setShowCreateModal(false); setForm(EMPTY_FORM); }} className="px-4 py-2 font-bold text-text-muted hover:text-text text-sm">إلغاء</button>
              <button onClick={handleUpsertExam} disabled={saving} className="px-5 py-2 bg-primary text-white font-black rounded-xl text-sm shadow-md disabled:opacity-50">
                {saving ? "جاري الإنشاء..." : "إنشاء الاختبار"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh]" dir="rtl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h2 className="text-base font-black text-text">إعدادات الاختبار</h2>
              <button onClick={() => setShowSettingsModal(false)} className="p-1.5 rounded-xl hover:bg-bg text-text-muted"><IconX size={16} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
              <SettingsForm form={form} setForm={setForm} courses={courses} exams={exams} showCourse={false} />
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border shrink-0">
              <button onClick={() => setShowSettingsModal(false)} className="px-4 py-2 font-bold text-text-muted hover:text-text text-sm">إلغاء</button>
              <button onClick={handleUpsertExam} disabled={saving} className="px-5 py-2 bg-primary text-white font-black rounded-xl text-sm shadow-md disabled:opacity-50">
                {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-rose-200 shadow-2xl p-5 text-center" dir="rtl">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-3">
              <IconAlertTriangle size={24} className="text-rose-500" />
            </div>
            <h2 className="text-base font-black text-text mb-1">حذف الاختبار؟</h2>
            <p className="text-sm text-text-muted mb-5">
              سيتم حذف <span className="font-black text-text">"{selectedExam.title}"</span> وجميع أسئلته نهائياً.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 font-bold text-text-muted border border-border rounded-xl text-sm hover:bg-bg">إلغاء</button>
              <button onClick={handleDeleteExam} disabled={saving} className="flex-1 py-2 bg-rose-500 text-white font-black rounded-xl text-sm hover:bg-rose-600 disabled:opacity-50">
                {saving ? "جاري..." : "حذف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
