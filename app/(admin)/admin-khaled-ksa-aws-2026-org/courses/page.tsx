"use client";

import { useState, useEffect } from "react";
import {
  IconPlus, IconEdit, IconTrash, IconX, IconCheck,
  IconRocket, IconStar, IconUsers, IconClock, IconTag,
  IconToggleLeft, IconToggleRight, IconCalendar,
  IconBrush, IconAlertTriangle,
} from "@tabler/icons-react";
import { usePlatformStore, type Course } from "@/lib/store";
import { fetchCourses, createCourse, updateCourse, deleteCourse, uploadCourseCover } from "@/lib/supabase/services/courses";

const GRADIENT_OPTIONS = [
  { label: "بنفسجي أزرق", value: "from-indigo-500 to-purple-600" },
  { label: "أخضر فيروزي", value: "from-teal-500 to-emerald-600" },
  { label: "ذهبي برتقالي", value: "from-amber-400 to-orange-600" },
  { label: "وردي بنفسجي", value: "from-pink-500 to-purple-700" },
  { label: "أزرق سماوي", value: "from-sky-500 to-blue-700" },
  { label: "أحمر برتقالي", value: "from-red-500 to-orange-600" },
];

const TRACK_OPTIONS = [
  { id: "qudrat-komi",  label: "القدرات (كمي)" },
  { id: "qudrat-lafzi", label: "القدرات (لفظي)" },
  { id: "nafis",        label: "نافس" },
  { id: "tasis",        label: "قدرات تأسيس" },
];

const EMPTY_COURSE = (): Omit<Course, "id" | "createdAt"> => ({
  title: "",
  subtitle: "",
  description: "",
  price: 0,
  discountedPrice: 0,
  currency: "ر.س",
  coverGradient: "from-indigo-500 to-purple-600",
  examDate: "",
  trackIds: [],
  features: [""],
  tags: [""],
  instructorName: "",
  totalHours: "",
  studentsCount: 0,
  isActive: true,
  isFeatured: false,
  requireWhatsappActivation: true,
  isSimulator: false,
});

