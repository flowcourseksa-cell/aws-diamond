"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconVideo,
  IconClipboardText,
  IconCalendarTime,
} from "@tabler/icons-react";

const ITEMS = [
  { href: "/dashboard", label: "الرئيسية", icon: IconLayoutDashboard },
  { href: "/lessons", label: "الدروس", icon: IconVideo },
  { href: "/exams", label: "اختبارات", icon: IconClipboardText },
  { href: "/study-plan", label: "خطتي", icon: IconCalendarTime },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-border bg-card py-2 md:hidden">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-[3px] px-2 py-1 text-[10.5px] font-bold transition-colors duration-200 ${
              active ? "text-primary" : "text-text-muted"
            }`}
          >
            <Icon size={21} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

