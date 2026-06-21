"use client";

import { useEffect, useState } from "react";
import { IconBook2 } from "@tabler/icons-react";
import { FlipBook } from "./flip-book";
import { fetchBookPages, type BookPage } from "@/lib/supabase/services/book";

export function BookClient() {
  const [pages, setPages] = useState<BookPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchBookPages().then((p) => {
      if (active) { setPages(p); setLoading(false); }
    });
    return () => { active = false; };
  }, []);

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <section className="flex items-center gap-3 rounded-2xl bg-sidebar px-6 py-5 text-white shadow-premium">
        <IconBook2 size={26} className="text-accent-amber" />
        <div>
          <h1 className="text-lg font-black">الكتاب التفاعلي</h1>
          <p className="text-[13px] text-white/70">اسحب يمينًا أو يسارًا لتقليب الصفحات، وعلّق على أي صفحة.</p>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <FlipBook pages={pages} />
      )}
    </div>
  );
}
