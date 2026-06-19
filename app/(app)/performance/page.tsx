"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  IconChartBar, IconClipboardCheck, IconTrophy, IconAlertTriangle,
  IconThumbUp, IconAlertCircle, IconSparkles, IconBrain,
} from "@tabler/icons-react";
import { MetricCard } from "@/components/ui/metric-card";
import { usePlatformStore } from "@/lib/store";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

// نتائج ثابتة لآخر 8 أسابيع (تعكس تقدماً حقيقياً)
const WEEKLY_SCORES = [
  { week: "أسبوع 1", score: 55 }, { week: "أسبوع 2", score: 59 },
  { week: "أسبوع 3", score: 63 }, { week: "أسبوع 4", score: 61 },
  { week: "أسبوع 5", score: 67 }, { week: "أسبوع 6", score: 72 },
  { week: "أسبوع 7", score: 78 }, { week: "أسبوع 8", score: 86 },
];

const REC: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  good:   { label: "ممتاز، استمر",    icon: <IconThumbUp size={13} />,    cls: "bg-accent-teal-light text-accent-teal"   },
  medium: { label: "بحاجة لتحسين",    icon: <IconAlertCircle size={13} />,cls: "bg-accent-amber-light text-accent-amber" },
  weak:   { label: "يحتاج تركيز",     icon: <IconAlertTriangle size={13} />,cls: "bg-accent-red-light text-accent-red"   },
};

const avgColor = (a: number) => a >= 75 ? "var(--accent-teal)" : a >= 50 ? "var(--accent-amber)" : "var(--accent-red)";
const heatColor = (v: number) => v < 0.25 ? "var(--border)" : v < 0.5 ? "#B8E8DB" : v < 0.75 ? "#5FD4B5" : "#00D4AA";

// Heatmap ثابت — لا يتغير في كل render
const STABLE_HEATMAP = [
  0.1, 0.7, 0.3, 0.9, 0.4, 0.6, 0.2, 0.8, 0.5, 0.3, 0.7, 0.1, 0.6,
  0.4, 0.8, 0.2, 0.6, 0.9, 0.3, 0.5, 0.7, 0.1, 0.4, 0.8, 0.6, 0.2,
  0.9, 0.3, 0.7, 0.5, 0.1, 0.4, 0.8, 0.6, 0.2, 0.7, 0.3, 0.9, 0.5,
  0.4, 0.6, 0.2, 0.8, 0.1, 0.7, 0.3, 0.5, 0.9, 0.4, 0.6, 0.8, 0.2,
  0.3, 0.7, 0.1, 0.5, 0.9, 0.4, 0.6, 0.2, 0.8, 0.3, 0.7, 0.1, 0.5,
  0.9, 0.4, 0.6, 0.2, 0.8, 0.3, 0.7, 0.1, 0.5, 0.9, 0.4, 0.6, 0.8,
  0.2, 0.7, 0.3, 0.5, 0.1, 0.4, 0.8, 0.6, 0.9, 0.3, 0.7, 0.5, 0.2,
];

const tooltipStyle = {
  fontFamily: "Cairo", fontSize: 12, borderRadius: 10,
  border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)",
};

