import React from "react";

import { cn } from "@/lib/utils";

interface EditorialHeadingProps {
  eyebrow?: string;
  title: string;
  italicAccent?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function EditorialHeading({
  eyebrow,
  title,
  italicAccent,
  subtitle,
  actions,
  className,
}: EditorialHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="max-w-3xl space-y-3">
        {eyebrow ? (
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1 text-xs sm:text-[13px] font-semibold uppercase tracking-[0.12em] text-forest">
            <span className="h-1.5 w-1.5 rounded-full bg-forest" aria-hidden="true" />
            {eyebrow}
          </p>
        ) : null}

        <h1 className="font-editorial text-[34px] leading-[1.08] tracking-tight text-ink sm:text-[42px] lg:text-[46px]">
          {title}{" "}
          {italicAccent ? (
            <span className="italic text-forest">{italicAccent}</span>
          ) : null}
        </h1>

        {subtitle ? (
          <p className="text-[15px] leading-relaxed text-muted sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
