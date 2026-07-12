"use client";

import React, { useState } from "react";
import Link from "next/link";
import { IconBrandTelegram, IconBrandWhatsapp, IconBrandYoutube, IconBrandSnapchat, IconBrandInstagram, IconBrandX, IconSchool } from "@tabler/icons-react";
import PolicyModal from "@/components/modals/policy-modal";

type PolicyType = "privacy" | "terms" | "refund" | null;

export default function PremiumFooter() {
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);

  return (
    <>
      <footer className="bg-[#0d0d0d] text-white pt-16 pb-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-10">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
              <IconSchool size={26} stroke={2.5} />
            </div>
            <div className="flex flex-col text-right">
              <span className="font-black text-xl text-white leading-none">منصة الأوس الماسية</span>
              <span className="text-sm text-orange-500 font-bold">التعليمية</span>
            </div>
          </div>

          {/* Description */}
          <p className="max-w-xl text-gray-400 font-medium leading-relaxed text-base">
            نوفر للمقبلين على اختبار التحصيلي والقدرات ملفات تأسيسية شاملة ومشروحة وأكبر وأشمل التجميعات لتغنيكم عن أي مصدر آخر وليصل الطالب إلى المئوية بإذن الله.
          </p>

          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-gray-400 font-bold">
            <button onClick={() => setActivePolicy("privacy")} className="hover:text-primary transition-colors">سياسة الخصوصية</button>
            <button onClick={() => setActivePolicy("terms")} className="hover:text-primary transition-colors">شروط الاستخدام</button>
            <button onClick={() => setActivePolicy("refund")} className="hover:text-primary transition-colors">سياسة الاسترجاع</button>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-white/10" />

          {/* Bottom Bar */}
          <p className="text-gray-500 text-sm font-medium">
            جميع الحقوق محفوظة {new Date().getFullYear()} © منصة الأوس الماسية التعليمية
          </p>
        </div>
      </footer>

      <PolicyModal 
        type={activePolicy} 
        isOpen={activePolicy !== null} 
        onClose={() => setActivePolicy(null)} 
      />
    </>
  );
}