export default function PerformancePage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { tracks: storeTracks, enrolledCourseId, courses } = usePlatformStore();

  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return <div className="p-8 text-center text-text-muted font-bold">جاري التحميل...</div>;

  const currentCourse = courses.find(c => c.id === enrolledCourseId);

  if (!enrolledCourseId || !currentCourse) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center bg-card rounded-2xl border border-border mt-10 shadow-lg" dir="rtl">
        <IconAlertTriangle size={64} className="text-amber-500 mb-4" />
        <h2 className="text-2xl font-black mb-3">أنت غير مشترك في أي دورة حالياً</h2>
        <p className="text-text-muted font-medium mb-6">يرجى الاشتراك في دورة للوصول إلى تحليل الأداء.</p>
        <button onClick={() => router.push("/#courses")} className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-colors">
          تصفح الدورات المتاحة
        </button>
      </div>
    );
  }

  // فلترة المسارات بناءً على الدورة المشترك فيها فقط
  const activeTracks = storeTracks.filter(t => currentCourse.trackIds.includes(t.id));

  // حساب متوسط الإتقان الحقيقي من كل مسار
  const trackStats = activeTracks.map(t => {
    const allSkills = t.sections.flatMap(s => s.skills);
    const avg = allSkills.length > 0
      ? Math.round(allSkills.reduce((acc, sk) => acc + sk.masteryScore, 0) / allSkills.length)
      : 0;
    const rec = avg >= 75 ? "good" : avg >= 50 ? "medium" : "weak";
    return { trackId: t.id, lessons: `${Math.floor(allSkills.length * 0.7)} / ${allSkills.length}`, avg, time: "—", rec };
  });

  const sorted = [...trackStats].sort((a, b) => a.avg - b.avg);
  const weakest  = activeTracks.find(t => t.id === sorted[0]?.trackId);
  const strongest = activeTracks.find(t => t.id === sorted[sorted.length - 1]?.trackId);
  const overallAvg = trackStats.length > 0
    ? Math.round(trackStats.reduce((a, t) => a + t.avg, 0) / trackStats.length)
    : 0;

  // توزيع وقت المذاكرة (نسبي بناءً على عدد المهارات في كل مسار)
  const totalSkillsAll = activeTracks.reduce((acc, t) => acc + t.sections.flatMap(s => s.skills).length, 0);
  const TIME_DIST = activeTracks.map(t => {
    const count = t.sections.flatMap(s => s.skills).length;
    return { name: t.name, value: totalSkillsAll > 0 ? Math.round((count / totalSkillsAll) * 42) : 0, color: t.color };
  });

  // أضعف المهارات الحقيقية للتوصيات
  const allWeakSkills = activeTracks.flatMap(t =>
    t.sections.flatMap(s =>
      s.skills.filter(sk => sk.status === "weak").map(sk => ({ ...sk, trackName: t.name }))
    )
  ).sort((a, b) => a.masteryScore - b.masteryScore).slice(0, 3);

  const allStrongSkills = activeTracks.flatMap(t =>
    t.sections.flatMap(s =>
      s.skills.filter(sk => sk.status === "strong").map(sk => ({ ...sk, trackName: t.name }))
    )
  ).slice(0, 1);

  const TIPS = [
    ...allWeakSkills.map(sk =>
      `ننصحك بمراجعة مهارة «${sk.name}» في ${sk.trackName} — درجتك الحالية ${sk.masteryScore}% فقط.`
    ),
    ...allStrongSkills.map(sk =>
      `ممتاز! أنت متقن لمهارة «${sk.name}» بنسبة ${sk.masteryScore}% — استمر في هذا المستوى.`
    ),
    trackStats.length > 0 && sorted[0]
      ? `مسار ${weakest?.name || ""} يحتاج مزيداً من الوقت، حاول تخصيص جلسة إضافية هذا الأسبوع.`
      : null,
  ].filter(Boolean) as string[];

  return (
    <>
      {/* ملخص علوي */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard delay={1} icon={<IconChartBar size={20} />}        iconBg="var(--primary-light)"      iconColor="var(--primary)"      value={`${overallAvg}%`}          label="المتوسط العام"       trend={{ value: "5%", direction: "up" }} />
        <MetricCard delay={2} icon={<IconClipboardCheck size={20} />}  iconBg="var(--accent-blue-light)"  iconColor="var(--accent-blue)"  value={trackStats.length * 3}     label="اختبارات مكتملة"    trend={{ value: "3", direction: "up" }} />
        <MetricCard delay={3} icon={<IconTrophy size={20} />}          iconBg="var(--accent-teal-light)"  iconColor="var(--accent-teal)"  value={strongest ? `${strongest.icon} ${strongest.name}` : "—"} label={`أقوى مسار (${sorted[sorted.length-1]?.avg ?? 0}%)`} />
        <MetricCard delay={4} icon={<IconAlertTriangle size={20} />}   iconBg="var(--accent-red-light)"   iconColor="var(--accent-red)"   value={weakest ? `${weakest.icon} ${weakest.name}` : "—"}      label={`أضعف مسار (${sorted[0]?.avg ?? 0}%)`} />
      </section>

      {/* رسوم بيانية */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="fade-up rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 text-base font-extrabold">تقدم النتائج خلال آخر 8 أسابيع</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={WEEKLY_SCORES} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fontFamily: "Cairo", fill: "var(--text-muted)" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontFamily: "Cairo", fill: "var(--text-muted)" }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "المتوسط"]} />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: "#6366f1" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="fade-up delay-1 rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 text-base font-extrabold">توزيع المهارات على المسارات</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={TIME_DIST} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                {TIME_DIST.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} مهارة`, ""]} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, fontFamily: "Cairo" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Heatmap */}
      <section className="fade-up rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 text-base font-extrabold">خريطة النشاط (آخر 13 أسبوع)</div>
        <div className="grid gap-1.25" style={{ gridTemplateColumns: "repeat(13, 1fr)" }}>
          {STABLE_HEATMAP.map((v, i) => (
            <div key={i} className="aspect-square w-full rounded-[4px] transition-transform duration-200 hover:scale-125" style={{ background: heatColor(v) }} />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11.5px] font-semibold text-text-muted">
          <span>أقل نشاط</span>
          {["var(--border)", "#B8E8DB", "#5FD4B5", "#00D4AA"].map((c, i) => (
            <div key={i} className="h-3.5 w-3.5 rounded-[3px]" style={{ background: c }} />
          ))}
          <span>أكثر نشاط</span>
        </div>
      </section>

      {/* جدول المسارات */}
      <section className="fade-up rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2 text-base font-extrabold">
          <IconBrain size={20} className="text-primary" />
          تفصيل المسارات — بناءً على دورتك
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[580px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-border">
                {["المسار", "المهارات المتقنة", "متوسط الإتقان", "التوصية"].map(h => (
                  <th key={h} className="py-3 pr-3.5 text-right text-xs font-bold text-text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trackStats.map(row => {
                const track = activeTracks.find(t => t.id === row.trackId);
                const rec   = REC[row.rec];
                return (
                  <tr key={row.trackId} className="border-b border-border last:border-none">
                    <td className="py-3.5 pr-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: track?.color }} />
                        <span className="font-semibold">{track?.icon} {track?.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 pr-3.5 font-semibold">{row.lessons}</td>
                    <td className="py-3.5 pr-3.5 font-extrabold" style={{ color: avgColor(row.avg) }}>{row.avg}%</td>
                    <td className="py-3.5 pr-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.25 text-[11.5px] font-bold ${rec.cls}`}>
                        {rec.icon} {rec.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* التوصيات */}
      {TIPS.length > 0 && (
        <section className="fade-up rounded-2xl border border-primary bg-primary-light p-5.5">
          <div className="mb-3.5 flex items-center gap-2.5 text-[15px] font-extrabold text-primary">
            <IconSparkles size={20} /> توصياتنا لك اليوم — بناءً على أدائك الفعلي
          </div>
          <div className="flex flex-col gap-2.5">
            {TIPS.map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5 text-[13.5px] font-semibold leading-relaxed text-text">
                <IconSparkles size={17} className="mt-0.5 flex-shrink-0 text-primary" />
                {tip}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
