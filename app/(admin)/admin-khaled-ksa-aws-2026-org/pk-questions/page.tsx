"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconPlus, IconTrash, IconEdit, IconX, IconCheck,
  IconSwords, IconCategory, IconSearch, IconLoader2
} from "@tabler/icons-react";
import { type PkQuestion } from "@/lib/supabase/services/pk-actions";
import {
  adminFetchPkQuestions,
  adminCreatePkQuestion,
  adminUpdatePkQuestion,
  adminDeletePkQuestion,
} from "@/lib/supabase/services/pk-admin-actions";

const CATEGORIES = [
  { value: "quantitative", label: "كمي", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "verbal",       label: "لفظي", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "analytical",   label: "إدراكي", color: "bg-violet-100 text-violet-700 border-violet-200" },
  { value: "mixed",        label: "متنوع",  color: "bg-amber-100 text-amber-700 border-amber-200" },
];

const CORRECT_LABELS = ["أ", "ب", "ج", "د"];

const EMPTY_FORM = {
  question: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_index: 0,
  category: "mixed" as PkQuestion["category"],
};

export default function AdminPkQuestionsPage() {
  const [questions, setQuestions] = useState<PkQuestion[]>([]);
  const [filtered, setFiltered] = useState<PkQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PkQuestion | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setIsLoading(true);
    const data = await adminFetchPkQuestions();
    setQuestions(data);
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let result = questions;
    if (catFilter !== "all") result = result.filter(q => q.category === catFilter);
    if (search.trim()) result = result.filter(q => q.question.includes(search));
    setFiltered(result);
  }, [questions, catFilter, search]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(q: PkQuestion) {
    setEditing(q);
    setForm({
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_index: q.correct_index,
      category: q.category,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.question.trim() || !form.option_a || !form.option_b || !form.option_c || !form.option_d) return;
    setSaving(true);
    if (editing) {
      await adminUpdatePkQuestion(editing.id, form);
    } else {
      await adminCreatePkQuestion(form);
    }
    await load();
    setSaving(false);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    await adminDeletePkQuestion(id);
    setConfirmDel(null);
    await load();
  }

  const catInfo = (cat: string) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[3];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-sidebar px-7 py-5 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-amber/20 text-accent-amber">
            <IconSwords size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black">أسئلة تحدي الأبطال</h1>
            <p className="text-sm text-white/60">{questions.length} سؤال في بنك التحدي</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-accent-amber px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-accent-amber/30 transition-all hover:-translate-y-0.5 hover:shadow-xl"
        >
          <IconPlus size={18} /> إضافة سؤال جديد
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <IconSearch size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث في الأسئلة..."
            className="h-10 w-full rounded-xl border border-border bg-card pr-9 pl-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCatFilter("all")}
            className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${catFilter === "all" ? "bg-primary text-white border-primary" : "bg-card border-border text-text-muted hover:border-primary"}`}
          >
            الكل
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCatFilter(c.value)}
              className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${catFilter === c.value ? "bg-primary text-white border-primary" : "bg-card border-border text-text-muted hover:border-primary"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Questions Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-text-muted">
          <IconLoader2 size={32} className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <IconSwords size={48} className="text-border mb-4" />
          <p className="font-bold text-text-muted">لا توجد أسئلة. أضف أول سؤال!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q, idx) => {
            const ci = catInfo(q.category);
            return (
              <div
                key={q.id}
                className="fade-up flex flex-wrap items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-[0_4px_16px_rgba(124,58,237,0.07)]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-black text-primary">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text mb-2 leading-relaxed">{q.question}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[q.option_a, q.option_b, q.option_c, q.option_d].map((opt, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold ${
                          i === q.correct_index
                            ? "bg-accent-teal/10 text-accent-teal border border-accent-teal/30"
                            : "bg-bg text-text-muted border border-border"
                        }`}
                      >
                        <span className="font-black text-xs">{CORRECT_LABELS[i]}</span>
                        {i === q.correct_index && <IconCheck size={12} />}
                        <span className="truncate">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${ci.color}`}>
                    {ci.label}
                  </span>
                  <button
                    onClick={() => openEdit(q)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-text-muted transition-colors hover:border-primary hover:text-primary"
                  >
                    <IconEdit size={15} />
                  </button>
                  <button
                    onClick={() => setConfirmDel(q.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-text-muted transition-colors hover:border-accent-red hover:text-accent-red"
                  >
                    <IconTrash size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-card border border-border shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border p-6">
              <h2 className="text-lg font-black">{editing ? "تعديل السؤال" : "إضافة سؤال جديد"}</h2>
              <button onClick={() => setShowForm(false)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-bg text-text-muted hover:text-text">
                <IconX size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* نوع السؤال */}
              <div>
                <label className="text-sm font-bold text-text-muted mb-2 block">نوع السؤال</label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setForm(f => ({ ...f, category: c.value as PkQuestion["category"] }))}
                      className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${
                        form.category === c.value ? "bg-primary text-white border-primary" : "bg-bg border-border text-text-muted"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* نص السؤال */}
              <div>
                <label className="text-sm font-bold text-text-muted mb-2 block">نص السؤال *</label>
                <textarea
                  value={form.question}
                  onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-bg p-3 text-sm outline-none focus:border-primary resize-none"
                  placeholder="اكتب نص السؤال هنا..."
                />
              </div>

              {/* الخيارات */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(["option_a", "option_b", "option_c", "option_d"] as const).map((key, i) => (
                  <div key={key}>
                    <label className="text-sm font-bold text-text-muted mb-1.5 block flex items-center gap-2">
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${form.correct_index === i ? "bg-accent-teal text-white" : "bg-border text-text-muted"}`}>
                        {CORRECT_LABELS[i]}
                      </span>
                      الخيار {CORRECT_LABELS[i]}
                    </label>
                    <input
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="h-10 w-full rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-primary"
                      placeholder={`الخيار ${CORRECT_LABELS[i]}...`}
                    />
                  </div>
                ))}
              </div>

              {/* الإجابة الصحيحة */}
              <div>
                <label className="text-sm font-bold text-text-muted mb-2 block">الإجابة الصحيحة</label>
                <div className="flex gap-2">
                  {CORRECT_LABELS.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => setForm(f => ({ ...f, correct_index: i }))}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-black transition-colors ${
                        form.correct_index === i
                          ? "bg-accent-teal text-white border-accent-teal shadow-lg shadow-accent-teal/30"
                          : "bg-bg border-border text-text-muted hover:border-accent-teal"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex flex-1 h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-white font-black text-sm shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {saving ? <IconLoader2 size={18} className="animate-spin" /> : <IconCheck size={18} />}
                  {editing ? "حفظ التعديلات" : "إضافة السؤال"}
                </button>
                <button onClick={() => setShowForm(false)} className="h-12 px-5 rounded-2xl border border-border text-sm font-bold text-text-muted hover:bg-bg">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-card border border-border p-8 shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-red/10 text-accent-red">
              <IconTrash size={32} />
            </div>
            <h3 className="text-lg font-black mb-2">حذف السؤال</h3>
            <p className="text-sm text-text-muted mb-6">هل أنت متأكد؟ لا يمكن التراجع.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(confirmDel)} className="flex-1 h-11 rounded-2xl bg-accent-red text-white font-black text-sm">حذف</button>
              <button onClick={() => setConfirmDel(null)} className="flex-1 h-11 rounded-2xl border border-border font-bold text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
