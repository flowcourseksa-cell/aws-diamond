"use client";

import { useState, useEffect } from "react";
import {
  IconPlus, IconEdit, IconTrash, IconCheck, IconX,
  IconClipboardText, IconChevronDown, IconChevronUp,
  IconAlertTriangle, IconPlayerPlay, IconLock,
} from "@tabler/icons-react";
import { type SkillQuestion } from "@/lib/mock-data";
import { usePlatformStore, type AdminExam } from "@/lib/store";

type FormStep = 1 | 2 | 3;

const EMPTY_QUESTION = (): Omit<SkillQuestion, "id" | "skillId" | "skillName"> => ({
  questionText: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  explanation: "",
});

// ── Pill badge ────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white" style={{ background: color }}>
      {label}
    </span>
  );
}

// ── Step Indicator ────────────────────────────────────────────
function StepBar({ step }: { step: FormStep }) {
  const steps = ["المعلومات الأساسية", "الأسئلة", "مراجعة وحفظ"];
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((label, i) => {
        const n = (i + 1) as FormStep;
        const done = step > n;
        const active = step === n;
        return (
          <div key={i} className="flex items-center gap-0 flex-1">
            <div className="flex flex-col items-center gap-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black border-2 transition-all ${
                active ? "border-primary bg-primary text-white" :
                done ? "border-emerald-500 bg-emerald-500 text-white" :
                "border-border bg-card text-text-muted"
              }`}>
                {done ? <IconCheck size={14}/> : n}
              </div>
              <span className={`text-[10.5px] font-bold hidden sm:block ${active ? "text-primary" : done ? "text-emerald-600" : "text-text-muted"}`}>
                {label}
              </span>
            </div>
            {i < 2 && (
              <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all ${done ? "bg-emerald-400" : "bg-border"}`}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminExamsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const exams = usePlatformStore(s => s.exams);
  const setExams = usePlatformStore(s => s.setExams);
  const tracks = usePlatformStore(s => s.tracks);

  useEffect(() => setIsMounted(true), []);

  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [showForm,    setShowForm]    = useState(false);
  const [editingExam, setEditingExam] = useState<AdminExam | null>(null);
  const [confirmDel,  setConfirmDel]  = useState<string | null>(null);

  // ── Form state ─────────────────────────────────────────────
  const [step,     setStep]     = useState<FormStep>(1);
  const [formName, setFormName] = useState("");
  const [formTrack, setFormTrack] = useState("");
  const [formSection, setFormSection] = useState("");
  const [formTime,  setFormTime]  = useState(15);
  const [formFree,  setFormFree]  = useState(true);
  const [formPrice, setFormPrice] = useState(0);
  const [formQuestions, setFormQuestions] = useState<ReturnType<typeof EMPTY_QUESTION>[]>([EMPTY_QUESTION()]);

  const trackSections = tracks.find(t => t.id === formTrack)?.sections ?? [];

  function openAdd() {
    setEditingExam(null);
    setFormName(""); setFormTrack(tracks[0]?.id ?? "");
    setFormSection(tracks[0]?.sections[0]?.id ?? "");
    setFormTime(15); setFormFree(true); setFormPrice(0);
    setFormQuestions([EMPTY_QUESTION()]);
    setStep(1); setShowForm(true);
  }

  function openEdit(exam: AdminExam) {
    setEditingExam(exam);
    setFormName(exam.name); setFormTrack(exam.trackId);
    setFormSection(exam.sectionId); setFormTime(exam.timeMinutes);
    setFormFree(exam.accessType === "free"); setFormPrice(exam.price);
    setFormQuestions(exam.questions.map(q => ({
      questionText: q.questionText, options: [...q.options],
      correctIndex: q.correctIndex, explanation: q.explanation ?? "",
    })));
    setStep(1); setShowForm(true);
  }

  function saveExam() {
    const track = tracks.find(t => t.id === formTrack);
    const section = track?.sections.find(s => s.id === formSection);
    const newExam: AdminExam = {
      id: editingExam?.id ?? `e-${Date.now()}`,
      trackId: formTrack, sectionId: formSection,
      name: formName, timeMinutes: formTime,
      accessType: formFree ? "free" : "paid", price: formFree ? 0 : formPrice,
      questions: formQuestions.map((q, i) => ({
        id: `q-${Date.now()}-${i}`,
        skillId: "custom", skillName: section?.name ?? "",
        questionText: q.questionText, options: q.options,
        correctIndex: q.correctIndex, explanation: q.explanation,
      })),
    };
    if (editingExam) {
      setExams(prev => prev.map(e => e.id === editingExam.id ? newExam : e));
    } else {
      setExams(prev => [...prev, newExam]);
    }
    setShowForm(false);
  }

  function deleteExam(id: string) {
    setExams(prev => prev.filter(e => e.id !== id));
    setConfirmDel(null);
  }

  function updateQuestion(idx: number, field: string, value: string | number) {
    setFormQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  }

  function updateOption(qIdx: number, optIdx: number, value: string) {
    setFormQuestions(prev => prev.map((q, i) =>
      i === qIdx ? { ...q, options: q.options.map((o, j) => j === optIdx ? value : o) } : q
    ));
  }

  if (!isMounted) return <div className="p-8 text-center font-bold text-text-muted">جاري التحميل...</div>;

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="fade-up rounded-2xl bg-sidebar px-7 py-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <IconClipboardText size={26}/>
              <h2 className="text-xl font-black">إنشاء وإدارة الاختبارات</h2>
            </div>
            <p className="text-white/55 text-sm">أضف اختبارات لكل قسم — حدد الأسئلة والخيارات والإجابات الصحيحة</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 rounded-xl bg-accent-amber px-5 py-3 text-sm font-bold text-white hover:bg-accent-amber/90 transition-colors">
            <IconPlus size={17}/> اختبار جديد
          </button>
        </div>
      </div>

      {/* Exams Table */}
      <div className="fade-up rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-border bg-bg/60">
                {["الاختبار", "المسار", "القسم", "الأسئلة", "الوقت", "النوع", "إجراءات"].map(h => (
                  <th key={h} className="px-4 py-3.5 text-right text-xs font-black text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exams.map(exam => {
                const track = tracks.find(t => t.id === exam.trackId);
                const section = track?.sections.find(s => s.id === exam.sectionId);
                const expanded = expandedId === exam.id;
                return [
                  <tr key={exam.id} className="border-b border-border last:border-none hover:bg-bg/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setExpandedId(expanded ? null : exam.id)}
                          className="flex items-center gap-2 font-extrabold text-text hover:text-primary transition-colors">
                          {expanded ? <IconChevronUp size={14}/> : <IconChevronDown size={14}/>}
                          {exam.name}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {track && <Badge label={`${track.icon} ${track.name}`} color={track.color} />}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-text-muted">{section?.name ?? "—"}</td>
                    <td className="px-4 py-3.5 font-black">{exam.questions.length}</td>
                    <td className="px-4 py-3.5 font-semibold">{exam.timeMinutes} دقيقة</td>
                    <td className="px-4 py-3.5">
                      {exam.accessType === "free"
                        ? <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs"><IconPlayerPlay size={12}/> مجاني</span>
                        : <span className="flex items-center gap-1 text-amber-600 font-bold text-xs"><IconLock size={12}/> {exam.price} ر.س</span>
                      }
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(exam)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted hover:border-primary hover:text-primary transition-colors">
                          <IconEdit size={13}/>
                        </button>
                        {confirmDel === exam.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => deleteExam(exam.id)}
                              className="flex h-7 items-center gap-1 rounded-lg bg-accent-red px-2 text-xs font-bold text-white">
                              <IconCheck size={11}/> نعم
                            </button>
                            <button onClick={() => setConfirmDel(null)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted">
                              <IconX size={11}/>
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDel(exam.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted hover:border-accent-red hover:text-accent-red transition-colors">
                            <IconTrash size={13}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>,

                  // Expanded questions view
                  expanded && (
                    <tr key={`${exam.id}-q`} className="border-b border-border">
                      <td colSpan={7} className="px-6 py-4 bg-bg/50">
                        <div className="text-xs font-black text-text-muted uppercase tracking-wider mb-3">أسئلة الاختبار</div>
                        <div className="flex flex-col gap-2.5">
                          {exam.questions.map((q, qi) => (
                            <div key={q.id} className="rounded-xl border border-border bg-card p-3.5">
                              <div className="font-bold text-sm mb-2.5 flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[10px] font-black flex-shrink-0">{qi + 1}</span>
                                {q.questionText}
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                {q.options.map((opt, oi) => (
                                  <div key={oi} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${oi === q.correctIndex ? "bg-emerald-50 border border-emerald-300 text-emerald-700" : "bg-bg border border-border text-text-muted"}`}>
                                    <span className="font-black">{["أ","ب","ج","د"][oi]}.</span> {opt}
                                    {oi === q.correctIndex && <IconCheck size={12} className="mr-auto text-emerald-600"/>}
                                  </div>
                                ))}
                              </div>
                              {q.explanation && (
                                <div className="mt-2 text-xs text-text-muted font-semibold border-r-2 border-primary/40 pr-2">💡 {q.explanation}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ),
                ].filter(Boolean);
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Overlay */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-black/45 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black">{editingExam ? "تعديل الاختبار" : "إضافة اختبار جديد"}</h3>
              <button onClick={() => setShowForm(false)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-text-muted hover:text-text"><IconX size={16}/></button>
            </div>

            <StepBar step={step} />

            {/* Step 1: Basic info */}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-black text-text-muted mb-1.5 block">اسم الاختبار</label>
                  <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="مثال: اختبار الجبر الشامل"
                    className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm font-semibold outline-none focus:border-primary"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-black text-text-muted mb-1.5 block">المسار</label>
                    <select value={formTrack} onChange={e => { setFormTrack(e.target.value); setFormSection(tracks.find(t => t.id === e.target.value)?.sections[0]?.id ?? ""); }}
                      className="w-full rounded-xl border border-border bg-bg px-3 py-3 text-sm font-semibold outline-none focus:border-primary">
                      {tracks.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-text-muted mb-1.5 block">القسم</label>
                    <select value={formSection} onChange={e => setFormSection(e.target.value)}
                      className="w-full rounded-xl border border-border bg-bg px-3 py-3 text-sm font-semibold outline-none focus:border-primary">
                      {trackSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-black text-text-muted mb-1.5 block">الوقت (دقيقة)</label>
                    <input type="number" value={formTime} onChange={e => setFormTime(Number(e.target.value))} min={1}
                      className="w-full rounded-xl border border-border bg-bg px-3 py-3 text-sm font-bold outline-none focus:border-primary text-center"/>
                  </div>
                  <div>
                    <label className="text-xs font-black text-text-muted mb-1.5 block">النوع</label>
                    <div className="flex gap-2 mt-0.5">
                      {(["free", "paid"] as const).map(t => (
                        <button key={t} onClick={() => setFormFree(t === "free")}
                          className={`flex-1 rounded-xl border py-2.5 text-xs font-bold transition-colors ${(formFree ? t === "free" : t === "paid") ? "border-primary bg-primary text-white" : "border-border text-text-muted"}`}>
                          {t === "free" ? "مجاني" : "مدفوع"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {!formFree && (
                    <div>
                      <label className="text-xs font-black text-text-muted mb-1.5 block">السعر (ر.س)</label>
                      <input type="number" value={formPrice} onChange={e => setFormPrice(Number(e.target.value))} min={0}
                        className="w-full rounded-xl border border-border bg-bg px-3 py-3 text-sm font-bold outline-none focus:border-primary text-center"/>
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-2">
                  <button onClick={() => setStep(2)} disabled={!formName.trim() || !formSection}
                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed">
                    التالي — الأسئلة <IconChevronDown size={16} className="rotate-[-90deg]"/>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Questions */}
            {step === 2 && (
              <div className="flex flex-col gap-4 max-h-[55vh] overflow-y-auto">
                {formQuestions.map((q, qi) => (
                  <div key={qi} className="rounded-xl border border-border bg-bg p-4 relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-[10px] font-black">{qi + 1}</span>
                      {formQuestions.length > 1 && (
                        <button onClick={() => setFormQuestions(prev => prev.filter((_, i) => i !== qi))}
                          className="text-accent-red/60 hover:text-accent-red transition-colors"><IconTrash size={14}/></button>
                      )}
                    </div>
                    <input value={q.questionText} onChange={e => updateQuestion(qi, "questionText", e.target.value)}
                      placeholder="نص السؤال..."
                      className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold mb-3 outline-none focus:border-primary"/>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${oi === q.correctIndex ? "border-emerald-400 bg-emerald-50" : "border-border bg-card"}`}>
                          <button onClick={() => updateQuestion(qi, "correctIndex", oi)}
                            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-black transition-all ${oi === q.correctIndex ? "border-emerald-500 bg-emerald-500 text-white" : "border-border"}`}>
                            {oi === q.correctIndex && <IconCheck size={11}/>}
                          </button>
                          <input value={opt} onChange={e => updateOption(qi, oi, e.target.value)}
                            placeholder={`الخيار ${["أ","ب","ج","د"][oi]}`}
                            className="flex-1 bg-transparent text-xs font-semibold outline-none min-w-0"/>
                        </div>
                      ))}
                    </div>
                    <input value={q.explanation} onChange={e => updateQuestion(qi, "explanation", e.target.value)}
                      placeholder="الشرح (اختياري)..."
                      className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold outline-none focus:border-primary"/>
                  </div>
                ))}

                <button onClick={() => setFormQuestions(prev => [...prev, EMPTY_QUESTION()])}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-bold text-text-muted hover:border-primary hover:text-primary transition-colors">
                  <IconPlus size={15}/> إضافة سؤال جديد
                </button>

                <div className="flex justify-between sticky bottom-0 bg-card pt-2 border-t border-border">
                  <button onClick={() => setStep(1)} className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-text-muted hover:text-text">
                    <IconChevronDown size={16} className="rotate-90"/> رجوع
                  </button>
                  <button onClick={() => setStep(3)} disabled={formQuestions.some(q => !q.questionText.trim())}
                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-40">
                    مراجعة وحفظ <IconChevronDown size={16} className="-rotate-90"/>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-border bg-bg p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="font-black text-text-muted">الاختبار</span><span className="font-extrabold">{formName}</span></div>
                  <div className="flex justify-between"><span className="font-black text-text-muted">المسار</span><span className="font-bold">{tracks.find(t => t.id === formTrack)?.name}</span></div>
                  <div className="flex justify-between"><span className="font-black text-text-muted">القسم</span><span className="font-bold">{trackSections.find(s => s.id === formSection)?.name}</span></div>
                  <div className="flex justify-between"><span className="font-black text-text-muted">الوقت</span><span className="font-bold">{formTime} دقيقة</span></div>
                  <div className="flex justify-between"><span className="font-black text-text-muted">الأسئلة</span><span className="font-bold">{formQuestions.length} سؤال</span></div>
                  <div className="flex justify-between"><span className="font-black text-text-muted">النوع</span><span className={`font-bold ${formFree ? "text-emerald-600" : "text-amber-600"}`}>{formFree ? "مجاني" : `مدفوع — ${formPrice} ر.س`}</span></div>
                </div>
                <div className="flex justify-between">
                  <button onClick={() => setStep(2)} className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-text-muted hover:text-text">
                    <IconChevronDown size={16} className="rotate-90"/> تعديل الأسئلة
                  </button>
                  <button onClick={saveExam}
                    className="flex items-center gap-2 rounded-xl bg-accent-amber px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-amber/90">
                    <IconCheck size={16}/> حفظ الاختبار
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
