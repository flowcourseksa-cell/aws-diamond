"use client";

import { useState } from "react";
import { 
  IconPlus, IconTrash, IconDeviceFloppy, IconCheck, 
  IconChevronDown, IconChevronUp, IconArrowLeft, IconEye, IconUpload, IconHeadphones
} from "@tabler/icons-react";
import Link from "next/link";
import { saveSimulatorQuestions, uploadSimulatorAudio } from "@/lib/supabase/services/final-exam";
import * as XLSX from "xlsx";

type SectionType = 'reading' | 'listening' | 'grammar' | 'analysis';

export default function SimulatorBuilder({
  courseId,
  courseTitle,
  examId,
  initialQuestions,
}: {
  courseId: string;
  courseTitle: string;
  examId: string;
  initialQuestions: any[];
}) {
  const [questions, setQuestions] = useState<any[]>(initialQuestions);
  const [saving, setSaving] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(initialQuestions.length > 0 ? initialQuestions[0].id : null);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const addQuestion = (section: SectionType) => {
    const newId = "new-" + Date.now();
    const newQ = {
      id: newId,
      final_exam_id: examId,
      text: "",
      explanation: "",
      difficulty: "medium",
      order_index: questions.length,
      section_type: section,
      context_text: section === "reading" ? "" : null,
      audio_url: null,
      options: [
        { id: "opt-1", text: "", is_correct: true },
        { id: "opt-2", text: "", is_correct: false },
        { id: "opt-3", text: "", is_correct: false },
        { id: "opt-4", text: "", is_correct: false },
      ]
    };
    setQuestions([...questions, newQ]);
    setSelectedQuestionId(newId);
  };

  const updateQuestion = (id: string, updates: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const updateOption = (qId: string, optIndex: number, text: string) => {
    setQuestions(questions.map(q => {
      if (q.id !== qId) return q;
      const newOpts = [...q.options];
      newOpts[optIndex].text = text;
      return { ...q, options: newOpts };
    }));
  };

  const setCorrectOption = (qId: string, optIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id !== qId) return q;
      const newOpts = q.options.map((opt: any, idx: number) => ({
        ...opt,
        is_correct: idx === optIndex
      }));
      return { ...q, options: newOpts };
    }));
  };

  const removeQuestion = (id: string) => {
    if(confirm("هل أنت متأكد من حذف هذا السؤال؟")) {
      const filtered = questions.filter(q => q.id !== id);
      setQuestions(filtered);
      if (selectedQuestionId === id) {
        setSelectedQuestionId(filtered.length > 0 ? filtered[0].id : null);
      }
    }
  };

  const removeAllQuestions = () => {
    if(questions.length === 0) return;
    if(confirm("هل أنت متأكد من حذف جميع الأسئلة بالكامل؟ لا يمكن التراجع عن هذه الخطوة!")) {
      setQuestions([]);
      setSelectedQuestionId(null);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newQ = [...questions];
    const temp = newQ[index];
    newQ[index] = newQ[index - 1];
    newQ[index - 1] = temp;
    setQuestions(newQ);
  };

  const moveDown = (index: number) => {
    if (index === questions.length - 1) return;
    const newQ = [...questions];
    const temp = newQ[index];
    newQ[index] = newQ[index + 1];
    newQ[index + 1] = temp;
    setQuestions(newQ);
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>, qId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAudio(true);
    const formData = new FormData();
    formData.append("file", file);

    const url = await uploadSimulatorAudio(formData);
    if (url) {
      updateQuestion(qId, { audio_url: url });
    } else {
      alert("فشل رفع الملف الصوتي.");
    }
    setUploadingAudio(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await saveSimulatorQuestions(examId, questions);
      if (success) {
        alert("تم الحفظ بنجاح!");
      } else {
        alert("حدث خطأ أثناء الحفظ");
      }
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء الحفظ");
    }
    setSaving(false);
  };

  const downloadTemplate = () => {
    const data = [
      {
        "نص السؤال": "سؤال قراءة كمثال",
        "القسم (reading/listening/grammar/analysis)": "reading",
        "قطعة القراءة / رابط الصوت": "قطعة القراءة توضع هنا",
        "الخيار أ (صحيح دائماً)": "الخيار الصحيح",
        "الخيار ب": "خيار خاطئ 1",
        "الخيار ج": "خيار خاطئ 2",
        "الخيار د": "خيار خاطئ 3",
        "الشرح": "شرح الإجابة هنا"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الأسئلة");
    XLSX.writeFile(wb, "قالب_أسئلة_المحاكي.xlsx");
  };

  const parseExcelFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json<any>(ws);

        const newImportedQuestions: any[] = rawData.map((row, index) => {
          let opts = [
            { id: `new-opt-1-${Date.now()}-${index}`, text: String(row["الخيار أ (صحيح دائماً)"] || ""), is_correct: true },
            { id: `new-opt-2-${Date.now()}-${index}`, text: String(row["الخيار ب"] || ""), is_correct: false },
            { id: `new-opt-3-${Date.now()}-${index}`, text: String(row["الخيار ج"] || ""), is_correct: false },
            { id: `new-opt-4-${Date.now()}-${index}`, text: String(row["الخيار د"] || ""), is_correct: false },
          ];
          opts = opts.filter(o => o.text.trim().length > 0);
          opts.sort(() => Math.random() - 0.5); // Randomize positions

          const section = String(row["القسم (reading/listening/grammar/analysis)"] || "grammar").trim().toLowerCase() as SectionType;
          const context = String(row["قطعة القراءة / رابط الصوت"] || "").trim();

          return {
            id: `new-${Date.now()}-${index}`,
            final_exam_id: examId,
            text: String(row["نص السؤال"] || ""),
            explanation: String(row["الشرح"] || ""),
            difficulty: "medium",
            order_index: questions.length + index,
            section_type: ['reading', 'listening', 'grammar', 'analysis'].includes(section) ? section : 'grammar',
            context_text: section === "reading" ? context : null,
            audio_url: section === "listening" ? context : null,
            options: opts
          };
        }).filter(q => q.text.trim().length > 0 && q.options.length >= 2);

        if (newImportedQuestions.length > 0) {
          setQuestions(prev => [...prev, ...newImportedQuestions]);
          setSelectedQuestionId(newImportedQuestions[0].id);
          alert(`تم استيراد ${newImportedQuestions.length} أسئلة بنجاح! لا تنس الحفظ.`);
        } else {
          alert("الملف فارغ أو لا يطابق القالب.");
        }
      } catch (err) {
        console.error(err);
        alert("حدث خطأ أثناء قراءة الملف.");
      }
      if (e.target) e.target.value = "";
    };
    reader.readAsBinaryString(file);
  };

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  return (
    <div className="p-6 w-full px-4 md:px-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-text-muted mb-1 text-sm font-bold">
            <Link href="/admin-khaled-ksa-aws-2026-org/simulators" className="hover:text-primary transition-colors flex items-center gap-1">
              <IconArrowLeft size={16} /> العودة للمحاكيات
            </Link>
          </div>
          <h1 className="text-2xl font-black text-text">إدارة أسئلة المحاكي: <span className="text-primary">{courseTitle}</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/simulator/${courseId}`} target="_blank" className="flex items-center gap-2 bg-border text-text px-4 py-2 rounded-xl font-bold hover:bg-border/80 transition-colors">
            <IconEye size={18} /> معاينة كطالب
          </Link>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            {saving ? <span className="animate-pulse">جاري الحفظ...</span> : <><IconDeviceFloppy size={18} /> حفظ جميع التعديلات</>}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start h-[calc(100vh-200px)] min-h-[600px]">
        {/* Sidebar */}
        <div className="w-full lg:w-1/3 xl:w-1/4 bg-card rounded-2xl border border-border shadow-sm h-full flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-background">
            <h3 className="font-black text-text mb-3">إضافة سؤال جديد</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => addQuestion('reading')} className="flex items-center justify-center gap-2 bg-indigo-500/10 text-indigo-500 px-4 py-2 rounded-lg font-bold hover:bg-indigo-500/20 transition-colors text-sm">
                <IconPlus size={16} /> قسم القراءة
              </button>
              <button onClick={() => addQuestion('listening')} className="flex items-center justify-center gap-2 bg-amber-500/10 text-amber-500 px-4 py-2 rounded-lg font-bold hover:bg-amber-500/20 transition-colors text-sm">
                <IconPlus size={16} /> قسم الاستماع
              </button>
              <button onClick={() => addQuestion('grammar')} className="flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-lg font-bold hover:bg-emerald-500/20 transition-colors text-sm">
                <IconPlus size={16} /> قسم القواعد
              </button>
              <button onClick={() => addQuestion('analysis')} className="flex items-center justify-center gap-2 bg-rose-500/10 text-rose-500 px-4 py-2 rounded-lg font-bold hover:bg-rose-500/20 transition-colors text-sm">
                <IconPlus size={16} /> قسم التحليل
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
              <button onClick={downloadTemplate} className="flex items-center justify-center gap-2 bg-border text-text px-4 py-2 rounded-lg font-bold hover:bg-border/80 transition-colors text-xs">
                تحميل قالب إكسيل
              </button>
              <label className="flex items-center justify-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold hover:bg-primary/20 transition-colors text-xs cursor-pointer">
                <IconUpload size={14} /> استيراد من إكسيل
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={parseExcelFile} />
              </label>
              <button onClick={removeAllQuestions} disabled={questions.length === 0} className="mt-2 flex items-center justify-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-lg font-bold hover:bg-red-500/20 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                <IconTrash size={14} /> حذف جميع الأسئلة
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#F8FAFC]">
            {questions.length === 0 ? (
              <div className="text-center py-10 text-text-muted text-sm font-bold">
                لا توجد أسئلة بعد
              </div>
            ) : (
              questions.map((q, index) => (
                <div 
                  key={q.id} 
                  onClick={() => setSelectedQuestionId(q.id)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${selectedQuestionId === q.id ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-card border-border hover:border-primary/40'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-black shrink-0 ${selectedQuestionId === q.id ? 'bg-primary text-white' : 'bg-border text-text-muted'}`}>
                      {index + 1}
                    </div>
                    <span className="text-sm font-bold truncate">
                      {q.text || "سؤال بدون نص"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div className="w-full lg:flex-1 bg-card rounded-2xl border border-border shadow-sm h-full overflow-hidden flex flex-col">
          {!selectedQuestion ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <IconEye size={48} className="text-border mb-4" />
              <h2 className="text-xl font-black text-text-muted">اختر سؤالاً للتعديل</h2>
              <p className="text-sm font-bold text-text-muted/60 mt-2">أو قم بإضافة سؤال جديد من القائمة الجانبية</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm font-bold">
                    {selectedQuestion.section_type === 'reading' && 'قسم القراءة'}
                    {selectedQuestion.section_type === 'listening' && 'قسم الاستماع'}
                    {selectedQuestion.section_type === 'grammar' && 'قسم القواعد'}
                    {selectedQuestion.section_type === 'analysis' && 'قسم التحليل الكتابي'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-muted ml-4">ترتيب السؤال</span>
                  <button onClick={() => moveUp(questions.findIndex(q => q.id === selectedQuestion.id))} className="p-2 bg-border/50 text-text rounded-lg hover:bg-border"><IconChevronUp size={16} /></button>
                  <button onClick={() => moveDown(questions.findIndex(q => q.id === selectedQuestion.id))} className="p-2 bg-border/50 text-text rounded-lg hover:bg-border"><IconChevronDown size={16} /></button>
                  <div className="w-px h-6 bg-border mx-2" />
                  <button onClick={() => removeQuestion(selectedQuestion.id)} className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 text-sm font-bold transition-colors">
                    <IconTrash size={16} /> حذف
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* Right Side: Context (Reading/Listening) */}
                {(selectedQuestion.section_type === 'reading' || selectedQuestion.section_type === 'listening') && (
                  <div className="space-y-4 xl:border-l border-border xl:pl-8">
                    {selectedQuestion.section_type === 'reading' && (
                      <div>
                        <label className="block text-sm font-bold text-text mb-2">قطعة القراءة (Reading Passage)</label>
                        <textarea 
                          value={selectedQuestion.context_text || ""}
                          onChange={(e) => updateQuestion(selectedQuestion.id, { context_text: e.target.value })}
                          className="w-full bg-background border border-border rounded-xl p-4 min-h-[300px] focus:outline-none focus:border-primary text-sm leading-relaxed resize-y"
                          placeholder="انسخ قطعة القراءة هنا..."
                        />
                      </div>
                    )}

                    {selectedQuestion.section_type === 'listening' && (
                      <div>
                        <label className="block text-sm font-bold text-text mb-2">الملف الصوتي (Audio File)</label>
                        <div className="bg-background border-2 border-dashed border-border rounded-2xl p-6 text-center">
                          <IconHeadphones size={40} className="text-border mx-auto mb-3" />
                          
                          {selectedQuestion.audio_url ? (
                            <div className="space-y-3">
                              <p className="text-sm font-bold text-green-500">تم رفع الملف الصوتي بنجاح</p>
                              <audio controls className="w-full max-w-sm mx-auto h-10" src={selectedQuestion.audio_url} />
                              <div>
                                <label className="text-xs font-bold text-text-muted mt-2 block cursor-pointer hover:text-primary transition-colors">
                                  تغيير الملف الصوتي
                                  <input 
                                    type="file" 
                                    accept="audio/*" 
                                    className="hidden" 
                                    onChange={(e) => handleAudioUpload(e, selectedQuestion.id)}
                                    disabled={uploadingAudio}
                                  />
                                </label>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-bold text-text-muted mb-4">اختر ملف صوتي (mp3, wav) من جهازك</p>
                              <label className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-xl font-bold cursor-pointer hover:bg-primary/20 transition-colors">
                                {uploadingAudio ? (
                                  <span className="animate-pulse">جاري الرفع...</span>
                                ) : (
                                  <>
                                    <IconUpload size={18} /> رفع الملف
                                    <input 
                                      type="file" 
                                      accept="audio/*" 
                                      className="hidden" 
                                      onChange={(e) => handleAudioUpload(e, selectedQuestion.id)}
                                    />
                                  </>
                                )}
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Left Side: Question Details */}
                <div className={`space-y-6 ${(selectedQuestion.section_type === 'grammar') ? 'xl:col-span-2' : ''}`}>
                  <div>
                    <label className="block text-sm font-bold text-text mb-2">نص السؤال</label>
                    <input 
                      type="text"
                      value={selectedQuestion.text}
                      onChange={(e) => updateQuestion(selectedQuestion.id, { text: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary font-bold"
                      placeholder="اكتب نص السؤال هنا..."
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-text mb-2">الخيارات (اختر الإجابة الصحيحة بالضغط على علامة الصح)</label>
                    {selectedQuestion.options.map((opt: any, optIdx: number) => (
                      <div key={optIdx} className={`flex items-center gap-3 p-2 rounded-xl border transition-colors ${opt.is_correct ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}>
                        <button 
                          onClick={() => setCorrectOption(selectedQuestion.id, optIdx)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${opt.is_correct ? 'bg-primary text-primary-foreground' : 'bg-border text-transparent hover:bg-border/50'}`}
                        >
                          <IconCheck size={14} stroke={3} />
                        </button>
                        <input 
                          type="text"
                          value={opt.text}
                          onChange={(e) => updateOption(selectedQuestion.id, optIdx, e.target.value)}
                          className="flex-1 bg-transparent focus:outline-none text-sm font-bold"
                          placeholder={`الخيار ${optIdx + 1}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-text mb-2">شرح الإجابة (اختياري)</label>
                    <textarea 
                      value={selectedQuestion.explanation || ""}
                      onChange={(e) => updateQuestion(selectedQuestion.id, { explanation: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl p-4 min-h-[100px] focus:outline-none focus:border-primary text-sm resize-y"
                      placeholder="اشرح للطالب لماذا هذه الإجابة هي الصحيحة..."
                    />
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
