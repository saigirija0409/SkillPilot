import React from "react";
import { CheckCircle2, Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type SkillChipStatus = "verified" | "self_reported" | "inferred" | "gap";

interface SkillChipProps {
  name: string;
  level?: number;
  status?: SkillChipStatus;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

const CHIP_STYLES: Record<SkillChipStatus, string> = {
  verified:
    "border-[var(--status-verified-border)] bg-[var(--status-verified-bg)] text-[var(--status-verified-text)]",
  self_reported:
    "border-line-strong bg-surface text-ink",
  inferred:
    "border-[var(--status-inferred-border)] bg-[var(--status-inferred-bg)] text-[var(--status-inferred-text)]",
  gap:
    "border-[var(--status-attention-border)] bg-[var(--status-attention-bg)] text-[var(--status-attention-text)]",
};

export function SkillChip({
  name,
  level,
  status = "self_reported",
  onRemove,
  onClick,
  className,
}: SkillChipProps) {
  const interactive = Boolean(onClick);
  const content = (
    <>
      {status === "verified" ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : status === "inferred" ? (
        <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : null}

      <span className="font-semibold">{name}</span>

      {typeof level === "number" ? (
        <span className="rounded-full bg-canvas/90 px-2 py-0.5 text-xs font-bold tracking-tight text-ink">
          L{level}
        </span>
      ) : null}

      {onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${name}`}
          className="ml-0.5 rounded-full p-0.5 transition hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-forest cursor-pointer"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </>
  );

  const sharedClasses = cn(
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium transition",
    CHIP_STYLES[status],
    interactive && "hover:brightness-[0.97] cursor-pointer",
    className
  );

  if (interactive) {
    return (
      <button type="button" onClick={onClick} className={sharedClasses}>
        {content}
      </button>
    );
  }

  return <span className={sharedClasses}>{content}</span>;
}
