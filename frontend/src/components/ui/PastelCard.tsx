import React from "react";

import { cn } from "@/lib/utils";

export type PastelTone = "pistachio" | "butter" | "lavender" | "peach" | "forest";

interface PastelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone: PastelTone;
  eyebrow?: string;
  title: string;
  description: string;
  illustration?: React.ReactNode;
  footer?: React.ReactNode;
}

const TONE_STYLES: Record<
  PastelTone,
  { container: string; eyebrow: string; text: string; muted: string }
> = {
  pistachio: {
    container: "bg-pistachio border-[#C5D89B]",
    eyebrow: "bg-surface/85 text-forest border-[#B7CC8B]",
    text: "text-ink",
    muted: "text-[#3B4A38]",
  },
  butter: {
    container: "bg-butter border-[#E6CA75]",
    eyebrow: "bg-surface/85 text-[#4E3E12] border-[#DEC168]",
    text: "text-ink",
    muted: "text-[#57491C]",
  },
  lavender: {
    container: "bg-lavender border-[#C7BDE4]",
    eyebrow: "bg-surface/85 text-[#372E5B] border-[#BAB0DA]",
    text: "text-ink",
    muted: "text-[#473E6B]",
  },
  peach: {
    container: "bg-peach border-[#E3B29B]",
    eyebrow: "bg-surface/85 text-[#5D2C1A] border-[#D7A48C]",
    text: "text-ink",
    muted: "text-[#5C3A2C]",
  },
  forest: {
    container: "bg-forest border-[#1F3B2D]",
    eyebrow: "bg-[#365E4A] text-[#F8F6F0] border-[#4A7560]",
    text: "text-[#FFFDF8]",
    muted: "text-[#D9E8B5]",
  },
};

export function PastelCard({
  tone,
  eyebrow,
  title,
  description,
  illustration,
  footer,
  className,
  children,
  ...props
}: PastelCardProps) {
  const styles = TONE_STYLES[tone];

  return (
    <article
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6 sm:p-7 transition-transform duration-200 hover:-translate-y-0.5",
        styles.container,
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          {eyebrow ? (
            <span
              className={cn(
                "inline-block rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-[0.1em]",
                styles.eyebrow
              )}
            >
              {eyebrow}
            </span>
          ) : null}
          <h3 className={cn("font-editorial text-2xl leading-snug sm:text-[28px]", styles.text)}>
            {title}
          </h3>
          <p className={cn("text-[14px] sm:text-[15px] font-medium leading-relaxed", styles.muted)}>
            {description}
          </p>
        </div>

        {illustration ? (
          <div className="shrink-0 opacity-95">{illustration}</div>
        ) : null}
      </div>

      {children ? <div className="mt-5">{children}</div> : null}
      {footer ? <div className="mt-6 pt-3">{footer}</div> : null}
    </article>
  );
}
