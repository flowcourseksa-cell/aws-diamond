// @ts-nocheck
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  fetchAllCertificates,
  deleteCertificate,
  deleteMultipleCertificates,
  type Certificate,
} from "@/lib/supabase/services/certificates";
import {
  IconDownload, IconSearch, IconExternalLink, IconShare,
  IconFilter, IconX, IconAward, IconUsers, IconChartBar,
  IconCertificate, IconTrash, IconAlertTriangle, IconCheck,
} from "@tabler/icons-react";
import * as XLSX from "xlsx";

const SIMULATOR_NAMES = ["محاكي الأوس الماسية", "STEP Simulator", "اختبار الستيب", "محاكي"];
function isSimulatorCert(cert: Certificate) {
  return SIMULATOR_NAMES.some(name => cert.course_title?.includes(name));
}

/* ── Confirm Delete Modal ─────────────────────────────────── */
function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" dir="rtl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-red/10 text-accent-red flex items-center justify-center flex-shrink-0">
            <IconAlertTriangle size={22} />
          </div>
          <h3 className="font-black text-text text-lg">تأكيد الحذف</h3>
        </div>
        <p className="text-text-muted font-semibold text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-black text-sm hover:opacity-90 transition-opacity"
          >
            نعم، احذف
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-bg border border-border text-text font-bold text-sm hover:bg-card transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Certs Table ─────────────────────────────────────────── */
function CertsTable({
  certs,
  onDeleted,
}: {
  certs: Certificate[];
  onDeleted: (ids: string[]) => void;
}) {
  const [search, setSearch]           = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [scoreFilter, setScoreFilter]   = useState("all");
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [confirmSingle, setConfirmSingle] = useState<string | null>(null); // cert ID
  const [confirmBulk, setConfirmBulk]     = useState(false);
  const [deleting, setDeleting]           = useState(false);

  const courses = useMemo(() => Array.from(new Set(certs.map(c => c.course_title))), [certs]);

  const filtered = useMemo(() => certs.filter(c => {
    const matchSearch =
      c.student_name.toLowerCase().includes(search.toLowerCase()) ||
      c.course_title.toLowerCase().includes(search.toLowerCase());
    const matchCourse = courseFilter === "all" || c.course_title === courseFilter;
    const matchScore =
      scoreFilter === "all" ||
      (scoreFilter === "high" && c.score_pct >= 80) ||
      (scoreFilter === "mid" && c.score_pct >= 60 && c.score_pct < 80) ||
      (scoreFilter === "low" && c.score_pct < 60);
    return matchSearch && matchCourse && matchScore;
  }), [certs, search, courseFilter, scoreFilter]);

  const avgScore = filtered.length > 0
    ? Math.round(filtered.reduce((s, c) => s + c.score_pct, 0) / filtered.length)
    : 0;

  const allSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id));
  const anySelected = selected.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(c => c.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleDeleteSingle(id: string) {
    setDeleting(true);
    const ok = await deleteCertificate(id);
    setDeleting(false);
    setConfirmSingle(null);
    if (ok) onDeleted([id]);
  }

  async function handleDeleteBulk() {
    const ids = Array.from(selected);
    setDeleting(true);
    const ok = await deleteMultipleCertificates(ids);
    setDeleting(false);
    setConfirmBulk(false);
    if (ok) { setSelected(new Set()); onDeleted(ids); }
  }

  function handleExport() {
    const data = filtered.map(c => ({
      "اسم الطالب": c.student_name,
      "الدورة": c.course_title,
      "الدرجة": `${c.score_pct}%`
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الشهادات");
    XLSX.writeFile(workbook, "certificates.xlsx");
  }

  return (
    <>
      {/* Confirm Modals */}
      {confirmSingle && (
        <ConfirmModal
          message={`هل تريد حذف هذه الشهادة نهائياً؟ لا يمكن التراجع عن هذه العملية.`}
          onConfirm={() => handleDeleteSingle(confirmSingle)}
          onCancel={() => setConfirmSingle(null)}
        />
      )}
      {confirmBulk && (
        <ConfirmModal
          message={`هل تريد حذف ${selected.size} شهادة نهائياً؟ لا يمكن التراجع عن هذه العملية.`}
          onConfirm={handleDeleteBulk}
          onCancel={() => setConfirmBulk(false)}
        />
      )}

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <IconSearch size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث باسم الطالب أو الدورة..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold outline-none focus:border-primary"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
              <IconX size={14} />
            </button>
          )}
        </div>

        <select
          value={courseFilter}
          onChange={e => setCourseFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold outline-none focus:border-primary min-w-[150px]"
        >
          <option value="all">كل الدورات</option>
          {courses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={scoreFilter}
          onChange={e => setScoreFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold outline-none focus:border-primary min-w-[140px]"
        >
          <option value="all">كل الدرجات</option>
          <option value="high">مرتفعة (≥80%)</option>
          <option value="mid">متوسطة (60-79%)</option>
          <option value="low">منخفضة (&lt;60%)</option>
        </select>

        <div className="flex items-center px-3 py-2.5 rounded-xl border border-border bg-card text-xs font-bold text-text-muted gap-1.5">
          <IconFilter size={14} /> {filtered.length} نتيجة
        </div>

        {/* Bulk delete */}
        {anySelected && (
          <button
            onClick={() => setConfirmBulk(true)}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-red/10 text-accent-red font-bold text-sm hover:bg-accent-red/20 transition-colors border border-accent-red/20"
          >
            <IconTrash size={15} /> حذف المحدد ({selected.size})
          </button>
        )}

        {/* Export CSV */}
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 border border-border bg-card text-text font-bold rounded-xl hover:bg-bg transition-colors text-sm"
          title="تصدير البيانات كملف Excel/Spreadsheet"
        >
          <IconDownload size={16} /> تصدير Excel ({filtered.length})
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-bg/60">
              {/* Select All */}
              <th className="px-4 py-3.5 w-10">
                <button
                  onClick={toggleAll}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    allSelected ? "bg-primary border-primary text-white" : "border-border hover:border-primary"
                  }`}
                >
                  {allSelected && <IconCheck size={12} />}
                </button>
              </th>
              {["الطالب", "الدورة", "الدرجة", "تاريخ الإصدار", "رقم الشهادة", "إجراءات"].map(h => (
                <th key={h} className="px-4 py-3.5 text-right text-xs font-black text-text-muted uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-text-muted font-semibold">لا توجد شهادات مطابقة</td></tr>
            )}
            {filtered.map(cert => {
              const isChecked = selected.has(cert.id);
              return (
                <tr
                  key={cert.id}
                  className={`border-b border-border last:border-none transition-colors ${isChecked ? "bg-primary/5" : "hover:bg-bg/40"}`}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleOne(cert.id)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        isChecked ? "bg-primary border-primary text-white" : "border-border hover:border-primary"
                      }`}
                    >
                      {isChecked && <IconCheck size={12} />}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-black text-text whitespace-nowrap">{cert.student_name}</td>
                  <td className="px-4 py-3 font-semibold text-text-muted max-w-[180px] truncate">{cert.course_title}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-black text-base ${cert.score_pct >= 80 ? "text-accent-teal" : cert.score_pct >= 60 ? "text-accent-amber" : "text-accent-red"}`}>
                        {cert.score_pct}%
                      </span>
                      <div className="w-14 h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cert.score_pct >= 80 ? "bg-accent-teal" : cert.score_pct >= 60 ? "bg-accent-amber" : "bg-accent-red"}`}
                          style={{ width: `${cert.score_pct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-text-muted text-xs whitespace-nowrap">
                    {new Date(cert.issued_at).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-text-muted bg-bg px-2 py-1 rounded-lg select-all">
                      {cert.id.slice(0, 8)}...
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <a
                        href={`/api/certificates/generate?id=${cert.id}`}
                        target="_blank"
                        className="p-1.5 rounded-lg bg-accent-amber/10 text-accent-amber hover:bg-accent-amber/20 transition-colors"
                        title="تحميل PDF"
                      >
                        <IconDownload size={15} />
                      </a>
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/verify/${cert.id}`;
                          navigator.clipboard.writeText(url);
                          alert("تم نسخ رابط الشهادة بنجاح! يمكنك مشاركته الآن.");
                        }}
                        className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        title="نسخ رابط الشهادة"
                      >
                        <IconShare size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmSingle(cert.id)}
                        className="p-1.5 rounded-lg bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors"
                        title="حذف الشهادة"
                        disabled={deleting}
                      >
                        <IconTrash size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-xs font-bold text-text-muted">
          <span>يعرض {filtered.length} من {certs.length} شهادة {anySelected ? `• محدد ${selected.size}` : ""}</span>
          <span>متوسط الدرجات المعروضة: {avgScore}%</span>
        </div>
      )}
    </>
  );
}

