"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calculator, CheckCircle2 } from "lucide-react";

import {
  Button,
  Card,
  EditorialHeading,
  PastelCard,
  ProgressBar,
  StatusLabel,
} from "@/components/ui";
import {
  DEPARTMENTS,
  HEATMAP_SKILLS,
  MANAGER_TRAINING_CATALOG,
  useManagerDemo,
} from "@/lib/demo/managerDemoStore";

export function ManagerBudgetView() {
  const {
    managerState,
    approvedSponsorshipSpentInr,
    remainingTrainingBudgetInr,
    setTrainingBudgetInr,
    setDepartmentAllocation,
  } = useManagerDemo();

  const [prioritySkills, setPrioritySkills] = useState<string[]>([
    "Generative AI",
    "Cloud Computing",
    "SQL",
  ]);
  const [seatsPerCohort, setSeatsPerCohort] = useState<number>(3);
  const [weeklyDeptHours, setWeeklyDeptHours] = useState<number>(18);

  function togglePrioritySkill(skill: string) {
    setPrioritySkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  // Deterministic allocator that guarantees total expenditure NEVER exceeds remainingTrainingBudgetInr
  const prioritizedCatalog = [...MANAGER_TRAINING_CATALOG].sort((a, b) => {
    const aMatch = prioritySkills.includes(a.targetSkill) ? 1 : 0;
    const bMatch = prioritySkills.includes(b.targetSkill) ? 1 : 0;
    if (aMatch !== bMatch) return bMatch - aMatch;
    return a.costPerSeatInr - b.costPerSeatInr;
  });

  let runningSpend = 0;
  let runningHours = 0;
  const allocatedCohorts: Array<{
    item: (typeof MANAGER_TRAINING_CATALOG)[number];
    cohortCostInr: number;
  }> = [];

  for (const item of prioritizedCatalog) {
    const cohortCostInr = item.costPerSeatInr * seatsPerCohort;
    if (
      runningSpend + cohortCostInr <= remainingTrainingBudgetInr &&
      runningHours + item.durationHours <= weeklyDeptHours * 4
    ) {
      runningSpend += cohortCostInr;
      runningHours += item.durationHours;
      allocatedCohorts.push({ item, cohortCostInr });
    }
  }

  const finalRemainingAfterSim = Math.max(
    0,
    remainingTrainingBudgetInr - runningSpend
  );
  const estimatedGapClosurePct = Math.min(
    92,
    allocatedCohorts.length * 18 + (approvedSponsorshipSpentInr > 0 ? 12 : 0)
  );

  return (
    <div className="space-y-8">
      <EditorialHeading
        eyebrow="Development • Budget What-If Simulator"
        title="INR Budget"
        italicAccent="Simulator"
        subtitle="Model department budget splits and cohort allocations cleanly. Approved sponsorship deductions are factored in live, and proposed spend never exceeds remaining headroom."
        actions={
          <Link href="/manager/sponsorship">
            <Button size="sm" variant="secondary">
              Inspect Approved Sponsorships
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Controls */}
        <Card padding="lg" className="lg:col-span-6 space-y-6">
          <h2 className="font-editorial text-2xl text-ink">
            Budget &amp; Capacity Levers (INR)
          </h2>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-ink">
              <span>Total Quarterly Training Budget (INR)</span>
              <span className="text-forest">
                ₹{managerState.totalTrainingBudgetInr.toLocaleString("en-IN")}{" "}
                INR
              </span>
            </div>
            <input
              type="range"
              min={10000}
              max={200000}
              step={5000}
              value={managerState.totalTrainingBudgetInr}
              onChange={(e) => setTrainingBudgetInr(Number(e.target.value))}
              className="w-full accent-[#294C3B] cursor-pointer"
            />
            <p className="text-[11px] text-muted">
              Already committed to Approved Sponsorships: ₹
              {approvedSponsorshipSpentInr.toLocaleString("en-IN")} INR →{" "}
              <strong className="text-ink">
                ₹{remainingTrainingBudgetInr.toLocaleString("en-IN")} INR
                available
              </strong>
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-ink">
                <span>Seats per Activity</span>
                <span className="text-forest">{seatsPerCohort} learners</span>
              </div>
              <input
                type="range"
                min={1}
                max={6}
                step={1}
                value={seatsPerCohort}
                onChange={(e) => setSeatsPerCohort(Number(e.target.value))}
                className="w-full accent-[#294C3B] cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-ink">
                <span>Team Hours / Week</span>
                <span className="text-forest">{weeklyDeptHours} hrs</span>
              </div>
              <input
                type="range"
                min={4}
                max={40}
                step={2}
                value={weeklyDeptHours}
                onChange={(e) => setWeeklyDeptHours(Number(e.target.value))}
                className="w-full accent-[#294C3B] cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Priority Skills to Fund
            </p>
            <div className="flex flex-wrap gap-2">
              {HEATMAP_SKILLS.map((sk) => {
                const active = prioritySkills.includes(sk.name);
                return (
                  <Button
                    key={sk.name}
                    size="sm"
                    variant={active ? "primary" : "secondary"}
                    onClick={() => togglePrioritySkill(sk.name)}
                  >
                    {sk.name}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 border-t border-line pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Department Budget Allocation Split
            </p>
            {DEPARTMENTS.map((dept) => {
              const pct = managerState.budgetAllocations[dept] ?? 20;
              const rupees = Math.round(
                (remainingTrainingBudgetInr * pct) / 100
              );
              return (
                <div key={dept} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-ink">{dept}</span>
                    <span className="text-forest">
                      {pct}% (₹{rupees.toLocaleString("en-IN")} INR)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={60}
                    step={5}
                    value={pct}
                    onChange={(e) =>
                      setDepartmentAllocation(dept, Number(e.target.value))
                    }
                    className="w-full accent-[#294C3B] cursor-pointer"
                  />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Simulated Allocation Results */}
        <div className="space-y-6 lg:col-span-6">
          <PastelCard
            tone="butter"
            eyebrow="Prototype mode · Hard-Cap Allocation"
            title={`${allocatedCohorts.length} Eligible Learning Activities`}
            description={`Proposed cohort spend: ₹${runningSpend.toLocaleString("en-IN")} INR • Remaining after plan: ₹${finalRemainingAfterSim.toLocaleString("en-IN")} INR.`}
            illustration={<Calculator className="h-9 w-9 text-forest" />}
          >
            <ProgressBar
              value={estimatedGapClosurePct}
              label="Estimated Skill-Gap Coverage Lift (Demo Model)"
              tone="forest"
            />
          </PastelCard>

          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-editorial text-2xl text-ink">
                Proposed Cohort Allocation
              </h3>
              <StatusLabel
                tone="verified"
                label="Within Remaining Budget Cap"
              />
            </div>

            {allocatedCohorts.length === 0 ? (
              <p className="text-xs text-muted">
                Remaining INR balance or weekly team capacity is too low for paid
                multi-seat cohorts; free workshops still unlock as budget grows.
              </p>
            ) : (
              <div className="space-y-2.5">
                {allocatedCohorts.map(({ item, cohortCostInr }) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-canvas px-4 py-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-forest shrink-0" />
                      <div>
                        <p className="font-bold text-ink">{item.title}</p>
                        <p className="text-muted">
                          {item.targetSkill} • {seatsPerCohort} seats •{" "}
                          {item.durationHours} hrs
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-forest">
                      {cohortCostInr === 0
                        ? "Free (₹0)"
                        : `₹${cohortCostInr.toLocaleString("en-IN")} INR`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
