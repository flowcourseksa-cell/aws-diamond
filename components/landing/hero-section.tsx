"use client";

import React, { useState } from "react";
import { IconSearch, IconUser, IconShoppingCart, IconBooks, IconStarFilled, IconSparkles } from "@tabler/icons-react";
import Link from "next/link";
import SearchModal from "@/components/modals/search-modal";
import { useCartStore } from "@/store/cart";

export default function HeroSection() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { items, openCart } = useCartStore();

  const handleSmoothScroll = (e: React.MouseEvent<HTMLElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };


  return (
    <div className="relative overflow-hidden bg-white min-h-screen">
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      {/* ===== Background Magic (Gradients & Patterns) ===== */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none z-0"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full blur-[120px] opacity-30 animate-pulse pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl from-amber-300 to-orange-400 rounded-full blur-[150px] opacity-20 animate-pulse pointer-events-none z-0"></div>
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-gradient-to-tr from-pink-400 to-rose-400 rounded-full blur-[100px] opacity-20 pointer-events-none z-0"></div>

      {/* ===== Floating Abstract Shapes ===== */}
      <div className="absolute top-32 left-10 text-amber-400 opacity-50 animate-bounce" style={{ animationDuration: '4s' }}>
        <IconStarFilled size={40} />
      </div>
      <div className="absolute top-1/2 right-12 text-purple-500 opacity-40 animate-float">
        <IconSparkles size={50} />
      </div>
      <div className="absolute bottom-20 left-1/4 w-16 h-16 border-4 border-dashed border-indigo-300 rounded-full opacity-50 animate-spin" style={{ animationDuration: '10s' }}></div>

      {/* ===== Navbar ===== */}
      <nav className="relative z-40 p-4 pt-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/60 backdrop-blur-2xl rounded-full px-8 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/30 transform transition-transform group-hover:scale-110 group-hover:rotate-6 glow-ring">
              💎
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl leading-none tracking-tight text-gradient-aurora">الأوس الماسية</span>
              <span className="text-sm text-amber-500 font-bold">المنصة التعليمية</span>
            </div>
          </Link>
          
          {/* Center Links */}
          <div className="hidden md:flex items-center gap-8 font-bold text-slate-600">
          </div>

          {/* Left Icons */}
          <div className="flex items-center gap-4 text-slate-500">
            <button onClick={openCart} className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors relative">
              <IconShoppingCart stroke={1.5} size={20} />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {items.length}
              </span>
            </button>
            <Link href="/login" className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors text-indigo-600">
              <IconUser stroke={1.5} size={20} />
            </Link>
            <button onClick={() => setIsSearchOpen(true)} className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors">
              <IconSearch stroke={1.5} size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* ===== Hero Content ===== */}
      <section className="relative pt-24 pb-32 px-4 max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Right Text Area */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-right">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-sm mb-8 animate-fade-in-up">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
              منصتك الأولى للتفوق
            </div>

            <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight tracking-tight">
              <span className="shimmer-text">الأوس الماسية</span> <br/>
              <span className="text-gradient-aurora">
                للتفوّق والتميّز
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-slate-600 font-medium mb-10 leading-relaxed">
              المصدر الأول لمئوية التحصيلي 
              <span className="inline-flex items-center justify-center ml-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-1 rounded-2xl transform -rotate-3 shadow-lg shadow-amber-500/30">
                100%
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/login" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-lg shadow-xl shadow-indigo-600/30 transition-all hover:-translate-y-1 text-center">
                ابدأ رحلة الـ 100%
              </Link>
              <button onClick={(e) => handleSmoothScroll(e, 'courses')} className="px-8 py-4 bg-white border-2 border-slate-200 hover:border-indigo-600 text-slate-700 hover:text-indigo-600 rounded-full font-bold text-lg transition-all">
                استكشف الدورات
              </button>
            </div>
          </div>

          {/* Left Image Area */}
          <div className="relative flex justify-center mt-10 lg:mt-0">
            <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
              
              {/* Image Backdrop Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl transform scale-110"></div>
              
              {/* Actual Image */}
              <img 
                src="/hero-books.png" 
                alt="كتب الأوس الماسية" 
                className="relative z-10 w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(79,70,229,0.4)] animate-float"
              />
              
              {/* Floating Element 1 */}
              <div className="absolute top-10 right-0 z-20 bg-white p-4 rounded-2xl shadow-xl shadow-slate-200/50 flex items-center gap-3 animate-float" style={{ animationDelay: '1s' }}>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-black">
                  ✓
                </div>
                <div>
                  <div className="text-sm text-slate-500 font-bold">نسبة نجاح</div>
                  <div className="text-lg font-black text-slate-800">99.9%</div>
                </div>
              </div>

              {/* Floating Element 2 */}
              <div className="absolute bottom-10 left-0 z-20 bg-white p-4 rounded-2xl shadow-xl shadow-slate-200/50 flex items-center gap-3 animate-float" style={{ animationDelay: '2s' }}>
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-500">
                  <IconBooks size={24} />
                </div>
                <div>
                  <div className="text-sm text-slate-500 font-bold">مواد شاملة</div>
                  <div className="text-lg font-black text-slate-800">تأسيس وتجميعات</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Animations: float و aurora معرّفة الآن عالمياً في globals.css */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }
      `}} />
    </div>
  );
}

