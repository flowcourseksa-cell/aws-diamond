"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { IconMenu2, IconMoon, IconSun, IconBell } from "@tabler/icons-react";
import Link from "next/link";
import { fetchPendingCount } from "@/lib/supabase/services/activations";

export function AdminHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const isDark = mounted && resolvedTheme === "dark";

  useEffect(() => {
    setMounted(true);
    fetchPendingCount().then(setPendingCount);
    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchPendingCount().then(setPendingCount);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-[58px] items-center justify-between gap-4 border-b border-border bg-card px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="flex h-9.5 w-9.5 items-center justify-center rounded-[10px] border border-border bg-card text-text lg:hidden">
          <IconMenu2 size={19} />
        </button>
        <div className="text-base font-extrabold text-text">لوحة تحكم المركز</div>
      </div>
      <div className="flex items-center gap-2.5">
        <button onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex h-9.5 w-9.5 items-center justify-center rounded-[10px] border border-border bg-card text-text hover:-translate-y-0.5 transition-transform">
          {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
        </button>
        <Link href="/admin-khaled-ksa-aws-2026-org/activations" className="relative flex h-9.5 w-9.5 items-center justify-center rounded-[10px] border border-border bg-card text-text hover:bg-bg transition-colors">
          <IconBell size={18} />
          {pendingCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-card bg-accent-red text-[10px] font-bold text-white">
              {pendingCount > 9 ? '+9' : pendingCount}
            </span>
          )}
        </Link>
        <div className="flex h-9.5 w-9.5 items-center justify-center rounded-[10px] bg-accent-amber text-sm font-bold text-white">م.ن</div>
      </div>
    </header>
  );
}

