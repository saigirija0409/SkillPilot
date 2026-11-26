"use client";

import React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface OptionCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  icon?: React.ReactNode;
  badge?: string;
  accent?: "forest" | "pistachio" | "lavender" | "peach";
  disabled?: boolean;
  className?: string;
}

const SELECTED_ACCENTS = {
  forest: "border-forest bg-forest-soft",
  pistachio: "border-forest bg-pistachio/55",
  lavender: "border-[#5D4E8E] bg-lavender/55",
  peach: "border-[#9D5337] bg-peach/45",
};

export function OptionCard({
  title,
  description,
  selected,
  onSelect,
  icon,
  badge,
  accent = "forest",
  disabled = false,
  className,
}: OptionCardProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "group flex w-full items-start justify-between gap-4 rounded-2xl border p-5 text-left transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-not-allowed disabled:opacity-55 cursor-pointer",
        selected
          ? SELECTED_ACCENTS[accent]
          : "border-line bg-surface hover:border-line-strong hover:bg-surface-muted/60",
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        {icon ? (
          <div
            className={cn(
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
              selected
                ? "border-forest/20 bg-surface text-forest"
                : "border-line bg-surface-muted text-muted"
            )}
          >
            {icon}
          </div>
        ) : null}

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink">{title}</span>
            {badge ? (
              <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[11px] font-medium text-muted">
                {badge}
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="text-xs leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
      </div>

      <span
        aria-hidden="true"
        className={cn(
          "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected
            ? "border-forest bg-forest text-[#FFFDF8]"
            : "border-line-strong bg-surface text-transparent group-hover:border-forest/50"
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    </button>
  );
}
