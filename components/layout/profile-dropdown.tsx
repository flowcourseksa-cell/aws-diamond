"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { IconUser, IconLogout, IconCopy, IconCheck, IconSettings, IconX, IconArrowRight, IconLock, IconEye, IconEyeOff, IconAward, IconBook2, IconFlame } from "@tabler/icons-react";
import { useAuth } from "@/hooks/use-auth";
import { LogoutConfirmModal } from "@/components/ui/logout-confirm-modal";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function ProfileDropdown({ customTrigger, loginClassName }: { customTrigger?: React.ReactNode, loginClassName?: string } = {}) {
  const { user, profile, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<'profile' | 'settings'>('profile');
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [stats, setStats] = useState({ courses: 0, progress: 0 });

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView('profile');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setMessage('');
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user) {
      const fetchStats = async () => {
        const supabase = createClient();
        const { count } = await supabase
          .from("enrollments")
          .select("*", { count: "exact", head: true })
          .eq("student_id", user.id);
        
        const progress = count ? Math.min(count * 15, 100) : 0;
        setStats({ courses: count || 0, progress });
      };
      fetchStats();
    }
  }, [isOpen, user]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      setMessage("يرجى إدخال كلمة المرور الحالية");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setMessage("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("كلمتا المرور غير متطابقتين");
      return;
    }
    
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    
    if (user?.email) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });
      
      if (signInError) {
        setMessage("كلمة المرور القديمة غير صحيحة");
        setLoading(false);
        return;
      }
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage("حدث خطأ، حاول مرة أخرى");
    } else {
      setMessage("تم التغيير بنجاح! ✅");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  };

  if (!user && !isLoading) {
    return (
      <Link href="/login" className={loginClassName || "w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors text-indigo-600"}>
        <IconUser stroke={1.5} size={20} />
      </Link>
    );
  }

  if (!mounted) return null;

  const displayProfile = isLoading 
    ? { full_name: "جاري التحميل...", role: "student", phone: "" } 
    : (profile || { full_name: "طالب جديد", role: "student", phone: "" });
    
  const studentCode = displayProfile.phone ? displayProfile.phone : (user ? `TKH-${user.id.split('-')[0].toUpperCase()}` : "");

  const copyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(studentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isMatching = newPassword && confirmPassword && newPassword === confirmPassword;
  const isTyping = confirmPassword.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {customTrigger ? (
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
          {customTrigger}
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center transition-colors text-indigo-600 font-bold border-2 border-white shadow-sm"
        >
          {displayProfile.full_name[0]}
        </button>
      )}

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" dir="rtl" onClick={() => setIsOpen(false)}>
          <div className="bg-white backdrop-blur-xl border border-slate-100 shadow-2xl rounded-3xl p-6 w-full max-w-sm relative animate-in slide-in-from-bottom-8 zoom-in-95 duration-300 ease-out overflow-hidden" onClick={(e) => e.stopPropagation()}>
            
            {view === 'profile' ? (
              <>
                {/* Premium Header Profile Area */}
                <div className="relative -mx-6 -mt-6 p-6 mb-5 overflow-hidden rounded-t-3xl border-b border-slate-50">
                  {/* Background Accents */}
                  <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-indigo-50/80 to-white pointer-events-none" />
                  
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-100 hover:bg-rose-50 hover:border-rose-100 text-slate-400 hover:text-rose-600 transition-all z-50 shadow-sm"
                  >
                    <IconX size={16} stroke={2.5} />
                  </button>

                  <div className="relative z-10 flex flex-col items-center text-center mt-2">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-500/30 mb-3 ring-4 ring-white relative">
                      {displayProfile.full_name[0]}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <IconCheck size={14} className="text-emerald-500" stroke={3} />
                      </div>
                    </div>
                    <h3 className="font-black text-slate-800 text-xl leading-tight mb-1.5">{displayProfile.full_name}</h3>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border mt-1 ${
                      displayProfile.role === 'admin' 
                        ? 'bg-rose-50 border-rose-100' 
                        : 'bg-indigo-50 border-indigo-100'
                    }`}>
                      {displayProfile.role === 'admin' ? (
                        <IconAward size={14} className="text-rose-500" />
                      ) : (
                        <IconUser size={14} className="text-indigo-500" />
                      )}
                      <span className={`text-xs font-bold tracking-wide ${
                        displayProfile.role === 'admin' ? 'text-rose-600' : 'text-indigo-600'
                      }`}>
                        {displayProfile.role === 'admin' ? 'إدارة المنصة' : 'طالب'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 mb-4 border border-slate-100 hover:border-indigo-200 hover:shadow-md shadow-sm transition-all flex items-center justify-between cursor-pointer group" onClick={copyId}>
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">الرقم التعريفي (ID)</p>
                    <p className="font-mono font-black text-slate-700 text-base md:text-lg tracking-wider group-hover:text-indigo-600 transition-colors" dir="ltr">{studentCode}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 border border-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 group-hover:border-indigo-100'}`}>
                    {copied ? <IconCheck size={20} stroke={2.5} /> : <IconCopy size={20} stroke={2} />}
                  </div>
                </div>

                <div className="mb-5 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-end mb-3 relative z-10">
                    <span className="text-sm font-bold text-slate-600 flex items-center gap-1.5">
                      <IconBook2 size={16} className="text-indigo-500" />
                      الدورات المشترك بها: <span className="font-black text-indigo-600">{stats.courses}</span>
                    </span>
                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg shadow-sm">{stats.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative z-10 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out relative" 
                      style={{ width: `${stats.progress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2.5 font-semibold relative z-10 flex items-center gap-1">
                    <IconFlame size={13} className="text-orange-500" />
                    استمر في التعلم لزيادة تقدمك!
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button 
                    onClick={() => {
                      setView('settings');
                      setMessage('');
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 py-3 text-sm font-bold text-slate-600 transition-all active:scale-95 shadow-sm hover:shadow"
                  >
                    <IconSettings size={18} stroke={2} />
                    الإعدادات
                  </button>
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      setShowLogout(true);
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 py-3 text-sm font-bold transition-all active:scale-95 shadow-sm hover:shadow"
                  >
                    <IconLogout size={18} stroke={2} />
                    تسجيل الخروج
                  </button>
                </div>
              </>
            ) : (
              <div className="animate-in slide-in-from-left-4 duration-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                    <IconSettings className="text-indigo-500" size={24} />
                    الإعدادات
                  </h3>
                  <button 
                    onClick={() => setView('profile')}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                  >
                    <IconArrowRight size={16} />
                  </button>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">كلمة المرور الحالية</label>
                    <div className="relative">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <IconLock size={16} />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="أدخل كلمة المرور الحالية"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-10 pl-10 text-slate-800 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                        dir="ltr"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                      >
                        {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 mt-3">كلمة المرور الجديدة</label>
                    <div className="relative">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <IconLock size={16} />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="كلمة المرور الجديدة"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-10 pl-10 text-slate-800 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                        dir="ltr"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                      >
                        {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="relative">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <IconLock size={16} />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="تأكيد كلمة المرور الجديدة"
                        className={`w-full bg-slate-50 border rounded-xl py-2.5 pr-10 pl-10 text-slate-800 text-sm font-semibold outline-none transition-all ${isTyping ? (isMatching ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-200' : 'border-rose-500 focus:ring-2 focus:ring-rose-200') : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'}`}
                        dir="ltr"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                      >
                        {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                      </button>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${isMatching ? 'bg-emerald-500 w-full' : isTyping ? 'bg-rose-500 w-full' : 'w-0'}`}
                      />
                    </div>
                    {isTyping && (
                      <p className={`text-[10px] font-bold mt-1 ${isMatching ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isMatching ? 'كلمتا المرور متطابقتان' : 'كلمتا المرور غير متطابقتين'}
                      </p>
                    )}
                  </div>

                  {message && (
                    <p className={`text-xs font-bold mt-2 text-center ${message.includes('بنجاح') ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {message}
                    </p>
                  )}
                  
                  <button 
                    type="submit"
                    disabled={loading || !oldPassword || !newPassword || !confirmPassword || !isMatching}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl py-3 text-sm font-bold transition-colors mt-2"
                  >
                    {loading ? "جاري الحفظ..." : "حفظ كلمة المرور"}
                  </button>
                </form>
              </div>
            )}
            
          </div>
        </div>
      , document.body)}

      {showLogout && <LogoutConfirmModal open={showLogout} onClose={() => setShowLogout(false)} expectedId={studentCode} />}
    </div>
  );
}