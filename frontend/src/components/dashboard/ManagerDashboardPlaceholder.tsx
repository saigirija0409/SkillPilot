"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Users } from "lucide-react";

import {
  Button,
  Card,
  CompassGrowthIllustration,
  EditorialHeading,
  PastelCard,
  StatusLabel,
} from "@/components/ui";
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

  return (
    <div className="space-y-8">
      <EditorialHeading
        eyebrow="Organization • Workforce Overview"
        title="Manager"
        italicAccent="Workforce Intelligence"
        subtitle="Authorized organization view. Real-time team heatmaps and consented employee analytics connect in Phase 5."
        actions={
          <StatusLabel
            tone={backendAuthorized ? "verified" : "in_progress"}
            label={backendAuthorized ? "Manager JWT Verified" : "Verifying API"}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <PastelCard
          tone="forest"
          eyebrow={`Role: ${accountType}`}
          title="Manager access verified"
          description={`FastAPI status: ${backendStatus}. Organization ID: ${organizationId || "Unassigned"}.`}
          illustration={<CompassGrowthIllustration className="h-20 w-20" />}
          className="lg:col-span-6"
        />

        <Card padding="lg" className="lg:col-span-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-forest" />
            <h2 className="font-editorial text-2xl text-ink">
              Portal Foundations Active
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            All 11 manager routes are navigable and protected by server-side
            role checks and PostgreSQL Row Level Security. Team heatmaps,
            budget simulations, and Realtime activity feeds are scheduled for
            Phase 5—no fabricated team data is shown here.
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas p-3 text-xs text-ink">
            <ShieldCheck className="h-4 w-4 text-forest shrink-0" />
            <span>
              Managers only access consented team data inside their assigned
              organization.
            </span>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/manager/teams">
              <Button variant="secondary" size="sm">
                Teams &amp; Employees
              </Button>
            </Link>
            <Link href="/manager/skills">
              <Button variant="primary" size="sm">
                Skill Heatmap
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
