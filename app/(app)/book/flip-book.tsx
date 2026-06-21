"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  IconChevronRight, IconChevronLeft, IconMessageCircle2,
  IconSend, IconBook2,
} from "@tabler/icons-react";
import {
  type BookPage, type BookComment,
  fetchPageComments, addPageComment,
} from "@/lib/supabase/services/book";

type FlipBookProps = {
  pages: BookPage[];
};

// RTL flip book: "next" page = swipe to the LEFT (Arabic reading direction
// moves forward leftwards), "previous" = swipe to the RIGHT.
export function FlipBook({ pages }: FlipBookProps) {
  const [index, setIndex] = useState(0);
  const [flip, setFlip] = useState<"next" | "prev" | null>(null);
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
      <div
        className="relative mx-auto w-full max-w-2xl select-none"
        style={{ perspective: "1800px" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          key={index}
          className={`relative min-h-[440px] rounded-2xl border border-border bg-card p-6 shadow-premium overflow-hidden ${
            flip === "next" ? "book-flip-next" : flip === "prev" ? "book-flip-prev" : ""
          }`}
          style={{ transformOrigin: flip === "next" ? "left center" : "right center" }}
        >
          {/* spine shading */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/5 to-transparent" />

          {page.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={page.image_url} alt={page.title || ""} className="mb-4 h-56 w-full rounded-xl object-cover" />
          )}
          {page.title && <h2 className="mb-3 text-xl font-black text-text">{page.title}</h2>}
          {page.body && (
            <p className="whitespace-pre-line text-[15px] leading-loose text-text">{page.body}</p>
          )}

          <div className="absolute bottom-3 left-0 right-0 text-center text-xs font-bold text-text-muted">
            صفحة {page.page_number}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
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

      {/* Per-page comments */}
      <PageComments pageId={page.id} />
    </div>
  );
}

function PageComments({ pageId }: { pageId: string }) {
  const [comments, setComments] = useState<BookComment[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPageComments(pageId).then((c) => {
      if (active) { setComments(c); setLoading(false); }
    });
    return () => { active = false; };
  }, [pageId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    const created = await addPageComment(pageId, draft);
    if (created) {
      setComments((prev) => [created, ...prev]);
      setDraft("");
    }
    setSending(false);
  }

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-black text-text">
        <IconMessageCircle2 size={18} className="text-primary" />
        تعليقات الطلاب على هذه الصفحة
      </div>

      <form onSubmit={submit} className="mb-4 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="اكتب تعليقك..."
          className="flex-1 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          <IconSend size={16} /> إرسال
        </button>
      </form>

      {loading ? (
        <p className="text-center text-sm text-text-muted">جاري تحميل التعليقات...</p>
      ) : comments.length === 0 ? (
        <p className="text-center text-sm text-text-muted">كن أول من يعلّق على هذه الصفحة.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-bg p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-black text-primary">{c.author_name}</span>
                <span className="text-[11px] text-text-muted" dir="ltr">
                  {new Date(c.created_at).toLocaleDateString("ar")}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-text">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