export default function AdminCoursesPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { courses, setCourses } = usePlatformStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_COURSE());
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchCourses().then(data => {
      // Avoid overwriting the free simulator if it's there, or just overwrite with DB data.
      setCourses(data.filter(c => !c.isSimulator));
    });
  }, []);

  if (!isMounted) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-accent-amber border-t-transparent rounded-full" />
    </div>
  );

  // ── Helpers ──────────────────────────────────────────────────────
  function openAdd() {
    setForm(EMPTY_COURSE());
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(c: Course) {
    setForm({ ...c });
    setEditId(c.id);
    setShowForm(true);
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const url = await uploadCourseCover(formData);
      if (url) {
        setForm(f => ({ ...f, coverImageUrl: url }));
      } else {
        alert("فشل رفع الصورة");
      }
    } catch (err) {
      alert("حدث خطأ أثناء الرفع");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    if (editId) {
      const success = await updateCourse(editId, form);
      if (success) {
        setCourses(prev => prev.map(c => c.id === editId ? { ...c, ...form } : c));
      }
    } else {
      const newCourse = await createCourse({
        ...form,
        features: form.features.filter(f => f.trim()),
        tags: form.tags.filter(t => t.trim()),
      });
      if (newCourse) {
        setCourses(prev => [newCourse, ...prev]);
      }
    }
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    const success = await deleteCourse(id);
    if (success) {
      setCourses(prev => prev.filter(c => c.id !== id));
    }
    setDeleteId(null);
  }

  async function toggleActive(id: string) {
    const course = courses.find(c => c.id === id);
    if (!course) return;
    const success = await updateCourse(id, { isActive: !course.isActive });
    if (success) {
      setCourses(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
    }
  }

  async function toggleFeatured(id: string) {
    const course = courses.find(c => c.id === id);
    if (!course) return;
    const success = await updateCourse(id, { isFeatured: !course.isFeatured });
    if (success) {
      setCourses(prev => prev.map(c => c.id === id ? { ...c, isFeatured: !c.isFeatured } : c));
    }
  }

  function updateFeature(i: number, val: string) {
    const arr = [...form.features];
    arr[i] = val;
    setForm(f => ({ ...f, features: arr }));
  }
  function addFeature() { setForm(f => ({ ...f, features: [...f.features, ""] })); }
  function removeFeature(i: number) { setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) })); }

  function updateTag(i: number, val: string) {
    const arr = [...form.tags];
    arr[i] = val;
    setForm(f => ({ ...f, tags: arr }));
  }
  function addTag() { setForm(f => ({ ...f, tags: [...f.tags, ""] })); }
  function removeTag(i: number) { setForm(f => ({ ...f, tags: f.tags.filter((_, idx) => idx !== i) })); }

  // Removed toggleTrack since we no longer use Tracks selection

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 pb-10" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-text">إدارة الدورات التعليمية</h1>
          <p className="text-sm text-text-muted mt-1">أضف وعدّل الدورات التي تظهر في الواجهة الرئيسية</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-accent-amber px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-amber/90 transition-colors"
        >
          <IconPlus size={18} /> إضافة دورة جديدة
        </button>
      </div>

      {/* Empty state */}
      {courses.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card py-20 text-center">
          <IconRocket size={48} className="text-text-muted/40" />
          <p className="font-bold text-text-muted">لا توجد دورات بعد</p>
          <button onClick={openAdd} className="rounded-xl bg-accent-amber px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-amber/90">
            ابدأ بإضافة أول دورة
          </button>
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {courses.map(course => (
          <div key={course.id} className={`rounded-2xl border bg-card overflow-hidden ${course.isActive ? "border-border" : "border-border opacity-60"}`}>
            {/* Cover */}
            <div className={`h-32 relative flex items-end p-4 overflow-hidden ${course.coverImageUrl ? "" : `bg-gradient-to-br ${course.coverGradient}`}`}>
              {course.coverImageUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={course.coverImageUrl} alt={course.title} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/35" />
                </>
              )}
              {course.isFeatured && (
                <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-accent-amber px-2.5 py-1 text-[11px] font-bold text-white">
                  <IconStar size={11} /> مميزة
                </span>
              )}
              <h3 className="relative z-10 text-base font-black text-white leading-tight line-clamp-2">{course.title}</h3>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col gap-3">
              <p className="text-xs text-text-muted line-clamp-2">{course.subtitle}</p>

              <div className="flex flex-wrap gap-1.5">
                {course.tags.map(t => (
                  <span key={t} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">{t}</span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-text-muted border-t border-border pt-3">
                <span className="flex items-center gap-1"><IconUsers size={13} /> {course.studentsCount} طالب</span>
                <span className="flex items-center gap-1"><IconClock size={13} /> {course.totalHours}</span>
                <span className="font-black text-sm text-primary">
                  {course.discountedPrice === 0 ? "مجاني" : `${course.discountedPrice} ${course.currency}`}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => toggleActive(course.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${course.isActive ? "bg-accent-teal/15 text-accent-teal" : "bg-border text-text-muted"}`}
                >
                  {course.isActive ? <IconToggleRight size={15} /> : <IconToggleLeft size={15} />}
                  {course.isActive ? "نشطة" : "مخفية"}
                </button>
                <button
                  onClick={() => toggleFeatured(course.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${course.isFeatured ? "bg-accent-amber/15 text-accent-amber" : "bg-border text-text-muted"}`}
                >
                  <IconStar size={14} /> {course.isFeatured ? "مميزة" : "عادية"}
                </button>
                <div className="flex-1" />
                <button onClick={() => openEdit(course)} className="rounded-lg p-2 text-text-muted hover:bg-primary/10 hover:text-primary transition-colors">
                  <IconEdit size={15} />
                </button>
                <button onClick={() => setDeleteId(course.id)} className="rounded-lg p-2 text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors">
                  <IconTrash size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 border border-border shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <IconAlertTriangle className="text-red-500" size={24} />
              <h3 className="text-base font-black">حذف الدورة</h3>
            </div>
            <p className="text-sm text-text-muted mb-6">هل أنت متأكد من حذف هذه الدورة؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteId)} className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600">حذف</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold hover:bg-bg">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add/Edit Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-8">
          <div className="w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-black">{editId ? "تعديل الدورة" : "إضافة دورة جديدة"}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-2 text-text-muted hover:bg-bg">
                <IconX size={20} />
              </button>
            </div>

            {/* Form Body */}
            <div className="flex flex-col gap-5 p-6">

              {/* Preview */}
              <div className={`relative h-24 rounded-xl overflow-hidden flex items-center justify-center ${form.coverImageUrl ? "" : `bg-gradient-to-br ${form.coverGradient}`}`}>
                {form.coverImageUrl && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.coverImageUrl} alt="معاينة" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/35" />
                  </>
                )}
                <span className="relative z-10 text-white font-black text-lg">{form.title || "معاينة الغلاف"}</span>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-text-muted mb-1.5">عنوان الدورة *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="مثال: دورة القدرات الشاملة 2026"
                    className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-text-muted mb-1.5">العنوان الفرعي</label>
                  <input
                    value={form.subtitle}
                    onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                    placeholder="مثال: الدورة الشاملة لاختبار القدرات الكمي واللفظي"
                    className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-text-muted mb-1.5">وصف الدورة</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="اكتب وصفاً شاملاً للدورة..."
                    className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm focus:border-primary focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="rounded-xl border border-border p-4">
                <h4 className="text-sm font-black mb-3 flex items-center gap-2"><IconTag size={16} className="text-accent-amber" /> التسعير</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">السعر الأصلي</label>
                    <input type="number" min={0} value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: +e.target.value }))}
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">السعر بعد الخصم</label>
                    <input type="number" min={0} value={form.discountedPrice}
                      onChange={e => setForm(f => ({ ...f, discountedPrice: +e.target.value }))}
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">العملة</label>
                    <input value={form.currency}
                      onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5 flex items-center gap-1"><IconBrush size={13} /> صورة الغلاف</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={isUploading}
                  className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm focus:border-primary focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {isUploading && <p className="mt-2 text-xs text-accent-amber font-bold animate-pulse">جاري رفع الصورة...</p>}
                {form.coverImageUrl && !isUploading && <p className="mt-2 text-xs text-green-500 font-bold">تم إرفاق الصورة بنجاح</p>}
              </div>

              {/* Extra Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1">عدد الطلاب (وهمي للعرض)</label>
                  <input type="number" min={0} value={form.studentsCount}
                    onChange={e => setForm(f => ({ ...f, studentsCount: +e.target.value }))}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1 flex items-center gap-1"><IconCalendar size={12} /> تاريخ الاختبار</label>
                  <input type="date" value={form.examDate}
                    onChange={e => setForm(f => ({ ...f, examDate: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>


              {/* Toggles */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                    className={`w-11 h-6 rounded-full transition-colors ${form.isActive ? "bg-accent-teal" : "bg-border"} relative`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.isActive ? "right-0.5" : "left-0.5"}`} />
                  </div>
                  <span className="text-sm font-bold">تفعيل الدورة</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setForm(f => ({ ...f, isFeatured: !f.isFeatured }))}
                    className={`w-11 h-6 rounded-full transition-colors ${form.isFeatured ? "bg-accent-amber" : "bg-border"} relative`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.isFeatured ? "right-0.5" : "left-0.5"}`} />
                  </div>
                  <span className="text-sm font-bold">تمييزها في الأعلى</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setForm(f => ({ ...f, requireWhatsappActivation: !f.requireWhatsappActivation }))}
                    className={`w-11 h-6 rounded-full transition-colors ${form.requireWhatsappActivation ? "bg-accent-blue" : "bg-border"} relative`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.requireWhatsappActivation ? "right-0.5" : "left-0.5"}`} />
                  </div>
                  <span className="text-sm font-bold">يتطلب تفعيل واتساب</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-border px-6 py-4">
              <button
                onClick={handleSave}
                disabled={!form.title.trim()}
                className="flex-1 rounded-xl bg-accent-amber py-2.5 text-sm font-bold text-white hover:bg-accent-amber/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editId ? "حفظ التعديلات" : "إضافة الدورة"}
              </button>
              <button onClick={() => setShowForm(false)} className="rounded-xl border border-border px-6 py-2.5 text-sm font-bold hover:bg-bg transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

