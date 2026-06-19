"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import {
  IconCircleCheck,
  IconAlertTriangle,
  IconX,
} from "@tabler/icons-react";

type ToastType = "success" | "warning" | "error";

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, ReactNode> = {
  success: <IconCircleCheck size={18} />,
  warning: <IconAlertTriangle size={18} />,
  error: <IconX size={18} />,
};

const COLORS: Record<ToastType, string> = {
  success: "text-accent-teal",
  warning: "text-accent-amber",
  error: "text-accent-red",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-5 right-5 z-100 flex flex-col gap-2.5">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`fade-up flex min-w-60 items-center gap-2.5 rounded-xl border border-border bg-card px-4.5 py-3.5 text-[13.5px] font-bold shadow-[0_8px_24px_rgba(15,17,23,0.08)] ${COLORS[toast.type]}`}
          >
            {ICONS[toast.type]}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast يجب أن يُستخدم داخل ToastProvider");
  }
  return ctx;
}
