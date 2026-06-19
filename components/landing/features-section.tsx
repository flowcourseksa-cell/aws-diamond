import React from "react";
import { IconDeviceMobile, IconCoin, IconEye, IconBooks } from "@tabler/icons-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: <IconDeviceMobile size={40} stroke={1.5} />,
      title: "موقع وتطبيق خاص",
      desc: "منصة ذكية متكاملة تجمع كل ما تحتاجه في مكان واحد بأعلى معايير التقنية.",
      gradient: "from-purple-500 to-indigo-500",
      bgLight: "bg-indigo-50",
      textColor: "text-indigo-600"
    },
    {
      icon: <IconCoin size={40} stroke={1.5} />,
      title: "باقات تنافسية",
      desc: "استثمارك الأفضل للمستقبل، جودة عالمية بأسعار تناسب الجميع.",
      gradient: "from-amber-400 to-orange-500",
      bgLight: "bg-amber-50",
      textColor: "text-amber-600"
    },
    {
      icon: <IconEye size={40} stroke={1.5} />,
      title: "تجربة بصرية مذهلة",
      desc: "تصميم هندسي يريح العين ويحفز العقل لساعات من المذاكرة الممتعة.",
      gradient: "from-emerald-400 to-teal-500",
      bgLight: "bg-teal-50",
      textColor: "text-teal-600"
    },
    {
      icon: <IconBooks size={40} stroke={1.5} />,
      title: "شمولية المنهج",
      desc: "تأسيس عميق، تجميعات حصرية، وشروحات تغنيك عن أي مصدر آخر.",
      gradient: "from-rose-400 to-pink-500",
      bgLight: "bg-rose-50",
      textColor: "text-rose-600"
    }
  ];

  return (
    <section className="py-24 bg-white px-4 relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16 fade-up">
          <span className="text-indigo-600 font-bold tracking-wider uppercase text-sm mb-2 block">لماذا نحن؟</span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-800">
            ما الذي يميز <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500">فلو</span>؟
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feat, idx) => (
            <div 
              key={idx} 
              className="group bg-white rounded-[2.5rem] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 relative overflow-hidden"
            >
              {/* Background Blob on Hover */}
              <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${feat.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
              
              <div className={`mb-6 w-20 h-20 rounded-3xl flex items-center justify-center bg-gradient-to-br ${feat.gradient} text-white shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                {feat.icon}
              </div>
              
              <h4 className="text-xl font-black mb-4 text-slate-800">{feat.title}</h4>
              <p className="text-slate-500 font-medium leading-relaxed">
                {feat.desc}
              </p>
              
              {/* Decorative bottom line */}
              <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent group-hover:w-full transition-all duration-700"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
