"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconBook2, IconArrowLeft } from "@tabler/icons-react";
import { fetchCourses } from "@/lib/supabase/services/courses";
import type { Course } from "@/lib/store";

export default function AdminBookDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses().then(data => {
      setCourses(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <IconBook2 className="text-primary" size={28} />
            الكتب التفاعلية
          </h1>
          <p className="text-slate-500 mt-1">اختر الدورة لإدارة الكتاب التفاعلي الخاص بها ورفع الصفحات</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <Link 
              key={course.id} 
              href={`/admin-khaled-ksa-aws-2026-org/book/${course.id}`}
              className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all hover:border-primary/30 flex flex-col gap-4"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${course.coverGradient || 'from-slate-100 to-slate-200'} text-white shadow-inner`}>
                <IconBook2 size={26} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg group-hover:text-primary transition-colors line-clamp-1">{course.title}</h3>
                <p className="text-slate-500 text-sm mt-1 line-clamp-2">{course.subtitle || 'إدارة صفحات المذكرة التفاعلية لهذه الدورة'}</p>
              </div>
              <div className="mt-auto pt-4 flex items-center text-primary font-bold text-sm">
                إدارة صفحات الكتاب
                <IconArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
          {courses.length === 0 && (
            <div className="col-span-full py-10 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              لا توجد دورات مسجلة حتى الآن.
            </div>
          )}
        </div>
      )}
    </div>
  );
}