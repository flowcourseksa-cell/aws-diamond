"use client";

import React from "react";
import { IconTicket, IconDiscountCheckFilled } from "@tabler/icons-react";

interface Offer {
  id: string;
  title: string;
  description: string;
  discountBadge: string;
  features: string[];
}

const OFFERS: Offer[] = [
  {
    id: "offer-1",
    title: "الباقة الشاملة (قدرات + تحصيلي)",
    description: "تأسيس وتدريب مكثف يضمن لك الدرجة العالية في الاختبارين بأفضل سعر.",
    discountBadge: "خصم ٤٠٪",
    features: ["دورة القدرات الكمي واللفظي", "دورة التحصيلي (المسار العلمي)", "نماذج اختبارات محاكية", "متابعة مستمرة مع المعلمين"],
  },
  {
    id: "offer-2",
    title: "تذكرة التأسيس المبكر",
    description: "احجز مقعدك الآن للدورات القادمة واستفد من سعر التذكرة المخفض.",
    discountBadge: "لفترة محدودة",
    features: ["تأسيس من الصفر", "ملازم حصرية مطبوعة", "جروب تلجرام مخصص لأسئلتك", "صلاحية الوصول لمدة سنة"],
  },
];

interface OffersSectionProps {
  onSubscribe: (offerName: string) => void;
}

export default function OffersSection({ onSubscribe }: OffersSectionProps) {
  return (
    <section id="offers" className="py-20 bg-card px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 fade-up">
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-text mb-4">العروض وتذاكر الخصم</h2>
            <p className="text-text-muted text-lg max-w-xl">
              لا تفوت فرصتك! استفد من العروض الحالية والباقات المجمعة التي توفر عليك الكثير.
            </p>
          </div>
          <div className="hidden md:flex w-24 h-24 bg-accent-amber-light rounded-full items-center justify-center text-accent-amber transform -rotate-12">
            <IconTicket size={48} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {OFFERS.map((offer, index) => (
            <div
              key={offer.id}
              className={`relative bg-bg rounded-3xl p-8 border-2 border-primary/20 hover:border-primary transition-colors overflow-hidden group fade-up delay-${(index % 2) + 1}`}
            >
              {/* Background gradient hint */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

              <div className="flex justify-between items-start mb-6 relative z-10">
                <h3 className="text-2xl font-black text-text w-3/4">{offer.title}</h3>
                <span className="bg-accent-red-light text-accent-red font-bold px-3 py-1 rounded-full text-sm whitespace-nowrap">
                  {offer.discountBadge}
                </span>
              </div>
              
              <p className="text-text-muted mb-8 relative z-10">
                {offer.description}
              </p>

              <div className="space-y-3 mb-8 relative z-10">
                {offer.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <IconDiscountCheckFilled className="text-primary" size={20} />
                    <span className="text-text font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onSubscribe(offer.title)}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl transition-transform transform group-hover:scale-[1.02] relative z-10 shadow-lg shadow-primary/20"
              >
                تفعيل العرض
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

