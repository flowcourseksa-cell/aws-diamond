import React from "react";
import { IconBrandTwitter, IconBrandInstagram, IconBrandWhatsapp, IconBrandYoutube } from "@tabler/icons-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-bg border-t border-border pt-16 pb-8 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl">
              ن
            </div>
            <span className="font-black text-2xl text-text">فلو</span>
          </div>
          <p className="text-text-muted leading-relaxed max-w-sm mb-6">
            المنصة التعليمية الأولى في المملكة لتهيئة الطلاب لاجتياز اختباري القدرات والتحصيلي بأعلى الدرجات، مع نخبة من الخبراء.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-colors">
              <IconBrandTwitter size={20} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-colors">
              <IconBrandInstagram size={20} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-colors">
              <IconBrandWhatsapp size={20} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-colors">
              <IconBrandYoutube size={20} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-lg text-text mb-6">روابط سريعة</h4>
          <ul className="space-y-4">
            <li><a href="#courses" className="text-text-muted hover:text-primary transition-colors">تصفح الدورات</a></li>
            <li><a href="#offers" className="text-text-muted hover:text-primary transition-colors">العروض وتذاكر الخصم</a></li>
            <li><Link href="/login" className="text-text-muted hover:text-primary transition-colors">تسجيل الدخول</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-lg text-text mb-6">تواصل معنا</h4>
          <ul className="space-y-4 text-text-muted">
            <li className="flex items-center gap-2">
              <IconBrandWhatsapp size={18} className="text-primary" />
              <span dir="ltr">+966 50 000 0000</span>
            </li>
            <li>الرياض، المملكة العربية السعودية</li>
            <li>info@flow.com</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-border pt-8 text-center text-text-muted text-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <p>جميع الحقوق محفوظة © {new Date().getFullYear()} منصة فلو.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary transition-colors">الشروط والأحكام</a>
          <a href="#" className="hover:text-primary transition-colors">سياسة الخصوصية</a>
        </div>
      </div>
    </footer>
  );
}
