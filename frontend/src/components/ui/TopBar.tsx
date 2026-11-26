"use client";

import React from "react";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";

interface TopBarProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu?: () => void;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  className?: string;
}

export function TopBar({
  title,
  subtitle,
  onOpenMobileMenu,
  leftSlot,
  rightSlot,
  className,
}: TopBarProps) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 border-b border-line bg-surface/90 px-5 py-3.5 backdrop-blur-sm sm:px-7",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {onOpenMobileMenu ? (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="inline-flex lg:hidden h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-ink hover:bg-surface-muted cursor-pointer"
          >
            <Menu className="h-4 w-4" />
          </button>
        ) : null}

        {leftSlot}

        <div>
          <p className="font-editorial text-xl leading-none text-ink sm:text-2xl">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>

      {rightSlot ? (
        <div className="flex flex-wrap items-center gap-2.5">{rightSlot}</div>
      ) : null}
    </header>
  );
}
