"use client";

import { useState } from "react";
import { IconLogout2, IconX, IconLock, IconAlertCircle } from "@tabler/icons-react";
import { useAuth } from "@/hooks/use-auth";

// Reusable logout confirmation that REQUIRES the user's password.
// The user can never be signed out without re-entering their password.
export function LogoutConfirmModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleConfirm() {
    if (!password) {
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    const ok = await signOut(password);
    if (ok) {
      window.location.href = "/login";
    } else {
      setError(true);
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="scale-in w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-premium" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-accent-red font-black text-lg">
            <IconLogout2 size={22} /> تأكيد تسجيل الخروج
          </div>
          <button onClick={onClose} disabled={loading} className="text-text-muted hover:text-text disabled:opacity-50">
            <IconX size={18} />
          </button>
        </div>

        <p className="text-sm text-text-muted mb-4 font-semibold">
          لحماية حسابك، أدخل كلمة المرور الخاصة بك لتأكيد الخروج.
        </p>

        <div className="relative mb-2">
          <IconLock size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
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
            placeholder="••••••••"
            className={`h-12 w-full rounded-xl border bg-bg pr-10 pl-4 text-sm text-text outline-none transition-all focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)] ${
              error ? "border-accent-red" : "border-border focus:border-primary"
            }`}
          />
        </div>
        {error && (
          <span className="flex items-center gap-1 text-xs font-semibold text-accent-red mb-2">
            <IconAlertCircle size={14} /> كلمة المرور غير صحيحة أو فارغة
          </span>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-11 rounded-xl border border-border font-bold text-sm text-text-muted hover:text-text disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-accent-red font-bold text-sm text-white hover:bg-accent-red/90 disabled:opacity-60"
          >
            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {loading ? "جاري التحقق..." : "تأكيد الخروج"}
          </button>
        </div>
      </div>
    </div>
  );
}
