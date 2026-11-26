"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckSquare, Scale, ShieldAlert, Square } from "lucide-react";

import {
  Button,
  Card,
  EditorialHeading,
  PastelCard,
  ProgressBar,
  StatusLabel,
} from "@/components/ui";
import {
  computeProjectCoverageForSkills,
  SAMPLE_PROJECT_PRESETS,
  useManagerDemo,
} from "@/lib/demo/managerDemoStore";

export function ManagerTalentView() {
  const {
    managerState,
    employees,
    applyProjectPreset,
    updateProjectRequirement,
  } = useManagerDemo();

  const [compareIds, setCompareIds] = useState<string[]>([
    employees[0]?.id ?? "",
    employees[1]?.id ?? "",
  ]);

  function toggleCompare(empId: string) {
    setCompareIds((prev) => {
      if (prev.includes(empId)) {
        return prev.filter((id) => id !== empId);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), empId];
      }
      return [...prev, empId];
    });
  }

  const matchedProfiles = employees
    .map((emp) => {
      const calc = computeProjectCoverageForSkills(
        emp.skills,
        managerState.projectRequirements
      );
      const matching = calc.breakdown.filter((b) => b.gap === 0);
      const missing = calc.breakdown.filter((b) => b.gap > 0);
      return { emp, ...calc, matching, missing };
    })
    .sort((a, b) => b.overallPct - a.overallPct);

  const comparedProfiles = matchedProfiles.filter((m) =>
    compareIds.includes(m.emp.id)
  );

  return (
    <div className="space-y-8">
      <EditorialHeading
        eyebrow="Organization • Internal Talent Discovery"
        title="Internal"
        italicAccent="Talent Discovery"
        subtitle="Signature project-to-employee capability matching backed by the exact same shared requirements as Project Readiness."
        actions={
          <Link href="/manager/projects">
            <Button
              size="sm"
              variant="secondary"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Edit Full Requirements
            </Button>
          </Link>
        }
      />

      {/* Responsible AI & Human Review Banner */}
      <PastelCard
        tone="lavender"
        eyebrow="Decision-Support Integrity Policy"
        title="Human-reviewed development planning — never automated personnel actions"
        description="Coverage percentages aggregate consented skills and demo assessment evidence strictly to assemble cross-functional learning cohorts and staffing recommendations. Never use coverage scores for automated hiring, firing, promotion, or rejection."
        illustration={<ShieldAlert className="h-9 w-9 text-forest" />}
      />

      {/* Shared Project Selector + Quick Requirement Sliders */}
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              Active Initiative: {managerState.projectName} (
              {managerState.projectTimeline})
            </p>
            <h2 className="font-editorial text-2xl text-ink">
              Switch Preset or Tune Thresholds Live
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROJECT_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                size="sm"
                variant={
                  managerState.projectPresetId === preset.id
                    ? "primary"
                    : "secondary"
                }
                onClick={() => applyProjectPreset(preset.id)}
              >
                {preset.name.replace("[DEMO] ", "")}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {managerState.projectRequirements.map((req) => (
            <div
              key={req.id}
              className="rounded-xl border border-line bg-canvas p-3 text-xs space-y-1.5"
            >
              <div className="flex justify-between font-bold text-ink">
                <span>{req.skill}</span>
                <span className="text-forest">
                  Lvl {req.requiredLevel}/5 (w:{req.importance})
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={req.requiredLevel}
                onChange={(e) =>
                  updateProjectRequirement(req.id, {
                    requiredLevel: Number(e.target.value),
                  })
                }
                className="w-full accent-[#294C3B] cursor-pointer"
              />
            </div>
          ))}
        </div>

        <p className="text-xs text-muted">
          Formula:{" "}
          <code className="font-mono text-ink">
            Skill coverage = min(current_proficiency / required_proficiency, 1)
          </code>{" "}
          weighted by importance score across{" "}
          {managerState.projectRequirements.length} required skills.
        </p>
      </Card>

      {/* Side-by-Side Comparison Matrix */}
      {comparedProfiles.length >= 2 ? (
        <Card padding="lg" className="space-y-4 overflow-x-auto">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-forest" />
            <h2 className="font-editorial text-2xl text-ink">
              Side-by-Side Comparison ({comparedProfiles.length} Selected)
            </h2>
          </div>

          <table className="w-full min-w-[540px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className="py-2 pr-4 font-bold text-muted">Requirement</th>
                {comparedProfiles.map(({ emp, overallPct }) => (
                  <th key={emp.id} className="py-2 px-3 font-bold text-ink">
                    {emp.name} ({overallPct}%)
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {managerState.projectRequirements.map((req) => (
                <tr key={req.id} className="border-b border-line/60">
                  <td className="py-2.5 pr-4 font-semibold text-ink">
                    {req.skill} (Target {req.requiredLevel}/5)
                  </td>
                  {comparedProfiles.map(({ emp }) => {
                    const curr = emp.skills[req.skill] ?? 0;
                    const ev = emp.evidenceStatus[req.skill] ?? "self_reported";
                    return (
                      <td key={`${emp.id}-${req.id}`} className="py-2.5 px-3">
                        <span className="font-bold text-ink">{curr}/5</span>{" "}
                        <span className="text-[11px] text-muted">
                          ({ev})
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      {/* Employee Matching Cards */}
      <div className="grid gap-5 md:grid-cols-2">
        {matchedProfiles.map(({ emp, overallPct, breakdown, matching, missing }) => {
          const isCompared = compareIds.includes(emp.id);
          return (
            <Card key={emp.id} className="flex flex-col justify-between gap-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pistachio text-sm font-bold text-ink border border-[#C5D89B]">
                      {emp.initials}
                    </span>
                    <div>
                      <h3 className="font-editorial text-2xl text-ink">
                        {emp.name}
                      </h3>
                      <p className="text-xs text-muted">
                        {emp.role} • {emp.department}
                      </p>
                    </div>
                  </div>
                  <StatusLabel
                    tone={overallPct >= 80 ? "verified" : "in_progress"}
                    label={`${overallPct}% Coverage`}
                  />
                </div>

                <ProgressBar
                  value={overallPct}
                  label={`${matching.length} matching • ${missing.length} developing/missing`}
                  size="sm"
                  tone={overallPct >= 80 ? "pistachio" : "butter"}
                />

                <div className="space-y-2">
                  {breakdown.map((b) => {
                    const ev =
                      emp.evidenceStatus[b.req.skill] ?? "self_reported";
                    return (
                      <div
                        key={b.req.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-canvas px-3 py-2 text-xs"
                      >
                        <div>
                          <span className="font-bold text-ink">
                            {b.req.skill}
                          </span>{" "}
                          <span className="text-muted">
                            ({b.current}/{b.req.requiredLevel})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusLabel
                            tone={
                              ev === "verified"
                                ? "verified"
                                : ev === "demonstrated"
                                  ? "in_progress"
                                  : "self_reported"
                            }
                            label={ev}
                          />
                          <span className="font-bold text-forest">
                            {Math.round(b.coverageRatio * 100)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {missing.length > 0 ? (
                  <p className="rounded-xl border border-line bg-surface-muted/60 px-3 py-2 text-xs text-ink">
                    <strong>Suggested Development:</strong> Upskill{" "}
                    {missing.map((m) => m.req.skill).join(", ")} to unlock 100%
                    project readiness.
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                <Button
                  size="sm"
                  variant={isCompared ? "pastel" : "secondary"}
                  leftIcon={
                    isCompared ? (
                      <CheckSquare className="h-3.5 w-3.5" />
                    ) : (
                      <Square className="h-3.5 w-3.5" />
                    )
                  }
                  onClick={() => toggleCompare(emp.id)}
                >
                  {isCompared ? "Selected for Compare" : "Compare Profile"}
                </Button>

                <Link href="/manager/training">
                  <Button size="sm" variant="ghost">
                    Plan Upskilling →
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
