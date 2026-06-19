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

// ── Mock data ──────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { usePlatformStore } from "@/lib/store";

// ── Mock data ──────────────────────────────────────────────────

const WEEKLY_EXAMS: any[] = [];

const TRACK_USAGE: any[] = [];

const WEAK_SKILLS: any[] = [];

const RECENT_ACTIVITY: any[] = [];

const tooltipStyle = {
  fontFamily: "Cairo", fontSize: 12, borderRadius: 10,
  border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)",
};

// ── Component ─────────────────────────────────────────────────
export default function AdminDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const exams = usePlatformStore(s => s.exams);
  const lessons = usePlatformStore(s => s.lessons);
  const subscriptionPrices = usePlatformStore(s => s.subscriptionPrices);

  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return <div className="p-8 text-center text-text-muted font-bold">جاري التحميل...</div>;

  const STATS = [
    { label: "إجمالي الطلاب",    value: "0",  sub: "0 هذا الشهر",  icon: <IconUsers size={22}/>,          color: "#6366f1", bg: "rgba(99,102,241,0.12)"  },
    { label: "اختبارات منشورة",  value: exams.length.toString(),sub: "0 هذا الشهر",      icon: <IconClipboardText size={22}/>,  color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
    { label: "دروس منشورة",      value: lessons.length.toString(),   sub: "0 جديدة هذا الأسبوع",icon: <IconBook size={22}/>,      color: "#10b981", bg: "rgba(16,185,129,0.12)"  },
    { label: "سعر الاشتراك الشهري",    value: `${subscriptionPrices.monthly} ر.س`, sub: "", icon: <IconCurrencyDollar size={22}/>, color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="fade-up rounded-2xl bg-sidebar px-7 py-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <IconChartBar size={26} />
          <h2 className="text-xl font-black">لوحة التحكم الرئيسية</h2>
        </div>
        <p className="text-white/55 text-sm">نظرة شاملة على أداء المنصة — الطلاب، الاختبارات، والإيرادات</p>
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

        {/* Bar Chart */}
        <div className="fade-up delay-1 rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 font-extrabold text-base flex items-center gap-2">
            <IconBrain size={18} className="text-primary" />
            توزيع الطلاب على المسارات
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={TRACK_USAGE} margin={{ top: 4, right: 4, bottom: 0, left: -28 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 10, fontFamily: "Cairo", fill: "var(--text-muted)" }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontFamily: "Cairo", fill: "var(--text-muted)" }} width={80} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} طالب`, ""]} />
              <Bar dataKey="students" fill="#f59e0b" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">

        {/* Weak Skills */}
        <div className="fade-up rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 font-extrabold text-base flex items-center gap-2 text-accent-red">
            <IconAlertTriangle size={18} />
            أكثر المهارات ضعفاً عبر الطلاب
          </div>
          <div className="flex flex-col gap-2.5">
            {WEAK_SKILLS.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-text truncate">{s.skill}</span>
                    <span className="text-xs font-black text-accent-red mr-2">{s.count} طالب</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-red"
                      style={{ width: `${(s.count / 34) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10.5px] text-text-muted mt-0.5">{s.track}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="fade-up delay-1 rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 font-extrabold text-base flex items-center gap-2">
            <IconCircleCheck size={18} className="text-accent-teal" />
            آخر الأنشطة
          </div>
          <div className="flex flex-col gap-3">
            {RECENT_ACTIVITY.map((a, i) => {
              const Icon = a.type === "whatsapp"
                ? IconBrandWhatsapp
                : a.type === "lesson"
                ? IconPlayerPlay
                : IconClipboardText;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px]"
                    style={{ background: `${a.color}18`, color: a.color }}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-text leading-tight">{a.text}</div>
                    <div className="text-xs text-text-muted mt-0.5">{a.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="fade-up rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 font-extrabold text-base">إجراءات سريعة</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: "/admin/exams",   label: "إضافة اختبار جديد",  icon: <IconClipboardText size={20}/>, color: "#6366f1" },
            { href: "/admin/lessons", label: "رفع درس جديد",        icon: <IconBook size={20}/>,          color: "#f59e0b" },
            { href: "/admin/tracks",  label: "تعديل الأقسام",       icon: <IconBrain size={20}/>,          color: "#10b981" },
            { href: "/admin/whatsapp",label: "إرسال واتساب",        icon: <IconBrandWhatsapp size={20}/>,  color: "#25d366" },
          ].map((action, i) => (
            <a
              key={i}
              href={action.href}
              className="flex flex-col items-center gap-2.5 rounded-xl border border-border p-4 text-center font-bold text-sm text-text transition-all hover:-translate-y-1 hover:border-primary hover:shadow-md"
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: `${action.color}18`, color: action.color }}
              >
                {action.icon}
              </div>
              {action.label}
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
