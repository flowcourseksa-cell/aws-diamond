"use client";

import React from "react";
import { IconBrandWhatsapp, IconArrowLeft } from "@tabler/icons-react";

export default function FloatingButtons() {
  return (
    <div className="fixed bottom-3 left-3 z-50 flex items-center gap-2" dir="rtl">
      {/* Support Label */}
      <div className="bg-white text-text px-3 py-1.5 rounded-xl shadow-lg border border-border flex items-center gap-1.5 font-bold text-sm animate-pulse-slow">
        <span>للدعم الفني</span>
        <IconArrowLeft size={16} className="text-[#25D366]" />
      </div>
      
      {/* WhatsApp Button */}
      <a 
        href="https://wa.me/966507806516"
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      >
        <IconBrandWhatsapp size={24} />
      </a>
    </div>
  );
}
