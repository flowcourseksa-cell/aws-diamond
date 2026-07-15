// @ts-nocheck
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  IconChevronRight, IconChevronLeft, IconMessageCircle2, IconSend, IconBook2, IconX, IconTrash,
  IconCrown, IconEdit, IconBan, IconZoomIn, IconZoomOut
} from "@tabler/icons-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  type BookPage, type BookComment, type Book,
  addPageComment, deleteMyComment, fetchPageComments
} from "@/lib/supabase/services/book";
import { deleteBookComment, toggleStudentCommentBan, editBookComment } from "@/lib/supabase/services/book-actions";
import { useAuth } from "@/hooks/use-auth";

import type { Course } from "@/lib/store";

type FlipBookProps = {
  pages: BookPage[];
  book?: Book;
  course?: Course;
};

// RTL flip book: "next" page = swipe to the LEFT (Arabic reading direction
// moves forward leftwards), "previous" = swipe to the RIGHT.
export function FlipBook({ pages, book, course }: FlipBookProps) {
  const [index, setIndex] = useState(0);
  const [flip, setFlip] = useState<"next" | "prev" | null>(null);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const total = pages.length;
  const page = pages[index];

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i >= total - 1) return i;
      setFlip("next");
      return i + 1;
    });
  }, [total]);

  const goPrev = useCallback(() => {
    setIndex((i) => {
      if (i <= 0) return i;
      setFlip("prev");
      return i - 1;
    });
  }, []);

  // Clear the flip animation class after it plays.
  useEffect(() => {
    if (!flip) return;
    const t = setTimeout(() => setFlip(null), 450);
    return () => clearTimeout(t);
  }, [flip, index]);

  // Keyboard arrows (RTL aware).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goNext();
      if (e.key === "ArrowRight") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  // Keyboard arrows for fullscreen modal
  useEffect(() => {
    if (fullscreenIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setFullscreenIndex(prev => prev !== null && prev < total - 1 ? prev + 1 : prev);
      }
      if (e.key === "ArrowRight") {
        setFullscreenIndex(prev => prev !== null && prev > 0 ? prev - 1 : prev);
      }
      if (e.key === "Escape") {
        setFullscreenIndex(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreenIndex, total]);

  // Preload next and prev images to eliminate lag when turning pages
  useEffect(() => {
    if (total === 0) return;
    
    // Preload next page
    if (index + 1 < total && pages[index + 1]?.image_url) {
      const img = new Image();
      img.src = pages[index + 1].image_url!;
    }
    
    // Preload prev page
    if (index - 1 >= 0 && pages[index - 1]?.image_url) {
      const img = new Image();
      img.src = pages[index - 1].image_url!;
    }
  }, [index, total, pages]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const THRESHOLD = 50;
    if (dx <= -THRESHOLD) goNext();   // swipe left -> next (RTL forward)
    else if (dx >= THRESHOLD) goPrev(); // swipe right -> previous
    touchStartX.current = null;
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card py-20 text-center">
        <IconBook2 size={44} className="text-text-muted/40" />
        <p className="font-bold text-text-muted">لا توجد صفحات في الكتاب بعد.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Book surface */}
      <div className="relative mx-auto w-full max-w-[1000px] group flex items-center justify-center">
        {/* Left Arrow (Next Page in RTL) */}
        <button
          onClick={goNext}
          disabled={index >= total - 1}
          className="absolute -left-12 md:-left-16 top-1/2 -translate-y-1/2 p-3 text-slate-400 hover:text-primary transition-colors disabled:opacity-30 disabled:hover:text-slate-400 z-10 hidden sm:block"
        >
          <IconChevronLeft size={36} />
        </button>

        <div
          className="relative w-full select-none"
          style={{ perspective: "1800px" }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
        <div
          key={index}
          className={`relative min-h-[500px] rounded-2xl border border-border bg-card p-6 shadow-premium overflow-hidden ${
            flip === "next" ? "book-flip-next" : flip === "prev" ? "book-flip-prev" : ""
          }`}
          style={{ transformOrigin: flip === "next" ? "left center" : "right center" }}
        >
          {/* spine shading */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/5 to-transparent" />

          {page.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={page.image_url} 
              alt={page.title || ""} 
              onClick={(e) => { e.stopPropagation(); setFullscreenIndex(index); }}
              className="mb-4 w-full h-auto max-h-[850px] object-contain rounded-xl cursor-zoom-in transition-transform hover:scale-[1.01]" 
            />
          )}
          {page.title && <h2 className="mb-3 text-xl font-black text-text">{page.title}</h2>}
          {page.body && (
            <p className="whitespace-pre-line text-[15px] leading-loose text-text">{page.body}</p>
          )}

          <div className="absolute bottom-3 left-0 right-0 text-center text-xs font-bold text-text-muted z-20 mix-blend-difference text-white">
            صفحة {page.page_number}
          </div>
        </div>
        </div>

        {/* Right Arrow (Prev Page in RTL) */}
        <button
          onClick={goPrev}
          disabled={index <= 0}
          className="absolute -right-12 md:-right-16 top-1/2 -translate-y-1/2 p-3 text-slate-400 hover:text-primary transition-colors disabled:opacity-30 disabled:hover:text-slate-400 z-10 hidden sm:block"
        >
          <IconChevronRight size={36} />
        </button>
      </div>

      {/* Controls (Mobile + Bottom) */}
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between sm:hidden">
        <button
          onClick={goPrev}
          disabled={index <= 0}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-text transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
        >
          <IconChevronRight size={18} /> السابقة
        </button>
        <span className="text-sm font-bold text-text-muted">{index + 1} / {total}</span>
        <button
          onClick={goNext}
          disabled={index >= total - 1}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-40"
        >
          التالية <IconChevronLeft size={18} />
        </button>
      </div>

      <div className="mx-auto hidden sm:flex w-full max-w-2xl items-center justify-center">
        <span className="text-sm font-bold text-text-muted bg-slate-100 px-4 py-2 rounded-full">{index + 1} / {total}</span>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {fullscreenIndex !== null && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={() => setFullscreenIndex(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-3 bg-white/10 rounded-full z-50 backdrop-blur"
            onClick={(e) => { e.stopPropagation(); setFullscreenIndex(null); }}
          >
            <IconX size={28} />
          </button>
          
          <div className="w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()} style={{ touchAction: 'none' }}>
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={5}
              centerOnInit={true}
              wheel={{ step: 0.1 }}
              pinch={{ step: 5 }}
              doubleClick={{ disabled: true }}
              panning={{ velocityDisabled: true }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <div className="w-full h-full flex flex-col items-center justify-center relative">
                  <div className="absolute top-6 left-6 flex gap-3 z-50">
                    <button className="text-white bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur transition shadow-lg" onClick={() => zoomIn()}>
                      <IconZoomIn size={24} />
                    </button>
                    <button className="text-white bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur transition shadow-lg" onClick={() => zoomOut()}>
                      <IconZoomOut size={24} />
                    </button>
                    <button className="text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur transition shadow-lg font-bold text-sm" onClick={() => resetTransform()}>
                      إعادة
                    </button>
                  </div>
                  <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                    <img 
                      src={pages[fullscreenIndex]?.image_url || ""} 
                      alt="Full size" 
                      className="max-w-[90vw] max-h-[90vh] object-contain select-none shadow-2xl pointer-events-auto" 
                      draggable="false"
                    />
                  </TransformComponent>
                </div>
              )}
            </TransformWrapper>
          </div>

          <button 
            className="absolute left-6 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-colors hover:bg-white/10 rounded-full z-50 hidden sm:block"
            onClick={(e) => {
              e.stopPropagation();
              setFullscreenIndex(prev => prev !== null && prev < total - 1 ? prev + 1 : prev);
            }}
          >
            <IconChevronLeft size={44} />
          </button>

          <button 
            className="absolute right-6 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-colors hover:bg-white/10 rounded-full z-50 hidden sm:block"
            onClick={(e) => {
              e.stopPropagation();
              setFullscreenIndex(prev => prev !== null && prev > 0 ? prev - 1 : prev);
            }}
          >
            <IconChevronRight size={44} />
          </button>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white font-bold bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
            {fullscreenIndex + 1} / {total}
          </div>
        </div>
      )}

      {/* Per-page comments */}
      <PageComments pageId={page.id} />
    </div>
  );
}

function PageComments({ pageId }: { pageId: string }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<BookComment[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string, name: string } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  const rootComments = comments.filter(c => !c.parent_id);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPageComments(pageId)
      .then((c) => {
        if (active) { setComments(c); setLoading(false); }
      })
      .catch(() => {
        // Silently recover — show empty state instead of infinite spinner
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [pageId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || sending) return;

    const parentId = replyingTo?.id || null;
    
    // Limits
    if (parentId) {
      if (comments.filter(c => c.parent_id === parentId).length >= 5) {
        alert("عذراً، لقد وصل هذا التعليق للحد الأقصى من الردود (5).");
        return;
      }
    } else {
      if (rootComments.length >= 100) {
        alert("عذراً، لقد وصلت هذه الصفحة للحد الأقصى من التعليقات الأساسية (100).");
        return;
      }
    }
    setSending(true);
    const body = replyingTo ? `@${replyingTo.name} ${draft}` : draft;
    const created = await addPageComment(pageId, body, parentId, profile?.role === "admin");
    
    // Handle banned student
    if (created === "banned") {
      alert("عذراً، لقد تم حظرك من التعليق في هذه المنصة. يرجى التواصل مع الإدارة.");
      setSending(false);
      return;
    }
    
    if (created) {
      // BUG FIX: Push to flat comments array so replies appear immediately
      // (rendering uses comments.filter(r => r.parent_id === c.id), not c.replies)
      setComments(prev => parentId ? [...prev, created] : [created, ...prev]);
      setDraft("");
      setReplyingTo(null);
    }
    setSending(false);
  }

  async function handleDelete(commentId: string) {
    if (!confirm("هل أنت متأكد من حذف تعليقك؟")) return;
    const success = await deleteMyComment(commentId);
    if (success) {
      setLoading(true);
      const c = await fetchPageComments(pageId);
      setComments(c);
      setLoading(false);
    } else {
      alert("حدث خطأ أثناء حذف التعليق.");
    }
  }

  async function handleAdminDelete(commentId: string) {
    if (!confirm("هل أنت متأكد من حذف هذا التعليق؟")) return;
    const success = await deleteBookComment(commentId);
    if (success) {
      setLoading(true);
      const c = await fetchPageComments(pageId);
      setComments(c);
      setLoading(false);
    }
  }

  async function handleAdminBan(studentId: string, global: boolean) {
    const msg = global ? "هل تريد حظر الطالب نهائياً من التعليقات في المنصة؟" : "هل تريد حظر الطالب من هذا الكتاب فقط؟ (حالياً سيتم الحظر الكلي)";
    if (!confirm(msg)) return;
    const success = await toggleStudentCommentBan(studentId, true);
    if (success) alert("تم الحظر بنجاح");
  }

  async function handleAdminEditSave(commentId: string) {
    if (!editBody.trim()) return;
    const success = await editBookComment(commentId, editBody.trim());
    if (success) {
      setEditingId(null);
      setLoading(true);
      const c = await fetchPageComments(pageId);
      setComments(c);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-black text-text">
        <IconMessageCircle2 size={18} className="text-primary" />
        تعليقات الطلاب على هذه الصفحة
      </div>

      <form onSubmit={submit} className="mb-4 flex flex-col gap-2">
        {replyingTo && (
          <div className="flex items-center justify-between bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-lg w-fit">
            <span>رد على: {replyingTo.name}</span>
            <button type="button" onClick={() => setReplyingTo(null)} className="mr-3 hover:text-red-500">
              إلغاء
            </button>
          </div>
        )}
        {profile?.is_banned_from_comments ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <IconBan size={16} className="shrink-0" />
            <span className="font-bold">لقد تم حظرك من التعليقات. تواصل مع الإدارة لرفع الحظر.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="اكتب تعليقك هنا أو اسأل زملائك..."
              className="flex-1 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
            >
              <IconSend size={16} /> إرسال
            </button>
          </div>
        )}
      </form>

      {loading ? (
        <p className="text-center text-sm text-text-muted">جاري تحميل التعليقات...</p>
      ) : comments.length === 0 ? (
        <p className="text-center text-sm text-text-muted">كن أول من يعلّق على هذه الصفحة.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rootComments.map((c) => {
            const replies = comments.filter(r => r.parent_id === c.id);
            return (
            <li key={c.id} className={`flex flex-col gap-3 rounded-xl p-4 ${c.is_admin_reply ? 'bg-orange-500/5 border border-orange-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]' : 'bg-bg border border-border'}`}>
              <div className="flex gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${c.is_admin_reply ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md' : 'bg-sidebar/50 text-text-muted'}`}>
                  {c.is_admin_reply ? <IconCrown size={22} className="text-white drop-shadow" /> : c.author_name?.charAt(0) || '?'}
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
                        <button onClick={() => handleAdminEditSave(c.id)} className="rounded-[10px] bg-primary px-3 py-1 text-xs font-bold text-white">حفظ</button>
                        <button onClick={() => setEditingId(null)} className="rounded-[10px] bg-bg px-3 py-1 text-xs font-bold text-text-muted">إلغاء</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[13.5px] leading-relaxed text-text/90 whitespace-pre-wrap">{c.body}</p>
                  )}

                  <div className="mt-2 flex items-center gap-2">
                    <button 
                      onClick={() => setReplyingTo({ id: c.id, name: c.is_admin_reply ? 'الأوس الماسية' : (c.author_name || '') })}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      رد
                    </button>
                    {user?.id === c.student_id && !c.is_admin_reply && profile?.role !== "admin" && (
                      <button 
                        onClick={() => handleDelete(c.id)}
                        className="text-xs font-bold text-red-500 hover:underline"
                      >
                        حذف
                      </button>
                    )}

                    {profile?.role === "admin" && (
                      <div className="flex items-center gap-3 mr-auto">
                        <button onClick={() => { setEditingId(c.id); setEditBody(c.body); }} className="text-primary hover:scale-110 transition-transform" title="تعديل التعليق">
                          <IconEdit size={15} />
                        </button>
                        <button onClick={() => handleAdminDelete(c.id)} className="text-red-500 hover:scale-110 transition-transform" title="حذف التعليق">
                          <IconTrash size={15} />
                        </button>
                        {!c.is_admin_reply && (
                          <>
                            {/* حظر من هذا الكتاب فقط - برتقالي */}
                            <button
                              onClick={() => handleAdminBan(c.student_id, false)}
                              className="flex items-center gap-1 rounded-lg bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600 hover:bg-orange-200 transition-colors dark:bg-orange-900/30 dark:text-orange-400"
                              title="حظر الطالب من هذا الكتاب فقط"
                            >
                              <IconBan size={11} /> حظر كتاب
                            </button>
                            {/* حظر نهائي من كل المنصة - أحمر داكن */}
                            <button
                              onClick={() => handleAdminBan(c.student_id, true)}
                              className="flex items-center gap-1 rounded-lg bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 hover:bg-red-200 transition-colors dark:bg-red-900/30 dark:text-red-400"
                              title="حظر الطالب نهائياً من جميع التعليقات في المنصة"
                            >
                              <IconBan size={11} /> حظر نهائي
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Threaded Replies */}
                  {replies.length > 0 && (
                    <div className="mt-4 mr-4 pr-3 border-r-2 border-border/50 flex flex-col gap-3">
                      {replies.map(r => (
                        <div key={r.id} className={`flex flex-col gap-2 rounded-xl p-3 ${r.is_admin_reply ? 'bg-orange-500/5 border border-orange-500/10' : 'bg-card border border-border/50'}`}>
                          <div className="flex gap-2">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-xs ${r.is_admin_reply ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' : 'bg-sidebar/50 text-text-muted'}`}>
                              {r.is_admin_reply ? <IconCrown size={16} /> : r.author_name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[11.5px] font-bold ${r.is_admin_reply ? 'text-orange-500' : 'text-text'}`}>
                                  {r.is_admin_reply ? 'الإدارة' : r.author_name}
                                </span>
                                {r.is_admin_reply && (
                                  <span className="flex items-center gap-1 text-[9px] font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                                    <IconCrown size={10} /> إدارة
                                  </span>
                                )}
                                <span className="text-[10px] text-text-muted">
                                  {new Date(r.created_at).toLocaleDateString('ar-SA')}
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed text-text/90 whitespace-pre-wrap">{r.body}</p>
                            </div>
                          </div>
                          
                          {(user?.id === r.student_id || profile?.role === "admin") && (
                            <div className="flex justify-end gap-3">
                              {profile?.role === "admin" ? (
                                <button onClick={() => handleAdminDelete(r.id)} className="text-red-500 hover:scale-110 transition-transform">
                                  <IconTrash size={14} />
                                </button>
                              ) : (
                                <button onClick={() => handleDelete(r.id)} className="text-[10px] font-bold text-red-500 hover:underline">
                                  حذف
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
