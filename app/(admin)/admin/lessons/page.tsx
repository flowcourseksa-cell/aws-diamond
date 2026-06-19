"use client";

import { useState } from "react";
import {
  IconPlus, IconEdit, IconTrash, IconCheck, IconX,
  IconBook, IconPlayerPlay, IconLock, IconFilter,
  IconBrandYoutube,
} from "@tabler/icons-react";
import { usePlatformStore, type AdminLesson } from "@/lib/store";

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white" style={{ background: color }}>
      {label}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────
export default function AdminLessonsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const lessons = usePlatformStore(s => s.lessons);
  const setLessons = usePlatformStore(s => s.setLessons);
  const tracks = usePlatformStore(s => s.tracks);
  
  useEffect(() => setIsMounted(true), []);
  const [filterTrack, setFilterTrack] = useState<string>("all");
  
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<AdminLesson | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  // ── Form State ─────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [trackId, setTrackId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [duration, setDuration] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState(0);
  const [status, setStatus] = useState<AdminLesson["status"]>("normal");
  const [uploadMode, setUploadMode] = useState<"url" | "file">("url");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const trackSections = tracks.find(t => t.id === trackId)?.sections ?? [];

  function openAdd() {
    setEditingLesson(null);
    setTitle(""); setVideoUrl(""); setTeacherName("");
    setTrackId(tracks[0]?.id ?? ""); setSectionId(tracks[0]?.sections[0]?.id ?? "");
    setDuration(""); setIsFree(true); setPrice(0); setStatus("normal");
    setUploadMode("url");
    setFileToUpload(null);
    setUploadProgress(0);
    setIsUploading(false);
    setShowForm(true);
  }

  function openEdit(lesson: AdminLesson) {
    setEditingLesson(lesson);
    setTitle(lesson.title); setVideoUrl(lesson.videoUrl); setTeacherName(lesson.teacherName);
    setTrackId(lesson.trackId); setSectionId(lesson.sectionId);
    setDuration(lesson.durationLabel); setIsFree(lesson.accessType === "free");
    setPrice(lesson.price); setStatus(lesson.status);
    setUploadMode(lesson.videoUrl.startsWith("ملف محلي") ? "file" : "url");
    setFileToUpload(null);
    setUploadProgress(0);
    setIsUploading(false);
    setShowForm(true);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileToUpload(file);
    setVideoUrl(`ملف محلي: ${file.name}`);
    
    // Auto-extract video duration
    if (file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        const mins = Math.floor(video.duration / 60);
        const secs = Math.floor(video.duration % 60);
        setDuration(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      };
      video.src = url;
    }
  }

  function saveLesson() {
    if (uploadMode === "file" && fileToUpload) {
      setIsUploading(true);
      let p = 0;
      const interval = setInterval(() => {
        p += Math.floor(Math.random() * 20) + 10;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          setUploadProgress(100);
          setTimeout(finishSaving, 500);
        } else {
          setUploadProgress(p);
        }
      }, 400);
    } else {
      finishSaving();
    }
  }

  function finishSaving() {
    const newLesson: AdminLesson = {
      id: editingLesson?.id ?? `l-${Date.now()}`,
      title, videoUrl, teacherName, trackId, sectionId,
      durationLabel: duration || "00:00",
      accessType: isFree ? "free" : "paid", price: isFree ? 0 : price,
      status,
    };
    if (editingLesson) {
      setLessons(prev => prev.map(l => l.id === editingLesson.id ? newLesson : l));
    } else {
      setLessons(prev => [...prev, newLesson]);
    }
    setIsUploading(false);
    setUploadProgress(0);
    setShowForm(false);
  }

  function deleteLesson(id: string) {
    setLessons(prev => prev.filter(l => l.id !== id));
    setConfirmDel(null);
  }

  const filteredLessons = filterTrack === "all" ? lessons : lessons.filter(l => l.trackId === filterTrack);

  if (!isMounted) return <div className="p-8 text-center font-bold text-text-muted">جاري التحميل...</div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="fade-up rounded-2xl bg-sidebar px-7 py-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <IconBook size={26} />
              <h2 className="text-xl font-black">إدارة الدروس والفيديوهات</h2>
            </div>
            <p className="text-white/55 text-sm">رفع دروس جديدة، تحديد الأسعار، وتعيينها للمسارات والأقسام.</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 rounded-xl bg-accent-amber px-5 py-3 text-sm font-bold text-white hover:bg-accent-amber/90 transition-colors">
            <IconPlus size={17} /> درس جديد
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 fade-up">
        <IconFilter size={20} className="text-text-muted" />
        <select value={filterTrack} onChange={e => setFilterTrack(e.target.value)}
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary">
          <option value="all">جميع المسارات</option>
          {tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="fade-up rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-border bg-bg/60">
                {["العنوان", "المسار", "القسم", "المعلم", "المدة", "النوع", "إجراءات"].map(h => (
                  <th key={h} className="px-4 py-3.5 text-right text-xs font-black text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLessons.map(lesson => {
                const track = tracks.find(t => t.id === lesson.trackId);
                const section = track?.sections.find(s => s.id === lesson.sectionId);
                return (
                  <tr key={lesson.id} className="border-b border-border last:border-none hover:bg-bg/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 font-extrabold text-text">
                        <IconBrandYoutube size={16} className="text-red-500" />
                        {lesson.title}
                        {lesson.status === "new" && <span className="text-[10px] bg-accent-teal/20 text-accent-teal px-1.5 py-0.5 rounded-full">جديد</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {track && <Badge label={`${track.icon} ${track.name}`} color={track.color} />}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-text-muted">{section?.name ?? "—"}</td>
                    <td className="px-4 py-3.5 font-semibold">{lesson.teacherName}</td>
                    <td className="px-4 py-3.5 font-black">{lesson.durationLabel}</td>
                    <td className="px-4 py-3.5">
                      {lesson.accessType === "free"
                        ? <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs"><IconPlayerPlay size={12} /> مجاني</span>
                        : <span className="flex items-center gap-1 text-amber-600 font-bold text-xs"><IconLock size={12} /> {lesson.price} ر.س</span>
                      }
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(lesson)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted hover:border-primary hover:text-primary transition-colors">
                          <IconEdit size={13} />
                        </button>
                        {confirmDel === lesson.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => deleteLesson(lesson.id)}
                              className="flex h-7 items-center gap-1 rounded-lg bg-accent-red px-2 text-xs font-bold text-white">
                              <IconCheck size={11} /> نعم
                            </button>
                            <button onClick={() => setConfirmDel(null)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted">
                              <IconX size={11} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDel(lesson.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted hover:border-accent-red hover:text-accent-red transition-colors">
                            <IconTrash size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredLessons.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-text-muted font-bold">لا توجد دروس مطابقة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black">{editingLesson ? "تعديل الدرس" : "إضافة درس جديد"}</h3>
              <button onClick={() => setShowForm(false)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-text-muted hover:text-text"><IconX size={16} /></button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-black text-text-muted mb-1.5 block">عنوان الدرس</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: أساسيات الجبر..."
                  className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-text-muted mb-1.5 block">المسار</label>
                  <select value={trackId} onChange={e => { setTrackId(e.target.value); setSectionId(tracks.find(t => t.id === e.target.value)?.sections[0]?.id ?? ""); }}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary">
                    {tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-text-muted mb-1.5 block">القسم</label>
                  <select value={sectionId} onChange={e => setSectionId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary">
                    {trackSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                  <label className="text-xs font-black text-text-muted mb-1.5 block">اسم المعلم</label>
                  <input value={teacherName} onChange={e => setTeacherName(e.target.value)} placeholder="مثال: أ. محمد..."
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-black text-text-muted mb-1.5 block">مصدر الفيديو</label>
                  <div className="flex gap-2 mb-2">
                    <button onClick={() => setUploadMode("url")} className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition-colors ${uploadMode === "url" ? "border-primary bg-primary text-white" : "border-border text-text-muted"}`}>رابط خارجي</button>
                    <button onClick={() => setUploadMode("file")} className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition-colors ${uploadMode === "file" ? "border-primary bg-primary text-white" : "border-border text-text-muted"}`}>رفع من الجهاز</button>
                  </div>
                  {uploadMode === "url" ? (
                    <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://..."
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary text-left" dir="ltr" />
                  ) : (
                    <div className="relative">
                      <input type="file" accept="video/*" onChange={handleFileSelect} 
                        className="w-full text-sm text-text-muted file:mr-0 file:ml-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {uploadMode === "url" && (
                  <div>
                    <label className="text-xs font-black text-text-muted mb-1.5 block">المدة (مثال: 24:30)</label>
                    <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="00:00"
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-bold outline-none focus:border-primary text-center" dir="ltr" />
                  </div>
                )}
                <div className={uploadMode === "file" ? "col-span-2" : ""}>
                  <label className="text-xs font-black text-text-muted mb-1.5 block">النوع</label>
                  <div className="flex gap-2 mt-0.5">
                    {(["free", "paid"] as const).map(t => (
                      <button key={t} onClick={() => setIsFree(t === "free")}
                        className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-colors ${(isFree ? t === "free" : t === "paid") ? "border-primary bg-primary text-white" : "border-border text-text-muted"}`}>
                        {t === "free" ? "مجاني" : "مدفوع"}
                      </button>
                    ))}
                  </div>
                </div>
                {!isFree && (
                  <div>
                    <label className="text-xs font-black text-text-muted mb-1.5 block">السعر (ر.س)</label>
                    <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} min={0}
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-bold outline-none focus:border-primary text-center" />
                  </div>
                )}
              </div>

              <div>
                 <label className="text-xs font-black text-text-muted mb-1.5 block">الحالة (شارة)</label>
                 <select value={status} onChange={e => setStatus(e.target.value as AdminLesson["status"])}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary">
                    <option value="new">جديد</option>
                    <option value="normal">عادي</option>
                    <option value="completed">مكتمل</option>
                 </select>
              </div>

              {isUploading && (
                <div className="mt-2 mb-2">
                  <div className="flex justify-between text-xs font-bold text-text-muted mb-1">
                    <span>جاري الرفع والمعالجة...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
                <button onClick={() => setShowForm(false)} disabled={isUploading} className="px-5 py-2.5 text-sm font-bold text-text-muted hover:text-text transition-colors disabled:opacity-50">
                  إلغاء
                </button>
                <button onClick={saveLesson} disabled={!title.trim() || !sectionId || isUploading || (uploadMode === "file" && !fileToUpload && !videoUrl.startsWith("ملف محلي"))}
                  className="flex items-center gap-2 rounded-xl bg-accent-amber px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-amber/90 disabled:opacity-50">
                  <IconCheck size={16} /> حفظ الدرس
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
