"use client";

import React, { useState, useRef, useEffect } from "react";
import { IconUser, IconLogout, IconCopy, IconCheck, IconSettings } from "@tabler/icons-react";
import { useAuth } from "@/hooks/use-auth";
import { LogoutConfirmModal } from "@/components/ui/logout-confirm-modal";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function ProfileDropdown() {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  
  const [stats, setStats] = useState({ courses: 0, progress: 0 });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && user) {
      const fetchStats = async () => {
        const supabase = createClient();
        const { count } = await supabase
          .from("enrollments")
          .select("*", { count: "exact", head: true })
          .eq("student_id", user.id);
        
        // Mock progress for now based on courses count
        const progress = count ? Math.min(count * 15, 100) : 0;
        setStats({ courses: count || 0, progress });
      };
      fetchStats();
    }
  }, [isOpen, user]);

  if (!user || !profile) {
    return (
      <Link href="/login" className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors text-indigo-600">
        <IconUser stroke={1.5} size={20} />
      </Link>
    );
  }

  const studentCode = `TKH-${user.id.split('-')[0].toUpperCase()}`;

  const copyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(studentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center transition-colors text-indigo-600 font-bold border-2 border-white shadow-sm"
      >
        {profile.full_name[0]}
      </button>

      {isOpen && (
        <div className="absolute top-14 left-0 md:right-0 md:left-auto w-80 bg-white/90 backdrop-blur-xl border border-slate-100 shadow-2xl rounded-3xl p-5 z-50 animate-fade-in-up" dir="rtl">
          {/* User Info */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/30">
              {profile.full_name[0]}
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-lg leading-tight">{profile.full_name}</h3>
              <p className="text-slate-500 text-sm font-semibold">طالب ماسي</p>
            </div>
          </div>

          {/* ID Box */}
          <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 relative group cursor-pointer hover:bg-slate-100 transition-colors" onClick={copyId}>
            <p className="text-xs font-bold text-slate-400 mb-1">الرقم التعريفي (ID)</p>
            <p className="font-mono font-black text-indigo-600 text-lg tracking-wider" dir="ltr">{studentCode}</p>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors">
              {copied ? <IconCheck size={20} className="text-emerald-500" /> : <IconCopy size={20} />}
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-bold text-slate-600">الدورات المشترك بها: {stats.courses}</span>
              <span className="text-xs font-black text-indigo-600">{stats.progress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${stats.progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2 font-semibold">استمر في التعلم لزيادة تقدمك!</p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 mt-2">
            <Link 
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 py-3 text-sm font-bold text-slate-600 transition-colors"
            >
              <IconSettings size={18} />
              الإعدادات
            </Link>
            <button 
              onClick={() => {
                setIsOpen(false);
                setShowLogout(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 py-3 text-sm font-bold transition-colors"
            >
              <IconLogout size={18} />
              تسجيل الخروج
            </button>
          </div>
        </div>
      )}

      {showLogout && <LogoutConfirmModal open={showLogout} onClose={() => setShowLogout(false)} />}
    </div>
  );
}
