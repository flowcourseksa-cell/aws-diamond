"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  IconChartBar, IconClipboardCheck, IconTrophy, IconAlertTriangle,
  IconThumbUp, IconAlertCircle, IconSparkles, IconBrain, IconFlame
} from "@tabler/icons-react";
import { usePlatformStore } from "@/lib/store";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

// لا يوجد بيانات وهمية هنا

const REC: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  good:   { label: "ممتاز، استمر",    icon: <IconThumbUp size={13} />,    cls: "bg-accent-teal-light text-accent-teal"   },
  medium: { label: "بحاجة لتحسين",    icon: <IconAlertCircle size={13} />,cls: "bg-accent-amber-light text-accent-amber" },
  weak:   { label: "يحتاج تركيز",     icon: <IconAlertTriangle size={13} />,cls: "bg-accent-red-light text-accent-red"   },
};

const avgColor = (a: number) => a >= 75 ? "#10b981" : a >= 50 ? "#f59e0b" : "#ef4444";
// Multi-color fiery/purple gradient for the heatmap
const heatColor = (v: number) => {
  if (v < 0.2) return "var(--border)"; // Empty
  if (v < 0.4) return "#c7d2fe"; // Indigo 200
  if (v < 0.6) return "#818cf8"; // Indigo 400
  if (v < 0.8) return "#c084fc"; // Purple 400
  return "#ec4899"; // Pink 500
};

// تم مسح الخريطة الوهمية

const tooltipStyle = {
  fontFamily: "Cairo", fontSize: 12, borderRadius: 10,
  border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)",
};

