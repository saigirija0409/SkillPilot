"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, ShieldCheck } from "lucide-react";

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
  SkillChip,
  StatusLabel,
} from "@/components/ui";
import {
  DEPARTMENTS,
  HEATMAP_SKILLS,
  useManagerDemo,
  type DemoEmployeeProfile,
} from "@/lib/demo/managerDemoStore";

export function ManagerTeamsView() {
  const { employees } = useManagerDemo();

  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [skillFilter, setSkillFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"progress" | "name" | "verified">(
    "progress"
  );
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("grid");
  const [selectedEmp, setSelectedEmp] = useState<DemoEmployeeProfile | null>(
    null
  );

  const filtered = employees
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
        subtitle="Consented competency directory across departments. Live assessment completions from the Employee Portal update demonstrated proof here automatically."
        actions={
          <div className="flex items-center gap-2">
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

      {/* Search, Filters & Sort */}
      <Card padding="md">
        <div className="grid gap-4 md:grid-cols-12 md:items-end">
          <div className="md:col-span-4">
            <Input
              label="Search Employee, Role, or Skill"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Ananya, Cloud, Python..."
            />
          </div>

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

          <div className="md:col-span-2">
            <Select
              label="Sort By"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "progress" | "name" | "verified")
              }
            >
              <option value="progress">Progress %</option>
              <option value="verified">Evidence Count</option>
              <option value="name">Name (A–Z)</option>
            </Select>
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title="No team members match those filters"
          description="Clear your search query or broaden the department and skill filters."
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
              Reset Directory Filters
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
          {filtered.map((emp) => {
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
                          status={ev === "verified" ? "verified" : ev === "demonstrated" ? "inferred" : "self_reported"}
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
                    onClick={() => setSelectedEmp(emp)}
                  >
                    Inspect Authorized Competency Profile
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Privacy-Preserving Employee Detail Drawer */}
      <Drawer
        open={Boolean(selectedEmp)}
        onClose={() => setSelectedEmp(null)}
        title={selectedEmp?.name || "Employee Profile"}
        description={
          selectedEmp
            ? `${selectedEmp.role} • ${selectedEmp.department}`
            : undefined
        }
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <Link href="/manager/training">
              <Button size="sm" variant="secondary">
                Assign Cohort Training
              </Button>
            </Link>
            <Button variant="primary" onClick={() => setSelectedEmp(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedEmp ? (
          <div className="space-y-5">
            <PastelCard
              tone="lavender"
              eyebrow="Authorized Competency Summary"
              title={`${selectedEmp.progressPct}% Development Momentum`}
              description={`Growth focus: ${selectedEmp.priorities.join(" & ")}.`}
            />

            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                Recorded &amp; Demonstrated Skills
              </p>
              {Object.entries(selectedEmp.skills).map(([skillName, lvl]) => {
                const ev =
                  selectedEmp.evidenceStatus[skillName] ?? "self_reported";
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
                      label={
                        ev === "demonstrated"
                          ? "Demonstrated (Demo Assessment)"
                          : ev
                      }
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-line bg-surface p-3.5 text-xs text-muted">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-forest shrink-0" />
              <p>
                <strong>Privacy Boundary Enforced:</strong> Private uploaded
                PDF resumes, personal AI copilot messages, and unconsented notes
                are never surfaced in manager views.
              </p>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
