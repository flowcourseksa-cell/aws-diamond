import React from "react";
import { IconBrandTelegram, IconMail, IconBrandWhatsapp, IconBrandYoutube, IconBrandTiktok, IconBrandX } from "@tabler/icons-react";

export default function PremiumFooter() {
  return (
    <footer className="bg-[#111111] text-white pt-20 pb-8 px-4">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-black text-2xl">
            ن
          </div>
          <div className="flex flex-col text-right">
            <span className="font-black text-2xl text-white leading-none">منصة الأوس الماسية</span>
            <span className="text-sm text-accent-amber font-bold">التعليمية</span>
          </div>
        </div>

        {/* Description */}
        <p className="max-w-2xl text-gray-400 font-medium leading-relaxed mb-10 text-lg">
          نوفر للمقبلين على اختبار التحصيلي والقدرات ملفات تأسيسية شاملة ومشروحة وأكبر وأشمل التجميعات لتغنيكم عن أي مصدر آخر وليصل الطالب إلى المئوية بإذن الله. تجارب طلابنا خير دليل على جودتنا.
        </p>

        <div className="text-gray-400 text-sm mb-10">
          الرقم الضريبي
          <div className="font-bold text-white mt-1">313100000000003</div>
        </div>

        {/* Links Grid */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-gray-300 font-bold mb-12">
          <a href="#" className="hover:text-accent-amber transition-colors">سياسة الخصوصية</a>
          <a href="#" className="hover:text-accent-amber transition-colors">الأسئلة الشائعة</a>
          <a href="#" className="hover:text-accent-amber transition-colors">الشروط والأحكام</a>
        </div>

        {/* Contact Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-10 w-full max-w-lg">
          <a href="#" className="flex-1 min-w-[140px] bg-transparent border border-gray-700 hover:bg-gray-800 rounded-lg py-3 flex items-center justify-center gap-2 transition-colors">
            <IconBrandTelegram size={20} /> تيليجرام
          </a>
          <a href="#" className="flex-1 min-w-[140px] bg-transparent border border-gray-700 hover:bg-gray-800 rounded-lg py-3 flex items-center justify-center gap-2 transition-colors">
            <IconMail size={20} /> البريد الإلكتروني
          </a>
          <a href="#" className="flex-1 min-w-[140px] bg-transparent border border-gray-700 hover:bg-gray-800 rounded-lg py-3 flex items-center justify-center gap-2 transition-colors">
            <IconBrandWhatsapp size={20} /> واتساب
          </a>
        </div>

        {/* Social Icons */}
        <div className="flex gap-4 mb-12">
          <a href="#" className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white hover:border-primary transition-all">
            <IconBrandYoutube size={20} />
          </a>
          <a href="#" className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white hover:border-primary transition-all">
            <IconBrandTiktok size={20} />
          </a>
          <a href="#" className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white hover:border-primary transition-all">
            <IconBrandX size={20} />
          </a>
        </div>

        {/* Bottom Bar */}
        <div className="w-full border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Payment Methods Placeholder */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg">
            <span className="text-xs text-black font-bold">طرق الدفع الآمنة</span>
            <div className="flex gap-1">
              <div className="w-8 h-5 bg-blue-600 rounded"></div>
              <div className="w-8 h-5 bg-green-500 rounded"></div>
              <div className="w-8 h-5 bg-black rounded"></div>
            </div>
          </div>

          <p className="text-gray-500 text-sm">
            جميع الحقوق محفوظة {new Date().getFullYear()} © منصة الأوس الماسية التعليمية
          </p>
        </div>
      </div>
    </footer>
  );
}

