"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { IconLogout2, IconX, IconIdBadge, IconAlertCircle } from "@tabler/icons-react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";

// Reusable logout confirmation that REQUIRES the user's student ID.
// The user can never be signed out without re-entering their ID.
export function LogoutConfirmModal({
  open,
  onClose,
  expectedId,
}: {
  open: boolean;
  onClose: () => void;
  expectedId: string;
}) {
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  async function handleConfirm() {
    if (!studentId || !expectedId) {
      setError(true);
      return;
    }
    
    setLoading(true);
    setError(false);

    if (studentId.trim().toUpperCase() !== expectedId.toUpperCase()) {
      setError(true);
      setLoading(false);
      return;
    }

    // Success -> Sign Out
    const supabase = createClient();
    await supabase.auth.signOut();
    
    // Clear local storage
    localStorage.removeItem("flow-logged-in");
    localStorage.removeItem("flow-user-role");
    
    window.location.href = "/login";
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="scale-in w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-accent-red font-black text-xl tracking-tight">
            <IconLogout2 size={24} /> تأكيد تسجيل الخروج
          </div>
          <button onClick={onClose} disabled={loading} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50">
            <IconX size={18} />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-6 font-bold leading-relaxed">
          لحماية حسابك وبياناتك، يُرجى إدخال <strong className="text-slate-700">الرقم التعريفي الخاص بك (ID)</strong> لتأكيد عملية الخروج.
        </p>

        <div className="relative mb-3">
          <IconIdBadge size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={studentId}
            autoFocus
            onChange={(e) => {
              setStudentId(e.target.value);
              if (error) setError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirm();
            }}
            placeholder="مثال: TKH-A1B2C3D4"
            className={`h-14 w-full rounded-2xl border-2 bg-slate-50 pr-12 pl-4 text-center font-mono text-lg font-bold text-slate-800 outline-none transition-all focus:bg-white focus:shadow-sm ${
              error ? "border-accent-red" : "border-slate-100 focus:border-indigo-500"
            }`}
            dir="ltr"
          />
        </div>
        {error && (
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-accent-red bg-accent-red/10 rounded-lg py-2 px-3 mb-2 animate-fade-in-up">
            <IconAlertCircle size={16} /> الرقم التعريفي غير صحيح
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-12 rounded-2xl border-2 border-slate-100 font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl bg-accent-red font-black text-white hover:bg-accent-red/90 disabled:opacity-60 transition-colors shadow-lg shadow-accent-red/20"
          >
            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {loading ? "جاري الخروج..." : "تأكيد الخروج"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