/* ── Main Page ───────────────────────────────────────────── */
export default function AdminCertificatesPage() {
  const [allCerts, setAllCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"real" | "simulator">("real");

  useEffect(() => {
    fetchAllCertificates().then(data => { setAllCerts(data); setLoading(false); });
  }, []);

  const realCerts = useMemo(() => allCerts.filter(c => !isSimulatorCert(c)), [allCerts]);
  const simCerts  = useMemo(() => allCerts.filter(c => isSimulatorCert(c)), [allCerts]);

  function handleDeleted(ids: string[]) {
    setAllCerts(prev => prev.filter(c => !ids.includes(c.id)));
  }

  const avgScore = allCerts.length > 0
    ? Math.round(allCerts.reduce((s, c) => s + c.score_pct, 0) / allCerts.length)
    : 0;
  const uniqueStudents = new Set(realCerts.map(c => c.student_id)).size;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="p-6 w-full" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-text">الشهادات الممنوحة</h1>
        <p className="text-text-muted font-semibold text-sm mt-1">{allCerts.length} شهادة إجمالاً</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "شهادات الدورات", value: realCerts.length, icon: <IconCertificate size={26} />, color: "text-primary", bg: "bg-primary/10" },
          { label: "طلاب حاصلون", value: uniqueStudents, icon: <IconUsers size={26} />, color: "text-accent-teal", bg: "bg-accent-teal/10" },
          { label: "متوسط الدرجات", value: `${avgScore}%`, icon: <IconChartBar size={26} />, color: "text-accent-amber", bg: "bg-accent-amber/10" },
          { label: "شهادات المحاكي", value: simCerts.length, icon: <IconAward size={26} />, color: "text-text-muted", bg: "bg-border/40" },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className="bg-card rounded-2xl p-5 border border-border flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bg} ${color}`}>{icon}</div>
            <div>
              <div className="text-2xl font-black text-text">{value}</div>
              <div className="text-xs font-bold text-text-muted mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-bg rounded-2xl p-1 border border-border w-fit">
        <button
          onClick={() => setActiveTab("real")}
          className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === "real" ? "bg-primary text-white shadow-md" : "text-text-muted hover:text-text"}`}
        >
          🏆 شهادات الدورات ({realCerts.length})
        </button>
        <button
          onClick={() => setActiveTab("simulator")}
          className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === "simulator" ? "bg-primary text-white shadow-md" : "text-text-muted hover:text-text"}`}
        >
          🎯 محاكي الأوس الماسية ({simCerts.length})
        </button>
      </div>

      <CertsTable
        certs={activeTab === "real" ? realCerts : simCerts}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
