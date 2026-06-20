"use client";

import Link from "next/link";
import {
  IconFlame, IconAward, IconChartBar, IconChecks,
  IconClockHour4, IconClipboardText, IconChartLine,
  IconBrain, IconAlertTriangle, IconSparkles,
  IconVideo, IconCalendarTime,
} from "@tabler/icons-react";
import { MetricCard } from "@/components/ui/metric-card";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { fetchStudentStats, type StudentStats } from "@/lib/supabase/services/student-stats";

const QUICK_LINKS = [
  { href: "/tracks",      title: "الأقسام والمهارات", sub: "تتبع تقدمك بدقة",      icon: IconBrain },
  { href: "/lessons",     title: "الدروس",             sub: "شاهد آخر الشروحات",   icon: IconVideo },
  { href: "/library",     title: "المكتبة والملفات",   sub: "حمل المذكرات والمرفقات", icon: IconClipboardText },
  { href: "/exams",       title: "الاختبارات",         sub: "اختبر مستواك الآن",   icon: IconChecks },
  { href: "/study-plan",  title: "خطة المذاكرة",       sub: "نظّم وقتك بفعالية",   icon: IconCalendarTime },
  { href: "/performance", title: "تحليل الأداء",        sub: "تابع تقدمك بالتفصيل", icon: IconChartLine },
];

export function DashboardClient() {
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchStudentStats(user.id)
      .then(setStats)
      .finally(() => setIsLoadingStats(false));
  }, [user]);

  if (isAuthLoading || (user && isLoadingStats) || !stats) {
    return <div className="p-8 text-center text-text-muted font-bold">جاري التحميل...</div>;
  }

  const studentName = profile?.full_name?.split(" ")[0] || "طالب";

  return (
    <>
      {/* شريط الترحيب */}
      <section className="fade-up flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-sidebar px-7 py-6 text-white">
        <div>
          <h2 className="mb-1.5 text-[21px] font-extrabold flex items-center gap-2">
            أهلاً {studentName}! استمر في تفوقك <IconSparkles size={20} className="text-accent-amber" />
          </h2>
          <p className="text-[13.5px] text-white/70">
            مرحباً بك في <span className="font-bold text-white">منصة الأوس الماسية</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <div className="flex items-center gap-2 rounded-xl bg-accent-amber/15 px-4 py-2.5 text-[13px] font-bold text-accent-amber border border-accent-amber/20">
            <IconAward size={18} />
            {stats.masteredSkills} مهارة متقنة
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-primary/20 px-4 py-2.5 text-[13px] font-bold text-[#A9A1FF] border border-primary/30">
            <IconChartBar size={18} />
            {stats.avgMastery}% متوسط الإتقان
          </div>
        </div>
      </section>

      {/* كروت الإحصائيات — أرقام حقيقية */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard delay={1} icon={<IconChartBar size={20} />}     iconBg="var(--primary-light)"      iconColor="var(--primary)"      value={`${stats.avgMastery}%`}                       label="متوسط إتقان المهارات"       trend={undefined} />
        <MetricCard delay={2} icon={<IconChecks size={20} />}       iconBg="var(--accent-teal-light)"  iconColor="var(--accent-teal)"  value={stats.completedLessons}                      label={`دروس مكتملة من ${stats.totalLessons}`} trend={undefined} />
        <MetricCard delay={3} icon={<IconClockHour4 size={20} />}   iconBg="var(--accent-amber-light)" iconColor="var(--accent-amber)" value={`${stats.studyHours} ساعة`}                   label="ساعات المذاكرة الكلية"      trend={undefined} />
        <MetricCard delay={4} icon={<IconClipboardText size={20} />}iconBg="var(--accent-blue-light)"  iconColor="var(--accent-blue)"  value={stats.availableExams}                        label="الاختبارات المتاحة لك"      trend={undefined} />
      </section>

      {/* ── بطاقة نسب إتقان المهارات ── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="fade-up rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconBrain size={20} className="text-primary" />
              <span className="text-base font-extrabold">تقدمك في المسارات</span>
            </div>
            <Link href="/tracks" className="text-[12.5px] font-bold text-primary hover:underline">
              عرض التفصيل
            </Link>
          </div>

          {/* Progress bars */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center">
              <div className="text-2xl font-black text-emerald-600">{stats.masteredSkills}</div>
              <div className="text-xs font-bold text-emerald-700 mt-0.5">مهارة قوية</div>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
              <div className="text-2xl font-black text-amber-600">{stats.averageSkills}</div>
              <div className="text-xs font-bold text-amber-700 mt-0.5">متوسطة</div>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-center">
              <div className="text-2xl font-black text-rose-600">{stats.weakSkills}</div>
              <div className="text-xs font-bold text-rose-700 mt-0.5">تحتاج تحسين</div>
            </div>
          </div>

          {/* Overall bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-bold text-text-muted">متوسط الإتقان الكلي</span>
              <span className="font-black text-primary">{stats.avgMastery}%</span>
            </div>
            <div className="h-3 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-700"
                style={{ width: `${stats.avgMastery}%` }}
              />
            </div>
          </div>
        </div>

        {/* أضعف المهارات */}
        <div className="fade-up delay-1 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-1.5 text-sm font-black text-rose-600 mb-4">
            <IconAlertTriangle size={18} />
            مهارات تحتاج للتحسين
          </div>
          {stats.topWeakSkills.length > 0 ? (
            <>
              <div className="space-y-3">
                {stats.topWeakSkills.map(sk => (
                  <div key={sk.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-text truncate">{sk.name}</div>
                      <span className="text-xs font-black text-rose-600">{sk.score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${sk.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/tracks"
                className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-100 transition-colors"
              >
                <IconBrain size={16} />
                تدرّب عليها الآن
              </Link>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[120px] text-center">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-2">
                <IconChecks size={24} />
              </div>
              <p className="text-xs font-bold text-emerald-600">لا توجد مهارات ضعيفة حالياً، ممتاز!</p>
            </div>
          )}
        </div>
      </section>

      {/* روابط سريعة */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {QUICK_LINKS.map((link, i) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`fade-up delay-${i + 1} flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.75 hover:border-primary hover:shadow-[0_8px_24px_rgba(15,17,23,0.05)] group`}
            >
              <Icon size={24} className="text-primary group-hover:scale-110 transition-transform" />
              <div className="text-sm font-bold">{link.title}</div>
              <div className="text-xs text-text-muted">{link.sub}</div>
            </Link>
          );
        })}
      </section>
    </>
  );
}
