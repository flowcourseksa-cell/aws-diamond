"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconUser, IconIdBadge, IconMail, IconArrowRight } from "@tabler/icons-react";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ full_name: string; id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const { data: userProfile } = await supabase
          .from("profiles")
          .select("full_name, id")
          .eq("id", session.user.id)
          .single();

        if (userProfile) {
          setProfile({
            full_name: userProfile.full_name,
            id: userProfile.id,
            email: session.user.email || ""
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-3xl font-black mb-4">الملف الشخصي غير موجود</h1>
        <button onClick={() => router.push("/")} className="px-6 py-3 bg-primary text-white font-bold rounded-xl">
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const studentCode = `TKH-${profile.id.split('-')[0].toUpperCase()}`;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-bg font-sans" dir="rtl">
      <div className="w-full max-w-xl bg-card rounded-3xl border border-border shadow-2xl p-8 relative overflow-hidden">
        
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary to-accent-teal opacity-10" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-6 shadow-xl border-4 border-bg">
            <IconUser size={48} />
          </div>

          <h1 className="text-3xl font-black text-text mb-2">{profile.full_name}</h1>
          <p className="text-text-muted font-medium mb-8 flex items-center gap-2">
            <IconMail size={18} />
            {profile.email}
          </p>

          <div className="w-full bg-bg border border-border rounded-2xl p-6 mb-8 text-center shadow-inner">
            <div className="flex items-center justify-center gap-3 mb-2 text-text-muted">
              <IconIdBadge size={24} className="text-accent-amber" />
              <span className="font-bold">الرقم التعريفي الخاص بك</span>
            </div>
            <div className="text-3xl md:text-4xl font-black tracking-widest text-primary font-mono mt-3" dir="ltr">
              {studentCode}
            </div>
            <p className="text-xs text-text-muted mt-4 font-semibold">
              يُرجى الاحتفاظ بهذا الرقم، سيُطلب منك عند التواصل مع الإدارة للتفعيل.
            </p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="w-full py-4 rounded-xl font-black text-lg bg-primary text-white shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
          >
            الذهاب للرئيسية
            <IconArrowRight size={20} />
          </button>
        </div>

      </div>
    </div>
  );
}
