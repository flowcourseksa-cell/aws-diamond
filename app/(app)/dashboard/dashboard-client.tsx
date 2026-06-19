"use client";

import Link from "next/link";
import {
  IconFlame, IconAward, IconChartBar, IconChecks,
  IconClockHour4, IconCalendarCheck, IconVideo,
  IconClipboardText, IconCalendarTime, IconChartLine,
  IconBrain, IconAlertTriangle,
} from "@tabler/icons-react";
import { MetricCard } from "@/components/ui/metric-card";
import {
  CURRENT_USER, METRICS, WEEK_DAYS, NEXT_EXAM,
} from "@/lib/mock-data";
import { usePlatformStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { CountdownTimer } from "./countdown-timer";
import { TodayTasks } from "./today-tasks";

const QUICK_LINKS = [
  { href: "/tracks",      title: "الأقسام والمهارات", sub: "تتبع تقدمك بدقة",      icon: IconBrain },
  { href: "/lessons",     title: "الدروس",             sub: "شاهد آخر الشروحات",   icon: IconVideo },
  { href: "/exams",       title: "الاختبارات",         sub: "اختبر مستواك الآن",   icon: IconClipboardText },
  { href: "/study-plan",  title: "خطة المذاكرة",       sub: "نظّم وقتك بفعالية",   icon: IconCalendarTime },
  { href: "/performance", title: "تحليل الأداء",        sub: "تابع تقدمك بالتفصيل", icon: IconChartLine },
];

export function DashboardClient() {
  const [isMounted, setIsMounted] = useState(false);
  const storeTracks = usePlatformStore(s => s.tracks);
  
  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return <div className="p-8 text-center text-text-muted font-bold">جاري التحميل...</div>;

  const allSkills = storeTracks.flatMap(t => t.sections.flatMap(s => s.skills.map(sk => ({ ...sk, trackName: t.name }))));
  const totalSkills = allSkills.length;
  const masteredSkills = allSkills.filter(sk => sk.status === "strong").length;
  const weakSkills = allSkills.filter(sk => sk.status === "weak");
  const weakSkillsCount = weakSkills.length;
  const avgMastery = totalSkills > 0 ? Math.round(allSkills.reduce((s, sk) => s + sk.masteryScore, 0) / totalSkills) : 0;
  const topWeakSkills = weakSkills.slice(0, 3).map(sk => ({ id: sk.id, name: sk.name, track: sk.trackName, score: sk.masteryScore }));

  const prog = {
    totalSkills,
    masteredSkills,
    weakSkillsCount,
    avgMastery,
    topWeakSkills
  };

  return (
    <>
      {/* شريط الترحيب */}
      <section className="fade-up flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-sidebar px-7 py-6 text-white">
        <div>
          <h2 className="mb-1.5 text-[21px] font-extrabold">
            أهلاً {CURRENT_USER.fullName.split(" ")[0]}! استمر في تفوقك 🎯
          </h2>
          <p className="text-[13.5px] text-white/55">
            لديك 5 مهام لليوم — أنجزت 2 منها بالفعل. واصل التقدم!
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <div className="flex items-center gap-2 rounded-xl bg-accent-amber/15 px-4 py-2.5 text-[13px] font-bold text-accent-amber">
            <IconFlame size={18} />
            {CURRENT_USER.streakDays} يوم متتالي
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-primary/20 px-4 py-2.5 text-[13px] font-bold text-[#A9A1FF]">
            <IconAward size={18} />
            المستوى {CURRENT_USER.level}
          </div>
        </div>
      </section>

      {/* كروت الإحصائيات */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard delay={1} icon={<IconChartBar size={20} />}     iconBg="var(--primary-light)"      iconColor="var(--primary)"      value={`${METRICS.avgScore}%`}             label="متوسط الاختبارات"           trend={{ value: "4%", direction: "up" }} />
        <MetricCard delay={2} icon={<IconChecks size={20} />}       iconBg="var(--accent-teal-light)"  iconColor="var(--accent-teal)"  value={METRICS.completedLessons}           label={`دروس مكتملة من ${METRICS.totalLessons}`} trend={{ value: "8", direction: "up" }} />
        <MetricCard delay={3} icon={<IconClockHour4 size={20} />}   iconBg="var(--accent-amber-light)" iconColor="var(--accent-amber)" value={`${METRICS.studyHours} ساعة`}      label="ساعات المذاكرة هذا الشهر"  trend={{ value: "6h", direction: "up" }} />
        <MetricCard delay={4} icon={<IconCalendarCheck size={20} />}iconBg="var(--accent-blue-light)"  iconColor="var(--accent-blue)"  value={`${METRICS.attendance}%`}           label="نسبة الحضور"                trend={{ value: "2%", direction: "down" }} />
      </section>

      {/* ── بطاقة نسب إتقان المهارات ── */}
      <section className="fade-up rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IconBrain size={20} className="text-primary" />
            <span className="text-base font-extrabold">نسب إتقان المهارات</span>
          </div>
          <Link href="/tracks" className="text-[12.5px] font-bold text-primary hover:underline">
            عرض التفصيل
          </Link>
        </div>

        {/* Progress bars */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center">
            <div className="text-2xl font-black text-emerald-600">{prog.masteredSkills}</div>
            <div className="text-xs font-bold text-emerald-700 mt-0.5">مهارة ممتازة</div>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
            <div className="text-2xl font-black text-amber-600">{prog.totalSkills - prog.masteredSkills - prog.weakSkillsCount}</div>
            <div className="text-xs font-bold text-amber-700 mt-0.5">متوسطة</div>
          </div>
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-center">
            <div className="text-2xl font-black text-rose-600">{prog.weakSkillsCount}</div>
            <div className="text-xs font-bold text-rose-700 mt-0.5">تحتاج تحسين</div>
          </div>
        </div>

        {/* Overall bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-bold text-text-muted">متوسط الإتقان الكلي</span>
            <span className="font-black text-primary">{prog.avgMastery}%</span>
          </div>
          <div className="h-3 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-700"
              style={{ width: `${prog.avgMastery}%` }}
            />
          </div>
        </div>

        {/* أضعف المهارات */}
        {prog.topWeakSkills.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-rose-600 mb-2">
              <IconAlertTriangle size={14} />
              المهارات الأكثر احتياجاً للتحسين
            </div>
            <div className="space-y-2">
              {prog.topWeakSkills.map(sk => (
                <div key={sk.id} className="flex items-center gap-3">
                  <div className="text-sm font-bold text-text min-w-0 flex-1 truncate">{sk.name}</div>
                  <div className="text-xs text-text-muted flex-shrink-0">{sk.track}</div>
                  <div className="w-20 h-2 bg-border rounded-full overflow-hidden flex-shrink-0">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${sk.score}%` }} />
                  </div>
                  <span className="text-xs font-black text-rose-600 w-8 text-left flex-shrink-0">{sk.score}%</span>
                </div>
              ))}
            </div>
            <Link
              href="/tracks"
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-sm hover:bg-rose-100 transition-colors"
            >
              <IconBrain size={16} />
              ابدأ تحسين هذه المهارات الآن
            </Link>
          </div>
        )}
      </section>

      {/* نشاط الأسبوع + الاختبار القادم */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="fade-up rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between text-base font-extrabold">
            نشاطك هذا الأسبوع
            <span className="cursor-pointer text-[12.5px] font-bold text-primary">عرض التفاصيل</span>
          </div>
          <div className="grid grid-cols-5 gap-2.5">
            {WEEK_DAYS.map((day) => (
              <div
                key={day.name}
                className={`cursor-pointer rounded-xl border p-3.5 text-center transition-colors duration-200 ${
                  day.isToday
                    ? "border-primary bg-primary text-white"
                    : "border-border hover:border-primary"
                }`}
              >
                <div className={`mb-2 text-xs font-bold ${day.isToday ? "text-white/70" : ""}`}>{day.name}</div>
                <div className="text-xl font-black">{day.count}</div>
                <div className={`mt-0.5 text-[10.5px] ${day.isToday ? "text-white/60" : "text-text-muted"}`}>{day.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="fade-up rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 text-base font-extrabold">الاختبار القادم</div>
          <div className="flex h-full flex-col items-center justify-center gap-3.5 text-center">
            <div className="text-sm font-bold">📐 {NEXT_EXAM.title}</div>
            <CountdownTimer targetDate={NEXT_EXAM.targetDate} />
            <div className="text-[13px] font-semibold text-text-muted">
              استعد جيداً — راجع التفاضل والتكامل
            </div>
          </div>
        </div>
      </section>

      {/* مهام اليوم */}
      <section className="fade-up rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between text-base font-extrabold">
          مهام اليوم
          <Link href="/study-plan" className="text-[12.5px] font-bold text-primary">
            + إضافة مهمة
          </Link>
        </div>
        <TodayTasks />
      </section>

      {/* روابط سريعة */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {QUICK_LINKS.map((link, i) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`fade-up delay-${i + 1} flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.75 hover:border-primary hover:shadow-[0_8px_24px_rgba(15,17,23,0.05)]`}
            >
              <Icon size={24} className="text-primary" />
              <div className="text-sm font-bold">{link.title}</div>
              <div className="text-xs text-text-muted">{link.sub}</div>
            </Link>
          );
        })}
      </section>
    </>
  );
}
