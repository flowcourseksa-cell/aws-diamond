"use client";

import React, { useState } from "react";
import { IconBrandWhatsapp, IconX, IconSend } from "@tabler/icons-react";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName?: string;
}

export default function SubscriptionModal({ isOpen, onClose, itemName }: SubscriptionModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here we would typically send the data to an API
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 3000);
  };

  const whatsappMessage = `مرحباً، أود الاشتراك في: ${itemName || "إحدى الباقات"}`;
  const whatsappUrl = `https://wa.me/966507806516?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      dir="rtl"
    >
      <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border fade-up pop">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h3 className="font-bold text-lg text-text">تأكيد الاشتراك</h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors p-1 rounded-full hover:bg-bg"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="p-6">
          {itemName && (
            <p className="text-text-muted mb-6 text-sm text-center">
              لقد اخترت: <span className="font-bold text-primary">{itemName}</span>
            </p>
          )}

          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-accent-teal-light text-accent-teal rounded-full flex items-center justify-center mx-auto mb-4">
                <IconSend size={32} />
              </div>
              <h4 className="font-bold text-lg mb-2">تم إرسال طلبك بنجاح!</h4>
              <p className="text-text-muted text-sm">سيتواصل معك فريقنا في أقرب وقت لإتمام عملية الاشتراك.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Option 1: WhatsApp */}
              <div className="text-center">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 px-4 rounded-xl font-bold transition-all transform hover:scale-[1.02]"
                >
                  <IconBrandWhatsapp className="ml-2" />
                  الاشتراك السريع عبر واتساب
                </a>
                <p className="text-xs text-text-muted mt-2">الطريقة الأسرع لتفعيل حسابك</p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-text-muted">أو اترك بياناتك لنتواصل معك</span>
                </div>
              </div>

              {/* Option 2: Contact Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">الاسم الكريم</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-bg border border-border text-text rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    placeholder="اكتب اسمك هنا..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">رقم الهاتف (للتواصل)</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-bg border border-border text-text rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-left"
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-xl font-bold transition-colors"
                >
                  إرسال الطلب
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
