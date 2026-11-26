"use client";

import React, { useEffect, useState } from "react";
import { Lock, Users } from "lucide-react";

import { StatusBadge } from "@/components/status/StatusBadge";
import { fetchManagerCheck } from "@/services/api";
import { getCurrentSessionAccessToken } from "@/services/auth";
import type { AccountType } from "@/types/database";

interface ManagerDashboardPlaceholderProps {
  accountType: AccountType;
  organizationId: string | null;
}

export function ManagerDashboardPlaceholder({
  accountType,
  organizationId,
}: ManagerDashboardPlaceholderProps) {
  const [backendStatus, setBackendStatus] = useState<string>("Checking...");
  const [backendAuthorized, setBackendAuthorized] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    let active = true;
    async function verify() {
      const token = await getCurrentSessionAccessToken();
      if (!token) {
        if (active) {
          setBackendAuthorized(false);
          setBackendStatus("No active access token");
        }
        return;
      }

      try {
        const res = await fetchManagerCheck(token);
        if (active) {
          setBackendAuthorized(true);
          setBackendStatus(res.message);
        }
      } catch (err) {
        if (active) {
          setBackendAuthorized(false);
          setBackendStatus(
            err instanceof Error
              ? err.message
              : "Backend rejected manager access (403)"
          );
        }
      }
    }
    void verify();
    return () => {
      active = false;
    };
  }, []);

  const isManager = accountType === "manager" || accountType === "admin";

  if (!isManager) {
    return (
      <section className="rounded-xl border border-rose-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-6 w-6 text-rose-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Manager Access Restricted (403)
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Your current account role is{" "}
              <strong className="uppercase">{accountType}</strong>. Manager
              permissions cannot be self-selected during signup and must be
              assigned by an organization administrator in Supabase.
            </p>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <strong>Backend Enforcement Check:</strong> {backendStatus}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <Users className="h-5 w-5 text-indigo-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Manager Workforce Intelligence (Phase 2 Placeholder)
            </h1>
            <p className="text-xs text-slate-500">
              Organization ID:{" "}
              <code className="font-mono">
                {organizationId || "Unassigned"}
              </code>
            </p>
          </div>
        </div>

        <StatusBadge
          tone={backendAuthorized ? "healthy" : "warning"}
          label={backendAuthorized ? "Manager Verified" : "Checking"}
        />
      </div>

      <p className="mt-4 text-sm text-slate-600">
        Your manager role is verified on both Next.js and FastAPI (
        {backendStatus}). Team skill heatmaps, consented progress feeds, and
        Supabase Realtime updates will be implemented in Phase 5.
      </p>
    </section>
  );
}
