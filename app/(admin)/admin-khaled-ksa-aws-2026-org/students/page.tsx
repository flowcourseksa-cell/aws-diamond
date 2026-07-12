"use client";

import { useState, useEffect } from "react";
import {
  IconUsers, IconSearch, IconFilter, IconChevronDown, IconChevronUp,
  IconBrandWhatsapp, IconChartPie, IconAlertTriangle, IconActivity,
  IconCheck, IconX, IconTrendingUp, IconKey, IconTrash,
  IconEdit, IconLock, IconShieldLock, IconUserOff
} from "@tabler/icons-react";

import { fetchStudents, enrollStudent, unenrollStudent, updateStudent, toggleStudentBan, updateStudentPassword, deleteStudentCompletely, type StudentWithDetails } from "@/lib/supabase/services/students";
import { fetchCourses } from "@/lib/supabase/services/courses";
import { type Course } from "@/lib/store";

// ── Component ─────────────────────────────────────────────────
export default function AdminStudentsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  
  // Modals
  const [manageStudent, setManageStudent] = useState<StudentWithDetails | null>(null);
  const [selectedCourseToEnroll, setSelectedCourseToEnroll] = useState<string>("");

  const [editStudent, setEditStudent] = useState<StudentWithDetails | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", parent_phone: "" });

  const [passwordStudent, setPasswordStudent] = useState<StudentWithDetails | null>(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    setIsMounted(true);
    Promise.all([fetchStudents(), fetchCourses('all')]).then(([sData, cData]) => {
      setStudents(sData);
      setCourses(cData);
      if (cData.length > 0) {
        setSelectedCourseToEnroll(cData[0].id);
      }
      setIsLoading(false);
    });
  }, []);

  const filtered = students.filter(s => {
    const studentId = `TKH-${s.id.split('-')[0].toUpperCase()}`;
    const searchLower = search.toLowerCase();
    
    if (search && 
        !s.full_name.toLowerCase().includes(searchLower) && 
        !studentId.toLowerCase().includes(searchLower)
    ) return false;
    
    if (filterCourse !== "all") {
      const isEnrolled = s.enrollments.some(e => e.course_id === filterCourse);
      if (!isEnrolled) return false;
    }
    return true;
  });

  const totalStudents = students.length;
  const activeSubs = students.filter(s => s.enrollments.length > 0).length;

  async function handleEnroll() {
    if (!manageStudent || !selectedCourseToEnroll) return;
    
    if (manageStudent.enrollments.some(e => e.course_id === selectedCourseToEnroll)) {
      alert("الطالب مشترك بالفعل في هذه الدورة.");
      return;
    }

    const success = await enrollStudent(manageStudent.id, selectedCourseToEnroll);
    if (success) {
      const sData = await fetchStudents();
      setStudents(sData);
      setManageStudent(sData.find(s => s.id === manageStudent.id) || null);
    }
  }

  async function handleUnenroll(enrollmentId: string) {
    if (!confirm("هل أنت متأكد من سحب صلاحية وصول الطالب لهذه الدورة؟")) return;
    
    const success = await unenrollStudent(enrollmentId);
    if (success) {
      const sData = await fetchStudents();
      setStudents(sData);
      setManageStudent(sData.find(s => s.id === manageStudent?.id) || null);
    }
  }

  function openEdit(student: StudentWithDetails) {
    setEditStudent(student);
    setEditForm({ full_name: student.full_name, phone: student.phone || "", parent_phone: student.parent_phone || "" });
  }

  async function handleSaveEdit() {
    if (!editStudent) return;
    const success = await updateStudent(editStudent.id, editForm);
    if (success) {
      setStudents(await fetchStudents());
      setEditStudent(null);
    }
  }

  async function handleUpdatePassword() {
    if (!passwordStudent || newPassword.length < 6) {
      alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return;
    }
    const success = await updateStudentPassword(passwordStudent.id, newPassword);
    if (success) {
      alert("تم تغيير كلمة المرور بنجاح.");
      setPasswordStudent(null);
      setNewPassword("");
    } else {
      alert("حدث خطأ أثناء تغيير كلمة المرور.");
    }
  }

  async function handleToggleBan(student: StudentWithDetails) {
    const isBanned = student.is_banned;
    if (!confirm(`هل أنت متأكد من ${isBanned ? 'فك حظر' : 'حظر'} الطالب ${student.full_name}؟`)) return;
    
    const success = await toggleStudentBan(student.id, !isBanned);
    if (success) {
      setStudents(await fetchStudents());
    }
  }

  async function handleDeleteStudent(student: StudentWithDetails) {
    const confirmName = prompt(`تحذير خطير! سيتم حذف الطالب "${student.full_name}" وكل اشتراكاته وبياناته نهائياً ولا يمكن التراجع.\n\nاكتب اسم الطالب بالكامل لتأكيد الحذف:`);
    if (confirmName !== student.full_name) {
      if (confirmName !== null) alert("اسم الطالب غير متطابق. تم إلغاء الحذف.");
      return;
    }
    
    const success = await deleteStudentCompletely(student.id);
    if (success) {
      alert("تم حذف الطالب بنجاح.");
      setStudents(await fetchStudents());
    } else {
      alert("فشل في حذف الطالب.");
    }
  }

  if (!isMounted || isLoading) return <div className="p-8 text-center font-bold text-text-muted">جاري تحميل بيانات الطلاب...</div>;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="fade-up rounded-2xl bg-sidebar px-7 py-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <IconUsers size={26} />
          <h2 className="text-xl font-black">إدارة الطلاب والاشتراكات</h2>
        </div>
        <p className="text-white/55 text-sm">إدارة وصول الطلاب للدورات، متابعة الحسابات، وتفعيل الاشتراكات.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 fade-up">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-bold text-text-muted mb-1 flex items-center gap-2"><IconUsers size={16}/> إجمالي الطلاب</div>
          <div className="text-2xl font-black text-primary">{totalStudents}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-bold text-text-muted mb-1 flex items-center gap-2"><IconCheck size={16}/> طلاب لديهم اشتراكات</div>
          <div className="text-2xl font-black text-emerald-500">{activeSubs}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 fade-up">
        <div className="flex-1 min-w-[200px] relative">
          <IconSearch size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث باسم الطالب أو الـ ID..."
            className="w-full rounded-xl border border-border bg-card pl-4 pr-10 py-2.5 text-sm font-semibold outline-none focus:border-primary" />
        </div>
        <div className="flex items-center gap-2">
          <IconFilter size={20} className="text-text-muted" />
          <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary max-w-[200px]">
            <option value="all">تصفية حسب الدورة (الكل)</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
      </div>

      <div className="fade-up rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-border bg-bg/60">
                {["الطالب", "رقم الهاتف", "ولي الأمر", "تاريخ التسجيل", "الاشتراكات الحالية", "إجراءات"].map(h => (
                  <th key={h} className="px-4 py-3.5 text-right text-xs font-black text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(student => {
                const hasSubs = student.enrollments.length > 0;
                return (
                  <tr key={student.id} className="border-b border-border last:border-none hover:bg-bg/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-black shadow-sm">
                          {student.full_name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-text">{student.full_name}</span>
                          <span className="text-[10px] font-bold text-text-muted font-mono tracking-wider mt-0.5" dir="ltr">
                            TKH-{student.id.split('-')[0].toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-text-muted" dir="ltr">
                      {student.phone || "—"}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-text-muted" dir="ltr">
                      {student.parent_phone || "—"}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-text-muted">
                      {new Date(student.created_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-4 py-3.5">
                      {hasSubs ? (
                        <div className="flex flex-wrap gap-1">
                          {student.enrollments.map(e => (
                            <span key={e.id} className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/20">
                              {e.course?.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-text-muted text-xs font-bold bg-bg px-2 py-0.5 rounded">لا يوجد</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button 
                          onClick={() => setManageStudent(student)}
                          className="flex items-center gap-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded transition-colors"
                        >
                          <IconKey size={14} /> الصلاحيات
                        </button>
                        <button 
                          onClick={() => openEdit(student)}
                          className="flex items-center gap-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded transition-colors"
                        >
                          <IconEdit size={14} /> تعديل
                        </button>
                        <button 
                          onClick={() => { setPasswordStudent(student); setNewPassword(""); }}
                          className="flex items-center gap-1 text-[11px] font-bold text-white bg-amber-500 hover:bg-amber-600 px-2.5 py-1 rounded transition-colors"
                        >
                          <IconLock size={14} /> كلمة السر
                        </button>
                        <button 
                          onClick={() => handleToggleBan(student)}
                          className={`flex items-center gap-1 text-[11px] font-bold text-white px-2.5 py-1 rounded transition-colors ${student.is_banned ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'}`}
                        >
                          {student.is_banned ? <IconShieldLock size={14} /> : <IconUserOff size={14} />} 
                          {student.is_banned ? 'فك الحظر' : 'حظر'}
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student)}
                          className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-100 border border-red-200 hover:bg-red-200 px-2.5 py-1 rounded transition-colors ml-1"
                        >
                          <IconTrash size={14} /> حذف نهائي
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-text-muted font-bold">لا يوجد طلاب يطابقون البحث</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Enrollments Modal */}
      {manageStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" onClick={e => { if (e.target === e.currentTarget) setManageStudent(null); }}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black">إدارة اشتراكات: <span className="text-primary">{manageStudent.full_name}</span></h3>
              <button onClick={() => setManageStudent(null)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-text-muted hover:text-text"><IconX size={16} /></button>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-black text-text-muted mb-3 uppercase tracking-wider">الاشتراكات الفعالة حالياً</h4>
              {manageStudent.enrollments.length === 0 ? (
                <div className="bg-bg border border-border rounded-xl p-4 text-center text-sm font-bold text-text-muted">
                  هذا الطالب غير مشترك في أي دورة حالياً. محتوى المنصة مقفل بالنسبة له.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {manageStudent.enrollments.map(e => (
                    <div key={e.id} className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                      <div className="font-bold text-emerald-800 text-sm">
                        {e.course?.title}
                      </div>
                      <button 
                        onClick={() => handleUnenroll(e.id)}
                        className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                        title="إلغاء الاشتراك"
                      >
                        <IconTrash size={14} /> سحب الصلاحية
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="h-px bg-border w-full mb-6" />

            <div>
              <h4 className="text-sm font-black text-text-muted mb-3 uppercase tracking-wider">منح صلاحية دورة جديدة</h4>
              <div className="flex gap-2">
                <select 
                  value={selectedCourseToEnroll} 
                  onChange={e => setSelectedCourseToEnroll(e.target.value)}
                  className="flex-1 rounded-xl border border-border bg-bg px-3 py-2 text-sm font-bold outline-none focus:border-primary"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id} disabled={manageStudent.enrollments.some(e => e.course_id === c.id)}>
                      {c.title} {manageStudent.enrollments.some(e => e.course_id === c.id) ? "(مشترك مسبقاً)" : ""}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={handleEnroll}
                  disabled={!selectedCourseToEnroll || manageStudent.enrollments.some(e => e.course_id === selectedCourseToEnroll)}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  <IconCheck size={16} /> تفعيل للمستخدم
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 fade-in" onClick={e => { if (e.target === e.currentTarget) setEditStudent(null); }}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl scale-in">
            <h3 className="text-lg font-black mb-4">تعديل بيانات: <span className="text-primary">{editStudent.full_name}</span></h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-text-muted mb-1">الاسم الكامل</label>
                <input 
                  type="text" 
                  value={editForm.full_name} 
                  onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-muted mb-1">رقم هاتف الطالب</label>
                <input 
                  type="text" 
                  value={editForm.phone} 
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-muted mb-1">رقم هاتف ولي الأمر</label>
                <input 
                  type="text" 
                  value={editForm.parent_phone} 
                  onChange={e => setEditForm(f => ({ ...f, parent_phone: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2 outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={handleSaveEdit} className="flex-1 rounded-xl bg-primary py-2.5 text-white font-bold hover:bg-primary-dark">حفظ التغييرات</button>
              <button onClick={() => setEditStudent(null)} className="flex-1 rounded-xl bg-bg border border-border py-2.5 font-bold hover:bg-border">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {passwordStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 fade-in" onClick={e => { if (e.target === e.currentTarget) setPasswordStudent(null); }}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl scale-in">
            <h3 className="text-lg font-black mb-4">تغيير كلمة المرور: <span className="text-primary">{passwordStudent.full_name}</span></h3>
            <div>
              <label className="block text-sm font-bold text-text-muted mb-1">كلمة المرور الجديدة</label>
              <input 
                type="text" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-bg px-3 py-2 outline-none focus:border-primary"
                placeholder="6 أحرف على الأقل"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={handleUpdatePassword} className="flex-1 rounded-xl bg-amber-500 py-2.5 text-white font-bold hover:bg-amber-600">تحديث</button>
              <button onClick={() => setPasswordStudent(null)} className="flex-1 rounded-xl bg-bg border border-border py-2.5 font-bold hover:bg-border">إلغاء</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
