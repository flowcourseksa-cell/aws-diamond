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
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { fetchPerformanceData, type PerformanceData } from "@/lib/supabase/services/performance";

const REC: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  good:   { label: "ممتاز، استمر",    icon: <IconThumbUp size={13} />,    cls: "bg-accent-teal-light text-accent-teal"   },
  medium: { label: "بحاجة لتحسين",    icon: <IconAlertCircle size={13} />,cls: "bg-accent-amber-light text-accent-amber" },
  weak:   { label: "يحتاج تركيز",     icon: <IconAlertTriangle size={13} />,cls: "bg-accent-red-light text-accent-red"   },
};

const avgColor = (a: number) => a >= 75 ? "var(--accent-teal)" : a >= 50 ? "var(--accent-amber)" : "var(--accent-red)";
const heatColor = (v: number) => v <= 0 ? "var(--border)" : v === 1 ? "#B8E8DB" : v === 2 ? "#5FD4B5" : "#00D4AA";

const tooltipStyle = {
  fontFamily: "Cairo", fontSize: 12, borderRadius: 10,
  border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)",
};

export default function PerformancePage() {
  const { user } = useAuth();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchPerformanceData(user.id)
      .then(setData)
      .finally(() => setIsLoading(false));
  }, [user]);

  if (isLoading || !data) return <div className="p-8 text-center text-text-muted font-bold">جاري تحميل تحليل الأداء...</div>;

  const sorted = [...data.tracks].sort((a, b) => a.avgMastery - b.avgMastery);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  // Time distribution = skill count per track (relative weight).
  const totalSkillsAll = data.tracks.reduce((acc, t) => acc + t.skillCount, 0);
  const TIME_DIST = data.tracks.map(t => ({ name: t.trackName, value: t.skillCount, color: t.trackColor }));

  const TIPS = [
    ...data.weakSkills.map(sk => `ننصحك بمراجعة مهارة «${sk.name}» في ${sk.track} — درجتك الحالية ${sk.score}% فقط.`),
    ...data.strongSkills.map(sk => `ممتاز! أنت متقن لمهارة «${sk.name}» بنسبة ${sk.score}% — استمر في هذا المستوى.`),
    weakest ? `مسار ${weakest.trackName} يحتاج مزيداً من الوقت، حاول تخصيص جلسة إضافية هذا الأسبوع.` : null,
  ].filter(Boolean) as string[];

  return (
    <>
      {/* ملخص علوي */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard delay={1} icon={<IconChartBar size={20} />}        iconBg="var(--primary-light)"      iconColor="var(--primary)"      value={`${data.overallAvg}%`}      label="المتوسط العام"       trend={undefined} />
        <MetricCard delay={2} icon={<IconClipboardCheck size={20} />}  iconBg="var(--accent-blue-light)"  iconColor="var(--accent-blue)"  value={data.completedExams}        label="اختبارات مكتملة"    trend={undefined} />
        <MetricCard delay={3} icon={<IconTrophy size={20} />}          iconBg="var(--accent-teal-light)"  iconColor="var(--accent-teal)"  value={strongest ? `${strongest.trackIcon} ${strongest.trackName}` : "—"} label={`أقوى مسار (${strongest?.avgMastery ?? 0}%)`} />
        <MetricCard delay={4} icon={<IconAlertTriangle size={20} />}   iconBg="var(--accent-red-light)"   iconColor="var(--accent-red)"   value={weakest ? `${weakest.trackIcon} ${weakest.trackName}` : "—"}      label={`أضعف مسار (${weakest?.avgMastery ?? 0}%)`} />
      </section>

      {/* رسوم بيانية */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="fade-up rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 text-base font-extrabold">تقدم النتائج خلال آخر 8 أسابيع</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.weeklyScores} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: "Cairo", fill: "var(--text-muted)" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontFamily: "Cairo", fill: "var(--text-muted)" }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "المتوسط"]} />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: "#6366f1" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="fade-up delay-1 rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 text-base font-extrabold">توزيع المهارات على المسارات</div>
          {TIME_DIST.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={TIME_DIST} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {TIME_DIST.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} مهارة`, ""]} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, fontFamily: "Cairo" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-text-muted text-sm font-semibold">لا توجد بيانات بعد</div>
          )}
        </div>
      </section>

      {/* Heatmap — نشاط حقيقي */}
      <section className="fade-up rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 text-base font-extrabold">خريطة النشاط (آخر 13 أسبوع)</div>
        <div className="grid gap-1.25" style={{ gridTemplateColumns: "repeat(13, 1fr)" }}>
          {data.activity.map((cell, i) => (
            <div key={i} title={`${cell.date}: ${cell.value} نشاط`} className="aspect-square w-full rounded-[4px] transition-transform duration-200 hover:scale-125" style={{ background: heatColor(cell.value) }} />
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
          تفصيل المسارات
        </div>
        {data.tracks.length === 0 ? (
          <div className="py-8 text-center text-text-muted text-sm font-semibold">لا يوجد بيانات أداء بعد — ابدأ بحل الاختبارات</div>
        ) : (
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
                {data.tracks.map(t => {
                  const recKey = t.avgMastery >= 75 ? "good" : t.avgMastery >= 50 ? "medium" : "weak";
                  const rec = REC[recKey];
                  return (
                    <tr key={t.trackId} className="border-b border-border last:border-none">
                      <td className="py-3.5 pr-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: t.trackColor }} />
                          <span className="font-semibold">{t.trackIcon} {t.trackName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-3.5 font-semibold">{t.masteredSkills} / {t.totalSkills}</td>
                      <td className="py-3.5 pr-3.5 font-extrabold" style={{ color: avgColor(t.avgMastery) }}>{t.avgMastery}%</td>
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
        )}
      </section>

      {/* التوصيات */}
      {TIPS.length > 0 && (
        <section className="fade-up animated-border bg-primary-light p-5.5">
          <div className="mb-3.5 flex items-center gap-2.5 text-[15px] font-extrabold text-primary">
            <IconSparkles size={20} className="animate-spin-slow" /> توصياتنا لك — بناءً على أدائك الفعلي
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
