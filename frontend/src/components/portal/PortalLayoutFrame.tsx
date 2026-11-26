"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";

import { BrandLogo, StatusLabel } from "@/components/ui";
import { cn } from "@/lib/utils";
import { signOutUser } from "@/services/auth";
import type { AccountType } from "@/types/database";

export interface PortalNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

export interface PortalNavGroup {
  title: string;
  items: PortalNavItem[];
}

interface PortalLayoutFrameProps {
  portalName: string;
  portalBadge: string;
  portalVariant: "employee" | "manager";
  organizationLabel?: string;
  groups: PortalNavGroup[];
  userEmail: string;
  fullName: string;
  accountType: AccountType;
  settingsHref: string;
  switchPortalLink?: { label: string; href: string } | null;
  children: React.ReactNode;
}

export function PortalLayoutFrame({
  portalName,
  portalBadge,
  portalVariant,
  organizationLabel,
  groups,
  userEmail,
  fullName,
  accountType,
  settingsHref,
  switchPortalLink,
  children,
}: PortalLayoutFrameProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Derive breadcrumb metadata from active route
  let currentGroup = portalName;
  let currentLabel = "Workspace";
  for (const group of groups) {
    const match = group.items.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    );
    if (match) {
      currentGroup = group.title;
      currentLabel = match.label;
      break;
    }
  }

  async function handleLogout() {
    setSigningOut(true);
    try {
      await signOutUser();
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  const initials = (fullName || userEmail)
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const renderSidebarInner = (isCollapsed: boolean) => (
    <div className="flex h-full flex-col justify-between gap-6">
      <div className="space-y-6">
        {/* Branding & collapse toggle */}
        <div className="flex items-center justify-between gap-2 px-1">
          <Link
            href={groups[0]?.items[0]?.href ?? "/"}
            onClick={() => setMobileOpen(false)}
          >
            <BrandLogo
              size="sm"
              showWordmark={!isCollapsed}
              subtitle={!isCollapsed ? portalBadge : undefined}
            />
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-muted transition hover:border-line-strong hover:text-ink cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation drawer"
            className="inline-flex lg:hidden h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Grouped Navigation */}
        <nav aria-label={`${portalName} navigation`} className="space-y-5">
          {groups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              {!isCollapsed ? (
                <p className="px-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">
                  {group.title}
                </p>
              ) : (
                <div className="mx-3 border-t border-line" />
              )}

              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        title={isCollapsed ? item.label : undefined}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-colors",
                          active
                            ? portalVariant === "employee"
                              ? "bg-forest font-semibold text-[#FFFDF8]"
                              : "bg-ink font-semibold text-[#FFFDF8]"
                            : "text-ink/80 hover:bg-surface-muted hover:text-ink",
                          isCollapsed && "justify-center px-2"
                        )}
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span className="shrink-0" aria-hidden="true">
                            {item.icon}
                          </span>
                          {!isCollapsed ? (
                            <span className="truncate">{item.label}</span>
                          ) : null}
                        </span>

                        {!isCollapsed && item.badge ? (
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold",
                              active
                                ? "bg-pistachio text-ink"
                                : "bg-surface-muted text-ink"
                            )}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Footer */}
      <div className="space-y-2 border-t border-line pt-4">
        {switchPortalLink && !isCollapsed ? (
          <Link
            href={switchPortalLink.href}
            className="block rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-[13px] font-semibold text-forest transition hover:bg-pistachio/40"
          >
            {switchPortalLink.label} →
          </Link>
        ) : null}

        <button
          type="button"
          disabled={signingOut}
          onClick={() => void handleLogout()}
          title={isCollapsed ? "Sign out" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium text-ink/80 transition hover:bg-surface-muted hover:text-ink disabled:opacity-50 cursor-pointer",
            isCollapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed ? (
            <span>{signingOut ? "Signing out..." : "Logout"}</span>
          ) : null}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex shrink-0 flex-col border-r border-line bg-surface px-4 py-5 transition-all duration-200",
          collapsed ? "w-[82px]" : "w-68"
        )}
      >
        {renderSidebarInner(collapsed)}
      </aside>

      {/* Mobile Slide-Over Sidebar */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-ink/35 backdrop-blur-[1px]"
            aria-hidden="true"
          />
          <aside className="relative z-10 flex h-full w-72 flex-col overflow-y-auto border-r border-line bg-surface px-4 py-5 shadow-[var(--shadow-elevated)]">
            {renderSidebarInner(false)}
          </aside>
        </div>
      ) : null}

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar with Breadcrumbs, Notifications Foundation, Profile Menu */}
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-line bg-surface/95 px-5 py-3.5 backdrop-blur-sm sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="inline-flex lg:hidden h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-ink hover:bg-surface-muted cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              <span className="font-medium text-muted">{portalName}</span>
              <span className="text-line-strong">/</span>
              <span className="hidden font-medium text-muted sm:inline">{currentGroup}</span>
              <span className="hidden text-line-strong sm:inline">/</span>
              <span className="font-semibold text-ink">{currentLabel}</span>
            </nav>
          </div>

          <div className="relative flex items-center gap-2.5">
            {organizationLabel ? (
              <span className="hidden rounded-full border border-line bg-canvas px-3.5 py-1 text-xs sm:text-[13px] font-semibold text-ink/80 md:inline-flex">
                {organizationLabel}
              </span>
            ) : null}
            <StatusLabel
              tone={portalVariant === "manager" ? "inferred" : "verified"}
              label={`Role: ${accountType}`}
              className="hidden sm:inline-flex"
            />

            {/* Notifications Foundation */}
            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => {
                  setNotificationsOpen((v) => !v);
                  setProfileMenuOpen(false);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-ink transition hover:bg-surface-muted cursor-pointer"
              >
                <Bell className="h-4 w-4" />
              </button>

              {notificationsOpen ? (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-elevated)]">
                  <div className="flex items-center justify-between border-b border-line pb-2.5">
                    <p className="text-[13px] font-bold uppercase tracking-wider text-ink">
                      Notifications
                    </p>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs sm:text-[13px] font-medium text-muted hover:text-ink cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                  <p className="mt-3 text-[13px] sm:text-sm leading-relaxed text-muted">
                    You&apos;re caught up. Updates for assessments, sponsorship reviews, and team milestones appear here.
                  </p>
                </div>
              ) : null}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                aria-expanded={profileMenuOpen}
                onClick={() => {
                  setProfileMenuOpen((v) => !v);
                  setNotificationsOpen(false);
                }}
                className="inline-flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-left transition hover:bg-surface-muted cursor-pointer"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pistachio text-xs font-bold text-ink">
                  {initials || "SP"}
                </span>
                <span className="hidden max-w-[160px] truncate text-sm font-semibold text-ink md:inline">
                  {fullName || userEmail}
                </span>
                <ChevronDown className="h-4 w-4 text-muted" />
              </button>

              {profileMenuOpen ? (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-line bg-surface p-2.5 shadow-[var(--shadow-elevated)]">
                  <div className="border-b border-line px-3 py-2.5">
                    <p className="truncate text-sm font-bold text-ink">
                      {fullName || "SkillPilot User"}
                    </p>
                    <p className="truncate text-xs sm:text-[13px] text-muted">{userEmail}</p>
                  </div>
                  <div className="mt-1.5 space-y-1">
                    <Link
                      href={settingsHref}
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
                    >
                      <Settings className="h-4 w-4 text-muted" />
                      Profile &amp; Settings
                    </Link>
                    <button
                      type="button"
                      disabled={signingOut}
                      onClick={() => void handleLogout()}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#8C371C] hover:bg-[var(--status-attention-bg)] cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      {signingOut ? "Signing out..." : "Logout"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {/* Page Content — Full-width workspace utilization beside sidebar */}
        <main className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-8 xl:px-10 xl:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
