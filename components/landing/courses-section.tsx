"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconStarFilled, IconUsers, IconClock,
  IconCheck, IconCalendar, IconArrowLeft,
} from "@tabler/icons-react";
import { type Course } from "@/lib/store";
import { fetchCourses } from "@/lib/supabase/services/courses";
import { fetchUserEnrollments } from "@/lib/supabase/services/enrollments";
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

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const data = await fetchCourses();
        if (!active) return;
        setCourses(data.filter((c) => c.isActive));

        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const userEnrollments = await fetchUserEnrollments(session.user.id);
          
          if (active && userEnrollments) {
            const enrollMap: Record<string, 'active' | 'pending'> = {};
            userEnrollments.forEach(e => {
              enrollMap[e.course_id] = e.is_active ? 'active' : 'pending';
            });
            setEnrollments(enrollMap);
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
              <CourseCard key={course.id} course={course} index={index} enrollmentStatus={enrollments[course.id]} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CourseCard({ course, index, enrollmentStatus }: { course: Course; index: number; enrollmentStatus?: 'active' | 'pending' }) {
  const isFree = course.discountedPrice === 0;

  return (
    <div className={`group relative flex flex-col rounded-2xl border bg-card overflow-hidden shadow-sm card-hover-3d tilt-in delay-${(index % 3) + 1} ${course.isFeatured ? "animated-border" : ""} ${enrollmentStatus === 'active' ? 'border-accent-teal shadow-accent-teal/20' : 'border-border'}`}>
      {/* Badges */}
      {enrollmentStatus === 'active' && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1 rounded-full bg-accent-teal px-3 py-1 text-xs font-black text-white shadow-lg">
          مشترك <IconCheck size={12} stroke={3} />
        </div>
      )}
      {course.isFeatured && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1 rounded-full bg-accent-amber px-3 py-1 text-xs font-black text-white shadow-gold">
          <IconStarFilled size={11} className="animate-spin-slow" /> مميزة
        </div>
      )}

      {/* Cover */}
      <div className={`relative h-52 bg-gradient-to-br ${course.coverGradient} flex flex-col justify-end p-5 overflow-hidden`}>
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
          <h3 className="text-lg font-black text-white leading-snug line-clamp-2 transition-transform duration-300 group-hover:translate-x-1">{course.title}</h3>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-4">
        <p className="text-sm text-text-muted line-clamp-2">{course.subtitle}</p>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-text-muted border-b border-border pb-4">
          <span className="flex items-center gap-1 count-pop"><IconUsers size={13} /> {course.studentsCount.toLocaleString("ar")} طالب</span>
          <span className="flex items-center gap-1"><IconClock size={13} /> {course.totalHours}</span>
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
              href={`/dashboard`}
              className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:gap-2.5 bg-accent-teal hover:bg-accent-teal/90"
            >
              الدخول <IconArrowLeft size={15} />
            </Link>
          ) : enrollmentStatus === 'pending' ? (
            <Link
              href={`/course/${course.id}`}
              className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 bg-accent-amber opacity-80 hover:bg-accent-amber/90"
            >
              في انتظار التحقق
            </Link>
          ) : (
            <Link
              href={`/course/${course.id}`}
              className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:gap-2.5 ${isFree ? "bg-accent-teal hover:bg-accent-teal/90" : "bg-primary hover:bg-primary-dark"}`}
            >
              {isFree ? "ابدأ مجاناً" : "اشترك الآن"}
              <IconArrowLeft size={15} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

