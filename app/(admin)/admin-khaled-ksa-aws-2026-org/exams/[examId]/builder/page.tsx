"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowRight, IconPlus, IconTrash, IconCheck,
  IconGripVertical, IconAlertCircle, IconDeviceFloppy,
  IconFileSpreadsheet, IconDownload, IconUpload, IconX,
  IconPhoto, IconLoader2
} from "@tabler/icons-react";
import * as XLSX from "xlsx";
import JSZip from "jszip";

import { fetchExamBuilderData, saveQuestionWithOptions, deleteQuestion, type ExamWithDetails, type DbQuestion, type DbQuestionOption } from "@/lib/supabase/services/exams";
import { bulkSaveExamQuestions } from "@/lib/supabase/services/exams-actions";
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
  image_url?: string | null;
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

  // Excel Import state
  const [showImport, setShowImport] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [importMicroSkillId, setImportMicroSkillId] = useState("");

  useEffect(() => {
    setIsMounted(true);
    if (!examId) return;

    fetchExamBuilderData(examId).then(data => {
      if (data) {
        setExam(data);
        
        // Map DB questions to our UI state and sort them by order_index
        const loadedQuestions: QuestionState[] = data.questions
          .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
          .map((q, i) => ({
          id: q.id,
          exam_id: q.exam_id,
          micro_skill_id: q.micro_skill_id,
          text: q.text,
          explanation: q.explanation || "",
          difficulty: q.difficulty,
          order_index: q.order_index,
          image_url: q.image_url || null,
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

  // --- EXCEL IMPORT LOGIC ---
  const downloadTemplate = () => {
    const data = [
      {
        "نص السؤال": "ما هي عاصمة السعودية؟",
        "الخيار أ (صحيح)": "الرياض",
        "الخيار ب": "جدة",
        "الخيار ج": "مكة",
        "الخيار د": "الدمام",
        "الصعوبة (easy/medium/hard)": "easy",
        "اسم الصورة (اختياري)": "سؤال1.png"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الأسئلة");
    XLSX.writeFile(wb, "قالب_أسئلة_الاختبار.xlsx");
  };

  // Upload a single image to Supabase Storage and return its public URL
  async function uploadImageToStorage(file: File, fileName: string): Promise<string | null> {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const ext = fileName.split(".").pop() || "png";
      const path = `exam-questions/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("question-images").upload(path, file, { upsert: true });
      if (error) { console.error("Image upload error:", error.message); return null; }
      const { data: urlData } = supabase.storage.from("question-images").getPublicUrl(path);
      return urlData?.publicUrl || null;
    } catch (e) {
      console.error("uploadImageToStorage error:", e);
      return null;
    }
  }

  // Parse Excel + optional ZIP file
  const zipFileRef = useRef<File | null>(null);
  const [zipFileName, setZipFileName] = useState("");

  const handleZipSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { zipFileRef.current = file; setZipFileName(file.name); }
  };

  const [uploadProgress, setUploadProgress] = useState<{ total: number; current: number } | null>(null);

  const parseExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!exam || !importMicroSkillId) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportResult(null);
    setUploadProgress(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json<any>(ws);

        // Extract images from ZIP if provided
        const imageMap = new Map<string, string>(); // lowercase filename -> public URL
        if (zipFileRef.current) {
          try {
            console.log("Loading ZIP file...");
            const zip = await JSZip.loadAsync(zipFileRef.current);
            const uploadPromises: Promise<void>[] = [];
            
            let foundImagesCount = 0;
            let successUploadCount = 0;

            // First pass to count total images
            zip.forEach((relativePath, zipEntry) => {
              if (!zipEntry.dir && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(relativePath)) {
                foundImagesCount++;
              }
            });

            if (foundImagesCount > 0) {
              setUploadProgress({ total: foundImagesCount, current: 0 });
            }

            // Second pass to upload
            zip.forEach((relativePath, zipEntry) => {
              if (!zipEntry.dir && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(relativePath)) {
                const fileName = relativePath.split("/").pop() || relativePath;
                const normalizedFileName = fileName.trim().toLowerCase(); // Case-insensitive matching

                uploadPromises.push(
                  zipEntry.async("blob").then(async (blob) => {
                    const imageFile = new File([blob], fileName, { type: blob.type || "image/png" });
                    const url = await uploadImageToStorage(imageFile, fileName);
                    if (url) {
                      imageMap.set(normalizedFileName, url);
                      successUploadCount++;
                      // Update progress UI securely
                      setUploadProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);
                    } else {
                      console.error(`Failed to upload image from ZIP: ${fileName}`);
                    }
                  }).catch(e => console.error("Error reading blob from ZIP:", e))
                );
              }
            });
            
            if (foundImagesCount > 0) {
              await Promise.all(uploadPromises);
              setUploadProgress(null); // Clear progress when done
              if (successUploadCount === 0) {
                alert("⚠️ تنبيه: تم العثور على صور في ملف ZIP لكن فشل رفعها جميعاً. تأكد أنك نفذت كود الـ SQL في Supabase لإنشاء مجلد الصور وإعطاء الصلاحيات.");
              } else if (successUploadCount < foundImagesCount) {
                alert(`⚠️ تم رفع ${successUploadCount} صورة فقط من أصل ${foundImagesCount}.`);
              }
            } else {
              alert("⚠️ لم يتم العثور على أي صور مدعومة داخل ملف الـ ZIP المرفق.");
            }
          } catch (zipErr) {
            console.error("ZIP parse error:", zipErr);
            setUploadProgress(null);
            alert("خطأ في قراءة ملف ZIP، تأكد أن الملف سليم.");
          }
        }

        const toImport = rawData.map(row => {
          let opts = [
            { text: String(row["الخيار أ (صحيح)"] || ""), is_correct: true },
            { text: String(row["الخيار ب"] || ""), is_correct: false },
            { text: String(row["الخيار ج"] || ""), is_correct: false },
            { text: String(row["الخيار د"] || ""), is_correct: false },
          ];
          opts = opts.filter(o => o.text.trim().length > 0);
          opts.sort(() => Math.random() - 0.5);

          const rawImageName = String(row["اسم الصورة (اختياري)"] || "").trim();
          const normalizedImageName = rawImageName.split("/").pop()?.toLowerCase() || rawImageName.toLowerCase();
          const image_url = normalizedImageName ? (imageMap.get(normalizedImageName) || null) : null;

          return {
            text: String(row["نص السؤال"] || ""),
            difficulty: String(row["الصعوبة (easy/medium/hard)"] || "medium"),
            image_url,
            options: opts
          };
        }).filter(q => q.text.trim().length > 0 && q.options.length >= 2);

        if (toImport.length > 0) {
          const res = await bulkSaveExamQuestions(exam.id, importMicroSkillId, toImport);
          setImportResult(res);
          if (res.success > 0) {
            alert(`✅ تم استيراد ${res.success} سؤال بنجاح! تم ربط ${imageMap.size} صورة.`);
            window.location.reload();
          }
        } else {
          alert("الملف فارغ أو لا يطابق القالب.");
        }
      } catch (err) {
        console.error(err);
        alert("حدث خطأ أثناء قراءة الملف.");
      }
      setImportLoading(false);
      if (e.target) e.target.value = "";
    };
    reader.readAsBinaryString(file);
  };

  // Upload image for a single question manually
  async function handleQuestionImageUpload(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    updateQuestion(index, { image_url: "__uploading__" });
    const url = await uploadImageToStorage(file, file.name);
    updateQuestion(index, { image_url: url || null });
    if (e.target) e.target.value = "";
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
          image_url: q.image_url === "__uploading__" ? null : (q.image_url ?? null),
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
      <div className="flex items-center justify-between bg-card border border-border rounded-2xl p-4 shadow-sm sticky top-4 z-10 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin-khaled-ksa-aws-2026-org/exams" className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg hover:bg-border transition-colors">
            <IconArrowRight size={20} className="text-text-muted" />
          </Link>
          <div>
            <h1 className="text-[16px] font-black text-text">مصمم الأسئلة: {exam.title}</h1>
            <p className="text-[12px] text-text-muted">
              اربط كل سؤال بمهارة دقيقة ليتمكن النظام من تحليل ضعف الطالب.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(v => !v)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors ${showImport ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/5" : "border-border text-text-muted hover:border-emerald-500/40 hover:text-emerald-600 bg-card"}`}
          >
            <IconFileSpreadsheet size={16} /> رفع بإكسيل
          </button>

          <button 
            onClick={handleSaveAll} 
            disabled={isSaving || questions.length === 0}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isSaving ? "جاري الحفظ..." : <><IconDeviceFloppy size={18} /> حفظ جميع التغييرات</>}
          </button>
        </div>
      </div>

      {/* Import Panel */}
      {showImport && (
        <div className="bg-card border-2 border-dashed border-emerald-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-text text-sm flex items-center gap-2">
              <IconFileSpreadsheet size={18} className="text-emerald-500" /> استيراد الأسئلة من ملف Excel
            </h3>
            <button onClick={() => { setShowImport(false); setImportResult(null); }} className="p-1 rounded-lg hover:bg-bg text-text-muted">
              <IconX size={16} />
            </button>
          </div>

          <div className="text-sm font-bold text-text-muted bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 mb-5">
            <p className="mb-2">خطوات الاستيراد:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-text-muted">
              <li>قم بتحميل القالب المخصص للأسئلة.</li>
              <li>قم بتعبئة الأسئلة، وضع <b>الإجابة الصحيحة دائماً في (الخيار أ)</b>.</li>
              <li>النظام سيقوم <b>بخلط ترتيب الإجابات عشوائياً</b> لكل سؤال عند رفعه.</li>
              <li>اختر <b>المهارة (Micro-Skill)</b> التي ترغب بربط جميع الأسئلة المستوردة بها.</li>
              <li className="text-emerald-700 font-bold">🖼️ للأسئلة التي تحتوي صور: ضع أسماء الصور في عمود "اسم الصورة (اختياري)"، ثم اضغط "رفع ملف ZIP الصور" أولاً.</li>
              <li>ارفع ملف Excel وسيتم حفظ الأسئلة فوراً.</li>
            </ol>
          </div>

          {/* Upload Progress Bar */}
          {uploadProgress && (
            <div className="mb-5 p-4 rounded-xl border border-primary/20 bg-primary/5">
              <div className="flex justify-between items-center mb-2 text-xs font-bold text-primary">
                <span>جاري رفع الصور...</span>
                <span>{uploadProgress.current} من {uploadProgress.total}</span>
              </div>
              <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4">

            <div className="flex-1 space-y-2">
              <label className="text-xs font-black text-text-muted block">المهارة المرتبطة لجميع الأسئلة المستوردة <span className="text-red-500">*</span></label>
              <select 
                value={importMicroSkillId} 
                onChange={(e) => setImportMicroSkillId(e.target.value)}
                className="w-full rounded-xl border border-primary/30 bg-primary/5 px-3 py-3 text-sm font-semibold outline-none focus:border-primary text-primary"
              >
                <option value="">-- اختر المهارة --</option>
                {allSkills.map(s => (
                  <option key={s.id} value={s.id}>
                    [{s.path}] — {s.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end gap-2 flex-1">
              <button
                onClick={downloadTemplate}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-card border border-border text-text-muted font-bold hover:bg-bg transition-colors"
              >
                <IconDownload size={18} /> تحميل القالب
              </button>
              
              {/* ZIP upload for images */}
              <div className="relative flex-1">
                <input type="file" accept=".zip" onChange={handleZipSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className={`flex h-11 items-center justify-center gap-2 rounded-xl font-bold border transition-colors text-xs ${zipFileName ? "bg-amber-500/10 border-amber-500/40 text-amber-700" : "border-border bg-bg text-text-muted hover:border-amber-400"}`}>
                  <IconPhoto size={16} /> {zipFileName ? zipFileName.slice(0, 12) + "…" : "ZIP الصور"}
                </div>
              </div>

              <div className="relative flex-1">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={parseExcelFile}
                  disabled={importLoading || !importMicroSkillId}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className={`flex h-11 items-center justify-center gap-2 rounded-xl font-bold transition-colors ${
                  !importMicroSkillId ? "bg-bg text-text-muted border border-border opacity-50" : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                }`}>
                  {importLoading ? <span className="animate-pulse">جاري الاستيراد...</span> : <><IconUpload size={18} /> رفع Excel</>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

                  {/* Question Image (optional) */}
                  <div>
                    <label className="text-xs font-black text-text-muted mb-1.5 block flex items-center gap-1.5">
                      <IconPhoto size={14} /> صورة السؤال (اختياري)
                    </label>
                    {q.image_url && q.image_url !== "__uploading__" ? (
                      <div className="relative inline-block">
                        <img src={q.image_url} alt="صورة السؤال" className="max-h-40 rounded-xl border border-border object-contain" />
                        <button
                          type="button"
                          onClick={() => updateQuestion(qIndex, { image_url: null })}
                          className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow"
                        >
                          <IconX size={12} />
                        </button>
                      </div>
                    ) : q.image_url === "__uploading__" ? (
                      <div className="flex items-center gap-2 text-sm text-text-muted">
                        <IconLoader2 size={16} className="animate-spin" /> جاري رفع الصورة...
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 cursor-pointer w-fit">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleQuestionImageUpload(qIndex, e)}
                        />
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border bg-bg text-text-muted hover:border-primary hover:text-primary transition-colors text-sm font-bold">
                          <IconUpload size={16} /> رفع صورة للسؤال
                        </div>
                      </label>
                    )}
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
