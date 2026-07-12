// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import { IconCheck, IconListCheck, IconTrash } from "@tabler/icons-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useToast } from "@/components/ui/toast";
import { TaskDrawer } from "./task-drawer";
import { useAuth } from "@/hooks/use-auth";
import { usePlatformStore } from "@/lib/store";
import {
  fetchStudyPlanTasks,
  addStudyPlanTask,
  toggleStudyPlanTask,
  updateStudyPlanTaskDate,
  deleteStudyPlanTask,
  type StudyPlanTask,
} from "@/lib/supabase/services/study-plan";

const DAY_NAMES = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeek(base: Date): Date {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); 
  return d;
}

export function StudyPlanClient() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { enrolledCourseId, enrolledCourses, platformSettings } = usePlatformStore();

  const [tasks, setTasks] = useState<StudyPlanTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Apply Features Overrides
  const activeCourse = enrolledCourses.find(c => c.id === enrolledCourseId);
  const pSettings = platformSettings || { global_interactive_book: true, global_study_plan: true, global_library: true };
  const overrides = (activeCourse as any)?.featuresOverride || {};
  const isEnabled = overrides.study_plan !== undefined ? overrides.study_plan : pSettings.global_study_plan;

  const [weekOffset, setWeekOffset] = useState(0); 
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDate, setDrawerDate] = useState<string>(toKey(new Date()));
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  
  const todayKey = toKey(new Date());

  const weekDays = useMemo(() => {
    const base = startOfWeek(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  useEffect(() => {
    if (!user) return;
    fetchStudyPlanTasks(user.id)
      .then(setTasks)
      .finally(() => setIsLoading(false));
  }, [user]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.is_completed).length;
    const remain = total - done;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, remain, pct };
  }, [tasks]);

  async function toggleTask(id: string) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const next = !task.is_completed;
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, is_completed: next } : t)));
    const ok = await toggleStudyPlanTask(id, next);
    if (!ok) {
      setTasks(prev => prev.map(t => (t.id === id ? { ...t, is_completed: !next } : t)));
      showToast("تعذر تحديث المهمة", "error");
    } else if (next) {
      showToast("أحسنت! تم إنجاز المهمة", "success");
    }
  }

  async function moveTask(id: string, newDateKey: string) {
    const task = tasks.find(t => t.id === id);
    if (!task || task.due_date === newDateKey) return;
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, due_date: newDateKey } : t)));
    const ok = await updateStudyPlanTaskDate(id, newDateKey);
    if (!ok) showToast("تعذر نقل المهمة", "error");
    else showToast("تم نقل المهمة بنجاح", "success");
  }

  async function addTask(payload: { title: string; due_date: string | null; micro_skill_id?: string | null }) {
    if (!user) return;
    const created = await addStudyPlanTask(user.id, payload);
    if (created) {
      setTasks(prev => [...prev, created]);
      setDrawerOpen(false);
      showToast("تمت إضافة المهمة بنجاح", "success");
    } else {
      showToast("تعذرت إضافة المهمة", "error");
    }
  }

  async function removeTask(id: string) {
    const prev = tasks;
    setTasks(p => p.filter(t => t.id !== id));
    const ok = await deleteStudyPlanTask(id);
    if (!ok) {
      setTasks(prev);
      showToast("تعذر حذف المهمة", "error");
    }
  }

  function openDrawer(dateKey: string) {
    setDrawerDate(dateKey);
    setDrawerOpen(true);
  }

  const todayTasks = tasks.filter(t => t.due_date === todayKey);

  if (!isEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <IconListCheck size={40} stroke={1.5} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">خطة المذاكرة غير متاحة</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          عذراً، ميزة خطة المذاكرة غير متاحة لهذه الدورة حالياً.
        </p>
      </div>
    );
  }

  if (isLoading) return <div className="p-8 text-center text-text-muted font-bold">جاري التحميل...</div>;

  const weekLabel = `${weekDays[0].getDate()} ${AR_MONTHS[weekDays[0].getMonth()]} - ${weekDays[6].getDate()} ${AR_MONTHS[weekDays[6].getMonth()]}`;

  return (
    <>
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3 mb-6">
        <div className="fade-up relative overflow-hidden flex items-center gap-4 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-lg shadow-indigo-200/50">
          <div className="absolute -left-6 -top-6 opacity-20">
            <IconListCheck size={120} />
          </div>
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-sm">
            <IconListCheck size={28} />
          </div>
          <div className="z-10">
            <div className="text-3xl font-black">{stats.total}</div>
            <div className="text-sm font-semibold opacity-90">إجمالي المهام المجدولة</div>
          </div>
        </div>

        <div className="fade-up delay-1 relative overflow-hidden flex items-center gap-4 rounded-3xl bg-gradient-to-br from-teal-400 to-emerald-500 p-6 text-white shadow-lg shadow-teal-200/50">
          <div className="absolute -left-6 -top-6 opacity-20">
            <IconCheck size={120} />
          </div>
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-sm">
            <IconCheck size={28} />
          </div>
          <div className="z-10">
            <div className="text-3xl font-black">
              {stats.done} <span className="text-xl opacity-70">/ {stats.total}</span>
            </div>
            <div className="text-sm font-semibold opacity-90">المهام المنجزة بنجاح</div>
          </div>
        </div>

        <div className="fade-up delay-2 flex flex-col justify-center gap-3 rounded-3xl bg-white border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-extrabold text-slate-700">معدل الإنجاز العام</div>
            <div className="text-2xl font-black text-indigo-600">{stats.pct}%</div>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
             <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-all duration-1000 ease-out" style={{ width: `${stats.pct}%` }} />
          </div>
        </div>
      </section>

      <section className="fade-up rounded-3xl border border-slate-100 bg-white p-6 shadow-sm mb-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="h-8 w-2 rounded-full bg-indigo-500"></div>
             <h2 className="text-xl font-black text-slate-800">الخطة الأسبوعية</h2>
          </div>
          <button onClick={() => openDrawer(todayKey)} className="group flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-600 transition-all hover:bg-indigo-600 hover:text-white shadow-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white text-indigo-600 transition-colors group-hover:bg-indigo-500 group-hover:text-white">+</span>
            مهمة جديدة
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setWeekOffset(0)}
            className={`rounded-xl px-5 py-2.5 text-[13px] font-extrabold transition-all duration-300 ${weekOffset === 0 ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
          >
            هذا الأسبوع ({weekLabel})
          </button>
          <button
            onClick={() => setWeekOffset(1)}
            className={`rounded-xl px-5 py-2.5 text-[13px] font-extrabold transition-all duration-300 ${weekOffset === 1 ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
          >
            الأسبوع القادم
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
          {weekDays.map(date => {
            const key = toKey(date);
            const dayTasks = tasks.filter(t => t.due_date === key);
            const isToday = key === todayKey;
            const isDragOver = dragOverKey === key;

            return (
              <div
                key={key}
                onDragOver={(e) => { e.preventDefault(); setDragOverKey(key); }}
                onDragLeave={() => setDragOverKey(cur => (cur === key ? null : cur))}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) moveTask(id, key);
                  setDragOverKey(null);
                }}
                className={`flex min-h-[300px] flex-col gap-3 rounded-2xl border-2 p-3 transition-all duration-200 ${isDragOver ? "border-indigo-400 bg-indigo-50/50" : isToday ? "border-indigo-100 bg-slate-50/50" : "border-slate-50 bg-white hover:border-slate-100"}`}
              >
                <div className={`mb-2 border-b-2 pb-3 text-center ${isToday ? "border-indigo-200" : "border-slate-100"}`}>
                  <div className={`text-[15px] font-black ${isToday ? "text-indigo-600" : "text-slate-700"}`}>
                    {DAY_NAMES[date.getDay()]}
                  </div>
                  <div className="mt-1 text-xs font-bold text-slate-400">{date.getDate()} {AR_MONTHS[date.getMonth()]}</div>
                </div>

                {dayTasks.length === 0 ? (
                  <div className="flex min-h-20 flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-xs font-semibold text-slate-400">
                    لا توجد مهام
                  </div>
                ) : (
                  dayTasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => { e.dataTransfer.setData("text/plain", task.id); }}
                      className={`group relative flex flex-col gap-2 cursor-grab rounded-xl p-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:cursor-grabbing ${task.is_completed ? "bg-slate-50 border border-slate-200 opacity-60" : task.source === "auto" ? "bg-rose-50 border border-rose-100" : "bg-white border border-indigo-100"}`}
                    >
                      <div className={`text-[13px] font-bold leading-tight ${task.is_completed ? "line-through text-slate-400" : task.source === "auto" ? "text-rose-900" : "text-slate-700"}`}>
                        {task.title}
                      </div>

                      {task.source === "auto" && !task.is_completed && (
                        <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-rose-600 bg-rose-100/50 w-fit px-2 py-0.5 rounded-full">
                          <span className="flex h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                          خطة علاجية
                        </div>
                      )}
                      
                      <div className="mt-auto pt-1 flex items-center justify-between border-t border-slate-100/50">
                        <button
                          onClick={() => toggleTask(task.id)}
                          aria-label={task.is_completed ? "إلغاء الإنجاز" : "إنجاز المهمة"}
                          className={`flex h-6 w-6 items-center justify-center rounded-md transition-all duration-300 ${task.is_completed ? "bg-teal-500 text-white shadow-inner" : "border-2 border-slate-300 text-transparent hover:border-teal-400"}`}
                        >
                          <IconCheck size={14} stroke={3} />
                        </button>
                        
                        <button
                          onClick={() => removeTask(task.id)}
                          aria-label="حذف"
                          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:text-rose-500 hover:bg-rose-50"
                        >
                          <IconTrash size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}

                <button
                  onClick={() => openDrawer(key)}
                  className="mt-auto rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-[12.5px] font-bold text-slate-400 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  + مهمة
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="fade-up rounded-3xl border border-slate-100 bg-white p-6 shadow-sm mb-6">
        <div className="mb-5 flex items-center gap-3">
           <div className="h-8 w-2 rounded-full bg-teal-400"></div>
           <h2 className="text-xl font-black text-slate-800">مهام اليوم</h2>
        </div>
        {todayTasks.length === 0 ? (
          <div className="flex min-h-24 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-400 bg-slate-50/50">
            لا توجد مهام متبقية لليوم 🎉 يمكنك أخذ قسط من الراحة!
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {todayTasks.map(task => (
              <div
                key={task.id}
                className={`group flex items-center gap-4 rounded-2xl border p-4 transition-all duration-300 hover:shadow-md ${task.is_completed ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-100 hover:border-indigo-200"}`}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  aria-label={task.is_completed ? "إلغاء الإنجاز" : "إنجاز المهمة"}
                  className={`pop flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[8px] border-2 transition-all duration-300 ${task.is_completed ? "border-teal-500 bg-teal-500 text-white shadow-inner scale-95" : "border-slate-300 text-transparent hover:border-teal-400 hover:scale-105"}`}
                >
                  <IconCheck size={18} stroke={3} />
                </button>
                <div className="flex-1">
                  <div className={`text-[15px] font-extrabold ${task.is_completed ? "line-through text-slate-400" : "text-slate-700"}`}>
                    {task.title}
                  </div>
                  {task.source === "auto" && !task.is_completed && (
                    <div className="mt-1 text-[11px] font-bold text-rose-500">مهمة علاجية موصى بها من النظام الذكي بناءً على أخطائك بالاختبار</div>
                  )}
                </div>
                <button onClick={() => removeTask(task.id)} aria-label="حذف" className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500">
                  <IconTrash size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {tasks.filter(t => !t.due_date).length > 0 && (
        <section className="fade-up rounded-3xl border border-rose-100 bg-rose-50/30 p-6 shadow-sm mb-6">
          <div className="mb-5 flex items-center gap-3">
             <div className="h-8 w-2 rounded-full bg-rose-400"></div>
             <h2 className="text-xl font-black text-rose-900">مهام غير مجدولة (تحتاج لجدولة أو حذف)</h2>
          </div>
          <div className="flex flex-col gap-3">
            {tasks.filter(t => !t.due_date).map(task => (
              <div key={task.id} className="group flex items-center justify-between rounded-2xl border border-rose-200 bg-white p-4 transition-all duration-300 hover:shadow-md">
                <div className="text-[15px] font-extrabold text-slate-700">{task.title}</div>
                <div className="flex gap-2">
                  <button onClick={() => removeTask(task.id)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-rose-500 transition-all duration-200 hover:bg-rose-100">
                    <IconTrash size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <TaskDrawer
        open={drawerOpen}
        defaultDate={drawerDate}
        onClose={() => setDrawerOpen(false)}
        onSave={addTask}
      />
    </>
  );
}
