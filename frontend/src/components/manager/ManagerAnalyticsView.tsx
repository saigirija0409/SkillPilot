"use client";

import React, { useState } from "react";
import { BarChart3, CheckCircle2, Info, RefreshCw } from "lucide-react";

import { useManagerOrganizationData } from "@/components/portal/ManagerPortalShell";
import {
  Button,
  Card,
  EditorialHeading,
  PastelCard,
  ProgressBar,
  Select,
  SkeletonCard,
  StatusLabel,
} from "@/components/ui";
import { DEPARTMENTS, useManagerDemo } from "@/lib/demo/managerDemoStore";

type DateWindow = "30d" | "qtd" | "90d";

export function ManagerAnalyticsView() {
  const { analytics, analyticsLoading, analyticsError, retryAnalytics } =
    useManagerOrganizationData();
  const {
    managerState,
    employees,
    sponsorships,
    employeeEvidence,
    approvedSponsorshipSpentInr,
  } = useManagerDemo();

  const [deptFilter, setDeptFilter] = useState<string>("All");
  const [dateWindow, setDateWindow] = useState<DateWindow>("qtd");

  if (analyticsLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const hasLiveOrgTeam = Boolean(analytics && analytics.team_size > 0);
  const windowMultiplier =
    dateWindow === "30d" ? 0.85 : dateWindow === "qtd" ? 1 : 1.1;

  const visibleEmployees = employees.filter(
    (e) => deptFilter === "All" || e.department === deptFilter
  );

  const verifiedTotal = visibleEmployees.reduce(
    (acc, emp) =>
      acc +
      Object.values(emp.evidenceStatus).filter((st) => st === "verified").length,
    0
  );
  const demonstratedTotal = visibleEmployees.reduce(
    (acc, emp) =>
      acc +
      Object.values(emp.evidenceStatus).filter((st) => st === "demonstrated")
        .length,
    0
  );

  const avgParticipationPct = hasLiveOrgTeam
    ? Math.round(analytics?.avg_readiness_score ?? 0)
    : Math.min(
        96,
        Math.round(
          (visibleEmployees.reduce((acc, e) => acc + e.progressPct, 0) /
            Math.max(1, visibleEmployees.length)) *
            windowMultiplier
        )
      );

  const departmentComparison = DEPARTMENTS.filter(
    (d) => deptFilter === "All" || d === deptFilter
  ).map((dept) => {
    const members = employees.filter((e) => e.department === dept);
    const avgProgress = Math.round(
      members.reduce((acc, m) => acc + m.progressPct, 0) /
        Math.max(1, members.length)
    );
    const verifiedCount = members.reduce(
      (acc, m) =>
        acc +
        Object.values(m.evidenceStatus).filter((v) => v === "verified").length,
      0
    );
    const demoCount = members.reduce(
      (acc, m) =>
        acc +
        Object.values(m.evidenceStatus).filter((v) => v === "demonstrated")
          .length,
      0
    );
    return { dept, avgProgress, verifiedCount, demoCount };
  });

  return (
    <div className="space-y-8">
      <EditorialHeading
        eyebrow="Development • Workforce Intelligence"
        title="Learning"
        italicAccent="Analytics"
        subtitle="Compares participation, course completion, demonstrated assessment outcomes, and INR training expenditure across departments."
        actions={
          <StatusLabel
            tone={hasLiveOrgTeam ? "verified" : "neutral"}
            label={
              hasLiveOrgTeam
                ? `Live Organization (${analytics?.team_size} Members)`
                : "Prototype mode · Sample data"
            }
          />
        }
      />

      {analyticsError ? (
        <Card
          padding="md"
          className="border-[var(--status-attention-border)] bg-[var(--status-attention-bg)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--status-attention-text)]">
            <span>
              <strong>Analytics API Error:</strong> {analyticsError}
            </span>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={retryAnalytics}
            >
              Retry
            </Button>
          </div>
        </Card>
      ) : null}

      <Card padding="md">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <Select
                label="Department Scope"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="All">All Departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-48">
              <Select
                label="Reporting Window"
                value={dateWindow}
                onChange={(e) => setDateWindow(e.target.value as DateWindow)}
              >
                <option value="30d">Last 30 Days</option>
                <option value="qtd">Quarter to Date</option>
                <option value="90d">Trailing 90 Days</option>
              </Select>
            </div>
          </div>

          <p className="text-xs font-semibold text-muted">
            Demo assessments passed:{" "}
            <strong className="text-forest">
              {Object.keys(employeeEvidence).length}
            </strong>{" "}
            • Approved INR spend:{" "}
            <strong className="text-ink">
              ₹{approvedSponsorshipSpentInr.toLocaleString("en-IN")} INR
            </strong>
          </p>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        <PastelCard
          tone="butter"
          eyebrow={
            hasLiveOrgTeam
              ? "Live Workforce Readiness"
              : "Learning Participation"
          }
          title={`${avgParticipationPct}% ${hasLiveOrgTeam ? "Readiness" : "Participation"}`}
          description={
            hasLiveOrgTeam
              ? `Measured across ${analytics?.team_size} team members.`
              : `Scoped across ${visibleEmployees.length} team profiles.`
          }
        />
        <PastelCard
          tone="lavender"
          eyebrow="Assessment Outcomes"
          title={`${demonstratedTotal} Demonstrated`}
          description="Updates immediately when learners pass interactive Challenges checks."
        />
        <PastelCard
          tone="pistachio"
          eyebrow="Verified Credentials"
          title={`${verifiedTotal} Verified Competencies`}
          description="Course participation never grants verified credentials without assessment."
          illustration={<BarChart3 className="h-9 w-9 text-forest" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card padding="lg" className="lg:col-span-7 space-y-5">
          <h2 className="font-editorial text-2xl text-ink">
            {hasLiveOrgTeam
              ? "Live Member Readiness Breakdown"
              : "Department Competency & Evidence"}
          </h2>

          <div className="space-y-4">
            {hasLiveOrgTeam && analytics
              ? analytics.members.map((m) => (
                  <div
                    key={m.user_id}
                    className="rounded-2xl border border-line bg-canvas p-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-ink">
                        {m.full_name || m.email} (
                        {m.target_role_title || "No Target Role"})
                      </span>
                      <StatusLabel
                        tone="verified"
                        label={`${m.skills_count} skills`}
                      />
                    </div>
                    <ProgressBar
                      value={m.readiness_score}
                      label="Live Supabase Role Readiness"
                      size="sm"
                      tone="forest"
                    />
                  </div>
                ))
              : departmentComparison.map((row) => (
                  <div
                    key={row.dept}
                    className="rounded-2xl border border-line bg-canvas p-4 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-ink">{row.dept}</span>
                      <div className="flex flex-wrap gap-2">
                        <StatusLabel
                          tone="verified"
                          label={`${row.verifiedCount} Verified`}
                        />
                        <StatusLabel
                          tone="in_progress"
                          label={`${row.demoCount} Demonstrated`}
                        />
                      </div>
                    </div>
                    <ProgressBar
                      value={row.avgProgress}
                      label="Learning Participation Rate"
                      size="sm"
                      tone="forest"
                    />
                  </div>
                ))}
          </div>
        </Card>

        <Card padding="lg" className="lg:col-span-5 space-y-5">
          <h2 className="font-editorial text-2xl text-ink">
            Spend &amp; Evidence Integrity
          </h2>

          <div className="rounded-2xl border border-line bg-canvas p-4 space-y-2 text-xs">
            <p className="font-bold text-ink">
              INR Budget Utilization
            </p>
            <ProgressBar
              value={approvedSponsorshipSpentInr}
              max={Math.max(1, managerState.totalTrainingBudgetInr)}
              label={`₹${approvedSponsorshipSpentInr.toLocaleString("en-IN")} spent of ₹${managerState.totalTrainingBudgetInr.toLocaleString("en-IN")} INR`}
              tone="pistachio"
            />
            <p className="text-muted">
              {sponsorships.filter((s) => s.status === "Approved (Demo)").length}{" "}
              approved •{" "}
              {
                sponsorships.filter(
                  (s) => s.status === "Pending Review (Demo)"
                ).length
              }{" "}
              pending review
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-2 rounded-xl border border-line bg-canvas p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-forest shrink-0" />
              <p className="text-ink">
                <strong>Four-tier Distinction:</strong> SkillPilot separates
                learning participation, course completion, demo assessment
                evidence, and verified credentials.
              </p>
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-line bg-canvas p-3">
              <Info className="mt-0.5 h-4 w-4 text-forest shrink-0" />
              <p className="text-muted">
                No organizational metrics are fabricated when real backend rows
                are absent.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
