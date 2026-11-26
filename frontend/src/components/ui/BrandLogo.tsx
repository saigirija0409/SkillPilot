import React from "react";

import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
}

const MARK_SIZES = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const WORDMARK_SIZES = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
};

export function BrandLogo({
  size = "md",
  showWordmark = true,
  subtitle,
  className,
}: BrandLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <svg
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(MARK_SIZES[size], "shrink-0")}
        aria-hidden="true"
      >
        <rect
          x="1"
          y="1"
          width="42"
          height="42"
          rx="12"
          fill="#294C3B"
          stroke="#202622"
          strokeOpacity="0.08"
        />
        <circle cx="31" cy="13" r="5" fill="#F9DF91" />
        <path
          d="M12 31C12 22.1634 19.1634 15 28 15H31"
          stroke="#D9E8B5"
          strokeWidth="2.75"
          strokeLinecap="round"
        />
        <path
          d="M19 29L25.5 20.5L23.5 29.5L19 29Z"
          fill="#FFFDF8"
        />
      </svg>

      {showWordmark ? (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "font-editorial tracking-tight text-ink",
              WORDMARK_SIZES[size]
            )}
          >
            Skill<span className="italic text-forest">Pilot</span>
          </span>
          {subtitle ? (
            <span className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
              {subtitle}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
