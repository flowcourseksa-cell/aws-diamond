// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { IconBook2, IconArrowRight } from "@tabler/icons-react";
import { FlipBook } from "./flip-book";
import { fetchBookPages, type BookPage, type Book, fetchBooksByIds, fetchBooksByCourse } from "@/lib/supabase/services/book";
import { fetchCourses } from "@/lib/supabase/services/courses";
import { fetchUserEnrollments } from "@/lib/supabase/services/enrollments";
import { useAuth } from "@/hooks/use-auth";
import { usePlatformStore } from "@/lib/store";
import type { Course } from "@/lib/store";

export function BookClient() {
  const { user } = useAuth();
  const { enrolledCourseId, enrolledCourses } = usePlatformStore();
  const [courses, setCourses] = useState<{id: string, title: string, coverGradient?: string}[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<BookPage[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply Features Overrides
  const activeCourse = enrolledCourses.find(c => c.id === enrolledCourseId);
  const pSettings = usePlatformStore(s => s.platformSettings) || { global_interactive_book: true, global_study_plan: true, global_library: true };
  const overrides = (activeCourse as any)?.featuresOverride || {};
  const isEnabled = overrides.interactive_book !== undefined ? overrides.interactive_book : pSettings.global_interactive_book;

  useEffect(() => {
    async function loadBookshelf() {
      if (!user) return;
      try {
        setLoading(true);
        if (enrolledCourses.length > 0 && enrolledCourseId) {
          const userCourses = enrolledCourses.filter(c => c.id === enrolledCourseId);
          setCourses(userCourses);

          const courseBooks = await fetchBooksByCourse(enrolledCourseId);
          setBooks(courseBooks.filter(b => b.is_published));
        } else {
          setBooks([]);
        }
      } catch (err) {
        console.error("Error loading bookshelf:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBookshelf();
  }, [user, enrolledCourseId, enrolledCourses]);

  const handleSelectBook = async (book: Book) => {
    setSelectedBook(book);
    setLoading(true);
    const p = await fetchBookPages(book.id);
    
    // Virtual cover page
    const virtualCover: BookPage = {
      id: "virtual-cover",
      book_id: book.id,
      page_number: 0,
      title: book.title,
      body: book.subtitle,
      image_url: book.cover_image || null,
      is_published: true,
      created_at: new Date().toISOString()
    };
    
    setPages([virtualCover, ...p]);
    setLoading(false);
  };

  if (!isEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <IconBook2 size={40} stroke={1.5} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">الكتاب التفاعلي غير متاح</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          عذراً، ميزة الكتاب التفاعلي غير متاحة لهذه الدورة حالياً.
        </p>
      </div>
    );
  }

  if (loading && !selectedBook) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Reading View
  if (selectedBook) {
    const parentCourse = courses.find(c => c.id === selectedBook.course_id);
    
    return (
      <div className="flex flex-col gap-5" dir="rtl">
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <button 
            onClick={() => setSelectedBook(null)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <IconArrowRight size={24} className="text-slate-500" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800">
              الكتاب التفاعلي: <span className="text-primary">{selectedBook.title}</span>
            </h1>
            <p className="text-[13px] text-slate-500 mt-1">{parentCourse?.title || ""} - اسحب يمينًا أو يسارًا لتقليب الصفحات، وعلّق على أي صفحة.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <FlipBook pages={pages} book={selectedBook} course={parentCourse as any} />
        )}
      </div>
    );
  }

  // Bookshelf View
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Header */}
      <section className="fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-8 text-white shadow-xl shadow-indigo-200">
        <div className="absolute -left-6 -top-6 opacity-10 blur-sm">
          <IconBook2 size={180} />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 shadow-inner backdrop-blur-md">
            <IconBook2 size={32} className="text-indigo-100" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md">الكتب التفاعلية</h1>
            <p className="mt-2 text-[15px] font-medium text-indigo-100/90 max-w-xl">
              اختر المذكرة أو الكتاب التفاعلي لتبدأ المذاكرة وتقليب الصفحات وتسجيل ملاحظاتك الذكية.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {books.map((book, idx) => {
          const course = courses.find(c => c.id === book.course_id);
          const gradient = book.cover_gradient || course?.coverGradient || 'from-indigo-500 to-purple-600';
          
          return (
            <button
              key={book.id}
              onClick={() => handleSelectBook(book)}
              className="fade-up group relative flex flex-col items-center justify-center gap-4 rounded-3xl bg-white p-6 border border-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-100"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {/* Cover */}
              <div className={`relative flex h-56 w-40 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${gradient} shadow-lg transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1`}>
                <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:opacity-0" />
                <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-r from-black/20 to-transparent" /> {/* Book binding effect */}
                
                {book.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.cover_image} alt={book.title} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <IconBook2 size={48} className="text-white/50" />
                )}
              </div>
              
              {/* Details */}
              <div className="text-center w-full mt-2">
                <h3 className="line-clamp-2 text-lg font-black text-slate-800 transition-colors group-hover:text-indigo-600 leading-snug">
                  {book.title}
                </h3>
                <p className="mt-1.5 text-[13px] font-bold text-slate-400 line-clamp-1">
                  {course?.title || "دورة عامة"}
                </p>
              </div>

              {/* Hover Glow */}
              <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-b from-transparent to-indigo-50/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </button>
          );
        })}
        {books.length === 0 && (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
              <IconBook2 size={40} />
            </div>
            <h3 className="text-lg font-black text-slate-700">لا توجد كتب متاحة</h3>
            <p className="text-slate-500 font-medium mt-1">لم يتم إضافة أي مذكرات أو كتب تفاعلية في هذا المسار حتى الآن.</p>
          </div>
        )}
      </div>
    </div>
  );
}