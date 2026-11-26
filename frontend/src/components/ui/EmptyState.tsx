import React from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  illustration?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  illustration,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface/75 px-6 py-12 text-center",
        className
      )}
    >
      {illustration ? (
        <div className="mb-5">{illustration}</div>
      ) : null}

      <h3 className="font-editorial text-[26px] sm:text-3xl text-ink">{title}</h3>
      <p className="mt-2.5 max-w-lg text-[15px] leading-relaxed text-muted">
        {description}
      </p>

      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
