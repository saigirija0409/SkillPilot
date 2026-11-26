"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, RefreshCw, ShieldCheck } from "lucide-react";

import { useManagerOrganizationData } from "@/components/portal/ManagerPortalShell";
import {
  Button,
  Card,
  Drawer,
  EditorialHeading,
  EmptyState,
  Input,
  PastelCard,
  ProgressBar,
  Select,
  SkeletonCard,
  SkillChip,
  StatusLabel,
} from "@/components/ui";
import {
  DEPARTMENTS,
  HEATMAP_SKILLS,
  useManagerDemo,
  type DemoEmployeeProfile,
} from "@/lib/demo/managerDemoStore";
import { formatEnumLabel } from "@/lib/formatters";
import type { TeamMemberSkillSummaryDto } from "@/types/api";

export function ManagerTeamsView() {
  const { organizationId, analytics, analyticsLoading, analyticsError, retryAnalytics } =
    useManagerOrganizationData();
  const { employees } = useManagerDemo();

  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [skillFilter, setSkillFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"progress" | "name" | "verified">(
    "progress"
  );
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("grid");
  const [selectedDemoEmp, setSelectedDemoEmp] =
    useState<DemoEmployeeProfile | null>(null);
  const [selectedLiveEmp, setSelectedLiveEmp] =
    useState<TeamMemberSkillSummaryDto | null>(null);

  if (analyticsLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const hasLiveOrgTeam = Boolean(analytics && analytics.team_size > 0);

  const liveFiltered = hasLiveOrgTeam && analytics
    ? analytics.members
        .filter((m) => {
          const q = query.trim().toLowerCase();
          if (!q) return true;
          return (
            m.full_name.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q) ||
            (m.target_role_title ?? "").toLowerCase().includes(q) ||
            m.top_gaps.some((g) => g.toLowerCase().includes(q))
          );
        })
        .sort((a, b) =>
          sortBy === "name"
            ? a.full_name.localeCompare(b.full_name)
            : b.readiness_score - a.readiness_score
        )
    : [];

  const demoFiltered = employees
    .filter((emp) => {
      if (deptFilter !== "All" && emp.department !== deptFilter) return false;
      if (skillFilter !== "All" && (emp.skills[skillFilter] ?? 0) < 3) {
        return false;
      }
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        Object.keys(emp.skills).some((s) => s.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "verified") {
        const aVer = Object.values(a.evidenceStatus).filter(
          (v) => v === "verified" || v === "demonstrated"
        ).length;
        const bVer = Object.values(b.evidenceStatus).filter(
          (v) => v === "verified" || v === "demonstrated"
        ).length;
        return bVer - aVer;
      }
      return b.progressPct - a.progressPct;
    });

  return (
    <div className="space-y-8">
      <EditorialHeading
        eyebrow="Organization • Teams & Employees"
        title="Teams &"
        italicAccent="Employees"
        subtitle={
          hasLiveOrgTeam
            ? `Showing ${analytics?.team_size} consented member(s) in your organization.`
            : "Consented workforce directory displaying role readiness, competencies, and active priorities."
        }
        actions={
          <div className="flex items-center gap-2">
            <StatusLabel
              tone={hasLiveOrgTeam ? "verified" : "neutral"}
              label={
                hasLiveOrgTeam ? "Live Organization Roster" : "Prototype mode · Sample data"
              }
            />
            <Button
              size="sm"
              variant={layoutMode === "grid" ? "primary" : "secondary"}
              leftIcon={<LayoutGrid className="h-3.5 w-3.5" />}
              onClick={() => setLayoutMode("grid")}
            >
              Grid
            </Button>
            <Button
              size="sm"
              variant={layoutMode === "list" ? "primary" : "secondary"}
              leftIcon={<List className="h-3.5 w-3.5" />}
              onClick={() => setLayoutMode("list")}
            >
              List
            </Button>
          </div>
        }
      />

      {analyticsError ? (
        <Card
          padding="md"
          className="border-[var(--status-attention-border)] bg-[var(--status-attention-bg)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--status-attention-text)]">
            <span>
              <strong>Team Roster API Error:</strong> {analyticsError}
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

      {!hasLiveOrgTeam && !analyticsError ? (
        <Card padding="md" className="bg-canvas text-xs text-muted">
          Prototype mode · Sample data — assign employees to an organization team to view live workforce records here.
        </Card>
      ) : null}

      {/* Search & Filters */}
      <Card padding="md">
        <div className="grid gap-4 md:grid-cols-12 md:items-end">
          <div className="md:col-span-4">
            <Input
              label="Search Employee, Target Role, or Gap"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, or skill..."
            />
          </div>

          {!hasLiveOrgTeam ? (
            <>
              <div className="md:col-span-3">
                <Select
                  label="Department"
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
              <div className="md:col-span-3">
                <Select
                  label="Strong Skill (3+/5)"
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                >
                  <option value="All">Any Skill</option>
                  {HEATMAP_SKILLS.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>
            </>
          ) : (
            <div className="md:col-span-6" />
          )}

          <div className="md:col-span-2">
            <Select
              label="Sort By"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "progress" | "name" | "verified")
              }
            >
              <option value="progress">Readiness %</option>
              <option value="verified">Evidence Count</option>
              <option value="name">Name (A–Z)</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Real Authorized Supabase Members */}
      {hasLiveOrgTeam ? (
        liveFiltered.length === 0 ? (
          <EmptyState
            title="No team members match that search"
            description="Clear the search input to view all authorized organization members."
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setQuery("")}
              >
                Reset Search
              </Button>
            }
          />
        ) : (
          <div
            className={
              layoutMode === "grid"
                ? "grid gap-5 md:grid-cols-2 lg:grid-cols-3"
                : "space-y-4"
            }
          >
            {liveFiltered.map((member) => {
              const initials = (member.full_name || member.email)
                .split(/[\s@]+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase() ?? "")
                .join("");

              return (
                <Card
                  key={member.user_id}
                  interactive
                  className="flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pistachio text-sm font-bold text-ink border border-[#C5D89B]">
                          {initials || "TM"}
                        </span>
                        <div>
                          <h2 className="font-editorial text-2xl leading-tight text-ink">
                            {member.full_name || member.email}
                          </h2>
                          <p className="text-xs text-muted">
                            {member.target_role_title || "No Target Role"}
                          </p>
                        </div>
                      </div>
                      <StatusLabel
                        tone="verified"
                        label={`${member.skills_count} skills`}
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {member.top_gaps.length === 0 ? (
                        <StatusLabel tone="verified" label="Zero Role Gaps" />
                      ) : (
                        member.top_gaps.map((g) => (
                          <SkillChip key={g} name={g} status="inferred" />
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-line pt-3">
                    <ProgressBar
                      value={member.readiness_score}
                      label="Live Role Readiness"
                      size="sm"
                      tone="forest"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      onClick={() => setSelectedLiveEmp(member)}
                    >
                      Inspect Authorized Summary
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : demoFiltered.length === 0 ? (
        <EmptyState
          title="No demo profiles match those filters"
          description="Clear search or widen department/skill filters."
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setQuery("");
                setDeptFilter("All");
                setSkillFilter("All");
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div
          className={
            layoutMode === "grid"
              ? "grid gap-5 md:grid-cols-2 lg:grid-cols-3"
              : "space-y-4"
          }
        >
          {demoFiltered.map((emp) => {
            const topSkills = Object.entries(emp.skills)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4);
            const demonstratedCount = Object.values(emp.evidenceStatus).filter(
              (st) => st === "verified" || st === "demonstrated"
            ).length;

            return (
              <Card
                key={emp.id}
                interactive
                className="flex flex-col justify-between gap-4"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pistachio text-sm font-bold text-ink border border-[#C5D89B]">
                        {emp.initials}
                      </span>
                      <div>
                        <h2 className="font-editorial text-2xl leading-tight text-ink">
                          {emp.name}
                        </h2>
                        <p className="text-xs text-muted">{emp.role}</p>
                      </div>
                    </div>
                    <StatusLabel tone="inferred" label={emp.department} />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {topSkills.map(([skillName, level]) => {
                      const ev = emp.evidenceStatus[skillName] ?? "self_reported";
                      return (
                        <SkillChip
                          key={skillName}
                          name={skillName}
                          level={level}
                          status={
                            ev === "verified"
                              ? "verified"
                              : ev === "demonstrated"
                                ? "inferred"
                                : "self_reported"
                          }
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 border-t border-line pt-3">
                  <ProgressBar
                    value={emp.progressPct}
                    label={`Development Progress (${demonstratedCount} proven)`}
                    size="sm"
                    tone="forest"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => setSelectedDemoEmp(emp)}
                  >
                    Inspect Authorized Competency Profile
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Drawer for Live Team Member */}
      <Drawer
        open={Boolean(selectedLiveEmp)}
        onClose={() => setSelectedLiveEmp(null)}
        title={selectedLiveEmp?.full_name || selectedLiveEmp?.email || "Member"}
        description={selectedLiveEmp?.target_role_title || "Organization Member"}
        footer={
          <Button variant="primary" onClick={() => setSelectedLiveEmp(null)}>
            Close
          </Button>
        }
      >
        {selectedLiveEmp ? (
          <div className="space-y-5">
            <PastelCard
              tone="pistachio"
              eyebrow="Live Backend Member Summary"
              title={`${selectedLiveEmp.readiness_score}% Target Role Readiness`}
              description={`${selectedLiveEmp.skills_count} recorded skills • Last activity: ${selectedLiveEmp.last_activity ? selectedLiveEmp.last_activity.slice(0, 10) : "None logged"}`}
            />
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                Top Priority Skill Gaps
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedLiveEmp.top_gaps.length === 0 ? (
                  <p className="text-xs text-muted">No open gaps detected.</p>
                ) : (
                  selectedLiveEmp.top_gaps.map((g) => (
                    <SkillChip key={g} name={g} status="inferred" />
                  ))
                )}
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface p-3.5 text-xs text-muted">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-forest shrink-0" />
              <p>
                Private uploaded PDF resumes and private learner chats are
                strictly excluded from manager endpoints.
              </p>
            </div>
          </div>
        ) : null}
      </Drawer>

      {/* Drawer for Demo Team Member */}
      <Drawer
        open={Boolean(selectedDemoEmp)}
        onClose={() => setSelectedDemoEmp(null)}
        title={selectedDemoEmp?.name || "Employee Profile"}
        description={
          selectedDemoEmp
            ? `${selectedDemoEmp.role} • ${selectedDemoEmp.department}`
            : undefined
        }
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <Link href="/manager/training">
              <Button size="sm" variant="secondary">
                Assign Cohort Training
              </Button>
            </Link>
            <Button variant="primary" onClick={() => setSelectedDemoEmp(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedDemoEmp ? (
          <div className="space-y-5">
            <PastelCard
              tone="lavender"
              eyebrow="Authorized Competency Summary"
              title={`${selectedDemoEmp.progressPct}% Development Momentum`}
              description={`Growth focus: ${selectedDemoEmp.priorities.join(" & ")}.`}
            />

            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                Recorded &amp; Demonstrated Skills
              </p>
              {Object.entries(selectedDemoEmp.skills).map(([skillName, lvl]) => {
                const ev =
                  selectedDemoEmp.evidenceStatus[skillName] ?? "self_reported";
                return (
                  <div
                    key={skillName}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <p className="font-bold text-ink">{skillName}</p>
                      <p className="text-muted">Level {lvl}/5</p>
                    </div>
                    <StatusLabel
                      tone={
                        ev === "verified"
                          ? "verified"
                          : ev === "demonstrated"
                            ? "in_progress"
                            : "self_reported"
                      }
                      label={formatEnumLabel(ev)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
