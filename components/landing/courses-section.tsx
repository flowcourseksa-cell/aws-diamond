"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconStarFilled, IconUsers, IconClock,
  IconCheck, IconCalendar, IconArrowLeft,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { type Course } from "@/lib/store";
import { fetchCourses } from "@/lib/supabase/services/courses";
import { fetchUserEnrollments } from "@/lib/supabase/services/enrollments";
import { fetchStudentCourseStatuses } from "@/lib/supabase/services/final-exam";
import { createClient } from "@/lib/supabase/client";

function CountdownBadge({ examDate }: { examDate: string }) {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    if (!examDate) return;
    const diff = Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000);
    setDays(diff > 0 ? diff : 0);
  }, [examDate]);
  if (days === null || !examDate) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs font-bold text-accent-amber">
      <IconCalendar size={13} />
      {days === 0 ? "الاختبار اليوم!" : `${days} يوم على الاختبار`}
    </div>
  );
}

export default function CoursesSection() {
  const [isMounted, setIsMounted] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Record<string, 'active' | 'pending'>>({});
  const [courseStatuses, setCourseStatuses] = useState<Record<string, 'certified' | 'failed' | 'active' | 'none'>>({});

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const data = await fetchCourses('all');
        if (!active) return;
        setCourses(data.filter((c) => c.isActive));

        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // 5s timeout for fetching enrollments so we don't hang the UI
          let timeoutId: NodeJS.Timeout;
          const timeoutPromise = new Promise<any[]>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error("Enrollments timeout")), 5000);
          });
          
          let userEnrollments: any[] | null = null;
          let statusData: { certifiedCourseIds: string[], failedCourseIds: string[] } | null = null;

          try {
            const results = await Promise.race([
              Promise.all([
                fetchUserEnrollments(session.user.id),
                fetchStudentCourseStatuses(session.user.id)
              ]),
              timeoutPromise
            ]).finally(() => clearTimeout(timeoutId));
            
            if (results && Array.isArray(results)) {
              userEnrollments = results[0] as any[];
              statusData = results[1] as any;
            }
          } catch (err) {
            console.warn("fetchUserEnrollments or statuses timed out or failed", err);
          }
          
          if (active && userEnrollments) {
            const enrollMap: Record<string, 'active' | 'pending'> = {};
            const statusMap: Record<string, 'certified' | 'failed' | 'active' | 'none'> = {};

            userEnrollments.forEach(e => {
              enrollMap[e.course_id] = e.is_active ? 'active' : 'pending';
              
              if (statusData?.certifiedCourseIds.includes(e.course_id)) {
                statusMap[e.course_id] = 'certified';
              } else if (statusData?.failedCourseIds.includes(e.course_id)) {
                statusMap[e.course_id] = 'failed';
              } else if (e.is_active) {
                statusMap[e.course_id] = 'active';
              } else {
                statusMap[e.course_id] = 'none';
              }
            });

            setEnrollments(enrollMap);
            setCourseStatuses(statusMap);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setIsMounted(true);
      }
    };
    loadData();
    return () => { active = false; };
  }, []);

  const active = courses;

  if (isMounted && active.length === 0) return null;

  return (
    <section id="courses" className="py-20 bg-bg px-4 relative" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14 fade-up">
          <span className="inline-block mb-3 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-black text-primary">
            دوراتنا التعليمية
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4">استكشف <span className="text-gradient-gold">دوراتنا</span></h2>
          <p className="text-text-muted max-w-2xl mx-auto text-base">
            دورات متخصصة مصممة لمساعدتك في تحقيق أعلى الدرجات في اختباري القدرات والتحصيلي
          </p>
        </div>

        {/* Skeleton while loading */}
        {!isMounted && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
                <div className="h-52 bg-border" />
                <div className="p-6 flex flex-col gap-3">
                  <div className="h-4 bg-border rounded w-3/4" />
                  <div className="h-3 bg-border rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Courses Grid */}
        {isMounted && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {active.map((course, index) => (
              <CourseCard key={course.id} course={course} index={index} enrollmentStatus={enrollments[course.id]} courseStatus={courseStatuses[course.id] || 'none'} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CourseCard({ course, index, enrollmentStatus, courseStatus }: { course: Course; index: number; enrollmentStatus?: 'active' | 'pending'; courseStatus?: 'certified' | 'failed' | 'active' | 'none' }) {
  const isFree = course.discountedPrice === 0;

  return (
    <div className={`group relative flex flex-col rounded-2xl border overflow-hidden shadow-sm card-hover-3d tilt-in delay-${(index % 3) + 1} ${course.isSimulator ? "bg-gradient-to-b from-accent-teal/10 to-card border-accent-teal/40 shadow-accent-teal/20 ring-1 ring-accent-teal/30" : "bg-card"} ${course.isFeatured ? "animated-border" : ""} ${enrollmentStatus === 'active' ? 'border-accent-teal shadow-accent-teal/20' : (!course.isSimulator ? 'border-border' : '')}`}>
      
      {/* Simulator Ribbon */}
      {course.isSimulator && (
        <div className="absolute -left-10 top-5 z-30 w-36 -rotate-45 bg-gradient-to-r from-accent-teal to-accent-blue py-1 text-center text-[11px] font-black text-white shadow-lg shadow-accent-teal/20">
          محاكي مجاني
        </div>
      )}

      {/* Free Course Ribbon */}
      {isFree && !course.isSimulator && (
        <div className="absolute -left-10 top-5 z-30 w-36 -rotate-45 bg-gradient-to-r from-orange-500 to-amber-500 py-1 text-center text-[11px] font-black text-white shadow-lg shadow-orange-500/20">
          دورة مجانية
        </div>
      )}

      {/* Badges (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-row-reverse items-center gap-2">
        {course.isFeatured && !course.isSimulator && (
          <div className="flex items-center gap-1 rounded-full bg-accent-amber px-3 py-1 text-xs font-black text-white shadow-gold">
            <IconStarFilled size={11} className="animate-spin-slow" /> مميزة
          </div>
        )}
        {courseStatus === 'certified' ? (
          <div className="flex items-center gap-1 rounded-full bg-accent-teal px-3 py-1 text-xs font-black text-white shadow-lg">
            مكتملة 🎓
          </div>
        ) : courseStatus === 'failed' ? (
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); document.getElementById(`modal-${course.id}`)?.classList.remove('hidden'); }} 
            className="flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-xs font-black text-white shadow-lg hover:bg-orange-600 transition-colors"
          >
            بانتظار التفعيل ⚠️
          </button>
        ) : (courseStatus === 'active' || (courseStatus === 'none' && enrollmentStatus === 'active')) ? (
          <div className="flex items-center gap-1 rounded-full bg-accent-teal px-3 py-1 text-xs font-black text-white shadow-lg">
            مشترك <IconCheck size={12} stroke={3} />
          </div>
        ) : null}
      </div>

      {/* Cover */}
      <div className={`relative h-52 flex flex-col justify-end p-5 overflow-hidden ${course.coverImageUrl ? "" : `bg-gradient-to-br ${course.coverGradient}`}`}>
        {course.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.coverImageUrl} alt={course.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        {/* Sheen on hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
        <div className="relative z-10">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {course.tags.slice(0, 3).map(tag => (
              <span key={tag} className="rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-bold text-white">
                {tag}
              </span>
            ))}
          </div>
          <div className="relative inline-block w-fit mt-2 group-hover:translate-x-1 transition-transform duration-300">
            {/* The Brush Stroke Background */}
            <div className="absolute inset-0 bg-black/80 scale-105 -rotate-2 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] pointer-events-none"></div>
            <div className="absolute inset-0 bg-black/60 scale-110 rotate-1 rounded-[15px_255px_15px_225px/225px_15px_255px_15px] pointer-events-none blur-[1px]"></div>
            
            {/* The Text */}
            <h3 className="relative z-10 text-lg font-black text-white px-3 py-1 leading-snug line-clamp-2">
              {course.title}
            </h3>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-4">
        <p className="text-sm text-text-muted line-clamp-2">{course.subtitle || course.description}</p>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-text-muted border-b border-border pb-4">
          {!course.isSimulator && (
            <span className="flex items-center gap-1 count-pop"><IconUsers size={13} /> {course.studentsCount.toLocaleString("ar")} طالب</span>
          )}
          <span className="flex items-center gap-1">
            <IconClock size={13} /> 
            {course.totalHours 
              ? (course.isSimulator ? `${course.totalHours} دقيقة` : course.totalHours) 
              : (course.isSimulator ? "لم تُحدد المدة" : "غير محدد")
            }
          </span>
          {course.examDate && <CountdownBadge examDate={course.examDate} />}
        </div>

        {/* Features (max 4) */}
        {course.features.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {course.features.slice(0, 4).map((feat, i) => (
              <li key={i} className="flex items-center gap-2 text-xs font-semibold text-text">
                <IconCheck size={13} className="text-accent-teal flex-shrink-0" /> {feat}
              </li>
            ))}
          </ul>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div>
            {isFree ? (
              <span className="text-xl font-black text-accent-teal">مجاناً</span>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-primary">{course.discountedPrice} <span className="text-sm">{course.currency}</span></span>
                {course.price > course.discountedPrice && (
                  <>
                    <span className="text-sm text-text-muted line-through">{course.price}</span>
                    <span className="text-xs font-black text-accent-teal bg-accent-teal/10 rounded-full px-2 py-0.5">خصم {Math.round((1 - course.discountedPrice / course.price) * 100)}%</span>
                  </>
                )}
              </div>
            )}
          </div>
          {enrollmentStatus === 'active' ? (
            <Link
              href={course.isSimulator ? `/simulator/${course.id}` : `/dashboard?courseId=${course.id}`}
              className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:gap-2.5 ${course.isSimulator ? "bg-accent-teal hover:bg-accent-teal/90" : "bg-accent-teal hover:bg-accent-teal/90"}`}
            >
              {course.isSimulator ? "الدخول للمحاكي" : "الدخول"} <IconArrowLeft size={15} />
            </Link>
          ) : enrollmentStatus === 'pending' ? (
            <Link
              href={course.isSimulator ? `/simulator/${course.id}` : `/course/${course.id}`}
              className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 bg-accent-amber opacity-80 hover:bg-accent-amber/90"
            >
              في انتظار التحقق
            </Link>
          ) : (
            <Link
              href={course.isSimulator ? `/simulator/${course.id}` : `/course/${course.id}`}
              className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:gap-2.5 ${isFree || course.isSimulator ? "bg-accent-teal hover:bg-accent-teal/90" : "bg-primary hover:bg-primary-dark"}`}
            >
              {course.isSimulator ? "تفاصيل المحاكي" : (isFree ? "ابدأ مجاناً" : "اشترك الآن")}
              <IconArrowLeft size={15} />
            </Link>
          )}
        </div>
      </div>

      {/* Failed Modal */}
      <div id={`modal-${course.id}`} className="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" style={{ position: 'fixed' }}>
        <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl p-6 text-center border border-border flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4 text-orange-500">
            <IconAlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-black mb-2 text-text">تفعيل المحاولات</h3>
          <p className="text-sm text-text-muted mb-6 leading-relaxed">
            لقد استنفدت محاولاتك الرسمية للاختبار النهائي لهذه الدورة. نرجو منك مراجعة الدروس الضعيفة، ثم التواصل مع الدعم الفني لتفعيل محاولة جديدة لك.
          </p>
          <div className="flex w-full gap-3">
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); document.getElementById(`modal-${course.id}`)?.classList.add('hidden'); }}
              className="flex-1 py-3 rounded-xl bg-border text-text font-bold hover:bg-border/80 transition-colors"
            >
              إغلاق
            </button>
            <Link 
              href="https://wa.me/966500000000"
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
            >
              التواصل مع الدعم
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

