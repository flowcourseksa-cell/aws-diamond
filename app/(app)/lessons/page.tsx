// @ts-nocheck
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  IconSearch, IconPlayerPlay, IconPlayerPause, IconCheck,
  IconLock, IconArrowRight, IconVideo, IconUser, IconBrain, IconCrown, IconTrash, IconBan, IconEdit
} from "@tabler/icons-react";
import { useToast } from "@/components/ui/toast";
import { ProgressBar } from "@/components/ui/progress-bar";
import { usePlatformStore, type AdminLesson } from "@/lib/store";
import { useRouter, useSearchParams } from "next/navigation";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useVideoStore } from "@/lib/video-store";
import { useAuth } from "@/hooks/use-auth";
import { markLessonCompleted, fetchUserProgress } from "@/lib/supabase/services/progress";
import { grantRemedialAttempt, saveLessonProgressTime, getLessonProgressTime } from "@/app/actions/progress";
import { addLessonComment, deleteLessonComment, fetchLessonComments, banStudentFromComments, editLessonComment } from "@/lib/supabase/services/lessons-actions";
import { useSyncStore } from "@/lib/sync-store";
import dynamic from "next/dynamic";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

// ── بيانات الدروس مرتبطة بالمسارات الصحيحة ────────────────

type TrackLesson = {
  id: string;
  trackId: string;
  trackName: string;
  trackColor: string;
  sectionName: string;
  title: string;
  teacherName: string;
  durationLabel: string;
  progressPercent: number;
  status: "" | "new" | "done";
  accessType: "free" | "paid";
  price: number;
  videoUrl: string;
  coverUrl?: string;
  commentsEnabled?: boolean;
};

// ── Filters ───────────────────────────────────────────────────

