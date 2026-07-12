// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import {
  IconSearch, IconFileTypePdf, IconVideo, IconPhoto,
  IconNotes, IconDownload, IconEye, IconLock, IconFolder,
  IconBook, IconBolt, IconDatabase, IconClipboardList
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import type { LibraryFileType } from "@/lib/types";
import { usePlatformStore, type LibraryFile as AdminFile } from "@/lib/store";
import { incrementFileDownload } from "@/lib/supabase/services/library";

// ── Categories ───────────────────────────────────────────────────
const CATEGORIES = [
  { value: "all", label: "الكل", icon: <IconFolder size={18} /> },
  { value: "ملازم وتأسيس", label: "ملازم وتأسيس", icon: <IconBook size={18} /> },
  { value: "ملخصات سريعة", label: "ملخصات سريعة", icon: <IconBolt size={18} /> },
  { value: "بنك أسئلة وتجميعات", label: "بنك أسئلة وتجميعات", icon: <IconDatabase size={18} /> },
  { value: "أوراق عمل", label: "أوراق عمل", icon: <IconClipboardList size={18} /> },
];

const TYPE_INFO: Record<LibraryFileType, { icon: React.ReactNode; color: string }> = {
  pdf:     { icon: <IconFileTypePdf size={20} />, color: "#FF6B6B" },
  video:   { icon: <IconVideo size={20} />,       color: "#4A9EFF" },
  image:   { icon: <IconPhoto size={20} />,       color: "#FFB347" },
  summary: { icon: <IconNotes size={20} />,       color: "#00D4AA" },
};

