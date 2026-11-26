"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BarChart3,
  Bot,
  Briefcase,
  Calculator,
  CalendarRange,
  Grid3X3,
  HandCoins,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import {
  Button,
  Card,
  PastelCard,
  ProgressBar,
  SkillChip,
  StatusLabel,
} from "@/components/ui";
import {
  DEPARTMENTS,
  HEATMAP_SKILLS,
  MANAGER_TRAINING_CATALOG,
  useManagerDemo,
  type DepartmentName,
} from "@/lib/demo/managerDemoStore";
import { fetchManagerCheck } from "@/services/api";
import { getCurrentSessionAccessToken } from "@/services/auth";
import type { AccountType } from "@/types/database";

interface ManagerOverviewViewProps {
  fullName: string;
  accountType: AccountType;
  organizationId: string | null;
}

const DEPT_SVG_NODES: Array<{
  dept: DepartmentName;
  cx: number;
  cy: number;
  fill: string;
}> = [
  { dept: "Data Science", cx: 78, cy: 62, fill: "#D9E8B5" },
  { dept: "Engineering", cx: 210, cy: 48, fill: "#F9DF91" },
  { dept: "Cloud", cx: 332, cy: 68, fill: "#DDD6F3" },
  { dept: "Analytics", cx: 122, cy: 158, fill: "#F4C9B4" },
  { dept: "Frontend", cx: 288, cy: 156, fill: "#D9E8B5" },
];

