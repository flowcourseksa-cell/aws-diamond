"use client";

import { useState, useRef, useEffect } from "react";
import {
  IconBrain,
  IconPlus,
  IconPencil,
  IconTrash,
  IconCheck,
  IconX,
  IconChevronLeft,
  IconSparkles,
  IconLayoutGridAdd,
  IconAlertTriangle,
  IconGripVertical,
  IconBook2,
  IconStar,
  IconStarFilled,
} from "@tabler/icons-react";
import {
  type FlowTrack,
  type FlowSection,
  type FlowSkill,
  type SkillStatus,
} from "@/lib/mock-data";
import { usePlatformStore } from "@/lib/store";

// ─── types ───────────────────────────────────────────────────────────────────

interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

const STATUS_COLORS: Record<SkillStatus, string> = {
  strong:      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  average:     "bg-amber-500/15 text-amber-400 border-amber-500/30",
  weak:        "bg-red-500/15 text-red-400 border-red-500/30",
  not_started: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const STATUS_LABELS: Record<SkillStatus, string> = {
  strong:      "متقن",
  average:     "متوسط",
  weak:        "ضعيف",
  not_started: "لم يبدأ",
};

function ScoreIcon({ score }: { score: number }) {
  if (score >= 80) return <IconStarFilled size={13} className="text-amber-400" />;
  if (score >= 50) return <IconStar size={13} className="text-amber-400/60" />;
  return null;
}

const TRACK_ACCENT: Record<string, { pill: string; dot: string }> = {
  "qudrat-komi":  { pill: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",   dot: "bg-indigo-500"  },
  "qudrat-lafzi": { pill: "bg-purple-500/20 text-purple-300 border-purple-500/30",   dot: "bg-purple-500"  },
  "nafis":        { pill: "bg-red-500/20 text-red-300 border-red-500/30",             dot: "bg-red-500"     },
  "tasis":        { pill: "bg-amber-500/20 text-amber-300 border-amber-500/30",      dot: "bg-amber-500"   },
};

function getAccent(trackId: string) {
  return TRACK_ACCENT[trackId] ?? TRACK_ACCENT["qudrat-komi"];
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  dialog,
  onClose,
}: {
  dialog: ConfirmDialogState;
  onClose: () => void;
}) {
  if (!dialog.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
        style={{ animation: "fadeUp 0.18s ease both" }}
      >
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/15">
            <IconAlertTriangle size={20} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-text">{dialog.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-text-muted">
              {dialog.message}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              dialog.onConfirm();
              onClose();
            }}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            تأكيد الحذف
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border bg-bg py-2.5 text-[13px] font-bold text-text-muted transition-colors hover:text-text"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── InlineInput ──────────────────────────────────────────────────────────────

function InlineInput({
  value,
  onChange,
  onConfirm,
  onCancel,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  placeholder: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <div className="flex items-center gap-2">
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === "Enter") onConfirm();
          if (e.key === "Escape") onCancel();
        }}
        className="h-9 flex-1 rounded-xl border border-indigo-500/60 bg-indigo-500/8 px-3 text-[13px] text-text outline-none placeholder:text-text-muted focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
      />
      <button
        onClick={onConfirm}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white transition-opacity hover:opacity-80"
      >
        <IconCheck size={15} />
      </button>
      <button
        onClick={onCancel}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border text-text-muted transition-colors hover:text-text"
      >
        <IconX size={15} />
      </button>
    </div>
  );
}

// ─── SkillRow ─────────────────────────────────────────────────────────────────

