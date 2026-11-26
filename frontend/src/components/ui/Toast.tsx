"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type ToastTone = "success" | "info" | "warning";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
}

interface ToastContextValue {
  pushToast: (toast: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_STYLES: Record<ToastTone, { box: string; icon: React.ReactNode }> = {
  success: {
    box: "border-[#BDD3C1] bg-surface text-ink",
    icon: <CheckCircle2 className="h-4 w-4 text-forest shrink-0" />,
  },
  info: {
    box: "border-[#C7BDE4] bg-surface text-ink",
    icon: <Info className="h-4 w-4 text-[#4B3D78] shrink-0" />,
  },
  warning: {
    box: "border-[#E3B29B] bg-surface text-ink",
    icon: <AlertTriangle className="h-4 w-4 text-[#9D4A2A] shrink-0" />,
  },
};

export function ToastBanner({
  title,
  description,
  tone = "info",
  onDismiss,
  className,
}: {
  title: string;
  description?: string;
  tone?: ToastTone;
  onDismiss?: () => void;
  className?: string;
}) {
  const style = TOAST_STYLES[tone];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start justify-between gap-3 rounded-2xl border px-4 py-3.5 shadow-[var(--shadow-elevated)]",
        style.box,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{style.icon}</div>
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-ink">{title}</p>
          {description ? (
            <p className="text-xs leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
      </div>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="rounded-md p-1 text-muted transition hover:bg-surface-muted hover:text-ink cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
      setTimeout(() => {
        dismiss(id);
      }, 4200);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto"
            >
              <ToastBanner
                title={item.title}
                description={item.description}
                tone={item.tone}
                onDismiss={() => dismiss(item.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside a ToastProvider");
  }
  return ctx;
}
