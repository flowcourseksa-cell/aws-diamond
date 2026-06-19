import React from "react";
import { IconSend, IconFolderOpen, IconBrandTelegram } from "@tabler/icons-react";
import Link from "next/link";

export default function CommunitySection() {
  return (
    <section className="py-20 bg-slate-50 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Telegram Group */}
        <a href="https://t.me/flow_group" target="_blank" rel="noopener noreferrer" className="bg-white border border-slate-200 rounded-[2rem] p-6 flex items-center gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] group transition-all duration-500 hover:-translate-y-2 fade-up delay-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/30 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 z-10">
            <IconBrandTelegram size={32} />
          </div>
          <div className="z-10">
            <h4 className="font-black text-slate-800 text-2xl mb-1">جروب التحصيلي</h4>
            <p className="text-slate-500 font-medium">@flow_group</p>
          </div>
        </a>

        {/* Telegram Channel */}
        <a href="https://t.me/flow_channel" target="_blank" rel="noopener noreferrer" className="bg-white border border-slate-200 rounded-[2rem] p-6 flex items-center gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] group transition-all duration-500 hover:-translate-y-2 fade-up delay-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 z-10">
            <IconBrandTelegram size={32} />
          </div>
          <div className="z-10">
            <h4 className="font-black text-slate-800 text-2xl mb-1">قناة التحصيلي</h4>
            <p className="text-slate-500 font-medium">@flow_channel</p>
          </div>
        </a>

        {/* Files Access Card */}
        <Link href="/dashboard" className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-[0_20px_40px_rgba(15,23,42,0.4)] flex items-center justify-between group cursor-pointer fade-up delay-3 col-span-1 md:col-span-1 border border-slate-700 block w-full">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          <div className="relative z-10 w-2/3">
            <h3 className="font-black text-2xl leading-snug text-white">
              للدخول على موقع<br/>
              الملفات للمشتركين
            </h3>
            <div className="w-16 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500 mt-4 rounded-full"></div>
          </div>
          
          <div className="relative z-10 w-1/3 flex justify-end transform group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500">
            <img 
              src="/files-folder.png" 
              alt="ملفات فلو" 
              className="w-32 h-32 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
            />
          </div>
        </Link>

      </div>
    </section>
  );
}
