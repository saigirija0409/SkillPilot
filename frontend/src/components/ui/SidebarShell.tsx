"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { BrandLogo } from "@/components/ui/BrandLogo";
import { cn } from "@/lib/utils";

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface SidebarShellProps {
  items: SidebarNavItem[];
  activeHref: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  portalLabel?: string;
  footer?: React.ReactNode;
  className?: string;
}

export function SidebarShell({
  items,
  activeHref,
  collapsed,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
  portalLabel = "Learner Portal",
  footer,
  className,
}: SidebarShellProps) {
  const navContent = (isCollapsed: boolean) => (
    <div className="flex h-full flex-col justify-between">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-2 px-1">
          <BrandLogo
            size="sm"
            showWordmark={!isCollapsed}
            subtitle={!isCollapsed ? portalLabel : undefined}
          />

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-muted transition hover:border-line-strong hover:text-ink cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {onCloseMobile ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="inline-flex lg:hidden h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-muted"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <nav aria-label="Portal navigation" className="space-y-1.5">
          {items.map((item) => {
            const active = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-colors",
                  active
                    ? "bg-forest text-[#FFFDF8] font-semibold"
                    : "text-muted hover:bg-surface-muted hover:text-ink",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="shrink-0" aria-hidden="true">
                    {item.icon}
                  </span>
                  {!isCollapsed ? <span>{item.label}</span> : null}
                </span>

                {!isCollapsed && item.badge ? (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      active
                        ? "bg-pistachio text-ink"
                        : "bg-surface-muted text-muted"
                    )}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      {footer ? (
        <div className="border-t border-line pt-4">{footer}</div>
      ) : null}
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-line bg-surface px-4 py-5 transition-all duration-200",
          collapsed ? "w-[82px]" : "w-64",
          className
        )}
      >
        {navContent(collapsed)}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-ink/35"
            aria-hidden="true"
          />
          <aside className="relative z-10 flex h-full w-72 flex-col border-r border-line bg-surface px-4 py-5 shadow-[var(--shadow-elevated)]">
            {navContent(false)}
          </aside>
        </div>
      ) : null}
    </>
  );
}
