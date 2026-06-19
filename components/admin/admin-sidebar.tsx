"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconRocket, IconLayoutDashboard, IconUsers, IconUpload,
  IconClipboardText, IconCurrencyDollar, IconArrowRight,
  IconLogout2, IconBrain, IconBook, IconFolder, IconBrandWhatsapp,
  IconSchool,
} from "@tabler/icons-react";

type NavItem = { href: string; label: string; icon: React.ReactNode };

const NAV_GROUPS = [
  {
    label: "الإدارة",
    items: [
      { href: "/admin",          label: "الرئيسية",           icon: <IconLayoutDashboard size={19} /> },
      { href: "/admin/courses",   label: "الدورات التعليمية",  icon: <IconSchool size={19} /> },
      { href: "/admin/tracks",   label: "المسارات والأقسام",  icon: <IconBrain size={19} /> },
      { href: "/admin/exams",    label: "إنشاء الاختبارات",   icon: <IconClipboardText size={19} /> },
      { href: "/admin/lessons",  label: "رفع الدروس",          icon: <IconBook size={19} /> },
      { href: "/admin/library",  label: "إدارة المكتبة",       icon: <IconFolder size={19} /> },
    ] as NavItem[],
  },
  {
    label: "الطلاب",
    items: [
      { href: "/admin/students",   label: "إدارة الطلاب",      icon: <IconUsers size={19} /> },
      { href: "/admin/whatsapp",   label: "إشعارات الواتساب",  icon: <IconBrandWhatsapp size={19} /> },
      { href: "/admin/pricing",    label: "التسعير والكودات",   icon: <IconCurrencyDollar size={19} /> },
    ] as NavItem[],
  },
];

export function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-39 bg-black/35 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed right-0 top-0 z-40 flex h-screen w-[240px] flex-shrink-0 flex-col bg-sidebar px-3.5 py-5 transition-transform duration-250 lg:sticky lg:translate-x-0 ${open ? "translate-x-0 shadow-[-10px_0_30px_rgba(0,0,0,0.2)]" : "translate-x-full lg:translate-x-0"}`}>

        {/* الشعار */}
        <div className="flex items-center gap-2.5 px-2.5 pb-6 pt-2">
          <div className="flex h-9.5 w-9.5 items-center justify-center rounded-[10px] bg-accent-amber text-white">
            <IconRocket size={20} />
          </div>
          <div>
            <div className="text-sm font-black text-white">فلو</div>
            <div className="text-[10px] font-bold text-white/40">لوحة التحكم</div>
          </div>
        </div>

        {/* التنقل */}
        <div className="flex-1 flex flex-col gap-5 overflow-y-auto">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-white/35 px-2.5 pb-2">
                {group.label}
              </div>
              <nav className="flex flex-col gap-[3px]">
                {group.items.map(item => {
                  const active = pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));
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
              <div className="truncate text-[13.5px] font-bold text-white">مدير فلو</div>
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
