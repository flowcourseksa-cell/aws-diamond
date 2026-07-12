"use client";

import {
  IconUsers, IconClipboardText, IconBook, IconCurrencyDollar,
  IconTrendingUp, IconAlertTriangle, IconCircleCheck, IconBrain,
  IconBrandWhatsapp, IconChartBar,
} from "@tabler/icons-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { useEffect, useState } from "react";
import { fetchAdminStats, type AdminStats } from "@/lib/supabase/services/admin-stats";
import { createClient } from "@/lib/supabase/client";

const tooltipStyle = {
  fontFamily: "Cairo", fontSize: 12, borderRadius: 10,
  border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminLevel, setAdminLevel] = useState("super");

  useEffect(() => {
    const fetchLevel = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("admin_level").eq("id", user.id).single();
        if (profile?.admin_level) setAdminLevel(profile.admin_level);
      }
    };
    fetchLevel();
    fetchAdminStats()
      .then(setStats)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !stats) {
    return <div className="p-8 text-center text-text-muted font-bold">جاري تحميل الإحصائيات...</div>;
  }

  // Real chart data straight from Supabase.
  const TRACK_USAGE = stats.weakSkills.length > 0
    ? stats.weakSkills.map(s => ({ name: s.name, skills: s.mastery_score }))
    : [];

  const STATS = [
    { label: "الدورات المنشورة", value: stats.totalCourses.toString(), sub: `${stats.activeCourses} نشطة`, icon: <IconUsers size={22}/>, color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
    { label: "اختبارات منشورة", value: stats.totalExams.toString(), sub: `${stats.freeExams} مجانية`, icon: <IconClipboardText size={22}/>, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    { label: "دروس منشورة", value: stats.totalLessons.toString(), sub: `${stats.newLessons} جديدة`, icon: <IconBook size={22}/>, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    { label: "إجمالي المهارات", value: stats.totalSkills.toString(), sub: `${stats.weakSkills.length} تحتاج تحسين`, icon: <IconBrain size={22}/>, color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
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

      {/* Students summary cards (real counts) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 fade-up">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-bold text-text-muted mb-1 flex items-center gap-2"><IconUsers size={16}/> إجمالي الطلاب</div>
          <div className="text-2xl font-black text-primary">{stats.totalStudents}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-bold text-text-muted mb-1 flex items-center gap-2"><IconCircleCheck size={16}/> طلاب لديهم اشتراكات</div>
          <div className="text-2xl font-black text-emerald-500">{stats.activeSubscriptions}</div>
        </div>
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
        {/* Line Chart — real weekly attempts */}
        <div className="fade-up rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 font-extrabold text-base flex items-center gap-2">
            <IconTrendingUp size={18} className="text-primary" />
            الاختبارات المكتملة هذا الأسبوع
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.weeklyExams} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: "Cairo", fill: "var(--text-muted)" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fontFamily: "Cairo", fill: "var(--text-muted)" }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} اختبار`, ""]} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: "#6366f1" }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart — weakest skills */}
        <div className="fade-up delay-1 rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 font-extrabold text-base flex items-center gap-2">
            <IconBrain size={18} className="text-primary" />
            أضعف المهارات (نسبة الإتقان)
          </div>
          {TRACK_USAGE.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={TRACK_USAGE} margin={{ top: 4, right: 4, bottom: 0, left: -28 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 10, fontFamily: "Cairo", fill: "var(--text-muted)" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontFamily: "Cairo", fill: "var(--text-muted)" }} width={90} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, ""]} />
                <Bar dataKey="skills" fill="#ef4444" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-text-muted text-sm font-semibold">
              لا توجد بيانات إتقان بعد
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
            {stats.weakSkills.length === 0 ? (
              <p className="text-sm text-text-muted font-semibold">لا توجد مهارات ضعيفة حالياً ✓</p>
            ) : stats.weakSkills.map((sk, idx) => (
              <div key={`${sk.micro_skill_id}-${idx}`} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sk.track_color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-text truncate">{sk.name}</span>
                    <span className="text-xs font-black text-accent-red mr-2">{sk.mastery_score}%</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-accent-red" style={{ width: `${sk.mastery_score}%` }} />
                  </div>
                  <div className="text-[10.5px] text-text-muted mt-0.5">{sk.track_name}</div>
                </div>
              </div>
            ))}
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
              { href: "/admin-khaled-ksa-aws-2026-org/courses",  label: "إضافة دورة جديدة",   icon: <IconUsers size={20}/>,         color: "#6366f1" },
              { href: "/admin-khaled-ksa-aws-2026-org/exams",    label: "إضافة اختبار",        icon: <IconClipboardText size={20}/>,  color: "#f59e0b" },
              { href: "/admin-khaled-ksa-aws-2026-org/lessons",  label: "رفع درس جديد",         icon: <IconBook size={20}/>,           color: "#10b981" },
              { href: "/admin-khaled-ksa-aws-2026-org/tracks",   label: "تعديل المهارات",       icon: <IconBrain size={20}/>,          color: "#8b5cf6" },
              { href: "/admin-khaled-ksa-aws-2026-org/whatsapp", label: "إشعارات الواتساب",    icon: <IconBrandWhatsapp size={20}/>,   color: "#25d366", restricted: true },
              { href: "/admin-khaled-ksa-aws-2026-org/pricing",  label: "التسعير والكودات",    icon: <IconCurrencyDollar size={20}/>,  color: "#ef4444", restricted: true },
            ]
            .filter(action => !(adminLevel === "content" && action.restricted))
            .map((action, i) => (
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
