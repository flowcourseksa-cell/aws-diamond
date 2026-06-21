"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { IconMenu2, IconSearch, IconMoon, IconSun } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import { NotificationsDropdown } from "./notifications-dropdown";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);

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
      <button
        onClick={onMenuClick}
        className="flex h-9.5 w-9.5 items-center justify-center rounded-[10px] border border-border bg-card text-text lg:hidden"
        aria-label="فتح القائمة"
      >
        <IconMenu2 size={19} />
      </button>

      <div className="relative hidden max-w-95 flex-1 sm:block">
        <IconSearch
          size={17}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          type="text"
          placeholder="ابحث عن درس، اختبار، ملف..."
          className="h-9.5 w-full rounded-[10px] border border-border bg-bg pr-10 pl-4 text-[13.5px] text-text outline-none transition-colors duration-200 focus:border-primary"
        />
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

        <div className="flex h-9.5 w-9.5 items-center justify-center rounded-[10px] bg-primary text-sm font-bold text-white">
          {profile?.full_name ? profile.full_name.charAt(0) : "؟"}
        </div>
      </div>
    </header>
  );
}