function SkillRow({
  skill,
  onEdit,
  onDelete,
}: {
  skill: FlowSkill;
  onEdit: (name: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(skill.name);

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border/40 bg-bg/40 px-3.5 py-2.5 transition-colors hover:bg-bg/70">
      <IconGripVertical size={14} className="flex-shrink-0 text-text-muted/30" />

      {editing ? (
        <div className="flex-1">
          <InlineInput
            value={draft}
            onChange={setDraft}
            onConfirm={() => {
              if (draft.trim()) { onEdit(draft.trim()); setEditing(false); }
            }}
            onCancel={() => { setDraft(skill.name); setEditing(false); }}
            placeholder="اسم المهارة"
          />
        </div>
      ) : (
        <>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-[13px] font-semibold text-text">
              {skill.name}
            </span>
            <ScoreIcon score={skill.masteryScore} />
          </div>

          <span
            className={`flex-shrink-0 rounded-lg border px-2 py-0.5 text-[10.5px] font-bold ${STATUS_COLORS[skill.status]}`}
          >
            {STATUS_LABELS[skill.status]}
          </span>

          {skill.masteryScore > 0 && (
            <span className="flex-shrink-0 text-[12px] font-bold tabular-nums text-text-muted">
              {skill.masteryScore}٪
            </span>
          )}

          <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => { setDraft(skill.name); setEditing(true); }}
              title="تعديل المهارة"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:border-indigo-500/50 hover:text-indigo-400"
            >
              <IconPencil size={13} />
            </button>
            <button
              onClick={onDelete}
              title="حذف المهارة"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:border-red-500/40 hover:text-red-400"
            >
              <IconTrash size={13} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────

function SectionCard({
  section,
  trackId,
  onUpdateSection,
  onDeleteSection,
  onAddSkill,
  onEditSkill,
  onDeleteSkill,
  onRequestConfirm,
}: {
  section: FlowSection;
  trackId: string;
  onUpdateSection: (name: string) => void;
  onDeleteSection: () => void;
  onAddSkill: (name: string) => void;
  onEditSkill: (skillId: string, name: string) => void;
  onDeleteSkill: (skillId: string) => void;
  onRequestConfirm: (opts: Omit<ConfirmDialogState, "open">) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(section.name);
  const [addingSkill, setAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const accent = getAccent(trackId);

  return (
    <div
      className="rounded-2xl border border-border bg-card shadow-sm"
      style={{ animation: "fadeUp 0.3s ease both" }}
    >
      {/* Section header */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${accent.dot}`} />

        {editingName ? (
          <div className="flex-1">
            <InlineInput
              value={nameDraft}
              onChange={setNameDraft}
              onConfirm={() => {
                if (nameDraft.trim()) { onUpdateSection(nameDraft.trim()); setEditingName(false); }
              }}
              onCancel={() => { setNameDraft(section.name); setEditingName(false); }}
              placeholder="اسم القسم"
            />
          </div>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <span className="text-[14.5px] font-extrabold text-text">
                {section.name}
              </span>
              <span className="mr-2 text-[12px] text-text-muted">
                {section.skills.length} مهارة
              </span>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1.5">
              <button
                onClick={() => { setNameDraft(section.name); setEditingName(true); }}
                className="flex h-8 items-center gap-1.5 rounded-xl border border-border px-3 text-[12px] font-semibold text-text-muted transition-colors hover:border-indigo-500/40 hover:text-indigo-400"
              >
                <IconPencil size={13} />
                تعديل
              </button>
              <button
                onClick={() =>
                  onRequestConfirm({
                    title: "حذف القسم",
                    message: `هل أنت متأكد من حذف قسم "${section.name}"؟ سيتم حذف جميع مهاراته نهائياً.`,
                    onConfirm: onDeleteSection,
                  })
                }
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-text-muted transition-colors hover:border-red-500/40 hover:text-red-400"
              >
                <IconTrash size={14} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Skills */}
      <div className="flex flex-col gap-2 p-4">
        {section.skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-6 text-text-muted">
            <IconBook2 size={24} strokeWidth={1.5} />
            <span className="text-[13px]">لا توجد مهارات في هذا القسم</span>
          </div>
        ) : (
          section.skills.map((skill) => (
            <SkillRow
              key={skill.id}
              skill={skill}
              onEdit={(name) => onEditSkill(skill.id, name)}
              onDelete={() =>
                onRequestConfirm({
                  title: "حذف المهارة",
                  message: `هل أنت متأكد من حذف مهارة "${skill.name}" نهائياً؟`,
                  onConfirm: () => onDeleteSkill(skill.id),
                })
              }
            />
          ))
        )}

        {/* Add skill */}
        {addingSkill ? (
          <div className="mt-1">
            <InlineInput
              value={newSkillName}
              onChange={setNewSkillName}
              onConfirm={() => {
                if (newSkillName.trim()) {
                  onAddSkill(newSkillName.trim());
                  setNewSkillName("");
                  setAddingSkill(false);
                }
              }}
              onCancel={() => { setNewSkillName(""); setAddingSkill(false); }}
              placeholder="اسم المهارة الجديدة..."
            />
          </div>
        ) : (
          <button
            onClick={() => setAddingSkill(true)}
            className="mt-1 flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-500/35 text-[13px] font-semibold text-indigo-400/75 transition-colors hover:border-indigo-400 hover:bg-indigo-500/5 hover:text-indigo-300"
          >
            <IconPlus size={15} />
            إضافة مهارة
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TracksPage() {
  const [isMounted, setIsMounted] = useState(false);
  const tracks = usePlatformStore(s => s.tracks);
  const setTracks = usePlatformStore(s => s.setTracks);
  
  const [activeTrackId, setActiveTrackId] = useState<string>("");
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && tracks.length > 0 && !activeTrackId) {
      setActiveTrackId(tracks[0].id);
    }
  }, [isMounted, tracks, activeTrackId]);

  const [addingSection, setAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [confirm, setConfirm] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const activeTrack = tracks.find((t) => t.id === activeTrackId);

  // ── mutations ─────────────────────────────────────────────────────────────

  function addSection(name: string) {
    const newSection: FlowSection = { id: uid(), name, skills: [] };
    setTracks((prev) =>
      prev.map((t) =>
        t.id === activeTrackId
          ? { ...t, sections: [...t.sections, newSection] }
          : t
      )
    );
  }

  function updateSection(sectionId: string, name: string) {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === activeTrackId
          ? { ...t, sections: t.sections.map((s) => s.id === sectionId ? { ...s, name } : s) }
          : t
      )
    );
  }

  function deleteSection(sectionId: string) {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === activeTrackId
          ? { ...t, sections: t.sections.filter((s) => s.id !== sectionId) }
          : t
      )
    );
  }

  function addSkill(sectionId: string, name: string) {
    const newSkill: FlowSkill = { id: uid(), name, masteryScore: 0, status: "not_started" };
    setTracks((prev) =>
      prev.map((t) =>
        t.id !== activeTrackId ? t : {
          ...t,
          sections: t.sections.map((s) =>
            s.id === sectionId ? { ...s, skills: [...s.skills, newSkill] } : s
          ),
        }
      )
    );
  }

  function editSkill(sectionId: string, skillId: string, name: string) {
    setTracks((prev) =>
      prev.map((t) =>
        t.id !== activeTrackId ? t : {
          ...t,
          sections: t.sections.map((s) =>
            s.id !== sectionId ? s : {
              ...s,
              skills: s.skills.map((sk) => sk.id === skillId ? { ...sk, name } : sk),
            }
          ),
        }
      )
    );
  }

  function deleteSkill(sectionId: string, skillId: string) {
    setTracks((prev) =>
      prev.map((t) =>
        t.id !== activeTrackId ? t : {
          ...t,
          sections: t.sections.map((s) =>
            s.id !== sectionId ? s : {
              ...s,
              skills: s.skills.filter((sk) => sk.id !== skillId),
            }
          ),
        }
      )
    );
  }

  // ── derived stats ─────────────────────────────────────────────────────────

  const totalSections = activeTrack?.sections.length ?? 0;
  const totalSkills = activeTrack?.sections.reduce((a, s) => a + s.skills.length, 0) ?? 0;
  const strongSkills = activeTrack?.sections.reduce(
    (a, s) => a + s.skills.filter((sk) => sk.status === "strong").length,
    0
  ) ?? 0;
  const activeAccent = getAccent(activeTrackId);

  // ─────────────────────────────────────────────────────────────────────────

  if (!isMounted || !activeTrack) return <div className="p-8 text-center text-text-muted font-bold">جاري التحميل...</div>;

  return (
    <>
      <ConfirmModal
        dialog={confirm}
        onClose={() => setConfirm((d) => ({ ...d, open: false }))}
      />

      {/* Page header */}
      <div className="fade-up flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-indigo-500/15">
            <IconBrain size={22} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-[18px] font-black text-text">
              إدارة المسارات والأقسام
            </h1>
            <p className="text-[12.5px] text-text-muted">
              تنظيم المسارات التعليمية ومهاراتها — {tracks.length} مسارات
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2">
          {[
            { label: "أقسام",  value: totalSections, color: "text-indigo-400" },
            { label: "مهارات", value: totalSkills,    color: "text-amber-400"  },
            { label: "متقنة",  value: strongSkills,   color: "text-emerald-400"},
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card px-4 py-2 text-center"
            >
              <div className={`text-[17px] font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-[11px] text-text-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="fade-up delay-1 flex flex-col gap-5 lg:flex-row lg:items-start">

        {/* LEFT — Track tab list */}
        <div className="flex-shrink-0 rounded-2xl border border-border bg-card p-3 lg:w-[240px]">
          <p className="mb-2.5 px-2 text-[10.5px] font-bold uppercase tracking-wider text-text-muted">
            المسارات
          </p>
          <nav className="flex flex-col gap-1">
            {tracks.map((track) => {
              const acc = getAccent(track.id);
              const isActive = track.id === activeTrackId;
              const sCount = track.sections.length;
              const skCount = track.sections.reduce((a, s) => a + s.skills.length, 0);
              return (
                <button
                  key={track.id}
                  onClick={() => {
                    setActiveTrackId(track.id);
                    setAddingSection(false);
                    setNewSectionName("");
                  }}
                  className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-right transition-all ${
                    isActive ? "bg-indigo-500/10" : "hover:bg-bg"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${acc.dot} ${
                      isActive ? "ring-2 ring-indigo-500/30 ring-offset-1 ring-offset-card" : ""
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className={`flex items-center gap-1.5 text-[13px] font-bold ${
                        isActive ? "text-text" : "text-text-muted"
                      }`}
                    >
                      <span>{track.icon}</span>
                      <span className="truncate">{track.name}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-text-muted">
                      {sCount} قسم · {skCount} مهارة
                    </div>
                  </div>
                  {isActive && (
                    <IconChevronLeft size={15} className="flex-shrink-0 text-indigo-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* RIGHT — Sections panel */}
        <div className="min-w-0 flex-1">

          {/* Panel header */}
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[24px] leading-none">{activeTrack.icon}</span>
              <div>
                <h2 className="text-[16px] font-extrabold text-text">
                  {activeTrack.name}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-lg border px-2.5 py-0.5 text-[11px] font-bold ${activeAccent.pill}`}
                  >
                    {totalSections} قسم
                  </span>
                  <span className="text-[12px] text-text-muted">
                    {totalSkills} مهارة إجمالاً
                  </span>
                </div>
              </div>
            </div>

            {addingSection ? (
              <div className="w-full sm:w-auto sm:min-w-[300px]">
                <InlineInput
                  value={newSectionName}
                  onChange={setNewSectionName}
                  onConfirm={() => {
                    if (newSectionName.trim()) {
                      addSection(newSectionName.trim());
                      setNewSectionName("");
                      setAddingSection(false);
                    }
                  }}
                  onCancel={() => { setNewSectionName(""); setAddingSection(false); }}
                  placeholder="اسم القسم الجديد..."
                />
              </div>
            ) : (
              <button
                onClick={() => setAddingSection(true)}
                className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 active:scale-[0.97]"
              >
                <IconLayoutGridAdd size={16} />
                إضافة قسم جديد
              </button>
            )}
          </div>

          {/* Sections or empty state */}
          {activeTrack.sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card py-20 text-text-muted">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-bg">
                <IconSparkles size={32} strokeWidth={1.2} />
              </div>
              <div className="text-center">
                <p className="text-[15px] font-bold text-text">لا توجد أقسام بعد</p>
                <p className="mt-1 text-[13px]">ابدأ بإضافة قسم جديد لهذا المسار</p>
              </div>
              <button
                onClick={() => setAddingSection(true)}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-amber-400"
              >
                <IconPlus size={16} />
                إضافة قسم
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {activeTrack.sections.map((section) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  trackId={activeTrackId}
                  onUpdateSection={(name) => updateSection(section.id, name)}
                  onDeleteSection={() => deleteSection(section.id)}
                  onAddSkill={(name) => addSkill(section.id, name)}
                  onEditSkill={(skillId, name) => editSkill(section.id, skillId, name)}
                  onDeleteSkill={(skillId) => deleteSkill(section.id, skillId)}
                  onRequestConfirm={(opts) => setConfirm({ ...opts, open: true })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
