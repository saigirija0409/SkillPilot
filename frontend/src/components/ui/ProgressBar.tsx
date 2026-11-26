"use client";

import React from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  tone?: "forest" | "pistachio" | "butter" | "lavender";
  size?: "sm" | "md";
  className?: string;
}

const BAR_COLORS = {
  forest: "bg-forest",
  pistachio: "bg-[#6C9241]",
  butter: "bg-[#C79B2A]",
  lavender: "bg-[#6D5AA3]",
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  tone = "forest",
  size = "md",
  className,
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 100;
  const pct = Math.min(100, Math.max(0, Math.round((value / safeMax) * 100)));

  return (
    <div className={cn("space-y-2", className)}>
      {label || showValue ? (
        <div className="flex items-center justify-between gap-2 text-[13px] sm:text-sm font-semibold">
          {label ? <span className="text-ink">{label}</span> : <span />}
          {showValue ? <span className="text-muted">{pct}%</span> : null}
        </div>
      ) : null}

      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
        className={cn(
          "w-full overflow-hidden rounded-full bg-surface-muted border border-line",
          size === "sm" ? "h-2" : "h-3"
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className={cn("h-full rounded-full", BAR_COLORS[tone])}
        />
      </div>
    </div>
  );
}

interface StepProgressProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function StepProgress({
  steps,
  currentStep,
  className,
}: StepProgressProps) {
  return (
    <nav aria-label="Step progress" className={cn("w-full", className)}>
      <ol className="grid gap-3 sm:grid-cols-4">
        {steps.map((title, index) => {
          const stepNum = index + 1;
          const isComplete = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <li
              key={title}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition-colors",
                isActive && "border-forest bg-forest-soft text-ink",
                isComplete && "border-[#BDD3C1] bg-pistachio/45 text-ink",
                !isActive && !isComplete && "border-line bg-surface text-muted"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  isActive && "bg-forest text-[#FFFDF8]",
                  isComplete && "bg-[#3C6E4D] text-[#FFFDF8]",
                  !isActive && !isComplete && "bg-surface-muted text-muted"
                )}
              >
                {stepNum}
              </span>
              <span className="font-semibold leading-tight">{title}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