export default function PerformancePage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { tracks: storeTracks, lessons: storeLessons } = usePlatformStore();

  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return <div className="p-8 text-center text-text-muted font-bold">جاري التحميل...</div>;

  // Use all tracks directly - free platform
  const activeTracks = storeTracks;

  // حساب متوسط الإتقان الحقيقي من كل مسار
  const trackStats = activeTracks.map(t => {
    const allSkills = t.sections.flatMap(s => s.skills);
    const avg = allSkills.length > 0
      ? Math.round(allSkills.reduce((acc, sk) => acc + (sk.masteryScore || 0), 0) / allSkills.length)
      : 0;
    const rec = avg >= 75 ? "good" : avg >= 50 ? "medium" : "weak";
    // حساب الدروس الحقيقية لهذا المسار من الـ store
    const trackLessons = storeLessons.filter(l => l.trackId === t.id);
    const completedCount = trackLessons.filter(l => l.status === "completed").length;
    const totalCount = trackLessons.length;
    return { trackId: t.id, lessons: totalCount > 0 ? `${completedCount} / ${totalCount}` : "—", avg, time: "—", rec };
  });

  const sorted = [...trackStats].sort((a, b) => a.avg - b.avg);
  const weakest  = activeTracks.find(t => t.id === sorted[0]?.trackId);
  const strongest = activeTracks.find(t => t.id === sorted[sorted.length - 1]?.trackId);
  const overallAvg = trackStats.length > 0
    ? Math.round(trackStats.reduce((a, t) => a + t.avg, 0) / trackStats.length)
    : 0;

  // إجمالي المهارات الحقيقية لجميع المسارات
  const allRealSkills = activeTracks.flatMap(t => t.sections.flatMap(s => s.skills));
  const masteredSkillsCount = allRealSkills.filter(sk => (sk.masteryScore || 0) >= 75).length;
  
  // توزيع المهارات الحقيقي على المسارات
  const TIME_DIST = activeTracks.map(t => {
    const count = t.sections.flatMap(s => s.skills).length;
    return { name: t.name, value: count, color: t.color };
  });

  // أضعف المهارات الحقيقية للتوصيات
  const allWeakSkills = activeTracks.flatMap(t =>
    t.sections.flatMap(s =>
      s.skills.filter(sk => sk.status === "weak").map(sk => ({ ...sk, trackName: t.name }))
    )
  ).sort((a, b) => (a.masteryScore || 0) - (b.masteryScore || 0)).slice(0, 3);

  const allStrongSkills = activeTracks.flatMap(t =>
    t.sections.flatMap(s =>
      s.skills.filter(sk => sk.status === "strong").map(sk => ({ ...sk, trackName: t.name }))
    )
  ).slice(0, 1);

  const TIPS = [
    ...allWeakSkills.map(sk =>
      `ننصحك بمراجعة مهارة «${sk.name}» في ${sk.trackName} — درجتك الحالية ${sk.masteryScore || 0}% فقط.`
    ),
    ...allStrongSkills.map(sk =>
      `ممتاز! أنت متقن لمهارة «${sk.name}» بنسبة ${sk.masteryScore || 0}% — استمر في هذا المستوى.`
    ),
    trackStats.length > 0 && sorted[0]
      ? `مسار ${weakest?.name || ""} يحتاج مزيداً من الوقت، حاول تخصيص جلسة إضافية هذا الأسبوع.`
      : null,
  ].filter(Boolean) as string[];

  return (
    <>
      {/* ملخص علوي بتصميم فخم ومشع */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-lg shadow-indigo-200">
          <div className="absolute -right-4 -top-4 opacity-10"><IconChartBar size={100} /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-indigo-100"><IconChartBar size={20} /> <span className="font-bold">المتوسط العام</span></div>
            <div className="mt-3 text-4xl font-black">{overallAvg}%</div>
            <div className="mt-1 text-sm font-semibold text-indigo-200">متوسط إتقانك لكل المسارات</div>
          </div>
        </div>

        <div className="fade-up delay-1 relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-600 p-6 text-white shadow-lg shadow-blue-200">
          <div className="absolute -right-4 -top-4 opacity-10"><IconClipboardCheck size={100} /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-blue-100"><IconClipboardCheck size={20} /> <span className="font-bold">مهارات متقنة</span></div>
            <div className="mt-3 text-4xl font-black">{masteredSkillsCount}</div>
            <div className="mt-1 text-sm font-semibold text-blue-200">مهارة تجاوزت فيها 75%</div>
          </div>
        </div>

        <div className="fade-up delay-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg shadow-emerald-200">
          <div className="absolute -right-4 -top-4 opacity-10"><IconTrophy size={100} /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-100"><IconTrophy size={20} /> <span className="font-bold">أقوى مسار ({sorted[sorted.length-1]?.avg ?? 0}%)</span></div>
            <div className="mt-3 text-2xl font-black">{strongest ? `${strongest.name}` : "—"}</div>
            <div className="mt-1 text-sm font-semibold text-emerald-200">أنت تتفوق هنا بشكل ملحوظ</div>
          </div>
        </div>

        <div className="fade-up delay-3 relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 p-6 text-white shadow-lg shadow-rose-200">
          <div className="absolute -right-4 -top-4 opacity-10"><IconAlertTriangle size={100} /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-rose-100"><IconAlertTriangle size={20} /> <span className="font-bold">أضعف مسار ({sorted[0]?.avg ?? 0}%)</span></div>
            <div className="mt-3 text-2xl font-black">{weakest ? `${weakest.name}` : "—"}</div>
            <div className="mt-1 text-sm font-semibold text-rose-200">نقطة انطلاقك القادمة للتحسين</div>
          </div>
        </div>
      </section>

      {/* رسوم بيانية (فقط الحقيقية) */}
      <section className="grid grid-cols-1 gap-6 mt-6">
        <div className="fade-up delay-1 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-2 text-lg font-black text-slate-800">حجم المهارات في كل مسار</div>
          <div className="mb-4 text-xs font-bold text-slate-400">نظرة عامة حقيقية على كثافة كل مسار دراسي بناءً على المحتوى</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={TIME_DIST} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" paddingAngle={5} stroke="none">
                {TIME_DIST.map((e, i) => <Cell key={i} fill={e.color} className="drop-shadow-sm transition-all hover:opacity-80" />)}
              </Pie>
              <Tooltip contentStyle={{...tooltipStyle, border: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.1)"}} formatter={(v) => [`${v} مهارة فعلية`, ""]} />
              <Legend iconType="circle" iconSize={12} wrapperStyle={{ fontSize: 13, fontFamily: "Cairo", fontWeight: "bold", marginTop: "20px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* جدول المسارات */}
      <section className="fade-up rounded-3xl border border-slate-100 bg-white p-6 shadow-sm mt-6">
        <div className="mb-6 flex items-center gap-3 text-lg font-black text-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><IconBrain size={24} /></div>
          تفصيل المسارات — بناءً على دورتك
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[580px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b-2 border-slate-100">
                {["المسار", "المهارات المتقنة", "متوسط الإتقان", "التوصية"].map(h => (
                  <th key={h} className="py-4 pr-4 text-right text-sm font-extrabold text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trackStats.map(row => {
                const track = activeTracks.find(t => t.id === row.trackId);
                const rec   = REC[row.rec];
                return (
                  <tr key={row.trackId} className="border-b border-slate-50 last:border-none transition-colors hover:bg-slate-50/50">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl shadow-sm text-white" style={{ background: track?.color }}>{track?.icon}</div>
                        <span className="font-extrabold text-slate-700">{track?.name}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 font-extrabold text-slate-600">{row.lessons}</td>
                    <td className="py-4 pr-4 font-black text-lg" style={{ color: avgColor(row.avg) }}>{row.avg}%</td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-extrabold ${rec.cls}`}>
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
        <section className="fade-up rounded-3xl border-2 border-indigo-100 bg-gradient-to-l from-indigo-50 to-white p-6 shadow-sm mt-6 mb-8">
          <div className="mb-5 flex items-center gap-3 text-lg font-black text-indigo-700">
            <IconSparkles size={24} className="animate-pulse" /> توصياتنا لك اليوم — بناءً على أدائك الفعلي
          </div>
          <div className="flex flex-col gap-3">
            {TIPS.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl bg-white p-4 text-[14px] font-extrabold leading-relaxed text-slate-700 shadow-sm border border-indigo-50">
                <IconSparkles size={20} className="mt-0.5 flex-shrink-0 text-indigo-500" />
                {tip}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
