"use client";

import React, { useState, useEffect } from "react";
import { IconSearch, IconX, IconArrowLeft } from "@tabler/icons-react";
import { fetchCourses } from "@/lib/supabase/services/courses";
import { type Course } from "@/lib/store";
import Link from "next/link";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [results, setResults] = useState<Course[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchCourses().then(setCourses);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
    } else {
      setResults(
        courses.filter(c => 
          c.title.includes(query) || 
          (c.subtitle && c.subtitle.includes(query)) ||
          c.description.includes(query)
        )
      );
    }
  }, [query, courses]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4" dir="rtl">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="relative flex items-center p-4 border-b border-slate-100">
          <IconSearch className="absolute right-8 text-indigo-500" size={24} />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن الدورات، الملخصات، والمحاكيات..." 
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pr-14 pl-12 text-lg text-slate-800 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            autoFocus
          />
          <button 
            onClick={onClose}
            className="absolute left-8 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {query.trim() === "" ? (
            <div>
              <p className="text-sm font-bold text-slate-400 mb-3 px-2">عمليات البحث الشائعة</p>
              <div className="flex flex-wrap gap-2 px-2">
                <span onClick={() => setQuery("تجميعات")} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold cursor-pointer hover:bg-indigo-100 transition-colors">تجميعات التحصيلي</span>
                <span onClick={() => setQuery("ستيب")} className="px-4 py-2 bg-amber-50 text-amber-600 rounded-full text-sm font-bold cursor-pointer hover:bg-amber-100 transition-colors">دورة الستيب المكثفة</span>
                <span onClick={() => setQuery("تأسيس")} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-bold cursor-pointer hover:bg-slate-200 transition-colors">ملفات التأسيس</span>
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col gap-2">
              {results.map(course => (
                <Link
                  key={course.id}
                  href={`/course/${course.id}`}
                  onClick={onClose}
                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-indigo-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${course.coverGradient} flex-shrink-0 shadow-sm`} />
                    <div>
                      <h4 className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{course.title}</h4>
                      <p className="text-sm text-slate-500 line-clamp-1">{course.subtitle || "دورة شاملة"}</p>
                    </div>
                  </div>
                  <IconArrowLeft className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <IconSearch size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-600">لا توجد نتائج مطابقة</h3>
              <p className="text-slate-400 text-sm mt-1">حاول البحث بكلمات مختلفة أو تحقق من الإملاء</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
