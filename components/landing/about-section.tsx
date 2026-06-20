import React from "react";
import { IconMessageCircleFilled, IconQuote } from "@tabler/icons-react";

export default function AboutSection() {
  return (
    <section className="py-24 bg-white px-4 flex flex-col items-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-indigo-100 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-100 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto w-full relative z-10">
        
        {/* Title */}
        <div className="flex items-center justify-center gap-6 mb-20 fade-up">
          <div className="h-1 w-12 bg-gradient-to-r from-transparent to-indigo-600 rounded-full"></div>
          <h2 className="text-5xl md:text-6xl font-black text-slate-800 tracking-tight">مين الأوس الماسية؟</h2>
          <div className="h-1 w-12 bg-gradient-to-l from-transparent to-indigo-600 rounded-full"></div>
        </div>

        {/* Text Box */}
        <div className="relative fade-up delay-1">
          {/* Decorative Icon */}
          <div className="absolute -top-12 -left-8 z-20 transform -rotate-12 drop-shadow-[0_10px_20px_rgba(245,158,11,0.4)] animate-float">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-full p-4 shadow-xl border-4 border-white">
               <IconMessageCircleFilled size={50} className="text-white" />
            </div>
          </div>

          <div className="absolute -bottom-8 -right-8 z-0 opacity-10 text-indigo-600">
            <IconQuote size={180} />
          </div>

          <div className="relative z-10 bg-white rounded-[3rem] p-12 md:p-16 border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
            <p className="text-2xl md:text-3xl text-slate-600 leading-[2.2] text-center font-bold">
              منصة تعليمية تقدم لك رحلة مختلفة في اختبار التحصيلي والقدرات بتوفير ملفات إلكترونية تشمل تأسيساً متكاملاً من الصفر، وتجميعات شاملة، واختبارات محاكية، وشروحات على جميع الملفات، وجداول وخطط متنوعة.
              <br/><br/>
              <span className="text-indigo-600">حرصنا في جميع ملفاتنا</span> على توفير الشمولية والجمالية والمتعة التعليمية. يمكنك الاعتماد بشكل كامل على ملفات الأوس الماسية كونها كتبت ودققت وصممت من قبل فريق من الخبراء، لتغنيك عن أي مصدر آخر ولتوصلك بإذن الله في نهاية هذه الرحلة إلى <span className="bg-amber-400 text-white px-3 py-1 rounded-xl mx-1 shadow-sm">المئوية (100%)</span>.
            </p>

            {/* Stars Decoration */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-2xl px-8 py-3 rounded-2xl flex items-center gap-2 shadow-[0_10px_20px_rgba(79,70,229,0.3)] border-2 border-white">
              <span className="text-amber-400">★</span>
              <span className="text-amber-400">★</span>
              <span className="text-amber-400">★</span>
              <span className="text-amber-400">★</span>
              <span className="text-amber-400">★</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

