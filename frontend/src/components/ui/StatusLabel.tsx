import React from "react";

import { cn } from "@/lib/utils";

export type StatusTone =
  | "verified"
  | "in_progress"
  | "inferred"
  | "self_reported"
  | "attention"
  | "neutral";

interface StatusLabelProps {
  tone?: StatusTone;
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

const TONE_MAP: Record<StatusTone, { pill: string; dot: string }> = {
  verified: {
    pill: "bg-[var(--status-verified-bg)] text-[var(--status-verified-text)] border-[var(--status-verified-border)]",
    dot: "bg-[#294C3B]",
  },
  in_progress: {
    pill: "bg-[var(--status-progress-bg)] text-[var(--status-progress-text)] border-[var(--status-progress-border)]",
    dot: "bg-[#B5891E]",
  },
  inferred: {
    pill: "bg-[var(--status-inferred-bg)] text-[var(--status-inferred-text)] border-[var(--status-inferred-border)]",
    dot: "bg-[#5D4E8E]",
  },
  self_reported: {
    pill: "bg-surface-muted text-ink border-line-strong",
    dot: "bg-muted",
  },
  attention: {
    pill: "bg-[var(--status-attention-bg)] text-[var(--status-attention-text)] border-[var(--status-attention-border)]",
    dot: "bg-[#B25432]",
  },
  neutral: {
    pill: "bg-surface text-muted border-line",
    dot: "bg-line-strong",
  },
};

export function StatusLabel({
  tone = "neutral",
  label,
  icon,
  className,
}: StatusLabelProps) {
  const styles = TONE_MAP[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs sm:text-[13px] font-semibold",
        styles.pill,
        className
      )}
    >
      {icon ? (
        <span className="shrink-0" aria-hidden="true">
          {icon}
        </span>
      ) : (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", styles.dot)}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </span>
  );
}
