"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconPlus, IconEdit, IconTrash, IconCheck, IconX,
  IconClipboardText, IconChevronDown, IconChevronUp,
  IconPlayerPlay, IconLock, IconTool,
} from "@tabler/icons-react";
import { fetchCourses } from "@/lib/supabase/services/courses";
import { fetchHierarchyByCourse, type DbTrack } from "@/lib/supabase/services/hierarchy";
import { fetchExamsByTracks, createExam, updateExam, deleteExam, type DbExam } from "@/lib/supabase/services/exams";
import { type Course } from "@/lib/store";

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white" style={{ background: color }}>
      {label}
    </span>
  );
}

export default function AdminExamsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string>("");
  const [tracks, setTracks] = useState<DbTrack[]>([]);
  const [exams, setExams] = useState<DbExam[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchCourses().then(data => {
      setCourses(data);
      if (data.length > 0) setActiveCourseId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (activeCourseId) {
      setIsLoading(true);
      fetchHierarchyByCourse(activeCourseId).then(hierarchy => {
        setTracks(hierarchy);
        const trackIds = hierarchy.map(t => t.id);
        fetchExamsByTracks(trackIds).then(examData => {
          setExams(examData);
          setIsLoading(false);
        });
      });
    } else {
      setTracks([]);
      setExams([]);
    }
  }, [activeCourseId]);

  const [filterTrack, setFilterTrack] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState<DbExam | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  // ── Form State ─────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [trackId, setTrackId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [timeMinutes, setTimeMinutes] = useState(15);
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState(0);
  const [isPublished, setIsPublished] = useState(false);

  const trackSections = tracks.find(t => t.id === trackId)?.sections ?? [];

  function openAdd() {
    setEditingExam(null);
    setTitle(""); 
    setTrackId(tracks[0]?.id ?? "");
    setSectionId(tracks[0]?.sections?.[0]?.id ?? "");
    setTimeMinutes(15); 
    setIsFree(true); 
    setPrice(0);
    setIsPublished(false);
    setShowForm(true);
  }

  function openEdit(exam: DbExam) {
    setEditingExam(exam);
    setTitle(exam.title); 
    setTrackId(exam.track_id); 
    setSectionId(exam.section_id || "");
    setTimeMinutes(Math.floor(exam.time_limit_seconds / 60));
    setIsFree(exam.access_type === "free"); 
    setPrice(exam.price || 0);
    setIsPublished(exam.is_published);
    setShowForm(true);
  }

  async function saveExam() {
    const payload: Partial<DbExam> = {
      title, 
      track_id: trackId, 
      section_id: sectionId || null,
      time_limit_seconds: timeMinutes * 60,
      access_type: isFree ? "free" : "paid", 
      price: isFree ? 0 : price,
      is_published: isPublished,
    };

    if (editingExam) {
      const success = await updateExam(editingExam.id, payload);
      if (success) {
        setExams(prev => prev.map(e => e.id === editingExam.id ? { ...e, ...payload } as DbExam : e));
      }
    } else {
      const newExam = await createExam(payload);
      if (newExam) {
        setExams(prev => [newExam, ...prev]);
        // Ideally we redirect to the builder here, but for now we just show it in the list
      }
    }
    setShowForm(false);
  }

  async function handleDeleteExam(id: string) {
    const success = await deleteExam(id);
    if (success) {
      setExams(prev => prev.filter(e => e.id !== id));
    }
    setConfirmDel(null);
  }

  const filteredExams = filterTrack === "all" ? exams : exams.filter(e => e.track_id === filterTrack);

  if (!isMounted) return <div className="p-8 text-center font-bold text-text-muted">جاري التحميل...</div>;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Header */}
      <div className="fade-up rounded-2xl bg-sidebar px-7 py-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <IconClipboardText size={26} />
            <h2 className="text-xl font-black">إدارة الاختبارات</h2>
          </div>
          <p className="text-white/55 text-sm">أضف اختبارات أساسية، ثم استخدم المصمم لإضافة الأسئلة المرتبطة بالمهارات.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
             <span className="text-sm font-bold text-white/80">الدورة:</span>
             <select 
               className="bg-bg text-text border border-border rounded-xl px-3 py-2 text-sm font-bold outline-none"
               value={activeCourseId}
               onChange={(e) => setActiveCourseId(e.target.value)}
             >
               {courses.length === 0 && <option value="">لا توجد دورات</option>}
               {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
             </select>
          </div>
          <button onClick={openAdd} disabled={!activeCourseId}
            className="flex items-center gap-2 rounded-xl bg-accent-amber px-5 py-2 text-sm font-bold text-white hover:bg-accent-amber/90 transition-colors disabled:opacity-50">
            <IconPlus size={17} /> إضافة اختبار
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-text-muted font-bold">جاري جلب بيانات الاختبارات...</div>
      ) : (
        <>
          {/* Table */}
          <div className="fade-up rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-[13.5px]">
                <thead>
                  <tr className="border-b border-border bg-bg/60">
                    {["الاختبار", "المسار", "الوقت", "النوع", "الحالة", "إجراءات"].map(h => (
                      <th key={h} className="px-4 py-3.5 text-right text-xs font-black text-text-muted uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredExams.map(exam => {
                    const track = tracks.find(t => t.id === exam.track_id);
                    return (
                      <tr key={exam.id} className="border-b border-border last:border-none hover:bg-bg/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 font-extrabold text-text">
                            {exam.title}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {track ? <Badge label={`${track.icon || '📝'} ${track.name}`} color={track.color || '#6366f1'} /> : "—"}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-text-muted">{Math.floor(exam.time_limit_seconds / 60)} دقيقة</td>
                        <td className="px-4 py-3.5">
                          {exam.access_type === "free"
                            ? <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs"><IconPlayerPlay size={12} /> مجاني</span>
                            : <span className="flex items-center gap-1 text-amber-600 font-bold text-xs"><IconLock size={12} /> {exam.price} ر.س</span>
                          }
                        </td>
                        <td className="px-4 py-3.5">
                          {exam.is_published 
                            ? <Badge label="منشور" color="#10b981" /> 
                            : <Badge label="مسودة" color="#f59e0b" />}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {/* Builder Button */}
                            <Link href={`/admin-khaled-ksa-aws-2026-org/exams/${exam.id}/builder`}
                              className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                              title="تصميم الأسئلة">
                              <IconTool size={13} /> مصمم الأسئلة
                            </Link>
                            
                            <button onClick={() => openEdit(exam)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted hover:border-primary hover:text-primary transition-colors">
                              <IconEdit size={13} />
                            </button>
                            {confirmDel === exam.id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleDeleteExam(exam.id)}
                                  className="flex h-7 items-center gap-1 rounded-lg bg-accent-red px-2 text-xs font-bold text-white">
                                  <IconCheck size={11} /> نعم
                                </button>
                                <button onClick={() => setConfirmDel(null)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted">
                                  <IconX size={11} />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmDel(exam.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted hover:border-accent-red hover:text-accent-red transition-colors">
                                <IconTrash size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredExams.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-text-muted font-bold">لا توجد اختبارات. أضف اختباراً جديداً.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black">{editingExam ? "تعديل إعدادات الاختبار" : "إضافة اختبار جديد"}</h3>
              <button onClick={() => setShowForm(false)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-text-muted hover:text-text"><IconX size={16} /></button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-black text-text-muted mb-1.5 block">اسم الاختبار</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: اختبار القدرات الشامل..."
                  className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-text-muted mb-1.5 block">المسار (الأساس)</label>
                  <select value={trackId} onChange={e => { setTrackId(e.target.value); setSectionId(tracks.find(t => t.id === e.target.value)?.sections?.[0]?.id ?? ""); }}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary">
                    {tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-text-muted mb-1.5 block">القسم (اختياري)</label>
                  <select value={sectionId} onChange={e => setSectionId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary">
                    <option value="">-- عام للمسار بالكامل --</option>
                    {trackSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-black text-text-muted mb-1.5 block">المدة (دقائق)</label>
                  <input type="number" value={timeMinutes} onChange={e => setTimeMinutes(Number(e.target.value))} min={1}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-bold outline-none focus:border-primary text-center" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-black text-text-muted mb-1.5 block">نوع الوصول</label>
                  <div className="flex gap-2 mt-0.5">
                    {(["free", "paid"] as const).map(t => (
                      <button key={t} onClick={() => setIsFree(t === "free")}
                        className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-colors ${(isFree ? t === "free" : t === "paid") ? "border-primary bg-primary text-white" : "border-border text-text-muted"}`}>
                        {t === "free" ? "مجاني" : "مدفوع"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {!isFree && (
                <div>
                  <label className="text-xs font-black text-text-muted mb-1.5 block">السعر (ر.س)</label>
                  <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} min={0}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-bold outline-none focus:border-primary text-center" />
                </div>
              )}

              <div className="flex items-center gap-3 mt-2 p-3 rounded-xl border border-border bg-bg">
                <input type="checkbox" id="published" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} 
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <label htmlFor="published" className="text-sm font-bold text-text select-none cursor-pointer">
                  نشر الاختبار مباشرة للطلاب
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
                <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-sm font-bold text-text-muted hover:text-text transition-colors">
                  إلغاء
                </button>
                <button onClick={saveExam} disabled={!title.trim() || !trackId}
                  className="flex items-center gap-2 rounded-xl bg-accent-amber px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-amber/90 disabled:opacity-50">
                  <IconCheck size={16} /> حفظ البيانات الأساسية
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

