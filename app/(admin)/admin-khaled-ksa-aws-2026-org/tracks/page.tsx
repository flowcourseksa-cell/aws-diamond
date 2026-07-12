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

import { fetchCourses } from "@/lib/supabase/services/courses";
import { type Course } from "@/lib/store";
import {
  fetchHierarchyByCourse,
  createTrack,
  updateTrack,
  deleteTrack,
  createSection,
  updateSection,
  deleteSection,
  createSkill,
  updateSkill,
  deleteSkill,
  type DbTrack,
  type DbSection,
  type DbMicroSkill,
} from "@/lib/supabase/services/hierarchy";
import { fetchLessonsByTracks, type DbLesson } from "@/lib/supabase/services/lessons";

// ─── types ───────────────────────────────────────────────────────────────────

interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

// Default accents
const TRACK_ACCENT: Record<string, { pill: string; dot: string }> = {
  default: { pill: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30", dot: "bg-indigo-500" },
};

function getAccent(trackId: string) {
  return TRACK_ACCENT.default;
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
            تأكيد
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
  skill: DbMicroSkill;
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
          </div>

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
  sectionLessons,
  onUpdateSection,
  onDeleteSection,
  onAddSkill,
  onEditSkill,
  onDeleteSkill,
  onRequestConfirm,
}: {
  section: DbSection;
  trackId: string;
  sectionLessons: DbLesson[];
  onUpdateSection: (name: string) => void;
  onDeleteSection: () => void;
  onAddSkill: (name: string, lessonId: string) => void;
  onEditSkill: (skillId: string, name: string) => void;
  onDeleteSkill: (skillId: string) => void;
  onRequestConfirm: (opts: Omit<ConfirmDialogState, "open">) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(section.name);
  const [addingSkill, setAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const accent = getAccent(trackId);

  const skills = section.micro_skills || [];

  return (
    <div
      className="rounded-2xl border border-border bg-card shadow-sm"
      style={{ animation: "fadeUp 0.3s ease both" }}
    >
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
                {skills.length} مهارة
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

      <div className="flex flex-col gap-2 p-4">
        {skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-6 text-text-muted">
            <IconBook2 size={24} strokeWidth={1.5} />
            <span className="text-[13px]">لا توجد مهارات في هذا القسم</span>
          </div>
        ) : (
          skills.map((skill) => (
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

        {addingSkill ? (
          sectionLessons.length === 0 ? (
            <div className="mt-1 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-red-500/30 bg-red-500/5 py-4 text-red-500">
              <IconAlertTriangle size={20} />
              <span className="text-[13px] font-bold">لا يمكن إضافة مهارة!</span>
              <span className="text-[12px] text-center px-4">يجب إضافة درس واحد على الأقل لهذا القسم قبل التمكن من إضافة مهارات مرتبطة به.</span>
              <button onClick={() => setAddingSkill(false)} className="mt-2 text-[12px] underline">إلغاء</button>
            </div>
          ) : (
            <div className="mt-1 flex flex-col gap-2 rounded-xl border border-indigo-500/30 p-3 bg-indigo-500/5">
              <input
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="اسم المهارة الجديدة..."
                className="h-9 w-full rounded-lg border border-indigo-500/30 bg-bg px-3 text-[13px] text-text outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
              />
              <select
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
                className="h-9 w-full rounded-lg border border-indigo-500/30 bg-bg px-3 text-[13px] text-text outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
              >
                <option value="">اختر الدرس المرتبط (إجباري)</option>
                {sectionLessons.map(l => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => {
                    if (newSkillName.trim() && selectedLessonId) {
                      onAddSkill(newSkillName.trim(), selectedLessonId);
                      setNewSkillName("");
                      setSelectedLessonId("");
                      setAddingSkill(false);
                    }
                  }}
                  disabled={!newSkillName.trim() || !selectedLessonId}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-indigo-500 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <IconCheck size={16} /> حفظ
                </button>
                <button
                  onClick={() => { setNewSkillName(""); setSelectedLessonId(""); setAddingSkill(false); }}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-card py-2 text-[13px] font-bold text-text-muted transition-colors hover:text-text"
                >
                  <IconX size={16} /> إلغاء
                </button>
              </div>
            </div>
          )
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
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string>("");
  
  const [tracks, setTracks] = useState<DbTrack[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<string>("");
  const [lessons, setLessons] = useState<DbLesson[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchCourses().then((data) => {
      setCourses(data);
      if (data.length > 0) {
        setActiveCourseId(data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (activeCourseId) {
      setIsLoading(true);
      fetchHierarchyByCourse(activeCourseId).then((data) => {
        setTracks(data);
        if (data.length > 0) {
          setActiveTrackId(data[0].id);
          fetchLessonsByTracks(data.map(t => t.id)).then(setLessons);
        } else {
          setActiveTrackId("");
          setLessons([]);
        }
        setIsLoading(false);
      });
    } else {
      setTracks([]);
      setActiveTrackId("");
      setLessons([]);
    }
  }, [activeCourseId]);

  const [addingTrack, setAddingTrack] = useState(false);
  const [newTrackName, setNewTrackName] = useState("");
  
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

  async function handleAddTrack() {
    if (!newTrackName.trim() || !activeCourseId) return;
    const newTrack = await createTrack(activeCourseId, newTrackName.trim(), "📝");
    if (newTrack) {
      setTracks((prev) => [...prev, newTrack]);
      setActiveTrackId(newTrack.id);
      setNewTrackName("");
      setAddingTrack(false);
    }
  }

  async function handleDeleteTrack(id: string) {
    const success = await deleteTrack(id);
    if (success) {
      const newTracks = tracks.filter((t) => t.id !== id);
      setTracks(newTracks);
      if (activeTrackId === id) {
        setActiveTrackId(newTracks.length > 0 ? newTracks[0].id : "");
      }
    }
  }

  async function handleAddSection(name: string) {
    if (!activeTrackId) return;
    const newSection = await createSection(activeTrackId, name);
    if (newSection) {
      setTracks((prev) =>
        prev.map((t) =>
          t.id === activeTrackId
            ? { ...t, sections: [...(t.sections || []), newSection] }
            : t
        )
      );
    }
  }

  async function handleUpdateSection(sectionId: string, name: string) {
    const success = await updateSection(sectionId, name);
    if (success) {
      setTracks((prev) =>
        prev.map((t) =>
          t.id === activeTrackId
            ? {
                ...t,
                sections: t.sections.map((s) => (s.id === sectionId ? { ...s, name } : s)),
              }
            : t
        )
      );
    }
  }

  async function handleDeleteSection(sectionId: string) {
    const success = await deleteSection(sectionId);
    if (success) {
      setTracks((prev) =>
        prev.map((t) =>
          t.id === activeTrackId
            ? { ...t, sections: t.sections.filter((s) => s.id !== sectionId) }
            : t
        )
      );
    }
  }

  async function handleAddSkill(sectionId: string, name: string, lessonId: string) {
    if (!activeTrackId) return;
    const newSkill = await createSkill(sectionId, name, lessonId);
    if (newSkill) {
      setTracks((prev) =>
        prev.map((t) =>
          t.id !== activeTrackId
            ? t
            : {
                ...t,
                sections: t.sections.map((s) =>
                  s.id === sectionId
                    ? { ...s, micro_skills: [...(s.micro_skills || []), newSkill] }
                    : s
                ),
              }
        )
      );
    }
  }

  async function handleEditSkill(sectionId: string, skillId: string, name: string) {
    const success = await updateSkill(skillId, name);
    if (success) {
      setTracks((prev) =>
        prev.map((t) =>
          t.id !== activeTrackId
            ? t
            : {
                ...t,
                sections: t.sections.map((s) =>
                  s.id !== sectionId
                    ? s
                    : {
                        ...s,
                        micro_skills: s.micro_skills.map((sk) =>
                          sk.id === skillId ? { ...sk, name } : sk
                        ),
                      }
                ),
              }
        )
      );
    }
  }

  async function handleDeleteSkill(sectionId: string, skillId: string) {
    const success = await deleteSkill(skillId);
    if (success) {
      setTracks((prev) =>
        prev.map((t) =>
          t.id !== activeTrackId
            ? t
            : {
                ...t,
                sections: t.sections.map((s) =>
                  s.id !== sectionId
                    ? s
                    : {
                        ...s,
                        micro_skills: s.micro_skills.filter((sk) => sk.id !== skillId),
                      }
                ),
              }
        )
      );
    }
  }

  // ── derived stats ─────────────────────────────────────────────────────────

  const totalSections = activeTrack?.sections?.length ?? 0;
  const totalSkills = activeTrack?.sections?.reduce((a, s) => a + (s.micro_skills?.length || 0), 0) ?? 0;
  const activeAccent = getAccent(activeTrackId);

  // ─────────────────────────────────────────────────────────────────────────

  if (!isMounted) return <div className="p-8 text-center text-text-muted font-bold">جاري التحميل...</div>;

  return (
    <>
      <ConfirmModal
        dialog={confirm}
        onClose={() => setConfirm((d) => ({ ...d, open: false }))}
      />

      <div className="flex flex-col gap-6 pb-10" dir="rtl">
        {/* Page header */}
        <div className="fade-up flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-indigo-500/15">
              <IconBrain size={22} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-[18px] font-black text-text">
                إدارة المسارات والأقسام
              </h1>
              <p className="text-[12.5px] text-text-muted">
                تنظيم الهيكل الداخلي لكل دورة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-muted">اختر الدورة:</span>
            <select 
              className="bg-card border border-border rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-indigo-500"
              value={activeCourseId}
              onChange={(e) => setActiveCourseId(e.target.value)}
            >
              {courses.length === 0 && <option value="">لا توجد دورات</option>}
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
           <div className="flex items-center justify-center py-20 text-text-muted">
             جاري جلب الهيكلة...
           </div>
        ) : (
          <div className="fade-up delay-1 flex flex-col gap-5 lg:flex-row lg:items-start">
            
            {/* LEFT — Track tab list */}
            <div className="flex-shrink-0 rounded-2xl border border-border bg-card p-3 lg:w-[240px]">
              <div className="flex items-center justify-between mb-2.5 px-2">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-text-muted">
                  المسارات
                </p>
                <button 
                  onClick={() => setAddingTrack(true)}
                  className="text-indigo-400 hover:text-indigo-300"
                  title="إضافة مسار"
                >
                  <IconPlus size={16} />
                </button>
              </div>

              <nav className="flex flex-col gap-1">
                {addingTrack && (
                  <div className="p-2">
                    <InlineInput
                      value={newTrackName}
                      onChange={setNewTrackName}
                      onConfirm={handleAddTrack}
                      onCancel={() => { setNewTrackName(""); setAddingTrack(false); }}
                      placeholder="اسم المسار..."
                    />
                  </div>
                )}
                {tracks.length === 0 && !addingTrack && (
                  <div className="px-2 py-4 text-center text-[12px] text-text-muted">
                    لا يوجد مسارات. أضف مساراً جديداً.
                  </div>
                )}
                {tracks.map((track) => {
                  const isActive = track.id === activeTrackId;
                  const sCount = track.sections?.length || 0;
                  const skCount = track.sections?.reduce((a, s) => a + (s.micro_skills?.length || 0), 0) || 0;
                  return (
                    <div key={track.id} className="relative group">
                      <button
                        onClick={() => {
                          setActiveTrackId(track.id);
                          setAddingSection(false);
                          setNewSectionName("");
                        }}
                        className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-right transition-all ${
                          isActive ? "bg-indigo-500/10" : "hover:bg-bg"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div
                            className={`flex items-center gap-1.5 text-[13px] font-bold ${
                              isActive ? "text-text" : "text-text-muted"
                            }`}
                          >
                            <span>{track.icon || "📝"}</span>
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
                      <button 
                        className="absolute left-2 top-3 p-1 rounded-md text-text-muted opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirm({
                            open: true,
                            title: "حذف مسار",
                            message: `هل أنت متأكد من حذف مسار "${track.name}" وجميع أقسامه؟`,
                            onConfirm: () => handleDeleteTrack(track.id)
                          });
                        }}
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* RIGHT — Sections panel */}
            <div className="min-w-0 flex-1">
              {activeTrack ? (
                <>
                  {/* Panel header */}
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[24px] leading-none">{activeTrack.icon || "📝"}</span>
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
                              handleAddSection(newSectionName.trim());
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
                  {activeTrack.sections?.length === 0 ? (
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
                      {activeTrack.sections?.map((section) => (
                        <SectionCard
                          key={section.id}
                          section={section}
                          trackId={activeTrackId}
                          sectionLessons={lessons.filter(l => l.section_id === section.id)}
                          onUpdateSection={(name) => handleUpdateSection(section.id, name)}
                          onDeleteSection={() => handleDeleteSection(section.id)}
                          onAddSkill={(name, lessonId) => handleAddSkill(section.id, name, lessonId)}
                          onEditSkill={(skillId, name) => handleEditSkill(section.id, skillId, name)}
                          onDeleteSkill={(skillId) => handleDeleteSkill(section.id, skillId)}
                          onRequestConfirm={(opts) => setConfirm({ ...opts, open: true })}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                 <div className="flex flex-col items-center justify-center py-20 text-text-muted border border-border bg-card rounded-2xl">
                   اختر مساراً لعرص التفاصيل أو قم بإضافة مسار جديد
                 </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

