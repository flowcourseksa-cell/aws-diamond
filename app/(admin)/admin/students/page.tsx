"use client";

import { useState, useEffect } from "react";
import {
  IconUsers, IconSearch, IconFilter, IconChevronDown, IconChevronUp,
  IconBrandWhatsapp, IconChartPie, IconAlertTriangle, IconActivity,
  IconCheck, IconX, IconTrendingUp,
} from "@tabler/icons-react";
import { FLOW_TRACKS } from "@/lib/mock-data";

// ── Types & Mock Data ─────────────────────────────────────────
type AdminStudent = {
  id: string;
  name: string;
  mainTrackId: string;
  avgMastery: number;
  weakSkills: string[];
  hasSubscription: boolean;
  lastActivity: string;
  progress: Record<string, number>;
};

const MOCK_STUDENTS: AdminStudent[] = [];

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white" style={{ background: color }}>
      {label}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────
export default function AdminStudentsPage() {
  const [students, setStudents] = useState<AdminStudent[]>(MOCK_STUDENTS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterTrack, setFilterTrack] = useState("all");
  const [filterSub, setFilterSub] = useState("all");

  const filtered = students.filter(s => {
    if (search && !s.name.includes(search)) return false;
    if (filterTrack !== "all" && s.mainTrackId !== filterTrack) return false;
    if (filterSub === "yes" && !s.hasSubscription) return false;
    if (filterSub === "no" && s.hasSubscription) return false;
    return true;
  });

  const totalStudents = students.length;
  const avgAllMastery = Math.round(students.reduce((acc, s) => acc + s.avgMastery, 0) / totalStudents);
  const totalWeakSkills = students.reduce((acc, s) => acc + s.weakSkills.length, 0);
  const activeSubs = students.filter(s => s.hasSubscription).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="fade-up rounded-2xl bg-sidebar px-7 py-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <IconUsers size={26} />
          <h2 className="text-xl font-black">إدارة الطلاب</h2>
        </div>
        <p className="text-white/55 text-sm">تابع تقدم الطلاب، المهارات الضعيفة، وتواصل مع أولياء الأمور.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 fade-up">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-bold text-text-muted mb-1 flex items-center gap-2"><IconUsers size={16}/> إجمالي الطلاب</div>
          <div className="text-2xl font-black text-primary">{totalStudents}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-bold text-text-muted mb-1 flex items-center gap-2"><IconTrendingUp size={16}/> متوسط الإتقان العام</div>
          <div className="text-2xl font-black text-emerald-500">{avgAllMastery}%</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-bold text-text-muted mb-1 flex items-center gap-2"><IconAlertTriangle size={16}/> إجمالي المهارات الضعيفة</div>
          <div className="text-2xl font-black text-accent-red">{totalWeakSkills}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-bold text-text-muted mb-1 flex items-center gap-2"><IconCheck size={16}/> اشتراكات نشطة</div>
          <div className="text-2xl font-black text-accent-teal">{activeSubs}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 fade-up">
        <div className="flex-1 min-w-[200px] relative">
          <IconSearch size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث باسم الطالب..."
            className="w-full rounded-xl border border-border bg-card pl-4 pr-10 py-2.5 text-sm font-semibold outline-none focus:border-primary" />
        </div>
        <div className="flex items-center gap-2">
          <IconFilter size={20} className="text-text-muted" />
          <select value={filterTrack} onChange={e => setFilterTrack(e.target.value)}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary">
            <option value="all">جميع المسارات</option>
            {FLOW_TRACKS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={filterSub} onChange={e => setFilterSub(e.target.value)}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary">
            <option value="all">حالة الاشتراك</option>
            <option value="yes">مشترك</option>
            <option value="no">غير مشترك</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="fade-up rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-border bg-bg/60">
                {["الطالب", "المسار الرئيسي", "متوسط الإتقان", "مهارات ضعيفة", "الاشتراك", "آخر نشاط", ""].map(h => (
                  <th key={h} className="px-4 py-3.5 text-right text-xs font-black text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(student => {
                const track = FLOW_TRACKS.find(t => t.id === student.mainTrackId);
                const expanded = expandedId === student.id;
                return [
                  <tr key={student.id} onClick={() => setExpandedId(expanded ? null : student.id)} className="border-b border-border last:border-none hover:bg-bg/40 transition-colors cursor-pointer">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 font-extrabold text-text">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                          {student.name.charAt(0)}
                        </div>
                        {student.name}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {track && <Badge label={`${track.icon} ${track.name}`} color={track.color} />}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-black ${student.avgMastery >= 80 ? "text-emerald-500" : student.avgMastery >= 50 ? "text-amber-500" : "text-accent-red"}`}>
                          {student.avgMastery}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {student.weakSkills.length > 0 ? (
                        <span className="flex items-center gap-1 text-accent-red font-bold text-xs"><IconAlertTriangle size={14}/> {student.weakSkills.length} مهارات</span>
                      ) : (
                        <span className="text-emerald-500 font-bold text-xs"><IconCheck size={14} className="inline"/> لا يوجد</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {student.hasSubscription
                        ? <span className="text-emerald-500 font-bold text-xs">نشط</span>
                        : <span className="text-text-muted font-bold text-xs">غير نشط</span>
                      }
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-text-muted">{student.lastActivity}</td>
                    <td className="px-4 py-3.5 text-left">
                      <button className="text-text-muted hover:text-primary">
                        {expanded ? <IconChevronUp size={16}/> : <IconChevronDown size={16}/>}
                      </button>
                    </td>
                  </tr>,

                  // Expanded view
                  expanded && (
                    <tr key={`${student.id}-details`} className="border-b border-border bg-bg/30">
                      <td colSpan={7} className="px-6 py-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Progress */}
                          <div>
                            <div className="text-xs font-black text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                              <IconChartPie size={16}/> التقدم في المسارات
                            </div>
                            <div className="flex flex-col gap-3">
                              {Object.entries(student.progress).map(([tid, val]) => {
                                const tr = FLOW_TRACKS.find(t => t.id === tid);
                                return (
                                  <div key={tid} className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: tr?.color }}/>
                                    <span className="text-xs font-bold w-24">{tr?.name}</span>
                                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: `${val}%`, background: tr?.color }}/>
                                    </div>
                                    <span className="text-xs font-black w-8 text-left">{val}%</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Weak skills & Actions */}
                          <div className="flex flex-col gap-4">
                            <div>
                              <div className="text-xs font-black text-accent-red uppercase tracking-wider mb-2 flex items-center gap-2">
                                <IconAlertTriangle size={16}/> المهارات الضعيفة الحالية
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {student.weakSkills.length > 0 ? student.weakSkills.map(sk => (
                                  <span key={sk} className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-2.5 py-1 rounded-lg text-xs font-bold">
                                    {sk}
                                  </span>
                                )) : <span className="text-xs font-semibold text-text-muted">لا يوجد مهارات ضعيفة.</span>}
                              </div>
                            </div>
                            <div className="mt-auto">
                              <button className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#25d366] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#20bd5a] transition-colors">
                                <IconBrandWhatsapp size={18}/> إرسال تقرير لولي الأمر
                              </button>
                            </div>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )
                ].filter(Boolean);
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-text-muted font-bold">لا يوجد طلاب مطابقين للبحث</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
