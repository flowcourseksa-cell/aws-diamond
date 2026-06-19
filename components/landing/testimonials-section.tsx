import React from "react";
import { IconStarFilled, IconQuote } from "@tabler/icons-react";

export default function TestimonialsSection() {
  const reviews = [
    {
      name: "عبدالملك العنزي",
      text: "شكراً لمنصة فلو، الدورة التأسيسية كانت شاملة ومفهومة جداً وجبت درجة عالية بفضل الله ثم فضلكم.",
      stars: 5,
      bg: "bg-indigo-50"
    },
    {
      name: "ريما محمد",
      text: "مررره رهيببببين وترا جبت درجة عالية ماشاءالله، وأنا ما ذاكرت إلا من عندكم، الأساتذة كثيرين وبيلقون اللي يناسبهم، شرح غير طبيعي.",
      stars: 5,
      bg: "bg-purple-50"
    },
    {
      name: "غلا",
      text: "تجنننن أحسها اختصرت علي مراااا وقت وجهد، الملازم مرتبة تفتح النفس للمذاكرة.",
      stars: 5,
      bg: "bg-amber-50"
    }
  ];

  return (
    <section className="py-24 bg-slate-50 px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-white to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16 fade-up">
          <span className="text-amber-500 font-bold tracking-wider uppercase text-sm mb-2 block">شركاء النجاح</span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-800">
            ماذا يقول <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">الأبطال</span>؟
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {reviews.map((rev, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 fade-up relative group">
              <IconQuote size={60} className="text-slate-100 absolute top-6 right-6 transform rotate-180 group-hover:text-indigo-50 transition-colors duration-500" />
              
              <div className="flex gap-1 text-amber-400 mb-6 relative z-10">
                {[...Array(rev.stars)].map((_, i) => (
                  <IconStarFilled key={i} size={20} />
                ))}
              </div>
              
              <p className="text-slate-600 font-medium leading-relaxed mb-8 relative z-10 text-lg min-h-[100px]">
                "{rev.text}"
              </p>
              
              <div className="flex items-center gap-4 border-t border-slate-100 pt-6">
                <div className={`w-14 h-14 ${rev.bg} rounded-full flex items-center justify-center text-2xl shadow-inner border border-white`}>
                  👨‍🎓
                </div>
                <div>
                  <span className="font-bold text-slate-800 text-lg block">{rev.name}</span>
                  <span className="text-sm text-slate-400 font-medium">طالب في منصة فلو</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center fade-up delay-2">
          <button className="bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-600 font-black px-10 py-4 rounded-full transition-all duration-300 flex items-center gap-3 shadow-sm hover:shadow-md">
            عرض المزيد من التجارب <span className="transform rotate-180 inline-block">➔</span>
          </button>
        </div>
      </div>
    </section>
  );
}
