"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { IconSearch, IconUser, IconBell, IconBooks, IconStarFilled, IconSparkles, IconSchool, IconCalculator, IconHourglass, IconLanguage, IconRefresh, IconCheck, IconBook2, IconFolder, IconClipboardText, IconX } from "@tabler/icons-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { NotificationsDropdown } from "@/components/layout/notifications-dropdown";
import { usePlatformStore } from "@/lib/store";
import { arabicFacts } from "@/lib/data/facts/arabic";
import { arabicFactsPart2 } from "@/lib/data/facts/arabic-part2";
import { arabicFactsPart3 } from "@/lib/data/facts/arabic-part3";
import { arabicFactsPart4 } from "@/lib/data/facts/arabic-part4";
import { mathFacts } from "@/lib/data/facts/math";
import { mathFactsPart2 } from "@/lib/data/facts/math-part2";
import { mathFactsPart3 } from "@/lib/data/facts/math-part3";
import { mathFactsPart4 } from "@/lib/data/facts/math-part4";
import { scienceFacts } from "@/lib/data/facts/science";
import { scienceFactsPart2 } from "@/lib/data/facts/science-part2";
import { scienceFactsPart3 } from "@/lib/data/facts/science-part3";
import { scienceFactsPart4 } from "@/lib/data/facts/science-part4";
import { historyFacts } from "@/lib/data/facts/history";
import { historyFactsPart2 } from "@/lib/data/facts/history-part2";
import { historyFactsPart3 } from "@/lib/data/facts/history-part3";
import { historyFactsPart4 } from "@/lib/data/facts/history-part4";

// Combined Facts Dictionary (300 facts per subject)
const facts = {
  math: [...mathFacts, ...mathFactsPart2, ...mathFactsPart3, ...mathFactsPart4],
  history: [...historyFacts, ...historyFactsPart2, ...historyFactsPart3, ...historyFactsPart4],
  arabic: [...arabicFacts, ...arabicFactsPart2, ...arabicFactsPart3, ...arabicFactsPart4],
  science: [...scienceFacts, ...scienceFactsPart2, ...scienceFactsPart3, ...scienceFactsPart4]
};

