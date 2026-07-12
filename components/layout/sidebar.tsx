// @ts-nocheck
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconSchool,
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
  IconHome,
  IconTrophy,
  IconAward,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { LogoutConfirmModal } from "@/components/ui/logout-confirm-modal";
import { useAuth } from "@/hooks/use-auth";
import { usePlatformStore } from "@/lib/store";

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
  { href: "/final-exam", label: "الاختبار النهائي", icon: <IconTrophy size={19} /> },
  { href: "/library", label: "المكتبة",            icon: <IconFolder size={19} /> },
  { href: "/certificates", label: "شهاداتي",       icon: <IconAward size={19} /> },
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
  const { user, profile } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const { enrolledCourses, enrolledCourseId, setEnrolledCourseId } = usePlatformStore();

  const handleCourseSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setEnrolledCourseId(newId);
    localStorage.setItem('active_course_id', newId);
    // Always redirect to dashboard when switching courses to avoid being stuck on a URL
    // belonging to the previous course (like /lessons/123 or /final-exam/old_id)
    window.location.href = "/dashboard";
  };

  const displayProfile = profile || { full_name: "طالب جديد", role: "student", phone: "" };
  const expectedId = displayProfile.phone ? displayProfile.phone : (user ? `TKH-${user.id.split('-')[0].toUpperCase()}` : "");

  return (
    <>
      <LogoutConfirmModal open={showLogout} onClose={() => setShowLogout(false)} expectedId={expectedId} />
      {/* الخلفية الشفافة (موبايل/تابلت) */}
      {open && (
        <div
          className="fixed inset-0 z-39 bg-black/35 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-40 flex h-screen w-[260px] flex-shrink-0 flex-col bg-sidebar px-3.5 py-5 text-white transition-all duration-300 ease-in-out lg:sticky ${
          open 
            ? "translate-x-0 shadow-[-10px_0_30px_rgba(0,0,0,0.2)] lg:shadow-none lg:mr-0" 
            : "translate-x-full lg:translate-x-0 lg:-mr-[260px] lg:opacity-0 lg:invisible lg:pointer-events-none"
        }`}
      >
        {/* الشعار وزر الإغلاق */}
        <div className="flex items-center justify-between px-2.5 pb-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#f97316] to-[#ea580c] shadow-md shadow-orange-500/20 text-white">
              <IconSchool size={22} stroke={2.5} />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-lg font-black leading-none text-white tracking-tight">الأوس الماسية</span>
              <span className="text-[10px] text-[#f97316] font-bold leading-none mt-1">المنصة التعليمية</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors lg:hidden"
            aria-label="إغلاق القائمة"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* مبدل الكورسات */}
        {enrolledCourses.length > 0 && (
          <div className="px-2.5 pb-4">
            <select
              value={enrolledCourseId || ""}
              onChange={handleCourseSwitch}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none focus:border-primary cursor-pointer appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'left 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px' }}
            >
              {enrolledCourses.map(c => (
                <option key={c.id} value={c.id} className="text-black">{c.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* الرئيسية */}

        {/* الرئيسية */}
        <div className="px-2.5 pb-2 pt-3.5 text-[11px] font-bold uppercase tracking-wider text-white/35">
          الرئيسية
        </div>
        <nav className="flex flex-col gap-[3px]">
          {MAIN_ITEMS.map((item) => {
            const href = item.href === "/final-exam" && enrolledCourseId 
              ? `/final-exam/${enrolledCourseId}` 
              : item.href;
            return <NavLink key={item.href} item={{ ...item, href }} active={pathname.startsWith(item.href)} />
          })}
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

        {/* العودة للرئيسية */}
        <div className="mt-auto border-t border-white/8 pt-3.5">
          <Link 
            href="/"
            className="flex items-center justify-center gap-2.5 rounded-[10px] px-3 py-3 bg-white/5 hover:bg-white/10 text-white transition-colors duration-200 group"
          >
            <IconHome size={19} className="text-white/70 group-hover:text-white transition-colors" />
            <span className="text-[13.5px] font-bold">العودة للرئيسية</span>
          </Link>
        </div>
      </aside>
    </>
  );
}