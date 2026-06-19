"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { IconMenu2, IconMoon, IconSun, IconBell } from "@tabler/icons-react";

export function AdminHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

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
        <button className="relative flex h-9.5 w-9.5 items-center justify-center rounded-[10px] border border-border bg-card text-text">
          <IconBell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-[1.5px] border-card bg-accent-red" />
        </button>
        <div className="flex h-9.5 w-9.5 items-center justify-center rounded-[10px] bg-accent-amber text-sm font-bold text-white">م.ن</div>
      </div>
    </header>
  );
}
