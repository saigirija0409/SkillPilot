"use client";

import React, { useState } from "react";
import { BarChart3, CheckCircle2, Info } from "lucide-react";

import {
  Card,
  EditorialHeading,
  PastelCard,
  ProgressBar,
  Select,
  StatusLabel,
} from "@/components/ui";
import { DEPARTMENTS, useManagerDemo } from "@/lib/demo/managerDemoStore";

type DateWindow = "30d" | "qtd" | "90d";

export function ManagerAnalyticsView() {
  const {
    managerState,
    employees,
    sponsorships,
    employeeEvidence,
    approvedSponsorshipSpentInr,
  } = useManagerDemo();

  const [deptFilter, setDeptFilter] = useState<string>("All");
  const [dateWindow, setDateWindow] = useState<DateWindow>("qtd");

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

  const avgParticipationPct = Math.min(
    96,
    Math.round(
      (visibleEmployees.reduce((acc, e) => acc + e.progressPct, 0) /
        Math.max(1, visibleEmployees.length)) *
        windowMultiplier
    )
  );
  const estimatedCourseCompletionPct = Math.max(25, avgParticipationPct - 18);

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
        subtitle="Demonstration organizational metrics comparing participation, course completion, assessment evidence, and INR expenditure. Never substitutes participation for verified competency."
        actions={<StatusLabel tone="in_progress" label="[DEMO] Sample Telemetry" />}
      />

      {/* Department & Date Window Controls */}
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
            Live employee assessments passed:{" "}
            <strong className="text-forest">
              {Object.keys(employeeEvidence).length}
            </strong>{" "}
            • Approved sponsorship spend:{" "}
            <strong className="text-ink">
              ₹{approvedSponsorshipSpentInr.toLocaleString("en-IN")} INR
            </strong>
          </p>
        </div>
      </Card>

      {/* Participation vs Completion vs Evidence Separation */}
      <div className="grid gap-5 md:grid-cols-3">
        <PastelCard
          tone="butter"
          eyebrow="[DEMO] Engagement Signal"
          title={`${avgParticipationPct}% Participation`}
          description={`Estimated ${estimatedCourseCompletionPct}% module completion across ${visibleEmployees.length} scoped member(s).`}
        />
        <PastelCard
          tone="lavender"
          eyebrow="[DEMO] Assessment Outcomes"
          title={`${demonstratedTotal} Demonstrated`}
          description="Updated immediately when learners pass interactive Challenges checks."
        />
        <PastelCard
          tone="pistachio"
          eyebrow="[DEMO] Rigorous Proof"
          title={`${verifiedTotal} Verified Competencies`}
          description="Course attendance never grants verified credentials without assessment."
          illustration={<BarChart3 className="h-9 w-9 text-forest" />}
        />
      </div>

      {/* Team Comparisons & Skill-Gap Trend */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card padding="lg" className="lg:col-span-7 space-y-5">
          <h2 className="font-editorial text-2xl text-ink">
            Department Competency &amp; Evidence Comparison
          </h2>

          <div className="space-y-4">
            {departmentComparison.map((row) => (
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
                  label="Learning Participation Rate [DEMO]"
                  size="sm"
                  tone="forest"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg" className="lg:col-span-5 space-y-5">
          <h2 className="font-editorial text-2xl text-ink">
            Training Spend &amp; Assessment Integrity
          </h2>

          <div className="rounded-2xl border border-line bg-canvas p-4 space-y-2 text-xs">
            <p className="font-bold text-ink">
              INR Budget Utilization (Shared State)
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
                <strong>Four-tier Metric Hygiene:</strong> SkillPilot separates
                daily learning participation, course completions, demo
                assessment scores, and server-verified credentials.
              </p>
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-line bg-canvas p-3">
              <Info className="mt-0.5 h-4 w-4 text-forest shrink-0" />
              <p className="text-muted">
                Production team analytics will aggregate PostgreSQL assessment &amp;
                activity logs in Phase 5 respecting learner consent.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
