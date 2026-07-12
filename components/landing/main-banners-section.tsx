"use client";

import React from "react";
import { IconCheck, IconPlayerPlayFilled, IconSparkles } from "@tabler/icons-react";
import { useCartStore } from "@/store/cart";
import Link from "next/link";

export default function MainBannersSection() {
  const { addItem } = useCartStore();

  const handleSubscribe = (name: string, price: number) => {
    addItem({ id: name, name, price });
  };

  return (
    <section id="courses" className="py-20 bg-white px-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none z-0"><button 
                  onClick={() => handleSubscribe("دورة الأوس الماسية للستيب 7 أيام", 200)}
                  className="bg-white text-indigo-900 hover:bg-indigo-50 px-8 py-3 rounded-full font-black text-lg mt-6 shadow-xl transition-transform hover:-translate-y-1"
                >
                  اشترك في دورة الستيب
                </button>
              </div>
      
      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        {/* ===== Big Course Banner (2026 Course) ===== */}
        <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 shadow-[0_20px_50px_rgba(49,46,129,0.5)] fade-up border border-indigo-500/30 group">
          
          {/* Animated Background Textures */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/30 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/30 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 p-12 md:p-20 relative z-10 items-center">
            <div className="order-2 md:order-1 relative h-72 md:h-auto flex justify-center items-center mt-10 md:mt-0">
              
              {/* Glowing 100% Badge */}
              <div className="absolute -top-10 right-0 md:right-10 w-28 h-28 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-black text-4xl transform rotate-12 shadow-[0_0_50px_rgba(245,158,11,0.6)] border-4 border-white/20 z-30 animate-pulse">
                100%
              </div>
              
              {/* Glassmorphism Book Mockup 1 */}
              <div className="w-40 h-56 bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 flex flex-col justify-between p-5 text-center transform -rotate-12 group-hover:-translate-y-4 group-hover:rotate-0 transition-all duration-500 z-20">
                <span className="text-sm font-bold text-indigo-200">كتاب التأسيس</span>
                <span className="text-2xl font-black text-white">الأحياء</span>
                <div className="w-12 h-1 bg-amber-400 mx-auto rounded-full"></div>
                <span className="text-2xl font-black text-indigo-300">2026</span>
              </div>

              {/* Glassmorphism Book Mockup 2 */}
              <div className="w-40 h-56 bg-indigo-600/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 flex flex-col justify-between p-5 text-center transform rotate-6 translate-y-12 -translate-x-10 group-hover:translate-y-4 group-hover:rotate-0 transition-all duration-500 z-10">
                <span className="text-sm font-bold text-indigo-200">كتاب التأسيس</span>
                <span className="text-2xl font-black text-white">الرياضيات</span>
                <div className="w-12 h-1 bg-purple-400 mx-auto rounded-full"></div>
                <span className="text-2xl font-black text-indigo-300">2026</span>
              </div>
            </div>
            
            <div className="order-1 md:order-2 text-center md:text-right text-white relative">
              <IconSparkles className="absolute -top-8 -right-8 text-amber-400 opacity-50 animate-spin" style={{animationDuration: '8s'}} size={40} />
              <h2 className="text-7xl md:text-9xl font-black mb-2 opacity-20 absolute -top-10 -right-4 pointer-events-none">2026</h2>
              
              <div className="relative z-10">
                <h3 className="text-4xl md:text-5xl font-black text-amber-400 mb-2 drop-shadow-md">دورة</h3>
                <h3 className="text-5xl md:text-7xl font-black mb-10 drop-shadow-lg leading-tight">الأوس الماسية للتحصيلي</h3>
                
                <button 
                  onClick={() => handleSubscribe("دورة الأوس الماسية للتحصيلي 2026", 450)}
                  className="bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600 px-12 py-4 rounded-full font-black text-2xl transition-all hover:scale-105 shadow-[0_10px_30px_rgba(245,158,11,0.4)] border border-amber-300"
                >
                  اشترك الآن
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Two Column Banners ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Step Free Simulator */}
          <div className="bg-white rounded-[3rem] p-10 shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col items-center justify-center text-center relative overflow-hidden group fade-up delay-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl"></div>
            
            <div className="absolute top-6 left-6 bg-gradient-to-br from-rose-500 to-red-600 text-white font-black text-2xl px-6 py-2 rounded-2xl transform -rotate-12 shadow-lg shadow-rose-500/30 z-20">
              مجانًا
            </div>
            
            <div className="w-full max-w-sm aspect-video bg-slate-50 rounded-3xl border border-slate-200 mb-8 flex items-center justify-center relative overflow-hidden group-hover:shadow-2xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5"></div>
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 z-10">
                <IconPlayerPlayFilled size={40} className="text-indigo-600 ml-2" />
              </div>
            </div>
            
            <h3 className="text-3xl md:text-4xl font-black text-amber-500 mb-2">المحاكي المجاني</h3>
            <h4 className="text-3xl md:text-4xl font-black text-slate-800">لاختبار الستيب</h4>
            
            <Link 
              href="/simulator"
              className="mt-8 bg-slate-800 hover:bg-slate-900 text-white px-10 py-4 rounded-full font-bold text-xl transition-transform hover:-translate-y-1 shadow-xl inline-block"
            >
              ابدأ الاختبار الآن
            </Link>
          </div>

          {/* Step Full Course */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[3rem] p-10 shadow-[0_20px_40px_rgba(79,70,229,0.4)] relative overflow-hidden flex flex-col md:flex-row items-center fade-up delay-2 group">
            {/* Glowing Orbs */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-400/30 rounded-full blur-3xl transition-opacity group-hover:opacity-100 opacity-50"></div>
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-400/30 rounded-full blur-3xl transition-opacity group-hover:opacity-100 opacity-50"></div>
            
            <div className="relative z-10 w-full md:w-1/2 text-white text-center md:text-right mb-10 md:mb-0">
              <h3 className="text-3xl md:text-4xl font-black text-amber-400 mb-2 drop-shadow-md">دورة الأوس الماسية</h3>
              <h4 className="text-4xl md:text-6xl font-black mb-6 drop-shadow-md">للستيب</h4>
              <p className="text-lg md:text-xl font-medium text-indigo-100 mb-6 leading-relaxed">
                أقوى دورة في الستيب<br/> بخطط مرنة ومكثفة تبدأ من
              </p>
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-4 rounded-3xl shadow-xl transform -rotate-3 transition-transform group-hover:rotate-0">
                <span className="font-black text-6xl text-amber-400">7</span>
                <span className="text-2xl font-bold mt-2">أيام</span>
              </div>
              <div className="mt-8">
                <button 
                  onClick={() => handleSubscribe("دورة الأوس الماسية للستيب 7 أيام", 200)}
                  className="bg-white text-indigo-900 hover:bg-indigo-50 px-8 py-3 rounded-full font-black text-lg shadow-xl transition-transform hover:-translate-y-1"
                >
                  اشترك في الدورة
                </button>
              </div>
            </div>
            
            {/* Elegant Card Mockup */}
            <div className="w-full md:w-1/2 relative z-10 flex justify-center md:justify-end">
              <div className="w-56 aspect-[3/4] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 border-white/20 p-8 text-center flex flex-col justify-center transform rotate-6 group-hover:rotate-0 transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner text-indigo-600">
                  <IconCheck size={40} />
                </div>
                <h4 className="font-black text-xl mb-1 text-slate-500">تجميعات</h4>
                <h5 className="font-black text-3xl text-indigo-900 mb-2">القواعد</h5>
                <h5 className="font-bold text-lg text-slate-400">الشاملة</h5>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