export default function HeroSection() {
  const { user } = useAuth();
  const [factModal, setFactModal] = useState({ isOpen: false, subject: 'science', currentFact: '' });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { lessons, exams, files } = usePlatformStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const searchItems = [
    ...lessons.map(l => ({ id: `lesson-${l.id}`, title: l.title, type: "درس", icon: <IconBook2 size={16} />, href: "/lessons" })),
    ...exams.map(e => ({ id: `exam-${e.id}`, title: e.name, type: "اختبار", icon: <IconClipboardText size={16} />, href: "/exams" })),
    ...files.map(f => ({ id: `file-${f.id}`, title: f.title, type: "ملف", icon: <IconFolder size={16} />, href: "/library" }))
  ];

  const filteredItems = searchQuery.trim().length > 0 ? searchItems.filter(item => (item.title || "").toLowerCase().includes(searchQuery.toLowerCase())) : [];

  const getNewFact = (subject: string) => {
    const list = facts[subject as keyof typeof facts] || facts.science;
    return list[Math.floor(Math.random() * list.length)];
  };

  const openFactModal = (subject: string) => {
    setFactModal({ isOpen: true, subject, currentFact: getNewFact(subject) });
  };

  const refreshFact = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFactModal(prev => ({ ...prev, currentFact: getNewFact(prev.subject) }));
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, targetId: string) => {
    e.preventDefault();
    const elem = document.getElementById(targetId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative bg-white min-h-[95vh] font-sans" dir="rtl">
      
      {/* Container for background elements with overflow hidden to prevent scrollbars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* ===== Background Gradients ===== */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#fcfaff] via-[#fffbf7] to-[#fff9f0]"></div>
        
        {/* Background Blobs for that exact hue */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#fff0e0] rounded-full blur-[140px] opacity-80"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#f4efff] rounded-full blur-[140px] opacity-80"></div>
      </div>

      {/* ===== Floating Abstract Shapes ===== */}
      <div className="absolute top-32 left-10 text-amber-400 opacity-50 animate-bounce z-0" style={{ animationDuration: '4s' }}>
        <IconStarFilled size={40} />
      </div>
      <div className="absolute top-1/2 right-12 text-[#c084fc] opacity-40 animate-float z-0">
        <IconSparkles size={50} />
      </div>
      <div className="absolute bottom-20 left-1/4 w-16 h-16 border-4 border-dashed border-indigo-300 rounded-full opacity-50 animate-spin z-0" style={{ animationDuration: '10s' }}></div>

      {/* ===== Floating Books (Moved down as per user drawing) ===== */}
      <img 
        src="/hero-book1.png" 
        alt="كتاب لغتي" 
        className="absolute top-[15%] left-[5%] md:top-[18%] md:left-[8%] w-32 h-32 md:w-48 md:h-48 lg:w-[220px] lg:h-[220px] object-contain animate-float drop-shadow-2xl z-20 transform -rotate-[15deg] cursor-pointer hover:scale-110 transition-transform duration-300" 
        style={{ animationDelay: '0s' }} 
        onClick={() => openFactModal('arabic')}
      />
      <img 
        src="/hero-book2.png" 
        alt="كتاب الرياضيات" 
        className="absolute bottom-0 right-[5%] md:-bottom-[15%] md:right-[10%] w-32 h-32 md:w-40 md:h-40 lg:w-[200px] lg:h-[200px] object-contain animate-float drop-shadow-2xl z-20 transform rotate-12 cursor-pointer hover:scale-110 transition-transform duration-300" 
        style={{ animationDelay: '1.5s' }} 
        onClick={() => openFactModal('math')}
      />
      <img 
        src="/hero-book3.png" 
        alt="كتاب التاريخ" 
        className="absolute bottom-[10%] left-[2%] md:bottom-[8%] md:left-[5%] w-28 h-28 md:w-32 md:h-32 lg:w-40 lg:h-40 object-contain animate-float drop-shadow-2xl z-20 transform -rotate-6 cursor-pointer hover:scale-110 transition-transform duration-300" 
        style={{ animationDelay: '3s' }} 
        onClick={() => openFactModal('history')}
      />
      <img 
        src="/hero-book4.png" 
        alt="كتاب العلوم" 
        className="absolute bottom-[35%] right-[5%] md:right-auto md:bottom-[18%] md:left-[40%] w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain animate-float drop-shadow-2xl z-20 transform rotate-[15deg] cursor-pointer hover:scale-110 transition-transform duration-300" 
        style={{ animationDelay: '2s' }} 
        onClick={() => openFactModal('science')}
      />

      {/* Mobile only Success Widget - Placed opposite to science book */}
      <div className="absolute bottom-[38%] left-[2%] bg-white rounded-[20px] px-4 py-2 shadow-xl flex items-center gap-3 z-40 animate-float sm:hidden transform scale-90" style={{ animationDelay: '0.5s' }}>
        <div className="w-8 h-8 rounded-full bg-[#ecfdf3] flex items-center justify-center text-[#12b76a]">
          <IconCheck size={20} stroke={3.5} />
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[11px] font-bold text-slate-400 leading-tight mb-0.5">نسبة النجاح</span>
          <span className="text-lg font-black text-slate-800 leading-tight">99.9%</span>
        </div>
      </div>
      
      {/* Universal Fact Popup */}
      {factModal.isOpen && (() => {
        let Icon = IconSparkles;
        let title = "معلومة علمية مدهشة!";
        let bgColors = "bg-blue-100 text-blue-600";
        
        if (factModal.subject === 'math') {
          Icon = IconCalculator;
          title = "معلومة رياضية مدهشة!";
          bgColors = "bg-indigo-100 text-indigo-600";
        } else if (factModal.subject === 'history') {
          Icon = IconHourglass;
          title = "معلومة تاريخية مدهشة!";
          bgColors = "bg-amber-100 text-amber-600";
        } else if (factModal.subject === 'arabic') {
          Icon = IconLanguage;
          title = "معلومة لغوية مدهشة!";
          bgColors = "bg-emerald-100 text-emerald-600";
        }

        return mounted ? createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setFactModal(prev => ({...prev, isOpen: false}))}>
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setFactModal(prev => ({...prev, isOpen: false}))}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors z-10"
              >
                ✕
              </button>

              <div className="flex flex-col items-center justify-center mb-4">
                <button 
                  onClick={refreshFact}
                  title="اضغط لتغيير المعلومة"
                  className={`relative w-20 h-20 ${bgColors} rounded-2xl flex items-center justify-center rotate-3 hover:rotate-6 hover:scale-105 transition-all shadow-md group cursor-pointer`}
                >
                  <Icon size={40} className="animate-pulse" />
                  <div className="absolute -bottom-3 -left-4 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                    <IconRefresh size={12} />
                    اضغط للتغيير
                  </div>
                </button>
                <div className="flex items-center gap-1 mt-4 text-slate-400 text-xs font-medium animate-bounce bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                  <IconRefresh size={14} />
                  <span>اضغط على الأيقونة لمعلومة جديدة</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-800 text-center mb-4">{title}</h3>
              <p className="text-slate-700 text-center text-sm md:text-base leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100 min-h-[100px] flex items-center justify-center font-medium shadow-inner">
                {factModal.currentFact}
              </p>
            </div>
          </div>
        , document.body) : null;
      })()}

      {/* ===== Navbar ===== */}
      <nav className="sticky top-0 z-50 p-4 pt-6 transition-all duration-300 w-full flex justify-center">
        {/* The Orange to White blurred gradient header */}
        <div className="w-full max-w-[95%] lg:max-w-7xl flex justify-between items-center bg-gradient-to-r from-orange-400/90 to-white/95 backdrop-blur-md rounded-full px-6 py-3 shadow-lg shadow-orange-500/10 border border-orange-100">
          
          {/* Right: Small Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <IconSchool size={22} stroke={2.5} />
            </div>
            <div className="flex flex-col text-right">
              <span className="font-black text-base md:text-lg text-slate-800 leading-none tracking-tight">الأوس الماسية</span>
              <span className="text-[10px] md:text-[11px] text-[#f97316] font-bold leading-none mt-1">المنصة التعليمية</span>
            </div>
          </div>
          


          {/* Left: 3 Icons (Search, Profile, Bell) working and visible on the orange background */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative">
              <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-transform hover:scale-105 shadow-sm text-orange-600">
                <IconSearch stroke={2} size={18} />
              </button>
              
              {isSearchOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4" dir="rtl">
                  {/* Backdrop */}
                  <div 
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSearchOpen(false)}
                  />
                  {/* Modal */}
                  <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                    <div className="relative flex items-center">
                      <IconSearch className="absolute right-4 text-slate-400" size={24} />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث عن الدورات، الملخصات، والمحاكيات..." 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pr-14 pl-12 text-lg text-slate-800 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                        autoFocus
                      />
                      <button 
                        onClick={() => setIsSearchOpen(false)}
                        className="absolute left-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                      >
                        <IconX size={20} />
                      </button>
                    </div>

                    <div className="mt-4 px-4 pb-4">
                      {searchQuery.trim().length > 0 ? (
                        <>
                          <p className="text-sm font-bold text-slate-400 mb-3">نتائج البحث ({filteredItems.length})</p>
                          {filteredItems.length > 0 ? (
                            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto scrollbar-thin">
                              {filteredItems.map(item => (
                                <Link 
                                  key={item.id} 
                                  href={item.href}
                                  onClick={() => setIsSearchOpen(false)}
                                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-indigo-50/50 transition-colors border border-transparent hover:border-indigo-100 group"
                                >
                                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    {item.icon}
                                  </div>
                                  <div>
                                    <div className="text-base font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{item.title}</div>
                                    <div className="text-sm font-medium text-slate-400">{item.type}</div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
                              <IconSearch size={48} className="mb-4 text-slate-200" />
                              <p className="text-base font-bold text-slate-600">لا توجد نتائج مطابقة</p>
                              <p className="text-sm mt-1">حاول البحث بكلمات مختلفة</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-slate-400 mb-3">عمليات البحث الشائعة</p>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => setSearchQuery('تجميعات التحصيلي 2026')} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold cursor-pointer hover:bg-indigo-100 transition-colors">تجميعات التحصيلي 2026</button>
                            <button onClick={() => setSearchQuery('دورة الستيب المكثفة')} className="px-4 py-2 bg-amber-50 text-amber-600 rounded-full text-sm font-bold cursor-pointer hover:bg-amber-100 transition-colors">دورة الستيب المكثفة</button>
                            <button onClick={() => setSearchQuery('ملفات التأسيس')} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-bold cursor-pointer hover:bg-slate-200 transition-colors">ملفات التأسيس</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              , document.body)}
            </div>

            <ProfileDropdown 
              customTrigger={
                <button className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-transform hover:scale-105 shadow-sm text-orange-600">
                  <IconUser stroke={2} size={18} />
                </button>
              }
              loginClassName="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-transform hover:scale-105 shadow-sm text-orange-600"
            />
            
            <NotificationsDropdown 
              customTrigger={
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-transform hover:scale-105 shadow-sm text-orange-600">
                  <IconBell stroke={2} size={18} />
                </div>
              }
            />
          </div>
        </div>
      </nav>

      {/* ===== Hero Content ===== */}
      <section className="relative pt-12 pb-32 px-6 max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full">
          
          {/* Right Text Area */}
          <div className="flex flex-col items-start relative z-30 w-full lg:pr-10">
            
            {/* Pill (منصتك الأولى للتفوق) -> Dot is on the LEFT */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#f3f4fa] text-[#5c67e6] font-bold text-[14px] mb-8 shadow-sm">
              منصتك الأولى للتفوق
              <span className="w-2.5 h-2.5 rounded-full bg-[#5c67e6]"></span>
            </div>

            {/* Success Widget Moved to the Green Box Area */}
            <div className="absolute top-[0%] left-[-10%] md:top-[5%] md:left-[-20%] lg:left-[-30%] bg-white rounded-[20px] px-5 py-3 shadow-xl flex items-center gap-4 z-40 animate-float hidden sm:flex" style={{ animationDelay: '0.5s' }}>
              <div className="w-10 h-10 rounded-full bg-[#ecfdf3] flex items-center justify-center text-[#12b76a]">
                <IconCheck size={24} stroke={3.5} />
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[12px] font-bold text-slate-400 leading-tight mb-0.5">نسبة النجاح</span>
                <span className="text-xl font-black text-slate-800 leading-tight">99.9%</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.2] tracking-tight flex flex-col items-start gap-2 w-full mb-8">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#7e22ce] to-[#5b21b6] pb-1">
                الأوس
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#d97706] to-[#b45309] pb-1 relative">
                الماسية
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#f59e0b] to-[#d97706] flex items-center gap-4 pb-1">
                للتفوق
                <IconSparkles className="text-[#c084fc] mb-4" size={35} stroke={2} />
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#fbbf24] to-[#f59e0b] opacity-90 pb-2">
                والتميز
              </span>
            </h1>

            {/* Added Back The Action Buttons exactly as requested */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full lg:w-auto relative z-50">
              <Link href={user ? "/dashboard" : "/login"} className="px-8 py-4 bg-gradient-to-r from-white to-orange-400 hover:to-orange-500 text-slate-900 rounded-full font-bold text-lg shadow-xl shadow-orange-500/30 transition-all hover:-translate-y-1 text-center">
                ابدأ رحلة الـ 100%
              </Link>
              <button onClick={(e) => handleSmoothScroll(e, 'courses')} className="px-8 py-4 bg-white border-2 border-slate-200 hover:border-indigo-600 text-slate-700 hover:text-indigo-600 rounded-full font-bold text-lg transition-all shadow-sm animate-pulse" style={{ animationDuration: '4s' }}>
                استكشف الدورات
              </button>
            </div>
            
          </div>

          {/* Left area is used for the boy floating, bigger and centered */}
          <div className="relative h-[500px] flex items-center justify-center mt-16 lg:mt-0">
             <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl transform scale-110 pointer-events-none"></div>
             <img 
               src="/hero-child.png" 
               alt="طالب متفوق" 
               className="relative z-30 w-full max-w-[400px] lg:max-w-[500px] object-contain drop-shadow-[0_20px_50px_rgba(79,70,229,0.3)] animate-float"
               style={{ animationDelay: '1s' }}
             />
          </div>

        </div>
      </section>
      
      {/* Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(var(--tw-rotate, 0deg)); }
          50% { transform: translateY(-20px) rotate(var(--tw-rotate, 0deg)); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}
