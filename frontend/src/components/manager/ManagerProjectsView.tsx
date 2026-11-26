"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Sparkles, Trash2 } from "lucide-react";

import {
  Button,
  Card,
  EditorialHeading,
  Input,
  PastelCard,
  ProgressBar,
  Select,
  StatusLabel,
} from "@/components/ui";
import {
  computeProjectCoverageForSkills,
  HEATMAP_SKILLS,
  SAMPLE_PROJECT_PRESETS,
  useManagerDemo,
} from "@/lib/demo/managerDemoStore";

export function ManagerProjectsView() {
  const {
    managerState,
    employees,
    applyProjectPreset,
    setProjectMetadata,
    addProjectRequirement,
    updateProjectRequirement,
    removeProjectRequirement,
  } = useManagerDemo();

  const [newSkill, setNewSkill] = useState<string>(HEATMAP_SKILLS[0].name);

  // Compute organizational current average proficiency per skill
  const orgAvgSkills: Record<string, number> = {};
  for (const sk of HEATMAP_SKILLS) {
    const avg =
      employees.reduce((acc, e) => acc + (e.skills[sk.name] ?? 0), 0) /
      Math.max(1, employees.length);
    orgAvgSkills[sk.name] = Number(avg.toFixed(2));
  }

  const orgCoverage = computeProjectCoverageForSkills(
    orgAvgSkills,
    managerState.projectRequirements
  );

  const rankedContributors = employees
    .map((emp) => {
      const cov = computeProjectCoverageForSkills(
        emp.skills,
        managerState.projectRequirements
      );
      return { emp, coveragePct: cov.overallPct };
    })
    .sort((a, b) => b.coveragePct - a.coveragePct)
    .slice(0, 4);

  const availableCompetencies = orgCoverage.breakdown.filter(
    (b) => b.coverageRatio >= 0.85
  );
  const missingCompetencies = orgCoverage.breakdown.filter(
    (b) => b.coverageRatio < 0.85
  );

  const unselectedSkills = HEATMAP_SKILLS.filter(
    (sk) => !managerState.projectRequirements.some((r) => r.skill === sk.name)
  );

  return (
    <div className="space-y-8">
      <EditorialHeading
        eyebrow="Organization • Project Readiness"
        title="Project"
        italicAccent="Readiness Builder"
        subtitle="Define required skills, proficiency thresholds, and importance weights. Requirements sync live with Internal Talent Discovery."
        actions={
          <Link href="/manager/talent">
            <Button
              size="sm"
              variant="primary"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Inspect Matching Talent
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Requirement Builder */}
        <div className="space-y-6 lg:col-span-7">
          <Card padding="lg" className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-editorial text-2xl text-ink">
                1. Project Definition &amp; Presets
              </h2>
              <StatusLabel tone="in_progress" label="Shared Live State" />
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

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Project Initiative Name"
                value={managerState.projectName}
                onChange={(e) =>
                  setProjectMetadata(e.target.value, managerState.projectTimeline)
                }
              />
              <Select
                label="Delivery Timeline"
                value={managerState.projectTimeline}
                onChange={(e) =>
                  setProjectMetadata(managerState.projectName, e.target.value)
                }
              >
                <option value="Q1 (8 Weeks)">Q1 (8 Weeks)</option>
                <option value="Q1 (10 Weeks)">Q1 (10 Weeks)</option>
                <option value="Q2 (12 Weeks)">Q2 (12 Weeks)</option>
                <option value="H2 (16 Weeks)">H2 (16 Weeks)</option>
              </Select>
            </div>
          </Card>

          <Card padding="lg" className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-editorial text-2xl text-ink">
                  2. Skill &amp; Proficiency Weights
                </h2>
                <p className="text-xs text-muted">
                  Adjust required level (1–5) and importance weight (1–10) to
                  recalculate organizational readiness instantly.
                </p>
              </div>

              {unselectedSkills.length > 0 ? (
                <div className="flex items-end gap-2">
                  <div className="w-44">
                    <Select
                      label="Add Skill"
                      value={
                        unselectedSkills.some((s) => s.name === newSkill)
                          ? newSkill
                          : unselectedSkills[0].name
                      }
                      onChange={(e) => setNewSkill(e.target.value)}
                    >
                      {unselectedSkills.map((sk) => (
                        <option key={sk.name} value={sk.name}>
                          {sk.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => {
                      const pick = unselectedSkills.some(
                        (s) => s.name === newSkill
                      )
                        ? newSkill
                        : unselectedSkills[0].name;
                      addProjectRequirement(pick, 4, 7);
                    }}
                  >
                    Add
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              {managerState.projectRequirements.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl border border-line bg-canvas p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-ink">
                      {req.skill}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Remove ${req.skill}`}
                      onClick={() => removeProjectRequirement(req.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted" />
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted">Required Level</span>
                        <span className="text-forest">
                          {req.requiredLevel} / 5
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

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted">Importance Weight</span>
                        <span className="text-forest">{req.importance} / 10</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={req.importance}
                        onChange={(e) =>
                          updateProjectRequirement(req.id, {
                            importance: Number(e.target.value),
                          })
                        }
                        className="w-full accent-[#294C3B] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Deterministic Coverage Output */}
        <div className="space-y-5 lg:col-span-5">
          <PastelCard
            tone={orgCoverage.overallPct >= 80 ? "pistachio" : "butter"}
            eyebrow={`${managerState.projectTimeline} • Deterministic Coverage`}
            title={`${orgCoverage.overallPct}% Org Project Readiness`}
            description={`Evaluated across ${managerState.projectRequirements.length} weighted requirements for "${managerState.projectName}".`}
          >
            <ProgressBar
              value={orgCoverage.overallPct}
              label="Weighted Organizational Coverage"
              tone="forest"
            />
          </PastelCard>

          <Card padding="lg" className="space-y-4">
            <h3 className="font-editorial text-2xl text-ink">
              Transparent Calculation
            </h3>
            <p className="rounded-xl border border-line bg-canvas px-3.5 py-2.5 font-mono text-[11px] text-ink">
              Skill coverage = min(current / required, 1)
              <br />
              Overall = weighted average by importance
            </p>

            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-forest">
                Available Competencies ({availableCompetencies.length})
              </p>
              {availableCompetencies.length === 0 ? (
                <p className="text-xs text-muted">
                  No competencies currently above 85% coverage threshold.
                </p>
              ) : (
                availableCompetencies.map((b) => (
                  <div
                    key={b.req.id}
                    className="flex items-center justify-between rounded-xl border border-[#C5D89B] bg-[#D9E8B5]/40 px-3 py-2 text-xs"
                  >
                    <span className="font-bold text-ink">{b.req.skill}</span>
                    <span className="font-semibold text-forest">
                      Org Avg {b.current}/5 ({Math.round(b.coverageRatio * 100)}
                      %)
                    </span>
                  </div>
                ))
              )}

              <p className="pt-2 text-xs font-bold uppercase tracking-wider text-[#8C371C]">
                Missing / Priority Gaps ({missingCompetencies.length})
              </p>
              {missingCompetencies.length === 0 ? (
                <p className="text-xs text-muted">
                  Every required skill meets target coverage.
                </p>
              ) : (
                missingCompetencies.map((b) => (
                  <div
                    key={b.req.id}
                    className="flex items-center justify-between rounded-xl border border-[#E3B29B] bg-[#F4C9B4]/45 px-3 py-2 text-xs"
                  >
                    <span className="font-bold text-ink">{b.req.skill}</span>
                    <span className="font-semibold text-[#8C371C]">
                      Avg {b.current}/{b.req.requiredLevel} (
                      {Math.round(b.coverageRatio * 100)}%)
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-2xl text-ink">
                Top Potential Contributors
              </h3>
              <Sparkles className="h-4 w-4 text-forest" />
            </div>
            <div className="space-y-2">
              {rankedContributors.map(({ emp, coveragePct }) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-xs"
                >
                  <div>
                    <p className="font-bold text-ink">{emp.name}</p>
                    <p className="text-muted">{emp.department}</p>
                  </div>
                  <StatusLabel
                    tone={coveragePct >= 80 ? "verified" : "in_progress"}
                    label={`${coveragePct}% Match`}
                  />
                </div>
              ))}
            </div>
            <Link href="/manager/talent">
              <Button size="sm" variant="secondary" className="w-full">
                Compare Contributors in Talent Discovery
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
