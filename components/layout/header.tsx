"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import { IconMenu2, IconSearch, IconMoon, IconSun, IconBook2, IconFolder, IconClipboardText, IconX, IconSchool, IconSparkles, IconChartBar, IconChecks, IconCalendarTime, IconAward, IconTrophy, IconBrain } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import { NotificationsDropdown } from "./notifications-dropdown";
import { ProfileDropdown } from "./profile-dropdown";
import Link from "next/link";
import { usePlatformStore } from "@/lib/store";

export function Header({ onMenuClick, sidebarOpen }: { onMenuClick: () => void; sidebarOpen?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { courses } = usePlatformStore();

  // ── Search items: Courses + Main sections only ──
  // All courses link to /dashboard to avoid 404 on /courses/[id]
  const searchItems = [
    ...courses.map(c => ({
      id: `course-${c.id}`,
      title: c.title || "",
      type: "دورة",
      color: "bg-indigo-100 text-indigo-600",
      icon: <IconSchool size={16} />,
      href: `/dashboard?courseId=${c.id}`,
    })),
    { id: "nav-tracks",    title: "الأقسام والمهارات",  type: "قسم",   color: "bg-violet-100 text-violet-600",   icon: <IconBrain size={16} />,        href: "/tracks" },
    { id: "nav-exams",     title: "الاختبارات",           type: "قسم",   color: "bg-blue-100 text-blue-600",      icon: <IconChecks size={16} />,       href: "/exams" },
    { id: "nav-final",    title: "الاختبار النهائي",      type: "قسم",   color: "bg-amber-100 text-amber-600",    icon: <IconTrophy size={16} />,       href: "/final-exam" },
    { id: "nav-book",     title: "الكتاب التفاعلي",       type: "قسم",   color: "bg-emerald-100 text-emerald-600",icon: <IconBook2 size={16} />,        href: "/book" },
    { id: "nav-library",  title: "المكتبة والملفات",      type: "قسم",   color: "bg-cyan-100 text-cyan-600",      icon: <IconFolder size={16} />,       href: "/library" },
    { id: "nav-plan",     title: "خطة المذاكرة",         type: "قسم",   color: "bg-pink-100 text-pink-600",      icon: <IconCalendarTime size={16} />, href: "/study-plan" },
    { id: "nav-perf",     title: "تحليل الأداء",          type: "قسم",   color: "bg-orange-100 text-orange-600",  icon: <IconChartBar size={16} />,     href: "/performance" },
    { id: "nav-certs",    title: "شهاداتي",               type: "قسم",   color: "bg-yellow-100 text-yellow-600",  icon: <IconAward size={16} />,        href: "/certificates" },
    { id: "nav-simulator",title: "المحاكي",               type: "محاكي", color: "bg-rose-100 text-rose-600",      icon: <IconSparkles size={16} />,     href: "/simulator" },
  ];

  const filteredItems = searchQuery.trim().length > 0
    ? searchItems.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.includes(searchQuery)
      )
    : [];


  useEffect(() => {
    setMounted(true);
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from("profiles").select("full_name").eq("id", session.user.id).single();
        if (data) setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-30 flex h-(--header-h) items-center justify-between gap-4 border-b border-border bg-card px-6">
      {/* Menu / Close toggle — visible on all sizes */}
      <button
        onClick={onMenuClick}
        className="flex h-9.5 w-9.5 items-center justify-center rounded-[10px] border border-border bg-card text-text transition-colors hover:border-primary hover:text-primary"
        aria-label={sidebarOpen ? "إغلاق القائمة" : "فتح القائمة"}
      >
        {sidebarOpen ? <IconX size={19} /> : <IconMenu2 size={19} />}
      </button>

      <div className="relative hidden max-w-95 flex-1 sm:block" ref={searchRef}>
        <IconSearch
          size={17}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsSearchOpen(true);
          }}
          onFocus={() => setIsSearchOpen(true)}
          placeholder="ابحث عن دورة، قسم، محاكي..."
          className="h-9.5 w-full rounded-[10px] border border-border bg-bg pr-10 pl-4 text-[13.5px] text-text outline-none transition-colors duration-200 focus:border-primary"
        />
        
        {isSearchOpen && searchQuery.trim().length > 0 && (
          <div className="absolute top-full right-0 mt-2 w-full bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {filteredItems.length > 0 ? (
              <div className="max-h-64 overflow-y-auto">
                <div className="p-2 px-3 text-xs font-bold text-text-muted bg-bg/50">نتائج البحث ({filteredItems.length})</div>
                {filteredItems.map(item => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-bg transition-colors border-t border-border/50 group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${item.color}`}>
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-text">{item.title}</div>
                      <div className="text-xs text-text-muted mt-0.5">{item.type}</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-text-muted">
                <IconSearch size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-bold text-text">لا توجد نتائج مطابقة</p>
                <p className="text-xs mt-1">حاول البحث بكلمات مختلفة</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          title="الوضع الليلي"
          className="flex h-9.5 w-9.5 items-center justify-center rounded-[10px] border border-border bg-card text-text transition-transform duration-200 hover:-translate-y-0.5"
          aria-label="تبديل الوضع الليلي"
        >
          {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
        </button>

        <NotificationsDropdown />

        <ProfileDropdown />
      </div>
    </header>
  );
}