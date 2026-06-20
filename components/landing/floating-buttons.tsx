"use client";

import React from "react";
import { IconBrandWhatsapp, IconMessageCircle2 } from "@tabler/icons-react";

export default function FloatingButtons() {
  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-4">
      {/* Support Button */}
      <a 
        href="#"
        className="bg-white text-text px-4 py-2 rounded-full shadow-lg border border-border flex items-center gap-2 font-bold hover:bg-bg transition-colors fade-up"
      >
        <span>للدعم الفني</span>
        <IconMessageCircle2 size={20} className="text-accent-amber" />
      </a>
      
      {/* WhatsApp Button */}
      <a 
        href="https://wa.me/966507806516"
        target="_blank"
        rel="noopener noreferrer"
        className="w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform fade-up delay-1"
      >
        <IconBrandWhatsapp size={36} />
      </a>
    </div>
  );
}

