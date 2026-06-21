"use client";

import { useState } from "react";
import { IconLogout2, IconX, IconLock, IconAlertCircle } from "@tabler/icons-react";

export function AdminLogoutModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function handleConfirm() {
    if (!password) {
      setError(true);
      return;
    }
    
    setLoading(true);
    setError(false);

    // Validate Admin Password (currently hardcoded as "0000" in admin-shell)
    if (password !== "0000") {
      setError(true);
      setLoading(false);
      return;
    }

    // Success -> Sign Out Admin
    localStorage.removeItem("admin_secret_token");
    window.location.reload();
  }

  return (
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
          يرجى إدخال <strong className="text-slate-700">الرمز السري للإدارة</strong> لتأكيد خروجك من البوابة السرية.
        </p>

        <div className="relative mb-3">
          <IconLock size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="password"
            value={password}
            autoFocus
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirm();
            }}
            placeholder="الرقم السري..."
            className={`h-14 w-full rounded-2xl border-2 bg-slate-50 pr-12 pl-4 text-center font-mono text-lg font-bold text-slate-800 outline-none transition-all focus:bg-white focus:shadow-sm ${
              error ? "border-accent-red" : "border-slate-100 focus:border-indigo-500"
            }`}
            dir="ltr"
          />
        </div>
        {error && (
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-accent-red bg-accent-red/10 rounded-lg py-2 px-3 mb-2 animate-fade-in-up">
            <IconAlertCircle size={16} /> الرقم السري غير صحيح
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-12 rounded-xl bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 h-12 rounded-xl bg-accent-red text-sm font-bold text-white shadow-lg shadow-accent-red/20 hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? "جاري الخروج..." : "تأكيد الخروج"}
          </button>
        </div>
      </div>
    </div>
  );
}
