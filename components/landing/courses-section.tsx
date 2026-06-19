"use client";

import React from "react";
import { IconStarFilled, IconUsers, IconClock, IconPlayerPlayFilled } from "@tabler/icons-react";

interface Course {
  id: string;
  title: string;
  instructor: string;
  rating: number;
  studentsCount: number;
  duration: string;
  price: number; // 0 means free
  imageGradient: string;
  tags: string[];
}

const COURSES: Course[] = [
  {
    id: "1",
    title: "الدورة التأسيسية الشاملة في القدرات (الكمي)",
    instructor: "أ. محمد عبدالله",
    rating: 4.9,
    studentsCount: 1250,
    duration: "40 ساعة",
    price: 0, // مجاني
    imageGradient: "from-blue-500 to-indigo-600",
    tags: ["مجاني", "قدرات", "كمي"],
  },
  {
    id: "2",
    title: "دورة التحصيلي المكثفة - المسار العلمي",
    instructor: "أ. أحمد خالد",
    rating: 4.8,
    studentsCount: 850,
    duration: "60 ساعة",
    price: 350,
    imageGradient: "from-teal-400 to-emerald-600",
    tags: ["تحصيلي", "علمي"],
  },
  {
    id: "3",
    title: "القدرات اللفظي - من الصفر للاحتراف",
    instructor: "أ. سارة سعيد",
    rating: 4.7,
    studentsCount: 920,
    duration: "35 ساعة",
    price: 200,
    imageGradient: "from-purple-500 to-pink-600",
    tags: ["قدرات", "لفظي"],
  },
];

interface CoursesSectionProps {
  onSubscribe: (courseName: string) => void;
}

export default function CoursesSection({ onSubscribe }: CoursesSectionProps) {
  return (
    <section id="courses" className="py-20 bg-bg px-4 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 fade-up">
          <h2 className="text-3xl md:text-5xl font-black text-text mb-4">اكتشف دوراتنا</h2>
          <p className="text-text-muted max-w-2xl mx-auto text-lg">
            مجموعة من أقوى الدورات المصممة خصيصاً لمساعدتك في تحقيق أعلى الدرجات في اختباري القدرات والتحصيلي.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {COURSES.map((course, index) => (
            <div
              key={course.id}
              className={`bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 fade-up delay-${(index % 4) + 1}`}
            >
              {/* Course Image Placeholder */}
              <div className={`h-48 w-full bg-gradient-to-br ${course.imageGradient} relative flex items-center justify-center group cursor-pointer`}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="w-14 h-14 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300">
                  <IconPlayerPlayFilled size={24} className="ml-1" />
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  {course.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        tag === "مجاني" ? "bg-accent-teal text-white" : "bg-card/90 text-text backdrop-blur-sm"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-text line-clamp-2 leading-tight">
                    {course.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
                  <div className="w-8 h-8 rounded-full bg-bg flex items-center justify-center font-bold text-primary">
                    {course.instructor.charAt(2)}
                  </div>
                  <span>{course.instructor}</span>
                </div>

                <div className="flex items-center justify-between text-sm text-text-muted mb-6 border-b border-border pb-6">
                  <div className="flex items-center gap-1">
                    <IconStarFilled size={16} className="text-accent-amber" />
                    <span className="font-bold text-text">{course.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconUsers size={16} />
                    <span>{course.studentsCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconClock size={16} />
                    <span>{course.duration}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-2xl font-black text-primary">
                    {course.price === 0 ? "مجاناً" : `${course.price} ريال`}
                  </div>
                  <button
                    onClick={() => onSubscribe(course.title)}
                    className={`px-6 py-2.5 rounded-xl font-bold transition-colors ${
                      course.price === 0
                        ? "bg-accent-teal hover:bg-accent-teal/90 text-white"
                        : "bg-primary hover:bg-primary-dark text-white"
                    }`}
                  >
                    {course.price === 0 ? "ابدأ مجاناً" : "اشترك الآن"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
