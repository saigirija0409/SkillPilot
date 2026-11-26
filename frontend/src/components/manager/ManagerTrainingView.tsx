"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CalendarRange, CheckSquare, Square } from "lucide-react";

import {
  Button,
  Card,
  EditorialHeading,
  PastelCard,
  Select,
  SkillChip,
  StatusLabel,
} from "@/components/ui";
import {
  DEPARTMENTS,
  HEATMAP_SKILLS,
  MANAGER_TRAINING_CATALOG,
  useManagerDemo,
} from "@/lib/demo/managerDemoStore";

export function ManagerTrainingView() {
  const { employees, remainingTrainingBudgetInr } = useManagerDemo();

  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [prioritySkill, setPrioritySkill] = useState<string>("Generative AI");
  const [selectedTrainingIds, setSelectedTrainingIds] = useState<string[]>([
    "tr-genai-eval",
    "tr-sql-lake",
  ]);
  const [participantIds, setParticipantIds] = useState<string[]>(
    employees.slice(0, 3).map((e) => e.id)
  );
  const [hoursCap, setHoursCap] = useState<number>(36);
  const [plannerBudgetInr, setPlannerBudgetInr] = useState<number>(
    Math.min(35000, Math.max(15000, remainingTrainingBudgetInr))
  );

  function toggleTraining(id: string) {
    setSelectedTrainingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleParticipant(id: string) {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const eligibleEmployees = employees.filter(
    (e) => selectedDept === "All" || e.department === selectedDept
  );
  const participatingEmployees = employees.filter((e) =>
    participantIds.includes(e.id)
  );
  const seatCount = Math.max(1, participatingEmployees.length);

  const chosenActivities = MANAGER_TRAINING_CATALOG.filter((tr) =>
    selectedTrainingIds.includes(tr.id)
  );
  const totalDurationHrs = chosenActivities.reduce(
    (acc, tr) => acc + tr.durationHours,
    0
  );
  const totalEstimatedCostInr = chosenActivities.reduce(
    (acc, tr) => acc + tr.costPerSeatInr * seatCount,
    0
  );

  const overBudget = totalEstimatedCostInr > plannerBudgetInr;
  const overHours = totalDurationHrs > hoursCap;

  return (
    <div className="space-y-8">
      <EditorialHeading
        eyebrow="Development • Cohort Strategy"
        title="Training"
        italicAccent="Planner"
        subtitle="Assemble department learning cohorts, balance learning hours against INR seat costs, and inspect projected vs. demonstrated competency gains."
        actions={
          <Link href="/manager/budget">
            <Button size="sm" variant="secondary">
              Open Budget Simulator
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Controls */}
        <div className="space-y-6 lg:col-span-7">
          <Card padding="lg" className="space-y-4">
            <h2 className="font-editorial text-2xl text-ink">
              1. Scope, Hours &amp; Budget Constraints
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Department Scope"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="All">All Departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>

              <Select
                label="Priority Skill Gap"
                value={prioritySkill}
                onChange={(e) => setPrioritySkill(e.target.value)}
              >
                {HEATMAP_SKILLS.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </Select>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-ink">
                  <span>Cohort Learning Hours</span>
                  <span className="text-forest">{hoursCap} hrs</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={80}
                  step={4}
                  value={hoursCap}
                  onChange={(e) => setHoursCap(Number(e.target.value))}
                  className="w-full accent-[#294C3B] cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-ink">
                  <span>Cohort INR Cap</span>
                  <span className="text-forest">
                    ₹{plannerBudgetInr.toLocaleString("en-IN")}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100000}
                  step={2500}
                  value={plannerBudgetInr}
                  onChange={(e) => setPlannerBudgetInr(Number(e.target.value))}
                  className="w-full accent-[#294C3B] cursor-pointer"
                />
              </div>
            </div>
          </Card>

          <Card padding="lg" className="space-y-4">
            <h2 className="font-editorial text-2xl text-ink">
              2. Select Learning Activities
            </h2>
            <div className="space-y-2.5">
              {MANAGER_TRAINING_CATALOG.map((tr) => {
                const picked = selectedTrainingIds.includes(tr.id);
                const matchesPriority = tr.targetSkill === prioritySkill;
                return (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => toggleTraining(tr.id)}
                    className={`flex w-full items-start justify-between gap-3 rounded-2xl border p-4 text-left transition cursor-pointer ${
                      picked
                        ? "border-forest bg-[#D9E8B5]/45"
                        : "border-line bg-canvas hover:border-line-strong"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {picked ? (
                        <CheckSquare className="mt-0.5 h-4 w-4 text-forest shrink-0" />
                      ) : (
                        <Square className="mt-0.5 h-4 w-4 text-muted shrink-0" />
                      )}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-ink">
                            {tr.title}
                          </span>
                          {matchesPriority ? (
                            <StatusLabel tone="verified" label="Priority Match" />
                          ) : null}
                        </div>
                        <p className="text-xs text-muted">
                          {tr.departmentFocus} • {tr.durationHours} hrs •{" "}
                          {tr.costPerSeatInr === 0
                            ? "Free"
                            : `₹${tr.costPerSeatInr.toLocaleString("en-IN")}/seat`}{" "}
                          • {tr.expectedLift}
                        </p>
                      </div>
                    </div>
                    <SkillChip name={tr.targetSkill} status="inferred" />
                  </button>
                );
              })}
            </div>
          </Card>

          <Card padding="lg" className="space-y-4">
            <h2 className="font-editorial text-2xl text-ink">
              3. Participating Employees ({participatingEmployees.length})
            </h2>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {eligibleEmployees.map((emp) => {
                const active = participantIds.includes(emp.id);
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => toggleParticipant(emp.id)}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left text-xs transition cursor-pointer ${
                      active
                        ? "border-forest bg-[#D9E8B5]/45"
                        : "border-line bg-canvas"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-ink">{emp.name}</p>
                      <p className="text-muted">
                        {emp.department} • {prioritySkill}:{" "}
                        {emp.skills[prioritySkill] ?? 0}/5
                      </p>
                    </div>
                    {active ? (
                      <CheckSquare className="h-4 w-4 text-forest shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-muted shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Proposed Training Plan Output */}
        <div className="space-y-5 lg:col-span-5">
          <PastelCard
            tone={overBudget || overHours ? "peach" : "pistachio"}
            eyebrow="[DEMO PLANNER] Proposed Cohort Plan"
            title={`₹${totalEstimatedCostInr.toLocaleString("en-IN")} INR • ${totalDurationHrs} hrs`}
            description={`${chosenActivities.length} activity(s) across ${participatingEmployees.length} employee(s). Deterministic preview until Phase 5 backend optimization.`}
            illustration={<CalendarRange className="h-9 w-9 text-forest" />}
          />

          <Card padding="lg" className="space-y-4">
            <h3 className="font-editorial text-2xl text-ink">
              Plan Feasibility &amp; Distinction
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between rounded-xl border border-line bg-canvas p-3">
                <span className="text-muted">Cohort INR Expenditure</span>
                <span
                  className={`font-bold ${overBudget ? "text-[#8C371C]" : "text-forest"}`}
                >
                  ₹{totalEstimatedCostInr.toLocaleString("en-IN")} / ₹
                  {plannerBudgetInr.toLocaleString("en-IN")} INR
                </span>
              </div>
              <div className="flex justify-between rounded-xl border border-line bg-canvas p-3">
                <span className="text-muted">Learning Time Needed</span>
                <span
                  className={`font-bold ${overHours ? "text-[#8C371C]" : "text-forest"}`}
                >
                  {totalDurationHrs} / {hoursCap} hrs
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[#C7BDE4] bg-[#DDD6F3]/40 p-3.5 text-xs leading-relaxed text-ink">
              <strong>Projected vs. Demonstrated Distinction:</strong> Assigning
              these workshops estimates target skill coverage lift. Formal
              demonstrated or verified status only updates after participants
              complete evaluated assessments.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
