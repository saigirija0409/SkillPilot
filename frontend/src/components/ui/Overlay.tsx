"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

interface BaseOverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

function useEscapeToClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: BaseOverlayProps) {
  useEscapeToClose(open, onClose);

  return (
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/35 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative z-10 w-full max-w-lg rounded-2xl border border-line bg-surface p-6 sm:p-7 shadow-[var(--shadow-elevated)]",
              className
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <div className="space-y-1">
                <h3
                  id="modal-title"
                  className="font-editorial text-2xl leading-snug text-ink"
                >
                  {title}
                </h3>
                {description ? (
                  <p className="text-sm text-muted">{description}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="rounded-lg border border-transparent p-1.5 text-muted transition hover:border-line hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-forest cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5">{children}</div>

            {footer ? (
              <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-line pt-4">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

interface DrawerProps extends BaseOverlayProps {
  side?: "right" | "left";
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  side = "right",
  children,
  footer,
  className,
}: DrawerProps) {
  useEscapeToClose(open, onClose);
  const offsetX = side === "right" ? 360 : -360;

  return (
    <AnimatePresence>
      {open ? (
        <div
          className={cn(
            "fixed inset-0 z-50 flex",
            side === "right" ? "justify-end" : "justify-start"
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/35 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          <motion.aside
            initial={{ x: offsetX }}
            animate={{ x: 0 }}
            exit={{ x: offsetX }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative z-10 flex h-full w-full max-w-md flex-col border-line bg-surface p-6 shadow-[var(--shadow-elevated)]",
              side === "right" ? "border-l" : "border-r",
              className
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <div className="space-y-1">
                <h3
                  id="drawer-title"
                  className="font-editorial text-2xl leading-snug text-ink"
                >
                  {title}
                </h3>
                {description ? (
                  <p className="text-sm text-muted">{description}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="rounded-lg border border-transparent p-1.5 text-muted transition hover:border-line hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-forest cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex-1 overflow-y-auto pr-1">{children}</div>

            {footer ? (
              <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-line pt-4">
                {footer}
              </div>
            ) : null}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
