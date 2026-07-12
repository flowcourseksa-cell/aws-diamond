"use client";

import { useState, useEffect } from "react";
import {
  IconPlus, IconEdit, IconTrash, IconCheck, IconX,
  IconBook, IconPlayerPlay, IconLock, IconFilter,
  IconBrandYoutube, IconMessageCircle, IconAlertTriangle,
} from "@tabler/icons-react";
import dynamic from "next/dynamic";
import { fetchCourses } from "@/lib/supabase/services/courses";
import { fetchHierarchyByCourse, type DbTrack } from "@/lib/supabase/services/hierarchy";
import { fetchLessonsByTracks, type DbLesson } from "@/lib/supabase/services/lessons";
import { createLesson, updateLesson, deleteLesson, getVideoUploadUrl, getPublicVideoUrl, uploadLessonCoverImage } from "@/lib/supabase/services/lessons-actions";
import { type Course } from "@/lib/store";
import { AdminCommentsModal } from "./AdminCommentsModal";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

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
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string>("");
  const [tracks, setTracks] = useState<DbTrack[]>([]);
  const [lessons, setLessons] = useState<DbLesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [commentsLesson, setCommentsLesson] = useState<DbLesson | null>(null);

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
        fetchLessonsByTracks(trackIds).then(lessonData => {
          setLessons(lessonData);
          setIsLoading(false);
        });
      });
    } else {
      setTracks([]);
      setLessons([]);
    }
  }, [activeCourseId]);

  const [filterTrack, setFilterTrack] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<DbLesson | null>(null);
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
  const [status, setStatus] = useState<DbLesson["status"]>("normal");
  const [uploadMode, setUploadMode] = useState<"url" | "file">("url");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [commentsEnabled, setCommentsEnabled] = useState(true);

  const activeTrack = tracks.find(t => t.id === trackId);
  const trackSections = activeTrack?.sections ?? [];

  function openAdd() {
    setEditingLesson(null);
    setTitle(""); setVideoUrl(""); setTeacherName("");
    setTrackId(tracks[0]?.id ?? ""); 
    setSectionId(tracks[0]?.sections?.[0]?.id ?? "");
    setDuration(""); setIsFree(true); setPrice(0); setStatus("normal");
    setUploadMode("url");
    setFileToUpload(null);
    setCoverImageFile(null);
    setCommentsEnabled(true);
    setUploadProgress(0);
    setIsUploading(false);
    setShowForm(true);
  }

  function openEdit(lesson: DbLesson) {
    setEditingLesson(lesson);
    setTitle(lesson.title); setVideoUrl(lesson.video_url); setTeacherName(lesson.teacher_name || "");
    setTrackId(lesson.track_id); setSectionId(lesson.section_id || "");
    
    // Quick duration formatter (assuming stored in seconds)
    if (lesson.duration_seconds) {
      const m = Math.floor(lesson.duration_seconds / 60);
      const s = lesson.duration_seconds % 60;
      setDuration(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    } else {
      setDuration("");
    }

    setIsFree(lesson.access_type === "free");
    setPrice(lesson.price || 0); setStatus(lesson.status || "normal");
    setUploadMode(lesson.video_url.startsWith("ملف محلي") || lesson.video_url.startsWith("http") && !lesson.video_url.includes("youtube") ? "file" : "url");
    setFileToUpload(null);
    setCoverImageFile(null);
    setCommentsEnabled(lesson.comments_enabled ?? true);
    setUploadProgress(0);
    setIsUploading(false);
    setShowForm(true);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileToUpload(file);
    setVideoUrl(`ملف محلي: ${file.name}`);
    
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

  async function saveLesson() {
    setIsUploading(true);
    let finalVideoUrl = videoUrl;
    let finalCoverUrl = editingLesson?.cover_image || undefined;

    if (uploadMode === "file" && fileToUpload) {
      // Generate a unique filename to prevent "The resource already exists" errors
      const ext = fileToUpload.name.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      
      const signedUrlData = await getVideoUploadUrl(uniqueFileName);
      if (signedUrlData && signedUrlData.signedUrl) {
        // Upload video file directly
        try {
          const req = new XMLHttpRequest();
          req.open("PUT", signedUrlData.signedUrl, true);
          
          await new Promise((resolve, reject) => {
            req.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                setUploadProgress(Math.round((e.loaded / e.total) * 90));
              }
            };
            req.onload = () => {
              if (req.status >= 200 && req.status < 300) resolve(true);
              else reject("Upload failed");
            };
            req.onerror = () => reject("Upload failed");
            req.send(fileToUpload);
          });
          
          finalVideoUrl = await getPublicVideoUrl(signedUrlData.path);
          setUploadProgress(95);
        } catch (err) {
          console.error(err);
          alert("حدث خطأ أثناء رفع الفيديو. يرجى المحاولة مرة أخرى.");
          setIsUploading(false);
          return;
        }
      } else {
        alert("فشل في تهيئة رابط الرفع السحابي. يرجى المحاولة مرة أخرى.");
        setIsUploading(false);
        return;
      }
    }

    if (coverImageFile) {
      const fd = new FormData();
      fd.append("file", coverImageFile);
      const url = await uploadLessonCoverImage(fd);
      if (url) finalCoverUrl = url;
    }

    setUploadProgress(100);
    finishSaving(finalVideoUrl, finalCoverUrl);
  }

  async function finishSaving(finalVideoUrl: string = videoUrl, finalCoverUrl?: string) {
    let durationSecs = 0;
    if (duration && duration.includes(":")) {
      const [m, s] = duration.split(":");
      durationSecs = (parseInt(m) || 0) * 60 + (parseInt(s) || 0);
    } else if (duration) {
      durationSecs = parseInt(duration) * 60;
    }

    const payload: Partial<DbLesson> = {
      title, 
      video_url: finalVideoUrl, 
      teacher_name: teacherName, 
      track_id: trackId, 
      section_id: sectionId || null,
      duration_seconds: durationSecs,
      access_type: isFree ? "free" : "paid", 
      price: isFree ? 0 : price,
      status,
      cover_image: finalCoverUrl,
      comments_enabled: commentsEnabled,
    };

    if (editingLesson) {
      const success = await updateLesson(editingLesson.id, payload);
      if (success) {
        setLessons(prev => prev.map(l => l.id === editingLesson.id ? { ...l, ...payload } as DbLesson : l));
      }
    } else {
      const newLesson = await createLesson(payload);
      if (newLesson) {
        setLessons(prev => [newLesson, ...prev]);
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
    setShowForm(false);
  }

  async function handleDeleteLesson(id: string) {
    const success = await deleteLesson(id);
    if (success) {
      setLessons(prev => prev.filter(l => l.id !== id));
    } else {
      alert("لا يمكن حذف هذا الدرس، قد يكون مرتبطاً بمهارة موجودة. يرجى إزالة الارتباط أولاً.");
    }
    setConfirmDel(null);
  }

  const filteredLessons = filterTrack === "all" ? lessons : lessons.filter(l => l.track_id === filterTrack);

  if (!isMounted) return <div className="p-8 text-center font-bold text-text-muted">جاري التحميل...</div>;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Header */}
      <div className="fade-up rounded-2xl bg-sidebar px-7 py-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <IconBook size={26} />
            <h2 className="text-xl font-black">إدارة الدروس والفيديوهات</h2>
          </div>
          <p className="text-white/55 text-sm">رفع دروس جديدة، تحديد الأسعار، وتعيينها للمسارات والأقسام.</p>
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
            <IconPlus size={17} /> درس جديد
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-text-muted font-bold">جاري جلب بيانات الدروس...</div>
      ) : (
        <>
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
                    const track = tracks.find(t => t.id === lesson.track_id);
                    const section = track?.sections?.find(s => s.id === lesson.section_id);
                    
                    let durationLabel = "—";
                    if (lesson.duration_seconds) {
                       const m = Math.floor(lesson.duration_seconds / 60);
                       const s = lesson.duration_seconds % 60;
                       durationLabel = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                    }

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
                          {track ? <Badge label={`${track.icon || '📝'} ${track.name}`} color={track.color || '#6366f1'} /> : "—"}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-text-muted">{section?.name ?? "—"}</td>
                        <td className="px-4 py-3.5 font-semibold">{lesson.teacher_name || "—"}</td>
                        <td className="px-4 py-3.5 font-black">{durationLabel}</td>
                        <td className="px-4 py-3.5">
                          {lesson.access_type === "free"
                            ? <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs"><IconPlayerPlay size={12} /> مجاني</span>
                            : <span className="flex items-center gap-1 text-amber-600 font-bold text-xs"><IconLock size={12} /> {lesson.price} ر.س</span>
                          }
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setCommentsLesson(lesson)}
                              title="إدارة التعليقات"
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted hover:border-primary hover:text-primary transition-colors">
                              <IconMessageCircle size={13} />
                            </button>
                            <button onClick={() => openEdit(lesson)}
                              title="تعديل"
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted hover:border-primary hover:text-primary transition-colors">
                              <IconEdit size={13} />
                            </button>
                            {confirmDel === lesson.id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleDeleteLesson(lesson.id)}
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
        </>
      )}

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
                  <select value={trackId} onChange={e => { setTrackId(e.target.value); setSectionId(tracks.find(t => t.id === e.target.value)?.sections?.[0]?.id ?? ""); }}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary">
                    {tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-text-muted mb-1.5 block">القسم</label>
                  <select value={sectionId} onChange={e => setSectionId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary">
                    <option value="">-- بدون قسم --</option>
                    {trackSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                 <div>
                  <label className="text-xs font-black text-text-muted mb-1.5 block">اسم المعلم</label>
                  <input value={teacherName} onChange={e => setTeacherName(e.target.value)} placeholder="مثال: أ. محمد..."
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-black text-text-muted mb-1.5 block">مصدر الفيديو</label>
                  <div className="flex gap-4 mb-3">
                    <button onClick={() => setUploadMode("url")} className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors ${uploadMode === "url" ? "bg-primary text-white" : "border border-border text-text-muted hover:border-primary"}`}>رابط خارجي</button>
                    <button onClick={() => setUploadMode("file")} className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors ${uploadMode === "file" ? "bg-primary text-white" : "border border-border text-text-muted hover:border-primary"}`}>رفع من الجهاز</button>
                  </div>
                  {uploadMode === "url" ? (
                    <>
                      <input type="text" className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-[13.5px] font-semibold outline-none focus:border-primary" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="رابط يوتيوب أو فيديو..." />
                      {videoUrl && (
                        <div className="hidden">
                          <ReactPlayer 
                            url={videoUrl} 
                            onDuration={(d: number) => {
                              const mins = Math.floor(d / 60);
                              const secs = Math.floor(d % 60);
                              setDuration(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
                            }} 
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="relative">
                      <input type="file" accept="video/*" onChange={handleFileSelect} 
                        className="w-full text-sm text-text-muted file:mr-0 file:ml-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-text-muted mb-1.5 block">صورة الغلاف للدرس (اختياري)</label>
                <div className="flex items-center gap-3 relative">
                  <input type="file" accept="image/*" onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)} className="w-full text-sm text-text-muted file:mr-0 file:ml-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
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
                 <select value={status || "normal"} onChange={e => setStatus(e.target.value as DbLesson["status"])}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary">
                    <option value="new">جديد</option>
                    <option value="normal">عادي</option>
                    <option value="completed">مكتمل</option>
                 </select>
              </div>

              <div className="flex items-center gap-3 bg-bg rounded-xl p-4 border border-border">
                <input 
                  type="checkbox" 
                  id="commentsEnabled" 
                  checked={commentsEnabled} 
                  onChange={(e) => setCommentsEnabled(e.target.checked)} 
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="commentsEnabled" className="text-sm font-bold text-text cursor-pointer">
                  تفعيل التعليقات على هذا الدرس
                </label>
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
                <button onClick={saveLesson} disabled={!title.trim() || !trackId || isUploading || (uploadMode === "file" && !fileToUpload && !videoUrl)}
                  className="flex items-center gap-2 rounded-xl bg-accent-amber px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-amber/90 disabled:opacity-50">
                  <IconCheck size={16} /> حفظ الدرس
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {commentsLesson && (
        <AdminCommentsModal 
          lessonId={commentsLesson.id} 
          lessonTitle={commentsLesson.title} 
          onClose={() => setCommentsLesson(null)} 
        />
      )}
    </div>
  );
}

