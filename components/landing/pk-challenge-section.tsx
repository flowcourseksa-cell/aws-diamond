"use client";

import Link from "next/link";
import { IconSwords, IconRobot, IconBolt, IconTrophy, IconFlame } from "@tabler/icons-react";
import { useAuth } from "@/hooks/use-auth";

export default function PkChallengeSection() {
  const { user } = useAuth();

  return (
    <section className="relative py-24 overflow-hidden bg-bg">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-20 left-20 w-32 h-32 bg-accent-amber/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-right space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-amber/10 text-accent-amber font-bold text-sm border border-accent-amber/20 mb-4">
              <IconFlame size={18} />
              ميزة جديدة وحصرية
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black text-text leading-tight">
              أثبت مهارتك في <span className="shimmer-text text-primary">تحدي الأبطال</span> ⚔️
            </h2>
            
            <p className="text-lg text-text-muted leading-relaxed max-w-2xl mx-auto lg:mx-0">
              ادخل في مواجهات مباشرة (PK) مع طلاب آخرين في أسئلة عشوائية من الكمي، اللفظي، والإدراكي. وإذا لم يتوفر منافس، ستواجه <strong className="text-accent-teal">المحاكي الذكي</strong> الذي يتكيف مع مستواك!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Link
                href={user ? "/challenge" : "/login?callbackUrl=/challenge"}
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-l from-primary to-violet-500 text-white rounded-2xl font-black text-lg overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_-10px_var(--primary)] hover:shadow-[0_0_60px_-10px_var(--primary)]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <IconSwords size={24} className="relative z-10 group-hover:rotate-12 transition-transform" />
                <span className="relative z-10">ابدأ التحدي الآن</span>
              </Link>
            </div>

            {/* Features List */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-8 border-t border-border mt-8">
              <div className="flex flex-col items-center lg:items-start gap-2">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <IconBolt size={24} />
                </div>
                <div className="font-bold text-sm">مواجهات سريعة</div>
                <div className="text-xs text-text-muted text-center lg:text-right">10 أسئلة، 25 ثانية لكل سؤال</div>
              </div>
              <div className="flex flex-col items-center lg:items-start gap-2">
                <div className="p-3 rounded-xl bg-accent-teal/10 text-accent-teal">
                  <IconRobot size={24} />
                </div>
                <div className="font-bold text-sm">محاكي ذكي</div>
                <div className="text-xs text-text-muted text-center lg:text-right">يلعب ضدك بسرعات ودقة واقعية</div>
              </div>
              <div className="flex flex-col items-center lg:items-start gap-2">
                <div className="p-3 rounded-xl bg-accent-amber/10 text-accent-amber">
                  <IconTrophy size={24} />
                </div>
                <div className="font-bold text-sm">متعة وتنافس</div>
                <div className="text-xs text-text-muted text-center lg:text-right">اجمع النقاط وأثبت جدارتك</div>
              </div>
            </div>
          </div>

          {/* Visual Mockup */}
          <div className="flex-1 w-full max-w-lg relative">
            <div className="relative z-10 transform -rotate-2 hover:rotate-0 transition-transform duration-700">
              <div className="animated-border p-[2px] rounded-3xl">
                <div className="bg-card border border-border rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
                  {/* Mockup Header */}
                  <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-primary flex items-center justify-center text-white font-bold text-xs border-2 border-white/10 shadow-lg">
                        أنت
                      </div>
                      <span className="font-bold text-sm text-text">0 نقطة</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-2xl font-black text-primary">00:25</div>
                      <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">السؤال 1 / 10</div>
                    </div>
                    <div className="flex items-center gap-3 flex-row-reverse">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xs border-2 border-white/10 shadow-lg">
                        بوت
                      </div>
                      <span className="font-bold text-sm text-text">0 نقطة</span>
                    </div>
                  </div>
                  
                  {/* Mockup Question */}
                  <div className="text-center py-6">
                    <div className="inline-block px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-xs font-bold mb-4">
                      قسم كمي
                    </div>
                    <p className="text-lg font-bold text-text leading-relaxed">
                      إذا كان سعر 3 أقلام هو 15 ريالاً، فكم سعر 7 أقلام من نفس النوع؟
                    </p>
                  </div>

                  {/* Mockup Options */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {["35 ريال", "30 ريال", "21 ريال", "45 ريال"].map((opt, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-bold ${i === 0 ? "border-accent-teal/40 bg-accent-teal/10 text-accent-teal" : "border-border bg-sidebar/50 text-text opacity-60"}`}>
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-black ${i === 0 ? "bg-accent-teal text-white" : "bg-primary/10 text-primary"}`}>
                          {["أ", "ب", "ج", "د"][i]}
                        </div>
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Glowing orb behind mockup */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/20 blur-[80px] rounded-full -z-10" />
          </div>

        </div>
      </div>
    </section>
  );
}
