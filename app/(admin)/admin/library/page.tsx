"use client";

import { useState } from "react";
import {
  IconPlus, IconEdit, IconTrash, IconCheck, IconX,
  IconFolder, IconFileText, IconVideo, IconPhoto, IconNotes,
  IconLock, IconFilter, IconDownload,
} from "@tabler/icons-react";
import { usePlatformStore, type LibraryFile } from "@/lib/store";

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white" style={{ background: color }}>
      {label}
    </span>
  );
}

function TypeIcon({ type }: { type: LibraryFile["type"] }) {
  switch (type) {
    case "pdf": return <IconFileText size={18} className="text-rose-500" />;
    case "video": return <IconVideo size={18} className="text-indigo-500" />;
    case "image": return <IconPhoto size={18} className="text-amber-500" />;
    case "summary": return <IconNotes size={18} className="text-emerald-500" />;
  }
}

// ── Component ─────────────────────────────────────────────────
export default function AdminLibraryPage() {
  const [isMounted, setIsMounted] = useState(false);
  const files = usePlatformStore(s => s.files);
  const setFiles = usePlatformStore(s => s.setFiles);
  const tracks = usePlatformStore(s => s.tracks);

  useEffect(() => setIsMounted(true), []);
  
  const [filterTrack, setFilterTrack] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  
  const [showForm, setShowForm] = useState(false);
  const [editingFile, setEditingFile] = useState<LibraryFile | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  // ── Form State ─────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [type, setType] = useState<LibraryFile["type"]>("pdf");
  const [trackId, setTrackId] = useState("");
  const [url, setUrl] = useState("");
  const [sizeLabel, setSizeLabel] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState(0);
  const [uploadMode, setUploadMode] = useState<"url" | "file">("url");

  function openAdd() {
    setEditingFile(null);
    setTitle(""); setType("pdf"); setTrackId(tracks[0]?.id ?? "");
    setUrl(""); setSizeLabel("1 MB"); setIsFree(true); setPrice(0);
    setUploadMode("url");
    setShowForm(true);
  }

  function openEdit(file: LibraryFile) {
    setEditingFile(file);
    setTitle(file.title); setType(file.type); setTrackId(file.trackId);
    setUrl(file.url); setSizeLabel(file.sizeLabel); setIsFree(file.accessType === "free");
    setPrice(file.price);
    setUploadMode(file.url.startsWith("تم رفع") ? "file" : "url");
    setShowForm(true);
  }

  function saveFile() {
    const newFile: LibraryFile = {
      id: editingFile?.id ?? `file-${Date.now()}`,
      title, type, trackId, url, sizeLabel,
      dateLabel: editingFile?.dateLabel ?? new Date().toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }),
      accessType: isFree ? "free" : "paid", price: isFree ? 0 : price,
    };
    if (editingFile) {
      setFiles(prev => prev.map(f => f.id === editingFile.id ? newFile : f));
    } else {
      setFiles(prev => [...prev, newFile]);
    }
    setShowForm(false);
  }

  function deleteFile(id: string) {
    setFiles(prev => prev.filter(f => f.id !== id));
    setConfirmDel(null);
  }

  const filteredFiles = files.filter(f => {
    if (filterTrack !== "all" && f.trackId !== filterTrack) return false;
    if (filterType !== "all" && f.type !== filterType) return false;
    return true;
  });

  if (!isMounted) return <div className="p-8 text-center font-bold text-text-muted">جاري التحميل...</div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="fade-up rounded-2xl bg-sidebar px-7 py-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <IconFolder size={26} />
              <h2 className="text-xl font-black">إدارة المكتبة والملفات</h2>
            </div>
            <p className="text-white/55 text-sm">ارفع الملخصات والخرائط الذهنية وملفات الـ PDF لكل مسار.</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 rounded-xl bg-accent-amber px-5 py-3 text-sm font-bold text-white hover:bg-accent-amber/90 transition-colors">
            <IconPlus size={17} /> إضافة ملف
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 fade-up">
        <IconFilter size={20} className="text-text-muted" />
        <select value={filterTrack} onChange={e => setFilterTrack(e.target.value)}
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary">
          <option value="all">جميع المسارات</option>
          {tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary">
          <option value="all">جميع الأنواع</option>
          <option value="pdf">PDF</option>
          <option value="video">فيديو</option>
          <option value="image">صورة</option>
          <option value="summary">ملخص</option>
        </select>
      </div>

      {/* Table */}
      <div className="fade-up rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-border bg-bg/60">
                {["العنوان", "المسار", "النوع", "الحجم", "التاريخ", "الوصول", "إجراءات"].map(h => (
                  <th key={h} className="px-4 py-3.5 text-right text-xs font-black text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map(file => {
                const track = tracks.find(t => t.id === file.trackId);
                return (
                  <tr key={file.id} className="border-b border-border last:border-none hover:bg-bg/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 font-extrabold text-text">
                        <TypeIcon type={file.type} />
                        {file.title}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {track && <Badge label={`${track.icon} ${track.name}`} color={track.color} />}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-text-muted uppercase">{file.type}</td>
                    <td className="px-4 py-3.5 font-semibold text-text-muted">{file.sizeLabel}</td>
                    <td className="px-4 py-3.5 font-semibold text-text-muted">{file.dateLabel}</td>
                    <td className="px-4 py-3.5">
                      {file.accessType === "free"
                        ? <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs"><IconDownload size={12} /> مجاني</span>
                        : <span className="flex items-center gap-1 text-amber-600 font-bold text-xs"><IconLock size={12} /> {file.price} ر.س</span>
                      }
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(file)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted hover:border-primary hover:text-primary transition-colors">
                          <IconEdit size={13} />
                        </button>
                        {confirmDel === file.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => deleteFile(file.id)}
                              className="flex h-7 items-center gap-1 rounded-lg bg-accent-red px-2 text-xs font-bold text-white">
                              <IconCheck size={11} /> نعم
                            </button>
                            <button onClick={() => setConfirmDel(null)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted">
                              <IconX size={11} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDel(file.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted hover:border-accent-red hover:text-accent-red transition-colors">
                            <IconTrash size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredFiles.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-text-muted font-bold">لا توجد ملفات مطابقة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black">{editingFile ? "تعديل الملف" : "رفع ملف جديد"}</h3>
              <button onClick={() => setShowForm(false)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-text-muted hover:text-text"><IconX size={16} /></button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-black text-text-muted mb-1.5 block">عنوان الملف</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: ملخص الجبر..."
                  className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-text-muted mb-1.5 block">نوع الملف</label>
                  <select value={type} onChange={e => setType(e.target.value as LibraryFile["type"])}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary">
                    <option value="pdf">PDF</option>
                    <option value="video">فيديو</option>
                    <option value="image">صورة</option>
                    <option value="summary">ملخص</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-text-muted mb-1.5 block">المسار</label>
                  <select value={trackId} onChange={e => setTrackId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary">
                    {tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-text-muted mb-1.5 block">مصدر الملف</label>
                <div className="flex gap-2 mb-2">
                  <button onClick={() => setUploadMode("url")} className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition-colors ${uploadMode === "url" ? "border-primary bg-primary text-white" : "border-border text-text-muted"}`}>رابط خارجي</button>
                  <button onClick={() => setUploadMode("file")} className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition-colors ${uploadMode === "file" ? "border-primary bg-primary text-white" : "border-border text-text-muted"}`}>رفع من الجهاز</button>
                </div>
                {uploadMode === "url" ? (
                  <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..."
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary text-left" dir="ltr" />
                ) : (
                  <div className="relative">
                    <input type="file" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUrl(`تم رفع: ${file.name}`);
                        setSizeLabel(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
                      }
                    }} className="w-full text-sm text-text-muted file:mr-0 file:ml-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-black text-text-muted mb-1.5 block">الحجم</label>
                  <input value={sizeLabel} onChange={e => setSizeLabel(e.target.value)} placeholder="مثال: 2 MB"
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-bold outline-none focus:border-primary text-center" dir="ltr" />
                </div>
                <div>
                  <label className="text-xs font-black text-text-muted mb-1.5 block">النوع</label>
                  <div className="flex gap-2 mt-0.5">
                    {(["free", "paid"] as const).map(t => (
                      <button key={t} onClick={() => setIsFree(t === "free")}
                        className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-colors ${(isFree ? t === "free" : t === "paid") ? "border-primary bg-primary text-white" : "border-border text-text-muted"}`}>
                        {t === "free" ? "مجاني" : "مدفوع"}
                      </button>
                    ))}
                  </div>
                </div>
                {!isFree && (
                  <div>
                    <label className="text-xs font-black text-text-muted mb-1.5 block">السعر (ر.س)</label>
                    <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} min={0}
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-bold outline-none focus:border-primary text-center" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
                <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-sm font-bold text-text-muted hover:text-text transition-colors">
                  إلغاء
                </button>
                <button onClick={saveFile} disabled={!title.trim()}
                  className="flex items-center gap-2 rounded-xl bg-accent-amber px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-amber/90 disabled:opacity-50">
                  <IconCheck size={16} /> حفظ الملف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
