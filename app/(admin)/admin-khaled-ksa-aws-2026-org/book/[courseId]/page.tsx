"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { IconBook2, IconArrowLeft, IconPlus, IconTrash, IconSettings } from "@tabler/icons-react";
import { fetchCourses } from "@/lib/supabase/services/courses";
import { fetchBooksByCourse } from "@/lib/supabase/services/book";
import { createBook, deleteBook, updateBook, uploadBookPageImage } from "@/lib/supabase/services/book-actions";
import type { Course } from "@/lib/store";
import type { Book } from "@/lib/supabase/services/book";

export default function AdminCourseBooksPage({ params }: { params: Promise<{ courseId: string }> }) {
  const unwrappedParams = use(params);
  const courseId = unwrappedParams.courseId;

  const [course, setCourse] = useState<Course | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState("");
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);

  useEffect(() => {
    Promise.all([
      fetchCourses(),
      fetchBooksByCourse(courseId)
    ]).then(([coursesData, booksData]) => {
      const c = coursesData.find(c => c.id === courseId);
      if (c) setCourse(c);
      setBooks(booksData);
      setLoading(false);
    });
  }, [courseId]);

  const handleCreateBook = async () => {
    if (!newTitle.trim()) return alert("يرجى إدخال عنوان الكتاب");
    setIsSubmitting(true);

    let coverUrl: string | null = null;
    if (newCoverFile) {
      const formData = new FormData();
      formData.append("file", newCoverFile);
      coverUrl = await uploadBookPageImage(formData) || null;
      if (!coverUrl) {
        alert("فشل رفع صورة الغلاف");
        setIsSubmitting(false);
        return;
      }
    }

    const success = await createBook({ course_id: courseId, title: newTitle.trim(), cover_image: coverUrl });
    if (success) {
      setNewTitle("");
      setNewCoverFile(null);
      const fileInput = document.getElementById("cover-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      const updated = await fetchBooksByCourse(courseId);
      setBooks(updated);
    } else {
      alert("حدث خطأ أثناء إضافة الكتاب");
    }
    setIsSubmitting(false);
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكتاب وجميع صفحاته وتعليقاته نهائياً؟")) return;
    const success = await deleteBook(id);
    if (success) {
      setBooks(books.filter(b => b.id !== id));
    } else {
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const handleToggleComments = async (book: Book) => {
    const success = await updateBook(book.id, { comments_enabled: !book.comments_enabled });
    if (success) {
      setBooks(books.map(b => b.id === book.id ? { ...b, comments_enabled: !b.comments_enabled } : b));
    } else {
      alert("حدث خطأ أثناء التحديث");
    }
  };

  const handleUpdateBook = async () => {
    if (!editingBook || !editTitle.trim()) return;
    setIsSubmitting(true);
    
    let coverUrl = editingBook.cover_image;
    if (editCoverFile) {
      const formData = new FormData();
      formData.append("file", editCoverFile);
      const url = await uploadBookPageImage(formData);
      if (url) coverUrl = url;
    }

    const success = await updateBook(editingBook.id, { 
      title: editTitle.trim(), 
      cover_image: coverUrl,
      comments_enabled: editingBook.comments_enabled,
      is_published: editingBook.is_published
    });
    
    if (success) {
      setBooks(books.map(b => b.id === editingBook.id ? { ...b, title: editTitle.trim(), cover_image: coverUrl, comments_enabled: editingBook.comments_enabled, is_published: editingBook.is_published } : b));
      setEditingBook(null);
      setEditCoverFile(null);
    } else {
      alert("حدث خطأ أثناء التحديث");
    }
    setIsSubmitting(false);
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">جاري التحميل...</div>;
  if (!course) return <div className="p-8 text-center text-red-500 font-bold">لم يتم العثور على الدورة!</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <IconBook2 size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">كتب الدورة: {course.title}</h1>
              <p className="text-slate-500 mt-1">أضف كتباً لهذه الدورة، وأدر صفحاتها وتعليقات الطلاب.</p>
            </div>
          </div>
          <Link href="/admin-khaled-ksa-aws-2026-org/book" className="flex items-center gap-2 text-primary hover:text-primary/80 font-bold bg-primary/5 px-4 py-2 rounded-xl transition-colors">
            <IconArrowLeft size={20} />
            العودة للدورات
          </Link>
        </div>
      </div>

      {/* Add Book Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="font-bold text-lg mb-4">إضافة كتاب جديد</h2>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <input 
            type="text" 
            placeholder="اسم الكتاب (مثال: مذكرة الشرح، بنك الأسئلة)" 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold"
          />
          <div className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500">صورة الغلاف (اختياري):</span>
            <input 
              id="cover-upload"
              type="file" 
              accept="image/*"
              onChange={(e) => setNewCoverFile(e.target.files?.[0] || null)}
              className="text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
            />
          </div>
          <button 
            onClick={handleCreateBook}
            disabled={isSubmitting || !newTitle.trim()}
            className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <IconPlus size={20} />
            إضافة الكتاب
          </button>
        </div>
      </div>

      {/* Books List */}
      <div className="space-y-4">
        <h2 className="font-bold text-xl text-slate-800">الكتب الحالية ({books.length})</h2>
        {books.length === 0 ? (
          <div className="bg-slate-50 p-8 rounded-2xl text-center text-slate-400 font-bold border border-slate-100 border-dashed">
            لا توجد كتب مضافة لهذه الدورة بعد. أضف الكتاب الأول من الأعلى.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map(book => (
              <div key={book.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group">
                <div className={`h-32 bg-gradient-to-tr ${book.cover_gradient} flex items-center justify-center relative bg-black overflow-hidden`}>
                  {book.cover_image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={book.cover_image} alt={book.title} className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <IconBook2 size={48} className="text-white/50 relative z-10" />
                  <div className="absolute top-2 left-2 flex gap-2 z-20">
                    <button onClick={() => handleDeleteBook(book.id)} className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-colors shadow-sm">
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2">{book.title}</h3>
                  
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                    <Link href={`/admin-khaled-ksa-aws-2026-org/book/${courseId}/${book.id}`} className="flex-1 text-center bg-primary hover:bg-primary/90 text-white text-sm font-bold py-2.5 px-4 rounded-xl transition-colors">
                      إدارة الصفحات
                    </Link>
                    <button 
                      onClick={() => { setEditingBook(book); setEditTitle(book.title); setEditCoverFile(null); }}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-2.5 px-4 rounded-xl transition-colors"
                    >
                      <IconSettings size={16} />
                      الإعدادات
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h2 className="text-xl font-bold mb-4">إعدادات الكتاب</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-1">اسم الكتاب</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-1">صورة الغلاف الجديدة (اختياري)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setEditCoverFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="font-bold text-sm block text-slate-800">حالة النشر (رؤية الطلاب)</span>
                  <span className="text-xs text-slate-500 block mt-0.5">إذا كان مغلقاً، لن يظهر الكتاب للطلاب إطلاقاً (مسودة).</span>
                </div>
                <button 
                  onClick={() => setEditingBook({ ...editingBook, is_published: !editingBook.is_published })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${editingBook.is_published ? 'bg-primary' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingBook.is_published ? '-translate-x-6' : '-translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="font-bold text-sm block text-slate-800">حالة التعليقات</span>
                  <span className="text-xs text-slate-500 block mt-0.5">اسمح للطلاب بترك تعليقات وأسئلة على صفحات هذا الكتاب.</span>
                </div>
                <button 
                  onClick={() => setEditingBook({ ...editingBook, comments_enabled: !editingBook.comments_enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${editingBook.comments_enabled ? 'bg-primary' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingBook.comments_enabled ? '-translate-x-6' : '-translate-x-1'}`} />
                </button>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button 
                onClick={handleUpdateBook}
                disabled={isSubmitting || !editTitle.trim()}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
              <button 
                onClick={() => setEditingBook(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}