"use client";

import { useEffect, useMemo, useState } from "react";
import { IconCheck, IconListCheck, IconTrash } from "@tabler/icons-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useToast } from "@/components/ui/toast";
import { TaskDrawer } from "./task-drawer";
import { useAuth } from "@/hooks/use-auth";
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

// Local YYYY-MM-DD (avoids UTC off-by-one from toISOString).
function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeek(base: Date): Date {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Sunday
  return d;
}

export function StudyPlanClient() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState<StudyPlanTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, 1 = next week
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDate, setDrawerDate] = useState<string>(toKey(new Date()));
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const todayKey = toKey(new Date());

  // The 7 day-cells of the visible week, as real dates.
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

  if (isLoading) return <div className="p-8 text-center text-text-muted font-bold">جاري التحميل...</div>;

  const weekLabel = `${weekDays[0].getDate()} ${AR_MONTHS[weekDays[0].getMonth()]} - ${weekDays[6].getDate()} ${AR_MONTHS[weekDays[6].getMonth()]}`;

  return (
    <>
      {/* إحصائيات سريعة */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="fade-up flex items-center gap-3.5 rounded-2xl border border-border bg-card px-5 py-4.5">
          <div className="flex h-11.5 w-11.5 flex-shrink-0 items-center justify-center rounded-xl bg-primary-light text-[21px] text-primary">
            <IconListCheck size={21} />
          </div>
          <div>
            <div className="text-[22px] font-black">{stats.total}</div>
            <div className="text-[12.5px] font-semibold text-text-muted">إجمالي المهام</div>
          </div>
        </div>

        <div className="fade-up delay-1 flex items-center gap-3.5 rounded-2xl border border-border bg-card px-5 py-4.5">
          <div className="flex h-11.5 w-11.5 flex-shrink-0 items-center justify-center rounded-xl bg-accent-teal-light text-[21px] text-accent-teal">
            <IconCheck size={21} />
          </div>
          <div>
            <div className="text-[22px] font-black">
              {stats.done} / {stats.remain}
            </div>
            <div className="text-[12.5px] font-semibold text-text-muted">مكتملة / متبقية</div>
          </div>
        </div>

        <div className="fade-up delay-2 flex flex-col gap-2 rounded-2xl border border-border bg-card px-5 py-4.5">
          <div className="flex items-center justify-between">
            <div className="text-[12.5px] font-semibold text-text-muted">نسبة الإنجاز</div>
            <div className="text-base font-black">{stats.pct}%</div>
          </div>
          <ProgressBar percent={stats.pct} color="var(--accent-teal)" />
        </div>
      </section>

      {/* التقويم الأسبوعي */}
      <section className="fade-up rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-base font-extrabold">
          الخطة الأسبوعية
          <button onClick={() => openDrawer(todayKey)} className="text-[12.5px] font-bold text-primary">
            + إضافة مهمة جديدة
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setWeekOffset(0)}
            className={`rounded-[10px] px-4.5 py-2.25 text-[13px] font-bold transition-colors ${weekOffset === 0 ? "bg-primary text-white" : "border border-border text-text-muted hover:border-primary hover:text-primary"}`}
          >
            هذا الأسبوع ({weekLabel})
          </button>
          <button
            onClick={() => setWeekOffset(1)}
            className={`rounded-[10px] px-4.5 py-2.25 text-[13px] font-bold transition-colors ${weekOffset === 1 ? "bg-primary text-white" : "border border-border text-text-muted hover:border-primary hover:text-primary"}`}
          >
            الأسبوع القادم
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-7">
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
                className={`flex min-h-85 flex-col gap-2.5 rounded-2xl border p-3.5 transition-colors duration-200 ${isDragOver ? "border-primary bg-primary-light" : "border-border"}`}
              >
                <div className="mb-1 border-b border-border pb-2.5 text-center">
                  <div className="text-sm font-extrabold">
                    {DAY_NAMES[date.getDay()]}{isToday ? " (اليوم)" : ""}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-text-muted">{date.getDate()} {AR_MONTHS[date.getMonth()]}</div>
                </div>

                {dayTasks.length === 0 ? (
                  <div className="flex min-h-20 flex-1 items-center justify-center rounded-[10px] border border-dashed border-border text-xs text-text-muted">
                    لا توجد مهام
                  </div>
                ) : (
                  dayTasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => { e.dataTransfer.setData("text/plain", task.id); }}
                      className={`group relative cursor-grab rounded-[10px] border border-border bg-bg p-2.5 transition-opacity duration-200 active:cursor-grabbing ${task.is_completed ? "opacity-50 line-through" : ""}`}
                    >
                      <div className="text-[12.5px] font-bold pl-6">{task.title}</div>
                      <button
                        onClick={() => toggleTask(task.id)}
                        aria-label={task.is_completed ? "إلغاء الإنجاز" : "إنجاز المهمة"}
                        className={`absolute bottom-2 left-2 flex h-4.5 w-4.5 items-center justify-center rounded-[6px] border-2 transition-colors ${task.is_completed ? "border-accent-teal bg-accent-teal text-white" : "border-border text-transparent"}`}
                      >
                        <IconCheck size={11} />
                      </button>
                      <button
                        onClick={() => removeTask(task.id)}
                        aria-label="حذف"
                        className="absolute top-2 left-2 text-text-muted opacity-0 group-hover:opacity-100 hover:text-accent-red transition-opacity"
                      >
                        <IconTrash size={13} />
                      </button>
                    </div>
                  ))
                )}

                <button
                  onClick={() => openDrawer(key)}
                  className="rounded-[10px] border border-dashed border-border py-2.25 text-[12.5px] font-bold text-text-muted transition-colors duration-200 hover:border-primary hover:text-primary"
                >
                  + إضافة مهمة
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* مهام اليوم */}
      <section className="fade-up rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 text-base font-extrabold">مهام اليوم</div>
        {todayTasks.length === 0 ? (
          <div className="flex min-h-20 items-center justify-center rounded-[10px] border border-dashed border-border text-xs text-text-muted">
            لا توجد مهام اليوم 🎉
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {todayTasks.map(task => (
              <div
                key={task.id}
                className={`flex items-center gap-3 rounded-xl border border-border px-3.5 py-3.25 transition-colors duration-200 hover:border-primary ${task.is_completed ? "opacity-55" : ""}`}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  aria-label={task.is_completed ? "إلغاء الإنجاز" : "إنجاز المهمة"}
                  className={`pop flex h-5.5 w-5.5 flex-shrink-0 items-center justify-center rounded-[7px] border-2 transition-colors duration-200 ${task.is_completed ? "border-accent-teal bg-accent-teal text-white" : "border-border text-transparent"}`}
                >
                  <IconCheck size={14} />
                </button>
                <span className={`flex-1 text-[13.5px] font-semibold ${task.is_completed ? "line-through" : ""}`}>
                  {task.title}
                </span>
                <button onClick={() => removeTask(task.id)} aria-label="حذف" className="text-text-muted hover:text-accent-red transition-colors">
                  <IconTrash size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <TaskDrawer
        open={drawerOpen}
        defaultDate={drawerDate}
        onClose={() => setDrawerOpen(false)}
        onSave={addTask}
      />
    </>
  );
}
