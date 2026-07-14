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
  action?: { label: string; onClick: () => void };
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType, action?: { label: string; onClick: () => void }) => void;
  removeToast: (id: number) => void;
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

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success", action?: { label: string; onClick: () => void }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, action }]);
    
    // Auto-dismiss only if there is no action requiring user interaction
    if (!action) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="fixed top-5 right-5 z-100 flex flex-col gap-2.5">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`fade-up flex min-w-60 flex-col gap-2 rounded-xl border border-border bg-card px-4.5 py-3.5 text-[13.5px] font-bold shadow-[0_8px_24px_rgba(15,17,23,0.08)] ${COLORS[toast.type]}`}
          >
            <div className="flex items-center gap-2.5">
              {ICONS[toast.type]}
              <span>{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="mr-auto text-text-muted hover:text-text transition-colors">
                 <IconX size={16} />
              </button>
            </div>
            {toast.action && (
              <button 
                onClick={() => { toast.action!.onClick(); removeToast(toast.id); }} 
                className="mt-1 w-full rounded-lg bg-primary/10 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
              >
                 {toast.action.label}
              </button>
            )}
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

