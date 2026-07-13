"use client";

import Link from "next/link";
import {
  IconFlame, IconAward, IconChartBar, IconChecks,
  IconClockHour4, IconClipboardText, IconChartLine,
  IconBrain, IconAlertTriangle, IconSparkles,
  IconVideo, IconCalendarTime, IconBook2, IconTrophy
} from "@tabler/icons-react";
import { MetricCard } from "@/components/ui/metric-card";
import { usePlatformStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

const QUICK_LINKS = [
  { href: "/tracks",      title: "الأقسام والمهارات", sub: "تتبع تقدمك بدقة",      icon: IconBrain },
  { href: "/lessons",     title: "الدروس",             sub: "شاهد آخر الشروحات",   icon: IconVideo },
  { href: "/book",        title: "الكتاب التفاعلي",    sub: "تصفح المنهج بمتعة",    icon: IconBook2 },
  { href: "/library",     title: "المكتبة والملفات",   sub: "حمل المذكرات والمرفقات", icon: IconClipboardText },
  { href: "/exams",       title: "الاختبارات",         sub: "اختبر مستواك الآن",   icon: IconChecks },
  { href: "/final-exam",  title: "الاختبار النهائي",  sub: "اجتز الاختبار للشهادة", icon: IconTrophy },
  { href: "/certificates",title: "شهاداتي",          sub: "استعرض وحمّل شهاداتك", icon: IconAward },
  { href: "/study-plan",  title: "خطة المذاكرة",       sub: "نظّم وقتك بفعالية",   icon: IconCalendarTime },
  { href: "/performance", title: "تحليل الأداء",        sub: "تابع تقدمك بالتفصيل", icon: IconChartLine },
];

import { useSearchParams } from "next/navigation";

export function DashboardClient() {
  const { profile, isLoading: isAuthLoading } = useAuth();
  const searchParams = useSearchParams();
  const queryCourseId = searchParams?.get("courseId");
  const [isMounted, setIsMounted] = useState(false);
  const { tracks: storeTracks, exams, lessons, enrolledCourses, enrolledCourseId, setEnrolledCourseId, platformSettings } = usePlatformStore();

  useEffect(() => {
    if (queryCourseId && queryCourseId !== enrolledCourseId) {
      setEnrolledCourseId(queryCourseId);
    }
  }, [queryCourseId, enrolledCourseId, setEnrolledCourseId]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || isAuthLoading) return <div className="p-8 text-center text-text-muted font-bold">جاري التحميل...</div>;

  // Filter tracks and content based on active course
  const currentCourseId = queryCourseId || enrolledCourseId;
  const activeCourse = currentCourseId ? enrolledCourses.find(c => c.id === currentCourseId) : null;
  const activeTracks = storeTracks; // Tracks are already filtered by enrolledCourseId in app-shell.tsx

  // Apply Features Overrides
  const filteredQuickLinks = QUICK_LINKS.filter(link => {
    const pSettings = platformSettings || { global_interactive_book: true, global_study_plan: true, global_library: true };
    const overrides = (activeCourse as any)?.featuresOverride || {};
    
    if (link.href === '/book') {
      return overrides.interactive_book !== undefined ? overrides.interactive_book : pSettings.global_interactive_book;
    }
    if (link.href === '/study-plan') {
      return overrides.study_plan !== undefined ? overrides.study_plan : pSettings.global_study_plan;
    }
    if (link.href === '/library') {
      return overrides.library !== undefined ? overrides.library : pSettings.global_library;
    }
    return true;
  });

  // إحصائيات المهارات الفعلية من الStore
  const allSkills = activeTracks.flatMap(t => t.sections.flatMap(s => s.skills.map(sk => ({ ...sk, trackName: t.name }))));
  const totalSkills = allSkills.length;
  
  const masteredSkills = allSkills.filter(sk => sk.status === "strong").length;
  const averageSkillsCount = allSkills.filter(sk => sk.status === "average").length;
  const weakSkills = allSkills.filter(sk => sk.status === "weak");
  const weakSkillsCount = weakSkills.length;
  const notStartedSkillsCount = allSkills.filter(sk => sk.status === "not_started").length;

  const avgMastery = totalSkills > 0 ? Math.round(allSkills.reduce((s, sk) => s + (sk.masteryScore || 0), 0) / totalSkills) : 0;
  const topWeakSkills = [...weakSkills].sort((a,b) => (a.masteryScore || 0) - (b.masteryScore || 0)).slice(0, 3).map(sk => ({ id: sk.id, name: sk.name, track: sk.trackName, score: sk.masteryScore || 0 }));

  const validTrackIds = activeTracks.map(t => t.id);
  
  // إحصائيات عامة
  const availableLessons = activeCourse ? lessons.filter(l => validTrackIds.includes(l.trackId)) : lessons;
  const availableExams = activeCourse ? exams.filter(e => validTrackIds.includes(e.trackId)) : exams;
  
  const completedLessons = availableLessons.filter(l => l.status === "completed");
  const completedLessonsCount = completedLessons.length;
  
  // حساب الوقت الفعلي للمذاكرة بناءً على progressPercent من كل الدروس (مكتملة أو جزئية)
  const totalStudySeconds = availableLessons.reduce((acc, l) => {
    const pct = l.progressPercent ?? (l.status === "completed" ? 100 : 0);
    return acc + Math.round(((l.durationSeconds || 0) * pct) / 100);
  }, 0);
  const totalStudyMinutes = Math.round(totalStudySeconds / 60);
  
  let studyTimeLabel = "";
  if (totalStudyMinutes === 0) {
    studyTimeLabel = "0 دقيقة";
  } else if (totalStudyMinutes < 60) {
    studyTimeLabel = `${totalStudyMinutes} دقيقة`;
  } else {
    const hours = Math.floor(totalStudyMinutes / 60);
    const mins = totalStudyMinutes % 60;
    if (mins === 0) {
      studyTimeLabel = `${hours} ساعة`;
    } else {
      studyTimeLabel = `${hours} س و ${mins} د`;
    }
  }
  
  // اسم المستخدم من الداتا الحقيقية
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
            مرحباً بك في <span className="font-bold text-white">{activeCourse ? activeCourse.title : "دورة الأوس الماسية الشاملة"}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <div className="flex items-center gap-2 rounded-xl bg-accent-amber/15 px-4 py-2.5 text-[13px] font-bold text-accent-amber border border-accent-amber/20">
            <IconFlame size={18} />
            {avgMastery * 10} شعلة نشاط
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-primary/20 px-4 py-2.5 text-[13px] font-bold text-[#A9A1FF] border border-primary/30">
            <IconAward size={18} />
            المستوى {masteredSkills + 1}
          </div>
        </div>
      </section>

      {/* كروت الإحصائيات */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard delay={1} icon={<IconChartBar size={20} />}     iconBg="var(--primary-light)"      iconColor="var(--primary)"      value={`${avgMastery}%`}             label="متوسط إتقان المهارات"       trend={{ value: "4%", direction: "up" }} />
        <MetricCard delay={2} icon={<IconChecks size={20} />}       iconBg="var(--accent-teal-light)"  iconColor="var(--accent-teal)"  value={completedLessonsCount}    label={`دروس مكتملة من ${availableLessons.length}`} trend={{ value: "2", direction: "up" }} />
        <MetricCard delay={3} icon={<IconClockHour4 size={20} />}   iconBg="var(--accent-amber-light)" iconColor="var(--accent-amber)" value={studyTimeLabel} label="وقت المذاكرة الفعلي"      trend={{ value: "دقيق", direction: "up" }} />
        <MetricCard delay={4} icon={<IconClipboardText size={20} />}iconBg="var(--accent-blue-light)"  iconColor="var(--accent-blue)"  value={availableExams.length}        label="الاختبارات المتاحة لك"      trend={undefined} />
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center">
              <div className="text-2xl font-black text-emerald-600">{masteredSkills}</div>
              <div className="text-xs font-bold text-emerald-700 mt-0.5">متقنة</div>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
              <div className="text-2xl font-black text-amber-600">{averageSkillsCount}</div>
              <div className="text-xs font-bold text-amber-700 mt-0.5">متوسطة</div>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-center">
              <div className="text-2xl font-black text-rose-600">{weakSkillsCount}</div>
              <div className="text-xs font-bold text-rose-700 mt-0.5">ضعيفة</div>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
              <div className="text-2xl font-black text-gray-500">{notStartedSkillsCount}</div>
              <div className="text-xs font-bold text-gray-600 mt-0.5">لم تبدأ</div>
            </div>
          </div>

          {/* Overall bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-bold text-text-muted">متوسط الإتقان الكلي</span>
              <span className="font-black text-primary">{avgMastery}%</span>
            </div>
            <div className="h-3 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-700"
                style={{ width: `${avgMastery}%` }}
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
          {topWeakSkills.length > 0 ? (
            <>
              <div className="space-y-3">
                {topWeakSkills.map(sk => (
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
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredQuickLinks.map((link, i) => {
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
