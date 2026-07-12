"use client";

import { useState, useEffect } from "react";
import { IconX, IconTrash, IconBan, IconMessagePlus, IconUser, IconArrowBackUp } from "@tabler/icons-react";
import { 
  fetchLessonComments, 
  deleteLessonComment, 
  banStudentFromComments, 
  unbanStudentFromComments,
  getCommentBans,
  addLessonComment
} from "@/lib/supabase/services/lessons-actions";

export function AdminCommentsModal({ lessonId, lessonTitle, onClose }: { lessonId: string, lessonTitle: string, onClose: () => void }) {
  const [comments, setComments] = useState<any[]>([]);
  const [bans, setBans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const loadData = async () => {
    setLoading(true);
    const [fetchedComments, fetchedBans] = await Promise.all([
      fetchLessonComments(lessonId),
      getCommentBans(lessonId)
    ]);
    setComments(fetchedComments);
    setBans(fetchedBans);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [lessonId]);

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا التعليق؟")) {
      const ok = await deleteLessonComment(id);
      if (ok) setComments(prev => prev.filter(c => c.id !== id && c.parent_id !== id));
    }
  };

  const handleBan = async (studentId: string, global: boolean) => {
    if (confirm(`هل تريد حظر الطالب ${global ? 'في كل الدروس' : 'في هذا الدرس فقط'}؟`)) {
      const ok = await banStudentFromComments(studentId, global ? null : lessonId);
      if (ok) await loadData();
    }
  };

  const handleUnban = async (studentId: string, global: boolean) => {
    const ok = await unbanStudentFromComments(studentId, global ? null : lessonId);
    if (ok) await loadData();
  };

  const handleAdminReply = async (parentId: string) => {
    if (!replyBody.trim()) return;
    const added = await addLessonComment(lessonId, "admin-user", replyBody.trim(), parentId, true);
    if (added && !added.error) {
      setReplyBody("");
      setReplyingTo(null);
      await loadData();
    } else {
      alert(added?.error || "حدث خطأ");
    }
  };

  const rootComments = comments.filter(c => !c.parent_id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-bg shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-6">
          <h2 className="text-xl font-black">
            إدارة التعليقات <span className="text-primary text-sm">({lessonTitle})</span>
          </h2>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-text-muted hover:bg-border/50 hover:text-text transition-colors">
            <IconX size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          {loading ? (
            <div className="text-center font-bold text-text-muted">جاري التحميل...</div>
          ) : rootComments.length === 0 ? (
            <div className="text-center font-bold text-text-muted p-10 border border-dashed border-border rounded-2xl">
              لا توجد تعليقات في هذا الدرس.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {rootComments.map(c => {
                const replies = comments.filter(r => r.parent_id === c.id);
                const isBannedGlobally = bans.some(b => b.student_id === c.student_id && b.lesson_id === null);
                const isBannedLocally = bans.some(b => b.student_id === c.student_id && b.lesson_id === lessonId);

                return (
                  <div key={c.id} className="rounded-xl border border-border bg-card p-4">
                    {/* Root Comment */}
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${c.is_admin_reply ? 'bg-primary text-white' : 'bg-sidebar/50 text-text-muted'}`}>
                          {c.author_name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-bold ${c.is_admin_reply ? 'text-primary' : 'text-text'}`}>{c.author_name}</span>
                            {c.is_admin_reply && <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">الإدارة</span>}
                            {(isBannedGlobally || isBannedLocally) && <span className="text-[10px] font-bold bg-accent-red text-white px-2 py-0.5 rounded-full">محظور</span>}
                            <span className="text-xs text-text-muted">{new Date(c.created_at).toLocaleDateString('ar-SA')}</span>
                          </div>
                          <p className="text-sm text-text/90 whitespace-pre-wrap">{c.body}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      {!c.is_admin_reply && (
                        <div className="flex items-center gap-2 md:self-start">
                          <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)} className="text-xs flex items-center gap-1 text-primary hover:underline">
                            <IconArrowBackUp size={14} /> رد
                          </button>
                          {isBannedGlobally ? (
                            <button onClick={() => handleUnban(c.student_id, true)} className="flex items-center gap-1 text-xs font-bold text-white bg-accent-red/80 hover:bg-accent-red px-2 py-1 rounded">
                              <IconBan size={14} /> فك حظر كلي
                            </button>
                          ) : (
                            <button onClick={() => handleBan(c.student_id, true)} className="flex items-center gap-1 text-xs font-bold text-accent-red hover:underline bg-accent-red/10 px-2 py-1 rounded">
                              <IconBan size={14} /> حظر كلي
                            </button>
                          )}
                          {isBannedLocally ? (
                            <button onClick={() => handleUnban(c.student_id, false)} className="flex items-center gap-1 text-xs font-bold text-white bg-accent-amber/80 hover:bg-accent-amber px-2 py-1 rounded">
                              <IconBan size={14} /> فك حظر من الدرس
                            </button>
                          ) : (
                            <button onClick={() => handleBan(c.student_id, false)} className="flex items-center gap-1 text-xs font-bold text-accent-amber hover:underline bg-accent-amber/10 px-2 py-1 rounded">
                              <IconBan size={14} /> حظر من الدرس
                            </button>
                          )}
                          <button onClick={() => handleDelete(c.id)} className="flex items-center justify-center text-accent-red hover:bg-accent-red/10 p-1.5 rounded">
                            <IconTrash size={16} />
                          </button>
                        </div>
                      )}
                      {c.is_admin_reply && (
                        <div className="md:self-start">
                           <button onClick={() => handleDelete(c.id)} className="flex items-center justify-center text-accent-red hover:bg-accent-red/10 p-1.5 rounded">
                            <IconTrash size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Admin Reply Area */}
                    {replyingTo === c.id && (
                      <div className="mt-4 flex gap-2 border-t border-border pt-4">
                        <textarea
                          value={replyBody}
                          onChange={e => setReplyBody(e.target.value)}
                          placeholder="اكتب ردك كإدارة..."
                          className="flex-1 resize-none rounded-xl border border-border bg-bg p-3 text-sm text-text outline-none focus:border-primary"
                          rows={2}
                        />
                        <button 
                          onClick={() => handleAdminReply(c.id)}
                          disabled={!replyBody.trim()}
                          className="rounded-xl bg-primary px-5 font-bold text-white hover:bg-primary-dark disabled:opacity-50"
                        >
                          إرسال الرد
                        </button>
                      </div>
                    )}

                    {/* Replies */}
                    {replies.length > 0 && (
                      <div className="mt-4 flex flex-col gap-3 mr-6 border-r-2 border-border/50 pr-4">
                        {replies.map(r => {
                          const rBannedGlobal = bans.some(b => b.student_id === r.student_id && b.lesson_id === null);
                          const rBannedLocal = bans.some(b => b.student_id === r.student_id && b.lesson_id === lessonId);
                          
                          return (
                            <div key={r.id} className={`flex justify-between gap-4 p-3 rounded-xl border ${r.is_admin_reply ? 'border-primary/30 bg-primary/5' : 'border-border bg-bg'}`}>
                              <div className="flex gap-3">
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${r.is_admin_reply ? 'bg-primary text-white' : 'bg-sidebar/50 text-text-muted'}`}>
                                  {r.author_name.charAt(0)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-bold ${r.is_admin_reply ? 'text-primary' : 'text-text'}`}>{r.author_name}</span>
                                    {r.is_admin_reply && <span className="text-[9px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">الإدارة</span>}
                                    {(rBannedGlobal || rBannedLocal) && <span className="text-[9px] font-bold bg-accent-red text-white px-2 py-0.5 rounded-full">محظور</span>}
                                    <span className="text-[10px] text-text-muted">{new Date(r.created_at).toLocaleDateString('ar-SA')}</span>
                                  </div>
                                  <p className="text-[13px] text-text/90 whitespace-pre-wrap">{r.body}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 self-start">
                                {!r.is_admin_reply && (
                                  <>
                                    {rBannedGlobal ? (
                                      <button onClick={() => handleUnban(r.student_id, true)} className="text-[10px] font-bold text-white bg-accent-red/80 px-2 py-1 rounded">فك كلي</button>
                                    ) : (
                                      <button onClick={() => handleBan(r.student_id, true)} className="text-[10px] font-bold text-accent-red bg-accent-red/10 px-2 py-1 rounded">حظر كلي</button>
                                    )}
                                    {rBannedLocal ? (
                                      <button onClick={() => handleUnban(r.student_id, false)} className="text-[10px] font-bold text-white bg-accent-amber/80 px-2 py-1 rounded">فك جزئي</button>
                                    ) : (
                                      <button onClick={() => handleBan(r.student_id, false)} className="text-[10px] font-bold text-accent-amber bg-accent-amber/10 px-2 py-1 rounded">حظر جزئي</button>
                                    )}
                                  </>
                                )}
                                <button onClick={() => handleDelete(r.id)} className="flex items-center justify-center text-accent-red hover:bg-accent-red/10 p-1.5 rounded">
                                  <IconTrash size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
