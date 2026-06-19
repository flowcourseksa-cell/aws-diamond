"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconStarFilled, IconUsers, IconClock,
  IconCheck, IconCalendar, IconArrowLeft,
} from "@tabler/icons-react";
import { usePlatformStore, type Course } from "@/lib/store";

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
  const storeCourses = usePlatformStore(s => s.courses);
  useEffect(() => setIsMounted(true), []);

  const active = isMounted ? storeCourses.filter(c => c.isActive) : [];

  if (isMounted && active.length === 0) return null;

  return (
    <section id="courses" className="py-20 bg-bg px-4 relative" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14 fade-up">
          <span className="inline-block mb-3 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-black text-primary">
            دوراتنا التعليمية
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-text mb-4">استكشف الدورات</h2>
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
              <CourseCard key={course.id} course={course} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CourseCard({ course, index }: { course: Course; index: number }) {
  const discountPct = course.price > 0
    ? Math.round((1 - course.discountedPrice / course.price) * 100)
    : 0;
  const isFree = course.discountedPrice === 0;

  return (
    <div className={`group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-400 hover:-translate-y-2 fade-up delay-${(index % 3) + 1}`}>
      {/* Featured Badge */}
      {course.isFeatured && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1 rounded-full bg-accent-amber px-3 py-1 text-xs font-black text-white shadow-lg">
          <IconStarFilled size={11} /> مميزة
        </div>
      )}

      {/* Cover */}
      <div className={`relative h-52 bg-gradient-to-br ${course.coverGradient} flex flex-col justify-end p-5`}>
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        <div className="relative z-10">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {course.tags.slice(0, 3).map(tag => (
              <span key={tag} className="rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-bold text-white">
                {tag}
              </span>
            ))}
          </div>
          <h3 className="text-lg font-black text-white leading-snug line-clamp-2">{course.title}</h3>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-4">
        <p className="text-sm text-text-muted line-clamp-2">{course.subtitle}</p>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-text-muted border-b border-border pb-4">
          <span className="flex items-center gap-1"><IconUsers size={13} /> {course.studentsCount.toLocaleString("ar")} طالب</span>
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
                {discountPct > 0 && (
                  <>
                    <span className="text-sm text-text-muted line-through">{course.price}</span>
                    <span className="text-xs font-black text-accent-teal bg-accent-teal/10 rounded-full px-2 py-0.5">خصم {discountPct}%</span>
                  </>
                )}
              </div>
            )}
          </div>
          <Link
            href={`/course/${course.id}`}
            className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:gap-2.5 ${isFree ? "bg-accent-teal hover:bg-accent-teal/90" : "bg-primary hover:bg-primary-dark"}`}
          >
            {isFree ? "ابدأ مجاناً" : "اشترك الآن"}
            <IconArrowLeft size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
