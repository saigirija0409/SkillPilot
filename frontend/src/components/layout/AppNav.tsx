"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Compass } from "lucide-react";

import { signOutUser } from "@/services/auth";
import type { AccountType } from "@/types/database";

interface AppNavProps {
  userEmail: string;
  accountType: AccountType;
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/profile", label: "Profile" },
  { href: "/manager", label: "Manager" },
];

export function AppNav({ userEmail, accountType }: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

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

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-slate-900"
          >
            <Compass className="h-5 w-5 text-indigo-600" />
            <span>SkillPilot</span>
          </Link>

          <nav className="flex flex-wrap items-center gap-1">
            {NAV_LINKS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <p className="font-medium text-slate-800">{userEmail}</p>
            <p className="uppercase tracking-wide text-slate-500">
              Role: {accountType}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={signingOut}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {signingOut ? "Signing out..." : "Logout"}
          </button>
        </div>
      </div>
    </header>
  );
}