// ── Comments Component ───────────────────────────────────────
function LessonComments({ lessonId, commentsEnabled }: { lessonId: string, commentsEnabled: boolean }) {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  useEffect(() => {
    if (commentsEnabled) {
      fetchLessonComments(lessonId).then(data => {
        setComments(data);
        setIsLoading(false);
      });
    }
  }, [lessonId, commentsEnabled]);

  const handleSubmit = async (parentId?: string) => {
    if (!user) {
      showToast("يرجى تسجيل الدخول أولاً لإضافة تعليق", "warning");
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const added = await addLessonComment(lessonId, user.id, newComment.trim(), parentId, profile?.role === "admin");
    if (added && !added.error) {
      setComments(prev => [...prev, added]);
      setNewComment("");
      setReplyingTo(null);
      showToast("تم إضافة تعليقك بنجاح", "success");
    } else {
      showToast(added?.error || "حدث خطأ أثناء إضافة التعليق", "error");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التعليق؟")) return;
    const ok = await deleteLessonComment(id);
    if (ok) {
      setComments(prev => prev.filter(c => c.id !== id));
      showToast("تم الحذف بنجاح", "success");
    } else {
      showToast("فشل الحذف", "error");
    }
  };

  const handleBan = async (studentId: string, global: boolean) => {
    if (!confirm(global ? "حظر نهائي للطالب من التعليقات؟" : "حظر الطالب من هذا الدرس؟")) return;
    const ok = await banStudentFromComments(studentId, global ? null : lessonId);
    if (ok) {
      showToast("تم حظر الطالب بنجاح", "success");
    } else {
      showToast("فشل الحظر", "error");
    }
  };

  const handleEditSave = async (id: string) => {
    if (!editBody.trim()) return;
    const ok = await editLessonComment(id, editBody.trim());
    if (ok) {
      setComments(prev => prev.map(c => c.id === id ? { ...c, body: editBody.trim() } : c));
      setEditingId(null);
      showToast("تم تعديل التعليق بنجاح", "success");
    } else {
      showToast("فشل التعديل", "error");
    }
  };

  if (!commentsEnabled) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-border p-5 text-center text-sm font-bold text-text-muted">
        التعليقات مغلقة لهذا الدرس 🔒
      </div>
    );
  }

  const rootComments = comments.filter(c => !c.parent_id);

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-4 text-lg font-black flex items-center gap-2">
        <IconUser size={22} className="text-primary" />
        النقاشات والأسئلة ({comments.length})
      </h3>

      <div className="mb-6 flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
          {user ? user.email?.charAt(0).toUpperCase() : "?"}
        </div>
        <div className="flex-1">
          <textarea
            value={!replyingTo ? newComment : ""}
            onChange={e => { if(!replyingTo) setNewComment(e.target.value); }}
            onFocus={() => setReplyingTo(null)}
            placeholder="اكتب سؤالك أو استفسارك هنا..."
            className="w-full resize-none rounded-[10px] border border-border bg-bg p-3.5 text-[13.5px] text-text outline-none focus:border-primary"
            rows={3}
          />
          <button 
            onClick={() => handleSubmit()} 
            disabled={isSubmitting || (!newComment.trim() && !replyingTo)}
            className="mt-2.5 h-10 rounded-[10px] bg-primary px-5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {isSubmitting && !replyingTo ? "جاري الإرسال..." : "إرسال التعليق"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-sm text-text-muted">جاري تحميل التعليقات...</div>
      ) : rootComments.length === 0 ? (
        <div className="text-center text-sm text-text-muted p-4 border border-dashed border-border rounded-xl">
          لا توجد تعليقات بعد، كن أول من يسأل!
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {rootComments.map(c => {
            const replies = comments.filter(r => r.parent_id === c.id);
            return (
              <div key={c.id} className={`flex flex-col gap-3 rounded-xl p-4 ${c.is_admin_reply ? 'bg-orange-500/5 border border-orange-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]' : 'bg-bg border border-border'}`}>
                <div className="flex gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${c.is_admin_reply ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md' : 'bg-sidebar/50 text-text-muted'}`}>
                    {c.is_admin_reply ? <IconCrown size={22} className="text-white drop-shadow" /> : c.author_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-bold ${c.is_admin_reply ? 'text-orange-500' : 'text-text'}`}>
                        {c.is_admin_reply ? 'الإدارة' : c.author_name}
                      </span>
                      {c.is_admin_reply && (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                          <IconCrown size={12} />
                          إدارة المنصة
                        </span>
                      )}
                      <span className="text-xs text-text-muted">
                        {new Date(c.created_at).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    {editingId === c.id ? (
                      <div className="mt-2 flex gap-2">
                        <textarea
                          value={editBody}
                          onChange={e => setEditBody(e.target.value)}
                          className="w-full resize-none rounded-[10px] border border-border bg-card p-2 text-[12.5px] text-text outline-none focus:border-primary"
                          rows={2}
                        />
                        <div className="flex flex-col gap-2">
                          <button onClick={() => handleEditSave(c.id)} className="rounded-[10px] bg-primary px-3 py-1 text-xs font-bold text-white">حفظ</button>
                          <button onClick={() => setEditingId(null)} className="rounded-[10px] bg-bg px-3 py-1 text-xs font-bold text-text-muted">إلغاء</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[13.5px] leading-relaxed text-text/90 whitespace-pre-wrap">{c.body}</p>
                    )}
                    
                    <div className="mt-2 flex items-center gap-2">
                      <button 
                        onClick={() => { setReplyingTo(replyingTo === c.id ? null : c.id); setNewComment(""); }}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        {replyingTo === c.id ? "إلغاء الرد" : "رد"}
                      </button>
                      <span className="text-[11px] text-text-muted">({replies.length}/6 ردود)</span>

                      {profile?.role === "admin" && (
                        <div className="flex items-center gap-3 mr-auto">
                          <button onClick={() => { setEditingId(c.id); setEditBody(c.body); }} className="text-primary hover:scale-110 transition-transform" title="تعديل التعليق">
                            <IconEdit size={15} />
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:scale-110 transition-transform" title="حذف التعليق">
                            <IconTrash size={15} />
                          </button>
                          {!c.is_admin_reply && (
                            <>
                              <button onClick={() => handleBan(c.student_id, false)} className="text-orange-500 hover:scale-110 transition-transform" title="حظر الطالب من هذا الدرس">
                                <IconBan size={15} />
                              </button>
                              <button onClick={() => handleBan(c.student_id, true)} className="text-red-600 hover:scale-110 transition-transform" title="حظر الطالب نهائياً من كافة الدروس">
                                <IconBan size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {replyingTo === c.id && (
                       <div className="mt-3 flex gap-2">
                          <textarea
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder="اكتب ردك هنا..."
                            className="w-full resize-none rounded-[10px] border border-border bg-card p-2 text-[12.5px] text-text outline-none focus:border-primary"
                            rows={2}
                          />
                          <button 
                            onClick={() => handleSubmit(c.id)} 
                            disabled={isSubmitting || !newComment.trim()}
                            className="h-full rounded-[10px] bg-primary px-4 text-xs font-bold text-white hover:bg-primary-dark disabled:opacity-50"
                          >
                            {isSubmitting ? "..." : "إرسال"}
                          </button>
                       </div>
                    )}
                  </div>
                </div>
                
                {replies.length > 0 && (
                  <div className="mr-8 flex flex-col gap-3 border-r-2 border-border/50 pr-4">
                    {replies.map(r => (
                      <div key={r.id} className="flex gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${r.is_admin_reply ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-sm' : 'bg-sidebar/50 text-text-muted'}`}>
                          {r.is_admin_reply ? <IconCrown size={16} className="text-white" /> : r.author_name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold ${r.is_admin_reply ? 'text-orange-500' : 'text-text'}`}>
                              {r.is_admin_reply ? 'الإدارة' : r.author_name}
                            </span>
                            {r.is_admin_reply && (
                              <span className="flex items-center gap-1 text-[9px] font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                                <IconCrown size={10} />
                                إدارة المنصة
                              </span>
                            )}
                            <span className="text-[10px] text-text-muted">
                              {new Date(r.created_at).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                          {editingId === r.id ? (
                            <div className="mt-2 flex gap-2">
                              <textarea
                                value={editBody}
                                onChange={e => setEditBody(e.target.value)}
                                className="w-full resize-none rounded-[10px] border border-border bg-card p-2 text-[12.5px] text-text outline-none focus:border-primary"
                                rows={2}
                              />
                              <div className="flex flex-col gap-2">
                                <button onClick={() => handleEditSave(r.id)} className="rounded-[10px] bg-primary px-3 py-1 text-xs font-bold text-white">حفظ</button>
                                <button onClick={() => setEditingId(null)} className="rounded-[10px] bg-bg px-3 py-1 text-xs font-bold text-text-muted">إلغاء</button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[12.5px] leading-relaxed text-text/90 whitespace-pre-wrap">{r.body}</p>
                          )}

                          {profile?.role === "admin" && (
                            <div className="mt-2 flex items-center gap-3">
                              <button onClick={() => { setEditingId(r.id); setEditBody(r.body); }} className="text-primary hover:scale-110 transition-transform" title="تعديل التعليق">
                                <IconEdit size={14} />
                              </button>
                              <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:scale-110 transition-transform" title="حذف التعليق">
                                <IconTrash size={14} />
                              </button>
                              {!r.is_admin_reply && (
                                <>
                                  <button onClick={() => handleBan(r.student_id, false)} className="text-orange-500 hover:scale-110 transition-transform" title="حظر الطالب من هذا الدرس">
                                    <IconBan size={14} />
                                  </button>
                                  <button onClick={() => handleBan(r.student_id, true)} className="text-red-600 hover:scale-110 transition-transform" title="حظر الطالب نهائياً من كافة الدروس">
                                    <IconBan size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Video Player ─────────────────────────────────────────────
function VideoPlayer({ lesson, onBack, onComplete, examId, remediateSkillIds, showRemedialBanner = true }: {
  lesson: TrackLesson;
  onBack: () => void;
  onComplete: () => void;
  examId: string | null;
  remediateSkillIds: string | null;
  showRemedialBanner?: boolean;
}) {
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(lesson.progressPercent);
  const [completed, setCompleted] = useState(lesson.status === "done");
  const { showToast } = useToast();
  const maxTimeRef = useRef(0);
  const playerRef = useRef<ReactPlayer>(null);
  const [isClient, setIsClient] = useState(false);

  const { user } = useAuth();
  const [isGranting, setIsGranting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [savedTime, setSavedTime] = useState(0);

  // 1. Load saved time on mount
  useEffect(() => {
    if (user && !completed && isClient) {
      getLessonProgressTime(user.id, lesson.id).then((time) => {
        if (time > 0) {
          maxTimeRef.current = time;
          setSavedTime(time);
        }
      });
    }
  }, [user, lesson.id, completed, isClient]);

  const handlePlayerReady = () => {
    if (savedTime > 0 && playerRef.current) {
      playerRef.current.seekTo(savedTime, "seconds");
    }
  };

  // 2. Save progress periodically
  useEffect(() => {
    if (!user || completed) return;
    const interval = setInterval(() => {
      if (playing && playerRef.current) {
        saveLessonProgressTime(user.id, lesson.id, Math.floor(playerRef.current.getCurrentTime()));
      }
    }, 5000); // Save every 5 seconds while playing
    return () => clearInterval(interval);
  }, [user, lesson.id, playing, completed]);

  const handleProgress = (state: { playedSeconds: number }) => {
    if (completed) return;
    // Anti-skip logic
    if (state.playedSeconds > maxTimeRef.current + 2) {
      if (playerRef.current) {
        playerRef.current.seekTo(maxTimeRef.current, "seconds");
        showToast("عذراً، لا يمكنك تخطي أجزاء من الدرس 🚫", "error");
      }
    } else {
      if (state.playedSeconds > maxTimeRef.current) {
        maxTimeRef.current = state.playedSeconds;
      }
    }
  };

  return (
    <div>
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-[13.5px] font-bold text-text-muted hover:text-primary">
        <IconArrowRight size={18} /> العودة لقائمة الدروس
      </button>

      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-[#0A0A0F] shadow-xl">
        <div
          className="relative flex h-[300px] items-center justify-center sm:h-[450px] bg-black group"
          onContextMenu={(e) => e.preventDefault()}
        >
          {lesson.videoUrl && isClient ? (
            <>
              <ReactPlayer 
                ref={(player: any) => { playerRef.current = player; }}
                url={lesson.videoUrl}
                className="w-full h-full"
                width="100%"
                height="100%"
                controls 
                playing={playing}
                onReady={handlePlayerReady}
                onPlay={() => setPlaying(true)}
                onPause={() => {
                  setPlaying(false);
                  if (user && !completed && playerRef.current) {
                    saveLessonProgressTime(user.id, lesson.id, Math.floor(playerRef.current.getCurrentTime()));
                  }
                }}
                onProgress={handleProgress}
                onEnded={() => {
                  setPlaying(false);
                  setProgress(100);
                  if (!completed) {
                    setCompleted(true);
                    onComplete();
                    showToast("تم إكمال الدرس ✅", "success");
                  }
                }}
                config={{
                  youtube: {
                    playerVars: { rel: 0, modestbranding: 1 }
                  },
                  file: {
                    attributes: {
                      controlsList: "nodownload noremoteplayback",
                      disablePictureInPicture: true,
                      onContextMenu: (e: any) => e.preventDefault(),
                    }
                  }
                }}
              />
              {/* Transparent overlay to block right-click / save on the video */}
              <div
                className="absolute inset-0 z-10 pointer-events-none select-none"
                onContextMenu={(e) => e.preventDefault()}
              />
            </>
          ) : (
            <>
              <IconVideo size={64} className="text-white opacity-10" />
              <button onClick={() => setPlaying(p => !p)}
                className="absolute flex h-18 w-18 items-center justify-center rounded-full bg-white/15 text-white transition-all hover:scale-105 hover:bg-white/25">
                {playing ? <IconPlayerPause size={30} /> : <IconPlayerPlay size={30} />}
              </button>
              {playing && <div className="absolute bottom-3 left-3 rounded-lg bg-black/50 px-2.5 py-1 text-xs font-bold text-white">يتم التشغيل...</div>}
            </>
          )}

          <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100">
            <span className="rounded-lg px-3 py-1 text-xs font-bold text-white" style={{ background: lesson.trackColor }}>
              {lesson.trackName}
            </span>
            <span className="rounded-lg bg-black/50 px-2.5 py-1 text-xs font-bold text-white">{lesson.sectionName}</span>
          </div>
        </div>
        {!lesson.videoUrl && (
          <div className="flex items-center gap-3 bg-[#0F1117] px-4 py-3">
            <button onClick={() => setPlaying(p => !p)} className="text-white hover:text-primary">
              {playing ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
            </button>
            <div className="flex-1"><ProgressBar percent={progress} color={lesson.trackColor} /></div>
            <span className="text-xs font-bold text-white/60">{lesson.durationLabel}</span>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: lesson.trackColor }}>{lesson.sectionName}</span>
        </div>
        <h2 className="my-2 text-lg font-extrabold">{lesson.title}</h2>
        <div className="mb-5 flex items-center gap-2 text-[12.5px] text-text-muted"><IconUser size={15} />{lesson.teacherName}</div>
        
        {completed ? (
          <div className="mb-2 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-accent-teal/10 text-sm font-extrabold text-accent-teal">
            <IconCheck size={18} /> تم إكمال الدرس بنجاح
          </div>
        ) : (
          <div className="mb-2 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-primary/10 text-sm font-extrabold text-primary">
            استمر في مشاهدة الدرس حتى النهاية لاجتيازه 🚀
          </div>
        )}

        {examId && showRemedialBanner && (
          <div className="mt-4 rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div>
                <h3 className="font-extrabold text-indigo-900 mb-1 flex items-center gap-2">
                  <IconAlertTriangle size={18} className="text-indigo-600"/>
                  أنت هنا لمراجعة المهارات الضعيفة!
                </h3>
                <p className="text-sm font-medium text-indigo-700">
                  هل أتممت المراجعة وأصبحت جاهزاً؟ اضغط على الزر لفتح محاولة جديدة في الاختبار.
                </p>
              </div>
              <button 
                disabled={isGranting}
                onClick={async () => {
                  if (!user) return;
                  setIsGranting(true);
                  const res = await grantRemedialAttempt(user.id, examId, remediateSkillIds ? remediateSkillIds.split(",")[0] : undefined);
                  
                  if (res.success) {
                    try {
                      const { fetchUserProgress } = await import("@/lib/supabase/services/progress");
                      const { skills: updatedSkills, lessons: updatedLessons } = await fetchUserProgress(user.id);
                      usePlatformStore.getState().applyUserProgress(updatedSkills, updatedLessons);
                    } catch (e) {
                      console.error("Failed to sync progress:", e);
                    }
                    showToast("تم فتح محاولة جديدة بنجاح! جاري العودة للاختبار...", "success");
                    setTimeout(() => router.push("/exams"), 1500);
                  } else {
                    setIsGranting(false);
                    showToast(res.error || "حدث خطأ ما.", "error");
                  }
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {isGranting ? "جاري الفتح..." : "أتممت المراجعة - افتح لي المحاولة (+1)"}
              </button>
            </div>
          </div>
        )}

      </div>

      <LessonComments lessonId={lesson.id} commentsEnabled={lesson.commentsEnabled ?? true} />
    </div>
  );
}

export default function LessonsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { lessons, tracks: storeTracks, isDataLoading, markLessonAsCompleted: storeMarkLessonAsCompleted, applyUserProgress } = usePlatformStore();
  const searchParams = useSearchParams();
  const lessonIdParam = searchParams.get("lessonId") || searchParams.get("id");
  const examIdParam = searchParams.get("examId");
  const remediateSkillIdsParam = searchParams.get("remediateSkillIds");
  
  useEffect(() => setIsMounted(true), []);

  const [filter, setFilter]       = useState("all");
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState<TrackLesson | null>(null);
  const [done, setDone]           = useState<Set<string>>(new Set());
  const [resolvedExamId, setResolvedExamId] = useState<string | null>(examIdParam);
  const { showToast }             = useToast();
  const { user }                  = useAuth();
  const hasSub = true;
  const { pendingExams } = useSyncStore();

  const storeExams = usePlatformStore(s => s.exams);
  const [statsMap, setStatsMap] = useState<Record<string, { bestScore: number; attemptsCount: number; maxAttempts: number }>>({});
  const lastStatsFetchRef = useRef<number>(0);

  useEffect(() => {
    if (!user) return;
    const now = Date.now();
    // Throttle: only fetch if 5 minutes have passed (same as exams-client)
    if (now - lastStatsFetchRef.current < 5 * 60 * 1000) return;
    lastStatsFetchRef.current = now;
    import("@/lib/supabase/services/progress").then(m => {
      m.fetchAllExamsStatsMap(user.id).then(setStatsMap).catch(console.error);
    });
  }, [user?.id]);

  useEffect(() => {
    if (examIdParam) {
      setResolvedExamId(examIdParam);
      return;
    }
    
    if (selected && user && storeExams.length > 0) {
      // Find all exams related to this lesson locally
      const relatedExams = storeExams.filter(e => e.sectionId === selected.sectionId || (selected.trackId && e.trackId === selected.trackId));
      
      for (const exam of relatedExams) {
        if (statsMap[exam.id]) {
          const examStats = statsMap[exam.id];
          const official = examStats.attemptsCount;
          const max = examStats.maxAttempts;
          
          // If exhausted (official >= max) and hasn't hit hard limit (max < 10) and not perfect score
          if (official >= max && max < 10 && examStats.bestScore < 100) {
            setResolvedExamId(exam.id);
            return;
          }
        }
      }
    }
    setResolvedExamId(null);
  }, [selected, user, examIdParam, storeExams, statsMap]);

  // Use all tracks directly - free platform
  const activeTracks = storeTracks;
  const activeLessons = lessons;

  const mappedLessons: TrackLesson[] = activeLessons.map(l => {
    const track = activeTracks.find(t => t.id === l.trackId);
    const section = track?.sections.find(s => s.id === l.sectionId);
    return {
      id: l.id,
      trackId: l.trackId,
      trackName: track?.name ?? "مسار محذوف",
      trackColor: track?.color ?? "#888",
      sectionName: section?.name ?? "قسم محذوف",
      title: l.title,
      teacherName: l.teacherName,
      durationLabel: l.durationLabel,
      progressPercent: l.progressPercent || 0,
      status: l.status === "completed" ? "done" : l.status === "new" ? "new" : "",
      accessType: l.accessType,
      price: l.price,
      videoUrl: l.videoUrl,
      coverUrl: l.coverImage,
      commentsEnabled: l.commentsEnabled,
    };
  });

  const filtered = mappedLessons.filter(l => {
    const mf = filter === "all" || l.trackId === filter;
    const ms = l.title.includes(search) || l.sectionName.includes(search) || l.teacherName.includes(search);
    return mf && ms;
  });

  const trackFilters = [
    { value: "all", label: "كل المسارات" },
    ...activeTracks.map(t => ({ value: t.id, label: t.name }))
  ];

  useEffect(() => {
    if (isMounted && lessonIdParam && !selected && mappedLessons.length > 0) {
      const l = mappedLessons.find(x => x.id === lessonIdParam);
      if (l) setSelected(l);
    }
  }, [isMounted, lessonIdParam, selected, mappedLessons]);

  function open(l: TrackLesson) {
    if (l.accessType === "paid" && !hasSub) {
      showToast(`هذا الدرس مدفوع (${l.price} ر.س) — اشترك للوصول`, "warning");
      return;
    }
    setSelected(l);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!isMounted || isDataLoading) return <div className="p-8 text-center font-bold">جاري التحميل...</div>;

  if (selected) {
    const s = resolvedExamId && statsMap[resolvedExamId] ? statsMap[resolvedExamId] : { bestScore: 0, attemptsCount: 0, maxAttempts: 5 };
    const pendingCount = resolvedExamId ? pendingExams.filter(p => p.examId === resolvedExamId).length : 0;
    const trueAttemptsCount = s.attemptsCount + pendingCount;
    const showBanner = resolvedExamId ? (trueAttemptsCount < 10 && s.bestScore < 100) : false;

    return (
      <VideoPlayer
        lesson={selected}
        examId={resolvedExamId}
        showRemedialBanner={showBanner}
        remediateSkillIds={remediateSkillIdsParam}
        onBack={async () => {
          setSelected(null);
          if (user) {
            try {
              const { skills, lessons } = await fetchUserProgress(user.id);
              usePlatformStore.getState().applyUserProgress(skills, lessons);
            } catch (e) {
              console.error("Failed to sync progress on back", e);
            }
          }
        }}
        onComplete={async () => {
          setDone(p => new Set([...p, selected.id]));
          usePlatformStore.getState().markLessonAsCompleted(selected.id);
          if (user) {
            await markLessonCompleted(user.id, selected.id);
            try {
              const { skills, lessons } = await fetchUserProgress(user.id);
              usePlatformStore.getState().applyUserProgress(skills, lessons);
            } catch (e) {
              console.error("Failed to sync progress on complete", e);
            }
          }
        }}
      />
    );
  }

  return (
    <>
      {/* Header */}
      <section className="fade-up rounded-2xl bg-sidebar px-7 py-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <IconVideo size={26} />
          <h2 className="text-xl font-black">الدروس والشروحات</h2>
        </div>
        <p className="text-white/55 text-sm">شروحات مرتبطة بكل مسار وقسم — ابدأ من أي نقطة</p>
      </section>

      {/* Filters + Search */}
      <section className="fade-up flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {trackFilters.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`whitespace-nowrap rounded-[10px] border px-4 py-2.25 text-[13px] font-bold transition-colors ${filter === f.value ? "border-primary bg-primary text-white" : "border-border bg-card text-text-muted hover:border-primary hover:text-primary"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-[220px]">
          <IconSearch size={17} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث عن درس أو قسم..."
            className="h-10.5 w-full rounded-[10px] border border-border bg-card pr-10 pl-4 text-[13.5px] text-text outline-none focus:border-primary" />
        </div>
      </section>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-text-muted">
          لا توجد دروس مطابقة
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l, i) => {
            const isDone  = done.has(l.id) || l.status === "done";
            const locked  = l.accessType === "paid" && !hasSub;
            return (
              <div key={l.id} onClick={() => open(l)}
                className={`fade-up delay-${(i % 4) + 1} flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.75 hover:shadow-lg`}>
                {/* Thumbnail */}
                <div className="relative flex h-36 items-center justify-center overflow-hidden" style={{ background: l.coverUrl ? `url(${l.coverUrl}) center/cover` : `${l.trackColor}18` }}>
                  {!l.coverUrl && <IconPlayerPlay size={38} style={{ color: l.trackColor }} className="opacity-80" />}
                  {l.coverUrl && <div className="absolute inset-0 bg-black/10" />}
                  {isDone && <div className="absolute right-2.5 top-2.5 flex items-center gap-1 z-10 rounded-lg bg-accent-teal px-2.5 py-1 text-[10.5px] font-extrabold text-white"><IconCheck size={12} />مكتمل</div>}
                  {!isDone && l.status === "new" && <div className="absolute right-2.5 top-2.5 z-10 rounded-lg bg-accent-red px-2.5 py-1 text-[10.5px] font-extrabold text-white">جديد</div>}
                  {locked && <div className="absolute left-2.5 top-2.5 flex items-center gap-1 z-10 rounded-lg bg-accent-amber px-2.5 py-1 text-[10.5px] font-extrabold text-white"><IconLock size={12} />{l.price} ر.س</div>}
                  <div className="absolute bottom-2.5 left-2.5 z-10 rounded-lg bg-black/60 px-2 py-0.75 text-[11px] font-bold text-white">{l.durationLabel}</div>
                  {/* Track badge */}
                  <div className="absolute bottom-2.5 right-2.5 z-10 rounded-lg px-2 py-0.75 text-[10px] font-bold text-white shadow-sm" style={{ background: l.trackColor }}>
                    {l.sectionName}
                  </div>
                </div>
                {/* Info */}
                <div className="flex flex-1 flex-col gap-2.5 p-4">
                  <div className="text-[14.5px] font-extrabold leading-tight">{l.title}</div>
                  <div className="text-[11.5px] font-bold" style={{ color: l.trackColor }}>{l.trackName}</div>
                  <div className="flex items-center gap-2 text-[12px] text-text-muted"><IconUser size={13} />{l.teacherName}</div>
                  <div>
                    <div className="mb-1.5 flex justify-between text-[11.5px] font-bold text-text-muted">
                      <span>تقدمك</span><span>{isDone ? 100 : l.progressPercent}%</span>
                    </div>
                    <ProgressBar percent={isDone ? 100 : l.progressPercent} color={l.trackColor} />
                  </div>
                  <button onClick={e => { e.stopPropagation(); open(l); }}
                    className={`mt-auto h-10 rounded-[10px] text-[13px] font-bold transition-colors ${locked ? "bg-accent-amber-light text-accent-amber hover:bg-accent-amber hover:text-white" : isDone ? "bg-accent-teal-light text-accent-teal" : "bg-primary text-white hover:bg-primary-dark"}`}>
                    {locked ? `مدفوع — ${l.price} ر.س` : isDone ? "مراجعة الدرس" : l.progressPercent > 0 ? "استكمال الدرس" : "ابدأ الآن"}
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </>
  );
}