export default function LibraryPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { files: storeFiles, tracks: storeTracks, enrolledCourseId, isDataLoading, enrolledCourses, platformSettings } = usePlatformStore();

  // Apply Features Overrides
  const activeCourse = enrolledCourses.find(c => c.id === enrolledCourseId);
  const pSettings = platformSettings || { global_interactive_book: true, global_study_plan: true, global_library: true };
  const overrides = (activeCourse as any)?.featuresOverride || {};
  const isEnabled = overrides.library !== undefined ? overrides.library : pSettings.global_library;

  useEffect(() => setIsMounted(true), []);

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [trackFilter, setTrackFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { showToast } = useToast();
  
  // Real platform logic usually checks active subscriptions
  const hasSub = true; 
  
  const mappedFiles = storeFiles.map(f => {
    const track = storeTracks.find(t => t.id === f.trackId);
    return {
      id: f.id,
      trackId: f.trackId,
      trackName: track?.name ?? "مسار محذوف",
      trackColor: track?.color ?? "#888",
      title: f.title,
      type: f.type,
      category: f.category || "ملازم وتأسيس",
      coverImage: f.coverImage,
      pagesCount: f.pagesCount || 0,
      downloadsCount: f.downloadsCount || 0,
      sizeLabel: f.sizeLabel,
      dateLabel: f.dateLabel,
      isNew: (() => {
        try {
          const parts = f.dateLabel.split('/');
          if (parts.length === 3) {
            const created = new Date(+parts[2], +parts[1] - 1, +parts[0]);
            const diff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
            return diff <= 7;
          }
          return false;
        } catch { return false; }
      })(),
      accessType: f.accessType,
      price: f.price,
      url: f.url,
    };
  });

  const files = mappedFiles.filter(f => {
    const mCat   = categoryFilter === "all" || f.category === categoryFilter;
    const mTrack = trackFilter === "all" || f.trackId === trackFilter;
    const mText  = f.title.includes(search);
    return mCat && mTrack && mText;
  });

  const trackFilters = [
    { value: "all", label: "كل المسارات" },
    ...storeTracks.map(t => ({ value: t.id, label: t.name }))
  ];

  if (!isEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <IconFolder size={40} stroke={1.5} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">المكتبة غير متاحة</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          عذراً، ميزة المكتبة غير متاحة لهذه الدورة حالياً.
        </p>
      </div>
    );
  }

  if (!isMounted || isDataLoading) return <div className="p-8 text-center text-text-muted font-bold">جاري التحميل...</div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="fade-up relative overflow-hidden rounded-3xl bg-sidebar px-8 py-10 text-white shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"></div>
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <IconFolder size={32} className="text-primary" />
            <h2 className="text-3xl font-black">مركز التحميل والمكتبة</h2>
          </div>
          <p className="text-white/70 text-sm max-w-lg leading-relaxed">
            مكتبتك الشاملة لكل ما تحتاجه للنجاح. حمل الملازم، راجع الملخصات السريعة، وتدرب على بنوك الأسئلة المحدثة لجميع المسارات.
          </p>
        </div>
      </section>

      {/* Filters Area */}
      <section className="fade-up flex flex-col gap-4">
        {/* Search */}
        <div className="relative w-full">
          <IconSearch size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن ملزمة، ملخص، أو بنك أسئلة..."
            className="h-12 w-full rounded-2xl border border-border bg-card pr-12 pl-4 text-sm font-semibold text-text shadow-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>

        {/* Categories (Tabs) */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setCategoryFilter(c.value)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl border px-5 py-2.5 text-sm font-bold transition-all ${
                categoryFilter === c.value 
                  ? "border-primary bg-primary text-white shadow-md shadow-primary/25" 
                  : "border-border bg-card text-text-muted hover:border-primary/50 hover:text-text"
              }`}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Tracks */}
        <div className="flex flex-wrap gap-2">
          {trackFilters.map(f => (
            <button key={f.value} onClick={() => setTrackFilter(f.value)}
              className={`whitespace-nowrap rounded-lg border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                trackFilter === f.value 
                  ? "border-text text-text bg-border/50" 
                  : "border-border bg-transparent text-text-muted hover:border-text/50 hover:text-text"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      {files.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card/50 text-text-muted">
          <IconFolder size={48} className="opacity-20" />
          <p className="font-bold text-sm">لا توجد ملفات مطابقة لبحثك</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((file, i) => {
            const info   = TYPE_INFO[file.type as LibraryFileType] || TYPE_INFO.pdf;
            const locked = file.accessType === "paid" && !hasSub;
            
            return (
              <div key={file.id} className={`fade-up delay-${(i % 4) + 1} group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5`}>
                {/* Card Cover */}
                <div className="relative flex h-40 w-full items-center justify-center bg-sidebar overflow-hidden">
                  <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
                  
                  {file.coverImage ? (
                    <img src={file.coverImage} alt={file.title} className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-sidebar">
                       <IconBook size={64} className="text-white/20" />
                    </div>
                  )}

                  {file.isNew && (
                    <div className="absolute left-3 top-3 z-20 rounded-lg bg-accent-red px-2.5 py-1 text-[10px] font-black text-white shadow-lg">جديد!</div>
                  )}
                  
                  <div className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 backdrop-blur-md text-white shadow-lg border border-white/10" style={{ color: info.color }}>
                    {info.icon}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 z-20 flex justify-between items-end">
                    <span className="rounded-md px-2 py-1 text-white/90 text-[10px] font-bold backdrop-blur-md border border-white/10" style={{ background: file.trackColor }}>
                      {file.trackName}
                    </span>
                    {file.pagesCount > 0 && (
                      <span className="text-white/80 text-[10px] font-bold bg-black/40 px-2 py-1 rounded-md backdrop-blur-md border border-white/10">{file.pagesCount} صفحة</span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-col p-4 flex-1">
                  <h3 className="text-sm font-extrabold leading-tight text-text line-clamp-2 mb-3" title={file.title}>{file.title}</h3>
                  
                  <div className="mt-auto flex items-center justify-between text-[11px] font-bold text-text-muted mb-4 border-b border-border/50 pb-4">
                    <div className="flex items-center gap-1.5"><IconFolder size={14} /> {file.sizeLabel}</div>
                    <div className="flex items-center gap-1.5"><IconDownload size={14} /> {file.downloadsCount} تحميل</div>
                  </div>

                  {locked ? (
                    <button onClick={() => showToast(`هذا الملف مدفوع (${file.price} ر.س) — اشترك للوصول`, "warning")}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent-amber/10 text-xs font-bold text-accent-amber transition-colors hover:bg-accent-amber hover:text-white">
                      <IconLock size={15} /> مقفل — اشترك الآن
                    </button>
                  ) : (
                    <div className="flex gap-2">
                    {file.url.includes("supabase.co") || file.url.includes("drive.google.com/uc?export=download") ? (
                      <button onClick={async () => {
                          // Increment downloads in the background
                          incrementFileDownload(file.id).catch(console.error);
                          
                          let downloadUrl = file.url;
                          if (downloadUrl.includes("supabase.co")) {
                            downloadUrl += (downloadUrl.includes('?') ? '&' : '?') + 'download=';
                          }
                          const a = document.createElement("a");
                          a.href = downloadUrl;
                          a.download = file.title || 'download';
                          a.target = "_blank";
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary h-10 text-xs font-bold text-white transition-all hover:bg-primary-dark hover:scale-[1.02] active:scale-95 shadow-md shadow-primary/20">
                        <IconDownload size={15} /> تحميل
                      </button>
                    ) : (
                      <button onClick={() => window.open(file.url, "_blank")}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-transparent h-10 text-xs font-bold text-text transition-colors hover:border-primary hover:text-primary">
                        <IconEye size={15} /> فتح الملف
                      </button>
                    )}
                  </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
