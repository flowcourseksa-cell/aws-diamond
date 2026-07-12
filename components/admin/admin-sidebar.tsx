"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconRocket, IconLayoutDashboard, IconUsers, IconUpload,
  IconClipboardText, IconCurrencyDollar, IconArrowRight,
  IconLogout2, IconBrain, IconBook, IconBook2, IconFolder, IconBrandWhatsapp,
  IconSchool, IconBell, IconBellRinging, IconSettings, IconKey, IconDeviceDesktopAnalytics
} from "@tabler/icons-react";

type NavItem = { href: string; label: string; icon: React.ReactNode };

const NAV_GROUPS = [
  {
    label: "الإدارة",
    items: [
      { href: "/admin-khaled-ksa-aws-2026-org",          label: "الرئيسية",           icon: <IconLayoutDashboard size={19} /> },
      { href: "/admin-khaled-ksa-aws-2026-org/courses",   label: "الدورات التعليمية",  icon: <IconSchool size={19} /> },
      { href: "/admin-khaled-ksa-aws-2026-org/simulators", label: "إدارة المحاكيات", icon: <IconDeviceDesktopAnalytics size={19} /> },
      { href: "/admin-khaled-ksa-aws-2026-org/tracks",   label: "المسارات والأقسام",  icon: <IconBrain size={19} /> },
      { href: "/admin-khaled-ksa-aws-2026-org/lessons",  label: "رفع الدروس",          icon: <IconBook size={19} /> },
      { href: "/admin-khaled-ksa-aws-2026-org/exams",    label: "إنشاء الاختبارات",   icon: <IconClipboardText size={19} /> },
      { href: "/admin-khaled-ksa-aws-2026-org/final-exams", label: "الاختبارات النهائية", icon: <IconClipboardText size={19} /> },
      { href: "/admin-khaled-ksa-aws-2026-org/library",  label: "إدارة المكتبة",       icon: <IconFolder size={19} /> },
      { href: "/admin-khaled-ksa-aws-2026-org/book", label: "الكتاب التفاعلي", icon: <IconBook2 size={19} /> },
      { href: "/admin-khaled-ksa-aws-2026-org/certificates", label: "الشهادات الممنوحة", icon: <IconSchool size={19} /> },
    ] as NavItem[],
  },
  {
    label: "الطلاب",
    items: [
      { href: "/admin-khaled-ksa-aws-2026-org/activations", label: "إشعارات التفعيل", icon: <IconBell size={19} /> },
      { href: "/admin-khaled-ksa-aws-2026-org/students",   label: "إدارة الطلاب",      icon: <IconUsers size={19} /> },
      { href: "/admin-khaled-ksa-aws-2026-org/notifications", label: "إشعارات الطلاب", icon: <IconBellRinging size={19} /> },
      { href: "/admin-khaled-ksa-aws-2026-org/parent-notifications",   label: "إشعارات ولي الأمر",  icon: <IconBrandWhatsapp size={19} /> },
      { href: "/admin-khaled-ksa-aws-2026-org/pricing",    label: "التسعير والكودات",   icon: <IconCurrencyDollar size={19} /> },
    ] as NavItem[],
  },
];

export function AdminSidebar({ open, onClose, adminLevel = "super" }: { open: boolean; onClose: () => void; adminLevel?: string }) {
  const pathname = usePathname();

  const filteredGroups = NAV_GROUPS.map(group => {
    if (adminLevel === "content" && group.label === "الطلاب") return null;
    return {
      ...group,
      items: group.items.filter(item => {
        if (adminLevel === "content") {
          if (item.href === "/admin-khaled-ksa-aws-2026-org/certificates") return false;
        }
        return true;
      })
    };
  }).filter(Boolean) as typeof NAV_GROUPS;

  if (adminLevel === "super") {
    filteredGroups.push({
      label: "الإعدادات",
      items: [
        { href: "/admin-khaled-ksa-aws-2026-org/platform-settings", label: "الإعدادات الشاملة", icon: <IconSettings size={19} /> },
        { href: "/admin-khaled-ksa-aws-2026-org/settings", label: "إدارة الصلاحيات", icon: <IconKey size={19} /> }
      ]
    });
  } else {
    filteredGroups.push({
      label: "الإعدادات",
      items: [
        { href: "/admin-khaled-ksa-aws-2026-org/platform-settings", label: "الإعدادات الشاملة", icon: <IconSettings size={19} /> },
      ]
    });
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-39 bg-black/35 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed right-0 top-0 z-40 flex h-screen w-[240px] flex-shrink-0 flex-col bg-sidebar px-3.5 py-5 transition-all duration-300 ease-in-out lg:sticky ${
        open
          ? "translate-x-0 shadow-[-10px_0_30px_rgba(0,0,0,0.2)] lg:shadow-none lg:mr-0"
          : "translate-x-full lg:translate-x-0 lg:-mr-[240px] lg:opacity-0 lg:invisible lg:pointer-events-none"
      }`}>

        {/* الشعار */}
        <div className="flex items-center gap-3 px-2.5 pb-6 pt-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#f97316] to-[#ea580c] shadow-md shadow-orange-500/20 text-white">
            <IconSchool size={22} stroke={2.5} />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-lg font-black leading-none text-white tracking-tight">الأوس الماسية</span>
            <span className="text-[10px] text-[#f97316] font-bold leading-none mt-1">لوحة التحكم</span>
          </div>
        </div>

        {/* التنقل */}
        <div className="flex-1 flex flex-col gap-5 overflow-y-auto">
          {filteredGroups.map(group => (
            <div key={group.label}>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-white/35 px-2.5 pb-2">
                {group.label}
              </div>
              <nav className="flex flex-col gap-[3px]">
                {group.items.map(item => {
                  const active = pathname === item.href ||
                    (item.href !== "/admin-khaled-ksa-aws-2026-org" && pathname.startsWith(item.href));
                  return (
                    <Link key={item.href} href={item.href}
                      className={`flex items-center gap-3 rounded-[10px] px-3 py-[11px] text-sm font-semibold transition-colors duration-200 ${
                        active
                          ? "bg-accent-amber text-white"
                          : "text-white/65 hover:bg-white/7 hover:text-white"
                      }`}>
                      {item.icon}<span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* قسم الطالب */}
        <div className="border-t border-white/8 pt-3">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-[10px] px-3 py-[10px] text-sm font-semibold text-white/55 transition-colors hover:bg-white/7 hover:text-white">
            <IconArrowRight size={19} /> عرض داشبورد الطالب
          </Link>
        </div>

        {/* المستخدم */}
        <div className="border-t border-white/8 pt-3.5">
          <div className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 hover:bg-white/7">
            <div className="flex h-9.5 w-9.5 flex-shrink-0 items-center justify-center rounded-[10px] bg-accent-amber text-sm font-bold text-white">م.ن</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-bold text-white">مدير المنصة</div>
              <div className="text-[11.5px] text-white/45">Center Admin</div>
            </div>
            <Link href="/login" title="خروج" className="text-white/50 hover:text-accent-red">
              <IconLogout2 size={19} />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
