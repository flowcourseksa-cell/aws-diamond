"use client";

import { useState, useEffect } from "react";
import {
  IconSearch, IconFileTypePdf, IconVideo, IconPhoto,
  IconNotes, IconDownload, IconEye, IconLock, IconFolder,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useToast } from "@/components/ui/toast";
import type { LibraryFileType } from "@/lib/types";
import { usePlatformStore, type LibraryFile as AdminFile } from "@/lib/store";

// ── ملفات المكتبة مرتبطة بالمسارات ──────────────────────────
type LibraryFile = {
  id: string; trackId: string; trackName: string; trackColor: string;
  title: string; type: LibraryFileType;
  sizeLabel: string; dateLabel: string; isNew: boolean;
  accessType: "free" | "paid"; price: number;
};
const TYPE_FILTERS: { value: "all" | LibraryFileType; label: string }[] = [
  { value: "all",     label: "الكل"     },
  { value: "pdf",     label: "PDF"      },
  { value: "video",   label: "فيديو"   },
  { value: "image",   label: "صور"     },
  { value: "summary", label: "ملخصات"  },
];
const TYPE_INFO: Record<LibraryFileType, { icon: React.ReactNode; color: string }> = {
  pdf:     { icon: <IconFileTypePdf size={26} />, color: "#FF6B6B" },
  video:   { icon: <IconVideo size={26} />,       color: "#4A9EFF" },
  image:   { icon: <IconPhoto size={26} />,       color: "#FFB347" },
  summary: { icon: <IconNotes size={26} />,       color: "#00D4AA" },
};

export default function LibraryPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { files: storeFiles, tracks: storeTracks } = usePlatformStore();

  useEffect(() => setIsMounted(true), []);

  const [typeFilter,  setTypeFilter]  = useState<"all" | LibraryFileType>("all");
  const [trackFilter, setTrackFilter] = useState("all");
  const [search,      setSearch]      = useState("");
  const { showToast }                 = useToast();
  const hasSub = true;

  if (!isMounted) return <div className="p-8 text-center text-text-muted font-bold">جاري التحميل...</div>;

  const activeTracks = storeTracks;
  const activeFiles = storeFiles;

  const mappedFiles: LibraryFile[] = activeFiles.map(f => {
    const track = activeTracks.find(t => t.id === f.trackId);
    return {
      id: f.id,
      trackId: f.trackId,
      trackName: track?.name ?? "مسار محذوف",
      trackColor: track?.color ?? "#888",
      title: f.title,
      type: f.type,
      sizeLabel: f.sizeLabel,
      dateLabel: f.dateLabel,
      isNew: true,
      accessType: f.accessType,
      price: f.price,
    };
  });

  const files = mappedFiles.filter(f => {
    const mType  = typeFilter  === "all" || f.type    === typeFilter;
    const mTrack = trackFilter === "all" || f.trackId === trackFilter;
    const mText  = f.title.includes(search);
    return mType && mTrack && mText;
  });

  const trackFilters = [
    { value: "all", label: "كل المسارات" },
    ...activeTracks.map(t => ({ value: t.id, label: t.name }))
  ];


  return (
    <>
      {/* Header */}
      <section className="fade-up rounded-2xl bg-sidebar px-7 py-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <IconFolder size={26} />
          <h2 className="text-xl font-black">المكتبة</h2>
        </div>
        <p className="text-white/55 text-sm">ملفات وشروحات وملخصات مرتبطة بكل مسار من مسارات القدرات</p>
      </section>

      {/* فلاتر النوع */}
      <section className="fade-up flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map(f => (
            <button key={f.value} onClick={() => setTypeFilter(f.value)}
              className={`whitespace-nowrap rounded-[10px] border px-4 py-2.25 text-[13px] font-bold transition-colors ${typeFilter === f.value ? "border-primary bg-primary text-white" : "border-border bg-card text-text-muted hover:border-primary hover:text-primary"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-[230px]">
          <IconSearch size={17} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث فوري عن ملف..."
            className="h-10.5 w-full rounded-[10px] border border-border bg-card pr-10 pl-4 text-[13.5px] text-text outline-none focus:border-primary" />
        </div>
      </section>

      {/* فلاتر المسار */}
      <section className="fade-up flex flex-wrap gap-2">
        {trackFilters.map(f => (
          <button key={f.value} onClick={() => setTrackFilter(f.value)}
            className={`whitespace-nowrap rounded-[10px] border px-3.5 py-1.75 text-[12.5px] font-bold transition-colors ${trackFilter === f.value ? "border-primary bg-primary text-white" : "border-border bg-card text-text-muted hover:border-primary hover:text-primary"}`}>
            {f.label}
          </button>
        ))}
      </section>

      {/* الملفات */}
      {files.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-text-muted">
          لا توجد ملفات مطابقة
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((file, i) => {
            const info   = TYPE_INFO[file.type];
            const locked = file.accessType === "paid" && !hasSub;
            return (
              <div key={file.id} className={`fade-up delay-${(i % 4) + 1} relative flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.75 hover:shadow-lg`}>
                {file.isNew && (
                  <div className="absolute left-3.5 top-3.5 rounded-lg bg-accent-red px-2.5 py-1 text-[10.5px] font-extrabold text-white">جديد</div>
                )}
                <div className="flex h-14 w-14 items-center justify-center rounded-[14px]" style={{ background: `${info.color}1A`, color: info.color }}>
                  {info.icon}
                </div>
                <div>
                  <div className="text-[14.5px] font-extrabold leading-tight">{file.title}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] font-semibold">
                    <span className="rounded-full px-2.5 py-0.5 text-white text-[10.5px] font-bold" style={{ background: file.trackColor }}>
                      {file.trackName}
                    </span>
                    <span className="text-text-muted">{file.sizeLabel}</span>
                    <span className="text-text-muted">·</span>
                    <span className="text-text-muted">{file.dateLabel}</span>
                  </div>
                </div>
                {locked ? (
                  <button onClick={() => showToast(`هذا الملف مدفوع (${file.price} ر.س) — اشترك للوصول`, "warning")}
                    className="flex h-10.5 items-center justify-center gap-2 rounded-[10px] bg-accent-amber-light text-[13px] font-bold text-accent-amber transition-colors hover:bg-accent-amber hover:text-white">
                    <IconLock size={15} /> مدفوع — {file.price} ر.س
                  </button>
                ) : (
                  <div className="flex gap-2.5">
                    <button onClick={() => showToast("جاري فتح الملف...", "success")}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-border bg-card h-10.5 text-[13px] font-bold text-text transition-colors hover:border-primary hover:text-primary">
                      <IconEye size={15} /> عرض
                    </button>
                    <button onClick={() => showToast("بدأ التحميل...", "success")}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-primary h-10.5 text-[13px] font-bold text-white transition-colors hover:bg-primary-dark">
                      <IconDownload size={15} /> تحميل
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </>
  );
}

