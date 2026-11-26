"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, MinusCircle } from "lucide-react";

import {
  Button,
  Card,
  EditorialHeading,
  PastelCard,
  ProgressBar,
  Select,
  StatusLabel,
} from "@/components/ui";
import {
  DEPARTMENTS,
  HEATMAP_SKILLS,
  MANAGER_TRAINING_CATALOG,
  useManagerDemo,
  type DepartmentName,
} from "@/lib/demo/managerDemoStore";

const TARGET_BY_SKILL: Record<string, number> = {
  Python: 4,
  SQL: 4,
  "Machine Learning": 3.5,
  "Generative AI": 3.5,
  "Cloud Computing": 3.5,
  DevOps: 3.5,
  "Data Visualization": 3.5,
};

export function ManagerHeatmapView() {
  const { employees } = useManagerDemo();

  const [deptFilter, setDeptFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [selectedCell, setSelectedCell] = useState<{
    dept: DepartmentName;
    skill: string;
  }>({ dept: "Data Science", skill: "Generative AI" });

  const visibleDepartments = DEPARTMENTS.filter(
    (d) => deptFilter === "All" || d === deptFilter
  );
  const visibleSkills = HEATMAP_SKILLS.filter(
    (s) => categoryFilter === "All" || s.category === categoryFilter
  );

  function getCellMetrics(dept: DepartmentName, skillName: string) {
    const members = employees.filter((e) => e.department === dept);
    const avg =
      members.reduce((acc, m) => acc + (m.skills[skillName] ?? 0), 0) /
      Math.max(1, members.length);
    const roundedAvg = Number(avg.toFixed(1));
    const required = TARGET_BY_SKILL[skillName] ?? 3.5;
    const gap = Math.max(0, Number((required - roundedAvg).toFixed(1)));
    const state: "met" | "developing" | "gap" =
      roundedAvg >= required
        ? "met"
        : roundedAvg >= required - 1.1
          ? "developing"
          : "gap";

    return { members, roundedAvg, required, gap, state };
  }

  const activeDetails = getCellMetrics(selectedCell.dept, selectedCell.skill);
  const matchingTrainings = MANAGER_TRAINING_CATALOG.filter(
    (t) =>
      t.targetSkill === selectedCell.skill ||
      t.departmentFocus === selectedCell.dept
  );

  return (
    <div className="space-y-8">
      <EditorialHeading
        eyebrow="Organization • Skill Heatmap"
        title="Organizational"
        italicAccent="Skill Heatmap"
        subtitle="Department-by-skill competency matrix combining color and explicit status markers so capability gaps stand out clearly without relying on color alone."
        actions={
          <Link href="/manager/training">
            <Button
              size="sm"
              variant="primary"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Plan Cohort Training
            </Button>
          </Link>
        }
      />

      {/* Legend & Filters */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <Select
                label="Department Filter"
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
                label="Skill Category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="Data & AI">Data &amp; AI</option>
                <option value="Cloud & Infra">Cloud &amp; Infra</option>
                <option value="Analytics & UI">Analytics &amp; UI</option>
              </Select>
            </div>
          </div>

          {/* Non-color + pastel legend */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C5D89B] bg-[#D9E8B5] px-3 py-1 text-ink">
              <CheckCircle2 className="h-3.5 w-3.5 text-forest" />
              Target Met (✓)
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EBCD75] bg-[#F9DF91] px-3 py-1 text-ink">
              <MinusCircle className="h-3.5 w-3.5 text-[#8A6300]" />
              Developing (~)
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E3B29B] bg-[#F4C9B4] px-3 py-1 text-ink">
              <AlertCircle className="h-3.5 w-3.5 text-[#8C371C]" />
              Gap Alert (!)
            </span>
          </div>
        </div>
      </Card>

      {/* Matrix + Cell Inspector */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card padding="md" className="lg:col-span-8 overflow-x-auto">
          <table className="w-full min-w-[600px] border-separate border-spacing-2 text-left text-xs">
            <thead>
              <tr>
                <th className="px-2 py-2 font-bold uppercase tracking-wider text-muted">
                  Department
                </th>
                {visibleSkills.map((sk) => (
                  <th
                    key={sk.name}
                    className="px-2 py-2 text-center font-bold text-ink"
                  >
                    {sk.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleDepartments.map((dept) => (
                <tr key={dept}>
                  <td className="px-2 py-2 font-bold text-ink whitespace-nowrap">
                    {dept}
                  </td>
                  {visibleSkills.map((sk) => {
                    const cell = getCellMetrics(dept, sk.name);
                    const isSelected =
                      selectedCell.dept === dept &&
                      selectedCell.skill === sk.name;
                    const bgClass =
                      cell.state === "met"
                        ? "bg-[#D9E8B5] border-[#BDD3C1] text-ink"
                        : cell.state === "developing"
                          ? "bg-[#F9DF91] border-[#EBCD75] text-ink"
                          : "bg-[#F4C9B4] border-[#E3B29B] text-ink";

                    return (
                      <td key={`${dept}-${sk.name}`}>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCell({ dept, skill: sk.name })
                          }
                          className={`w-full rounded-xl border px-2 py-2.5 text-center transition cursor-pointer ${bgClass} ${
                            isSelected ? "ring-2 ring-forest ring-offset-1" : ""
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1 font-bold">
                            {cell.state === "met" ? (
                              <CheckCircle2 className="h-3 w-3 text-forest" />
                            ) : cell.state === "developing" ? (
                              <MinusCircle className="h-3 w-3 text-[#8A6300]" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-[#8C371C]" />
                            )}
                            <span>{cell.roundedAvg}/5</span>
                          </div>
                          <p className="mt-0.5 text-[10px] font-semibold">
                            {cell.state === "met"
                              ? "Met ✓"
                              : cell.state === "developing"
                                ? "Dev ~"
                                : "Gap !"}
                          </p>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Cell Detail Inspector */}
        <div className="space-y-5 lg:col-span-4">
          <Card padding="lg" className="space-y-4">
            <div className="space-y-1">
              <StatusLabel
                tone={
                  activeDetails.state === "met"
                    ? "verified"
                    : activeDetails.state === "developing"
                      ? "in_progress"
                      : "attention"
                }
                label={
                  activeDetails.state === "met"
                    ? "Benchmark Met"
                    : activeDetails.state === "developing"
                      ? "Developing Coverage"
                      : "Priority Capability Gap"
                }
              />
              <h2 className="font-editorial text-3xl text-ink">
                {selectedCell.dept} • {selectedCell.skill}
              </h2>
            </div>

            <div className="rounded-xl border border-line bg-canvas p-4 space-y-2">
              <ProgressBar
                value={activeDetails.roundedAvg}
                max={activeDetails.required}
                label={`Current ${activeDetails.roundedAvg}/5 vs Target ${activeDetails.required}/5`}
                tone={activeDetails.gap === 0 ? "pistachio" : "butter"}
              />
              <p className="text-xs text-muted">
                {activeDetails.gap === 0
                  ? "Department meets or exceeds target proficiency benchmark."
                  : `Missing coverage: -${activeDetails.gap} proficiency levels below benchmark.`}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Team Members ({activeDetails.members.length})
              </p>
              {activeDetails.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-line bg-canvas px-3 py-2 text-xs"
                >
                  <span className="font-semibold text-ink">{m.name}</span>
                  <span className="font-bold text-forest">
                    {m.skills[selectedCell.skill] ?? 0}/5
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-line pt-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Recommended Learning Actions
              </p>
              {matchingTrainings.map((tr) => (
                <div
                  key={tr.id}
                  className="rounded-xl border border-line bg-canvas p-3 text-xs space-y-1"
                >
                  <p className="font-bold text-ink">{tr.title}</p>
                  <p className="text-muted">
                    {tr.durationHours} hrs •{" "}
                    {tr.costPerSeatInr === 0
                      ? "Free"
                      : `₹${tr.costPerSeatInr.toLocaleString("en-IN")} INR/seat`}
                  </p>
                </div>
              ))}
              <Link href="/manager/training">
                <Button size="sm" variant="primary" className="w-full">
                  Schedule in Training Planner
                </Button>
              </Link>
            </div>
          </Card>

          <PastelCard
            tone="lavender"
            eyebrow="[DEMO] Matrix Transparency"
            title="Accessible Status Coding"
            description="Every cell pairs pastel tones with text tags and vector status symbols so priority gaps are unmistakable."
          />
        </div>
      </div>
    </div>
  );
}
