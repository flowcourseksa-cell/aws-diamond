"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconRocket,
  IconLayoutDashboard,
  IconVideo,
  IconClipboardText,
  IconFolder,
  IconCalendarTime,
  IconChartLine,
  IconTelescope,
  IconStar,
  IconLogout2,
  IconBrain,
  IconBook2,
} from "@tabler/icons-react";
import { useState } from "react";
import { LogoutConfirmModal } from "@/components/ui/logout-confirm-modal";
import { useAuth } from "@/hooks/use-auth";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
};

const MAIN_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "لوحة التحكم",    icon: <IconLayoutDashboard size={19} /> },
  { href: "/tracks",   label: "الأقسام والمهارات",icon: <IconBrain size={19} /> },
  { href: "/lessons",  label: "الدروس",           icon: <IconVideo size={19} /> },
  { href: "/exams",   label: "الاختبارات",        icon: <IconClipboardText size={19} /> },
  { href: "/library", label: "المكتبة",            icon: <IconFolder size={19} /> },
];

const TOOLS_ITEMS: NavItem[] = [
  { href: "/study-plan", label: "خطة المذاكرة", icon: <IconCalendarTime size={19} /> },
  { href: "/performance", label: "تحليل الأداء", icon: <IconChartLine size={19} /> },
  { href: "/book", label: "الكتاب التفاعلي", icon: <IconBook2 size={19} /> },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-[10px] px-3 py-[11px] text-sm font-semibold transition-colors duration-200 ${
        active
          ? "bg-primary text-white"
          : "text-white/65 hover:bg-white/7 hover:text-white"
      }`}
    >
      {item.icon}
      <span>{item.label}</span>
      {item.badge && (
        <span
          className={`mr-auto min-w-5 rounded-full px-[7px] text-center text-[10.5px] font-bold ${
            active ? "bg-white/25 text-white" : "bg-accent-red text-white"
          }`}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const [showLogout, setShowLogout] = useState(false);

  return (
    <>
      <LogoutConfirmModal open={showLogout} onClose={() => setShowLogout(false)} />
      {/* الخلفية الشفافة (موبايل/تابلت) */}
      {open && (
        <div
          className="fixed inset-0 z-39 bg-black/35 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-40 flex h-screen w-(--sidebar-w) flex-shrink-0 flex-col bg-sidebar px-3.5 py-5 text-white transition-transform duration-250 ease-in-out lg:sticky lg:translate-x-0 ${
          open ? "translate-x-0 shadow-[-10px_0_30px_rgba(0,0,0,0.2)]" : "translate-x-full lg:translate-x-0"
        }`}
      >
        {/* الشعار */}
        <div className="flex items-center gap-2.5 px-2.5 pb-6 pt-2">
          <div className="flex h-9.5 w-9.5 items-center justify-center rounded-[10px] bg-primary text-[19px]">
            <IconRocket size={20} />
          </div>
          <div className="text-lg font-black">الأوس الماسية</div>
        </div>

        {/* الرئيسية */}
        <div className="px-2.5 pb-2 pt-3.5 text-[11px] font-bold uppercase tracking-wider text-white/35">
          الرئيسية
        </div>
        <nav className="flex flex-col gap-[3px]">
          {MAIN_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}
        </nav>

        {/* أدوات */}
        <div className="px-2.5 pb-2 pt-3.5 text-[11px] font-bold uppercase tracking-wider text-white/35">
          أدوات
        </div>
        <nav className="flex flex-col gap-[3px]">
          {TOOLS_ITEMS.map((item) => (
            <NavLink key={item.label} item={item} active={pathname === item.href} />
          ))}
        </nav>

        {/* معلومات المستخدم */}
        <div className="mt-auto border-t border-white/8 pt-3.5">
          <div className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 transition-colors duration-200 hover:bg-white/7">
            <Link href="/profile" className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity">
              <div className="flex h-9.5 w-9.5 flex-shrink-0 items-center justify-center rounded-[10px] bg-primary text-sm font-bold">
                {profile?.full_name ? profile.full_name[0] : "T"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-bold text-white">
                  {profile?.full_name || "جاري التحميل..."}
                </div>
                <div className="text-[11.5px] text-white/45">الملف الشخصي</div>
              </div>
            </Link>
            <button
              onClick={() => setShowLogout(true)}
              title="تسجيل الخروج"
              className="text-white/50 transition-colors duration-200 hover:text-accent-red cursor-pointer bg-transparent border-none p-0 flex-shrink-0"
            >
              <IconLogout2 size={19} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

