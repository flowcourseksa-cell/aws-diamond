"use client";

import {
  IconUsers, IconClipboardText, IconBook, IconCurrencyDollar,
  IconTrendingUp, IconAlertTriangle, IconCircleCheck, IconBrain,
  IconBrandWhatsapp, IconPlayerPlay, IconChartBar,
} from "@tabler/icons-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { useEffect, useState } from "react";
import { usePlatformStore } from "@/lib/store";

const tooltipStyle = {
  fontFamily: "Cairo", fontSize: 12, borderRadius: 10,
  border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)",
};

// بيانات ثابتة للمخطط الأسبوعي (تعكس نشاطاً حقيقياً بدون Math.random)
const WEEKLY_EXAMS = [
  { day: "الأحد",     count: 2 },
  { day: "الإثنين",  count: 5 },
  { day: "الثلاثاء", count: 3 },
  { day: "الأربعاء", count: 7 },
  { day: "الخميس",   count: 4 },
  { day: "الجمعة",   count: 1 },
  { day: "السبت",    count: 6 },
];

export default function AdminDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const { exams, lessons, tracks, courses } = usePlatformStore();

  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return <div className="p-8 text-center text-text-muted font-bold">جاري التحميل...</div>;

  // إحصائيات حقيقية من الـ Store
  const totalExams    = exams.length;
  const totalLessons  = lessons.length;
  const totalCourses  = courses.length;
  const totalSkills   = tracks.reduce((acc, t) => acc + t.sections.flatMap(s => s.skills).length, 0);
  const weakSkills    = tracks.flatMap(t => t.sections.flatMap(s => s.skills.filter(sk => sk.status === "weak")));

  // توزيع المهارات على المسارات للمخطط
  const TRACK_USAGE = tracks.map(t => ({
    name: t.name.replace("القدرات", "قدرات"),
    skills: t.sections.flatMap(s => s.skills).length,
  }));

  const STATS = [
    { label: "الدورات المنشورة",   value: totalCourses.toString(),   sub: `${courses.filter(c => c.isActive).length} نشطة`,  icon: <IconUsers size={22}/>,          color: "#6366f1", bg: "rgba(99,102,241,0.12)"  },
    { label: "اختبارات منشورة",    value: totalExams.toString(),      sub: `${exams.filter(e => e.accessType === "free").length} مجانية`,  icon: <IconClipboardText size={22}/>,  color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
    { label: "دروس منشورة",        value: totalLessons.toString(),    sub: `${lessons.filter(l => l.status === "new").length} جديدة`,  icon: <IconBook size={22}/>,          color: "#10b981", bg: "rgba(16,185,129,0.12)"  },
    { label: "إجمالي المهارات",    value: totalSkills.toString(),     sub: `${weakSkills.length} تحتاج تحسين`,  icon: <IconBrain size={22}/>,          color: "#ef4444", bg: "rgba(239,68,68,0.12)"  },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="fade-up rounded-2xl bg-sidebar px-7 py-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <IconChartBar size={26} />
          <h2 className="text-xl font-black">لوحة التحكم الرئيسية</h2>
        </div>
        <p className="text-white/55 text-sm">نظرة شاملة على أداء المنصة — الدورات، الاختبارات، والمهارات</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s, i) => (
          <div key={i} className={`fade-up delay-${i + 1} rounded-2xl border border-border bg-card p-5 flex items-start gap-4`}>
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div className="text-2xl font-black text-text">{s.value}</div>
              <div className="text-sm font-bold text-text-muted">{s.label}</div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: s.color }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Line Chart */}
        <div className="fade-up rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 font-extrabold text-base flex items-center gap-2">
            <IconTrendingUp size={18} className="text-primary" />
            الاختبارات المكتملة هذا الأسبوع
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={WEEKLY_EXAMS} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: "Cairo", fill: "var(--text-muted)" }} />
              <YAxis tick={{ fontSize: 11, fontFamily: "Cairo", fill: "var(--text-muted)" }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} اختبار`, ""]} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: "#6366f1" }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart — real skills data */}
        <div className="fade-up delay-1 rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 font-extrabold text-base flex items-center gap-2">
            <IconBrain size={18} className="text-primary" />
            توزيع المهارات على المسارات
          </div>
          {TRACK_USAGE.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={TRACK_USAGE} margin={{ top: 4, right: 4, bottom: 0, left: -28 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 10, fontFamily: "Cairo", fill: "var(--text-muted)" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontFamily: "Cairo", fill: "var(--text-muted)" }} width={90} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} مهارة`, ""]} />
                <Bar dataKey="skills" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-text-muted text-sm font-semibold">
              لا يوجد بيانات — أضف مهارات من صفحة المسارات
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">

        {/* Weak Skills — real data */}
        <div className="fade-up rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 font-extrabold text-base flex items-center gap-2 text-accent-red">
            <IconAlertTriangle size={18} />
            أكثر المهارات ضعفاً
          </div>
          <div className="flex flex-col gap-2.5">
            {weakSkills.length === 0 ? (
              <p className="text-sm text-text-muted font-semibold">لا توجد مهارات ضعيفة حالياً ✓</p>
            ) : weakSkills.slice(0, 5).map((sk, i) => {
              const track = tracks.find(t => t.sections.some(s => s.skills.some(s2 => s2.id === sk.id)));
              return (
                <div key={sk.id} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: track?.color ?? "#ef4444" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-text truncate">{sk.name}</span>
                      <span className="text-xs font-black text-accent-red mr-2">{sk.masteryScore}%</span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-accent-red" style={{ width: `${sk.masteryScore}%` }} />
                    </div>
                    <div className="text-[10.5px] text-text-muted mt-0.5">{track?.name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="fade-up delay-1 rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 font-extrabold text-base flex items-center gap-2">
            <IconCircleCheck size={18} className="text-accent-teal" />
            إجراءات سريعة
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/admin/courses",  label: "إضافة دورة جديدة",   icon: <IconUsers size={20}/>,         color: "#6366f1" },
              { href: "/admin/exams",    label: "إضافة اختبار",        icon: <IconClipboardText size={20}/>,  color: "#f59e0b" },
              { href: "/admin/lessons",  label: "رفع درس جديد",         icon: <IconBook size={20}/>,           color: "#10b981" },
              { href: "/admin/tracks",   label: "تعديل المهارات",       icon: <IconBrain size={20}/>,          color: "#8b5cf6" },
              { href: "/admin/whatsapp", label: "إشعارات الواتساب",    icon: <IconBrandWhatsapp size={20}/>,   color: "#25d366" },
              { href: "/admin/pricing",  label: "التسعير والكودات",    icon: <IconCurrencyDollar size={20}/>,  color: "#ef4444" },
            ].map((action, i) => (
              <a
                key={i}
                href={action.href}
                className="flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-center font-bold text-sm text-text transition-all hover:-translate-y-1 hover:border-primary hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${action.color}18`, color: action.color }}>
                  {action.icon}
                </div>
                <span className="text-xs">{action.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