export function ManagerOverviewView({
  fullName,
  accountType,
  organizationId,
}: ManagerOverviewViewProps) {
  const {
    managerState,
    sponsorships,
    employees,
    employeeEvidence,
    remainingTrainingBudgetInr,
  } = useManagerDemo();

  const [selectedDept, setSelectedDept] =
    useState<DepartmentName>("Data Science");
  const [backendAuthorized, setBackendAuthorized] = useState<boolean | null>(
    null
  );
  const [backendMessage, setBackendMessage] = useState<string>(
    "Verifying manager token..."
  );

  useEffect(() => {
    let active = true;
    async function verify() {
      const token = await getCurrentSessionAccessToken();
      if (!token) {
        if (active) {
          setBackendAuthorized(false);
          setBackendMessage("No session token available");
        }
        return;
      }
      try {
        const res = await fetchManagerCheck(token);
        if (active) {
          setBackendAuthorized(true);
          setBackendMessage(res.message);
        }
      } catch (err) {
        if (active) {
          setBackendAuthorized(false);
          setBackendMessage(
            err instanceof Error
              ? err.message
              : "Backend rejected manager check"
          );
        }
      }
    }
    void verify();
    return () => {
      active = false;
    };
  }, []);

  const firstName = fullName.split(" ")[0] || "Leader";
  const pendingSponsorships = sponsorships.filter(
    (s) => s.status === "Pending Review (Demo)"
  );
  const pendingAmountInr = pendingSponsorships.reduce(
    (acc, s) => acc + s.amountInr,
    0
  );

  const avgWorkforceReadiness = Math.round(
    employees.reduce((acc, emp) => acc + emp.progressPct, 0) /
      Math.max(1, employees.length)
  );

  const deptEmployees = employees.filter((e) => e.department === selectedDept);
  const deptAvgReadiness = Math.round(
    deptEmployees.reduce((acc, e) => acc + e.progressPct, 0) /
      Math.max(1, deptEmployees.length)
  );

  const deptSkillAverages = HEATMAP_SKILLS.map((sk) => {
    const avg =
      deptEmployees.reduce((acc, e) => acc + (e.skills[sk.name] ?? 0), 0) /
      Math.max(1, deptEmployees.length);
    return { skill: sk.name, avg: Number(avg.toFixed(1)) };
  }).sort((a, b) => a.avg - b.avg);

  const priorityOrgGaps = HEATMAP_SKILLS.map((sk) => {
    const avg =
      employees.reduce((acc, e) => acc + (e.skills[sk.name] ?? 0), 0) /
      Math.max(1, employees.length);
    return { skill: sk.name, avg: Number(avg.toFixed(1)) };
  })
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3);

  const recentDemonstratedList = Object.values(employeeEvidence);

  return (
    <div className="space-y-10">
      {/* Executive Editorial Hero with Interactive Workforce Capability Map */}
      <section className="rounded-[28px] border border-line bg-surface p-6 sm:p-10 shadow-[var(--shadow-card)]">
        <div className="grid items-center gap-8 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusLabel
                tone={backendAuthorized ? "verified" : "in_progress"}
                label={
                  backendAuthorized
                    ? `Manager JWT Verified (${accountType})`
                    : backendMessage
                }
              />
              <StatusLabel
                tone="inferred"
                label={managerState.organizationDisplayName}
              />
            </div>

            <h1 className="font-editorial text-4xl leading-[1.03] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Great teams.{" "}
              <span className="italic text-forest">Greater possibilities.</span>
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Good day, <strong className="text-ink">{firstName}</strong>.
              Translate individual employee learning journeys into measurable
              organizational capability across {DEPARTMENTS.length} core practice
              groups.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/manager/projects">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Open Project Readiness
                </Button>
              </Link>
              <Link href="/manager/sponsorship">
                <Button
                  variant="secondary"
                  size="lg"
                  leftIcon={<HandCoins className="h-4 w-4" />}
                >
                  Review Sponsorships ({pendingSponsorships.length})
                </Button>
              </Link>
            </div>
          </div>

          {/* Interactive Team Capability Growth Constellation SVG */}
          <div className="rounded-2xl border border-line bg-canvas p-5 lg:col-span-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                [DEMO] Interactive Team Capability Map
              </span>
              <span className="text-xs font-semibold text-forest">
                Click a department hub
              </span>
            </div>

            <svg
              viewBox="0 0 410 205"
              className="w-full"
              role="img"
              aria-label="Interactive organizational capability growth map"
            >
              {/* Hub center representing Organizational Capability */}
              {DEPT_SVG_NODES.map((n) => (
                <line
                  key={`link-${n.dept}`}
                  x1={n.cx}
                  y1={n.cy}
                  x2={205}
                  y2={108}
                  stroke={selectedDept === n.dept ? "#294C3B" : "#D6D1C4"}
                  strokeWidth={selectedDept === n.dept ? 2.5 : 1.5}
                  strokeDasharray={selectedDept === n.dept ? undefined : "4 4"}
                />
              ))}

              <circle
                cx={205}
                cy={108}
                r={28}
                fill="#294C3B"
                stroke="#D9E8B5"
                strokeWidth={3}
              />
              <text
                x={205}
                y={105}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#FFFDF8"
              >
                ORG
              </text>
              <text
                x={205}
                y={118}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#D9E8B5"
              >
                {avgWorkforceReadiness}%
              </text>

              {DEPT_SVG_NODES.map((node) => {
                const active = selectedDept === node.dept;
                return (
                  <g
                    key={node.dept}
                    onClick={() => setSelectedDept(node.dept)}
                    className="cursor-pointer"
                  >
                    {active ? (
                      <circle
                        cx={node.cx}
                        cy={node.cy}
                        r={27}
                        fill={node.fill}
                        fillOpacity={0.45}
                      />
                    ) : null}
                    <circle
                      cx={node.cx}
                      cy={node.cy}
                      r={active ? 21 : 17}
                      fill={node.fill}
                      stroke="#294C3B"
                      strokeWidth={active ? 2.5 : 1.5}
                    />
                    <text
                      x={node.cx}
                      y={node.cy + 4}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="700"
                      fill="#202622"
                    >
                      {node.dept.slice(0, 4).toUpperCase()}
                    </text>
                    <text
                      x={node.cx}
                      y={node.cy + 32}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight={active ? "700" : "600"}
                      fill="#202622"
                    >
                      {node.dept}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="rounded-xl border border-line bg-surface p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-bold text-ink">
                  {selectedDept} • {deptEmployees.length} member(s) •{" "}
                  {deptAvgReadiness}% development progress
                </p>
                <p className="text-xs text-muted">
                  Priority gaps:{" "}
                  <strong className="text-ink">
                    {deptSkillAverages
                      .slice(0, 2)
                      .map((s) => `${s.skill} (${s.avg}/5)`)
                      .join(", ")}
                  </strong>
                </p>
              </div>
              <Link href="/manager/skills">
                <Button size="sm" variant="secondary">
                  Open Matrix
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Focused Executive Snapshot */}
      <div className="grid gap-6 md:grid-cols-3">
        <PastelCard
          tone="pistachio"
          eyebrow="[DEMO] Workforce Readiness"
          title={`${avgWorkforceReadiness}% Avg Progress`}
          description={`Tracked across ${employees.length} consented team profiles in ${DEPARTMENTS.length} departments.`}
          footer={
            <Link href="/manager/teams">
              <Button size="sm" variant="secondary">
                Inspect Teams &amp; Employees
              </Button>
            </Link>
          }
        />

        <PastelCard
          tone="butter"
          eyebrow="[DEMO] Priority Skill Gaps"
          title={priorityOrgGaps[0]?.skill || "Generative AI"}
          description={`Lowest avg coverage: ${priorityOrgGaps.map((g) => `${g.skill} (${g.avg}/5)`).join(" • ")}.`}
          footer={
            <Link href="/manager/skills">
              <Button size="sm" variant="secondary">
                View Skill Heatmap
              </Button>
            </Link>
          }
        />

        <PastelCard
          tone="peach"
          eyebrow="Shared Sponsorship Queue"
          title={`${pendingSponsorships.length} Pending (${pendingAmountInr.toLocaleString("en-IN")} INR)`}
          description={`Remaining demo training budget: ₹${remainingTrainingBudgetInr.toLocaleString("en-IN")} INR.`}
          footer={
            <Link href="/manager/sponsorship">
              <Button size="sm" variant="primary">
                Approve / Review Requests
              </Button>
            </Link>
          }
        />
      </div>

      {/* Team Journeys, Recent Demonstrated Proof & Training Actions */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card padding="lg" className="lg:col-span-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                [DEMO] Team Development Journeys
              </p>
              <h2 className="font-editorial text-3xl text-ink">
                Recently Demonstrated Proof
              </h2>
            </div>
            <Link href="/manager/talent">
              <Button size="sm" variant="secondary">
                Talent Discovery
              </Button>
            </Link>
          </div>

          {recentDemonstratedList.length > 0 ? (
            <div className="space-y-2.5">
              {recentDemonstratedList.map((ev) => (
                <div
                  key={ev.skillName}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#C5D89B] bg-[#D9E8B5]/45 px-4 py-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Award className="h-4 w-4 text-forest shrink-0" />
                    <div>
                      <p className="font-bold text-ink">
                        Ananya Rao [DEMO] • {ev.skillName}
                      </p>
                      <p className="text-muted">
                        {ev.evidenceTitle} on {ev.updatedAt} (Live synced from
                        Employee Assessment)
                      </p>
                    </div>
                  </div>
                  <StatusLabel tone="in_progress" label="Demonstrated" />
                </div>
              ))}
            </div>
          ) : null}

          <div className="space-y-3">
            {employees.slice(0, 3).map((emp) => (
              <div
                key={emp.id}
                className="rounded-xl border border-line bg-canvas p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink">
                    {emp.name} ({emp.department})
                  </span>
                  <span className="font-semibold text-forest">
                    {emp.progressPct}% path progress
                  </span>
                </div>
                <ProgressBar
                  value={emp.progressPct}
                  showValue={false}
                  size="sm"
                  tone="forest"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg" className="lg:col-span-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                Recommended Strategy Actions
              </p>
              <h2 className="font-editorial text-3xl text-ink">
                Upcoming Cohorts &amp; Links
              </h2>
            </div>
            <Link href="/manager/training">
              <Button size="sm" variant="secondary">
                Training Planner
              </Button>
            </Link>
          </div>

          <div className="space-y-2.5">
            {MANAGER_TRAINING_CATALOG.slice(0, 3).map((tr) => (
              <div
                key={tr.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-canvas px-4 py-3 text-xs"
              >
                <div>
                  <p className="font-bold text-ink">{tr.title}</p>
                  <p className="text-muted">
                    {tr.departmentFocus} • {tr.durationHours} hrs •{" "}
                    {tr.costPerSeatInr === 0
                      ? "Free"
                      : `₹${tr.costPerSeatInr.toLocaleString("en-IN")}/seat`}
                  </p>
                </div>
                <SkillChip name={tr.targetSkill} status="inferred" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2 sm:grid-cols-3">
            {[
              { label: "Teams", href: "/manager/teams", icon: Users },
              { label: "Heatmap", href: "/manager/skills", icon: Grid3X3 },
              { label: "Projects", href: "/manager/projects", icon: Briefcase },
              { label: "Talent", href: "/manager/talent", icon: Sparkles },
              { label: "Planner", href: "/manager/training", icon: CalendarRange },
              { label: "Budget", href: "/manager/budget", icon: Calculator },
              { label: "Analytics", href: "/manager/analytics", icon: BarChart3 },
              { label: "Copilot", href: "/manager/copilot", icon: Bot },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-semibold text-ink transition hover:border-forest"
                >
                  <Icon className="h-3.5 w-3.5 text-forest" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Authorization & Privacy Integrity Strip */}
      <Card padding="md" className="bg-canvas">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-forest" />
            <span className="font-semibold text-ink">
              Org ID: {organizationId || "Unassigned (Demo Mode Active)"}
            </span>
          </div>
          <span className="text-muted">
            Private resumes &amp; private employee AI threads remain strictly
            hidden from manager views.
          </span>
        </div>
      </Card>
    </div>
  );
}
