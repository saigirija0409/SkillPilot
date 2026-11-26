import React from "react";

import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  italicWord?: string;
  description?: string;
  badge?: string;
  action?: React.ReactNode;
  divided?: boolean;
  className?: string;
}

export function SectionHeading({
  title,
  italicWord,
  description,
  badge,
  action,
  divided = false,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        divided && "border-b border-line pb-4",
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="font-editorial text-2xl leading-tight text-ink sm:text-[28px]">
            {title}{" "}
            {italicWord ? (
              <span className="italic text-forest">{italicWord}</span>
            ) : null}
          </h2>
          {badge ? (
            <span className="rounded-full border border-line bg-surface-muted px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
              {badge}
            </span>
          ) : null}
        </div>

        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
