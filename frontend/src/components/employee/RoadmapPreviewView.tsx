"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BookmarkCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Lock,
  Plus,
  SlidersHorizontal,
} from "lucide-react";

import {
  Button,
  Card,
  EditorialHeading,
  Input,
  Modal,
  PastelCard,
  ProgressBar,
  StatusLabel,
  useToast,
} from "@/components/ui";
import {
  SUPPLEMENTAL_DEMO_OPPORTUNITIES,
  useEmployeeDemo,
  type DemoRoadmapItem,
} from "@/lib/demo/employeeDemoStore";
import { fetchAllCatalogOpportunities } from "@/services/profile";
import type { Opportunity } from "@/types/database";

const MILESTONE_POSITIONS = [
  { cx: 88, cy: 130 },
  { cx: 235, cy: 74 },
  { cx: 392, cy: 146 },
  { cx: 558, cy: 76 },
  { cx: 716, cy: 128 },
];

export function RoadmapPreviewView() {
  const {
    state: demoState,
    toggleRoadmapItem,
    rescheduleRoadmapItem,
    addOpportunityToRoadmap,
    updateSimulatorConstraints,
  } = useEmployeeDemo();
  const { pushToast } = useToast();

  const [bucket, setBucket] = useState<30 | 60 | 90 | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(
    demoState.roadmapItems[1]?.id ?? null
  );
  const [selectedSvgItemId, setSelectedSvgItemId] = useState<string | null>(
    demoState.roadmapItems[1]?.id ?? null
  );
  const [rescheduleTarget, setRescheduleTarget] =
    useState<DemoRoadmapItem | null>(null);
  const [newDate, setNewDate] = useState("");
  const [catalogOpps, setCatalogOpps] = useState<Opportunity[]>(
    SUPPLEMENTAL_DEMO_OPPORTUNITIES
  );

  useEffect(() => {
    let active = true;
    fetchAllCatalogOpportunities(40)
      .then((data) => {
        if (!active) return;
        setCatalogOpps([...data, ...SUPPLEMENTAL_DEMO_OPPORTUNITIES]);
      })
      .catch(() => {
        // Supplemental demo items remain available if offline
      });
    return () => {
      active = false;
    };
  }, []);

  const savedOpportunitiesNotYetOnPlan = catalogOpps.filter(
    (opp) =>
      demoState.savedOpportunityIds.includes(opp.id) &&
      !demoState.roadmapItems.some((rm) => rm.sourceOpportunityId === opp.id)
  );

  const visibleItems = demoState.roadmapItems.filter(
    (item) => bucket === "all" || item.bucket === bucket
  );
  const completedCount = demoState.roadmapItems.filter((i) => i.completed).length;

  // What-If Simulator Feasibility Math ([DEMO] client calculation)
  const remainingItems = demoState.roadmapItems.filter((i) => !i.completed);
  const totalRemainingHours = remainingItems.reduce(
    (acc, i) => acc + i.estimatedHours,
    0
  );
  const estimatedWeeks =
    demoState.weeklyHoursSim > 0
      ? Math.ceil(totalRemainingHours / demoState.weeklyHoursSim)
      : 0;
  const totalPlanCostInr = remainingItems.reduce(
    (acc, i) => acc + i.costInr,
    0
  );
  const overBudgetInr = Math.max(0, totalPlanCostInr - demoState.budgetInrSim);
  const feasibleHoursIn90Days = demoState.weeklyHoursSim * 12;
  const paceFit =
    totalRemainingHours <= feasibleHoursIn90Days
      ? "Feasible within 90 days"
      : `${totalRemainingHours - feasibleHoursIn90Days} hrs overflow beyond 12 weeks`;

  const svgItems = demoState.roadmapItems.slice(0, 5);
  const highlightedSvgItem =
    svgItems.find((i) => i.id === selectedSvgItemId) ?? svgItems[0] ?? null;

  return (
    <div className="space-y-9">
      <EditorialHeading
        eyebrow="Workspace • Adaptive Journey"
        title="Winding"
        italicAccent="Career Roadmap"
        subtitle="30 / 60 / 90-day learning journal preview. Automated AI optimization and Supabase roadmap sync connect in Phase 4."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusLabel tone="in_progress" label="[DEMO] Interactive Plan" />
            <Link href="/employee/explore">
              <Button size="sm" variant="secondary">
                Browse Opportunities
              </Button>
            </Link>
          </div>
        }
      />

      {/* Winding Career Journey SVG Illustration */}
      <Card padding="lg" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              Winding Career River • 30 → 60 → 90 Days
            </p>
            <h2 className="font-editorial text-2xl text-ink">
              Tap a milestone along the ribbon
            </h2>
          </div>
          <div className="w-full sm:w-64">
            <ProgressBar
              value={completedCount}
              max={demoState.roadmapItems.length}
              label="Overall Milestone Progress"
              tone="forest"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-canvas p-4 overflow-x-auto">
          <svg
            viewBox="0 0 800 205"
            className="min-w-[620px] w-full"
            role="img"
            aria-label="Winding 30 60 90 day learning roadmap"
          >
            <defs>
              <linearGradient id="windingRoad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D9E8B5" />
                <stop offset="50%" stopColor="#F9DF91" />
                <stop offset="100%" stopColor="#DDD6F3" />
              </linearGradient>
            </defs>

            <path
              d="M 88 130 C 148 130, 175 74, 235 74 C 300 74, 326 146, 392 146 C 460 146, 492 76, 558 76 C 625 76, 654 128, 716 128"
              fill="none"
              stroke="#E2DFD5"
              strokeWidth="16"
              strokeLinecap="round"
            />
            <path
              d="M 88 130 C 148 130, 175 74, 235 74 C 300 74, 326 146, 392 146 C 460 146, 492 76, 558 76 C 625 76, 654 128, 716 128"
              fill="none"
              stroke="url(#windingRoad)"
              strokeWidth="6"
              strokeDasharray="9 6"
              strokeLinecap="round"
            />

            {svgItems.map((item, idx) => {
              const pos = MILESTONE_POSITIONS[idx] ?? { cx: 80 + idx * 140, cy: 110 };
              const selected = highlightedSvgItem?.id === item.id;
              const nodeFill = item.completed
                ? "#D9E8B5"
                : item.bucket === 30
                  ? "#F9DF91"
                  : item.bucket === 60
                    ? "#F4C9B4"
                    : "#DDD6F3";

              return (
                <g
                  key={item.id}
                  onClick={() => {
                    setSelectedSvgItemId(item.id);
                    setExpandedId(item.id);
                  }}
                  className="cursor-pointer"
                >
                  {selected ? (
                    <circle
                      cx={pos.cx}
                      cy={pos.cy}
                      r={28}
                      fill={nodeFill}
                      fillOpacity={0.45}
                    />
                  ) : null}
                  <circle
                    cx={pos.cx}
                    cy={pos.cy}
                    r={selected ? 21 : 17}
                    fill={nodeFill}
                    stroke="#294C3B"
                    strokeWidth={selected ? 3 : 1.8}
                  />
                  <text
                    x={pos.cx}
                    y={pos.cy + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#202622"
                  >
                    {item.completed ? "✓" : `D${item.bucket}`}
                  </text>
                  <text
                    x={pos.cx}
                    y={pos.cy + 36}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight={selected ? "700" : "600"}
                    fill="#202622"
                  >
                    {item.type}
                  </text>
                </g>
              );
            })}
          </svg>

          {highlightedSvgItem ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-xs">
              <div>
                <p className="font-bold text-ink">
                  {highlightedSvgItem.title}
                </p>
                <p className="text-muted">
                  Day {highlightedSvgItem.bucket} tier •{" "}
                  {highlightedSvgItem.estimatedHours} hrs •{" "}
                  {highlightedSvgItem.costInr === 0
                    ? "Free"
                    : `₹${highlightedSvgItem.costInr.toLocaleString("en-IN")} INR`}
                </p>
              </div>
              <Button
                size="sm"
                variant={highlightedSvgItem.completed ? "pastel" : "primary"}
                onClick={() => toggleRoadmapItem(highlightedSvgItem.id)}
              >
                {highlightedSvgItem.completed
                  ? "Mark Incomplete"
                  : "Mark Complete (+35 XP)"}
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      {/* Main Horizon List + What-If Simulator */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: 30/60/90 Expandable Milestones + Saved Queue */}
        <div className="space-y-6 lg:col-span-7">
          <Card padding="lg" className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div className="flex flex-wrap gap-2">
                {(["all", 30, 60, 90] as const).map((day) => (
                  <Button
                    key={String(day)}
                    size="sm"
                    variant={bucket === day ? "primary" : "secondary"}
                    onClick={() => setBucket(day)}
                  >
                    {day === "all" ? "All 90 Days" : `First ${day} Days`}
                  </Button>
                ))}
              </div>
              <span className="text-xs font-semibold text-muted">
                {visibleItems.length} milestone(s)
              </span>
            </div>

            <div className="space-y-3">
              {visibleItems.map((item) => {
                const isExpanded = expandedId === item.id;
                const prereqUnfinished = Boolean(
                  item.prerequisiteTitle &&
                    demoState.roadmapItems.some(
                      (other) =>
                        other.title.includes(item.prerequisiteTitle ?? "") &&
                        !other.completed
                    )
                );
                const overSimBudget = item.costInr > demoState.budgetInrSim;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-line bg-canvas p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const nextDone = !item.completed;
                          toggleRoadmapItem(item.id);
                          pushToast({
                            tone: nextDone ? "success" : "info",
                            title: nextDone
                              ? "Milestone completed (+35 Engagement XP)"
                              : "Activity marked active",
                            description: nextDone
                              ? "Proficiency verification still requires passing an assessment."
                              : undefined,
                          });
                        }}
                        className="flex flex-1 items-start gap-3 text-left cursor-pointer"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 text-forest shrink-0" />
                        ) : (
                          <Circle className="mt-0.5 h-5 w-5 text-muted shrink-0" />
                        )}
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p
                              className={`text-sm font-bold ${
                                item.completed
                                  ? "line-through text-muted"
                                  : "text-ink"
                              }`}
                            >
                              {item.title}
                            </p>
                            {prereqUnfinished && !item.completed ? (
                              <StatusLabel
                                tone="attention"
                                label="Prerequisite Pending"
                                icon={<Lock className="h-3 w-3" />}
                              />
                            ) : null}
                            {overSimBudget && !item.completed ? (
                              <StatusLabel
                                tone="attention"
                                label="Exceeds INR Cap"
                              />
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-xs text-muted">
                            Day {item.bucket} • {item.type} •{" "}
                            {item.estimatedHours} hrs •{" "}
                            {item.costInr === 0
                              ? "Free"
                              : `₹${item.costInr.toLocaleString("en-IN")} INR`}{" "}
                            • Target: {item.scheduledDate}
                          </p>
                        </div>
                      </button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : item.id)
                        }
                        aria-label="Toggle milestone details"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {isExpanded ? (
                      <div className="space-y-3 border-t border-line pt-3 text-xs">
                        <p className="leading-relaxed text-ink">{item.notes}</p>
                        {item.prerequisiteTitle ? (
                          <p className="text-muted">
                            <strong>Recommended prerequisite:</strong>{" "}
                            {item.prerequisiteTitle}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            leftIcon={<CalendarClock className="h-3.5 w-3.5" />}
                            onClick={() => {
                              setRescheduleTarget(item);
                              setNewDate(item.scheduledDate);
                            }}
                          >
                            Reschedule Date
                          </Button>
                          {item.costInr > 0 ? (
                            <Link href="/employee/sponsorship">
                              <Button size="sm" variant="ghost">
                                Request INR Sponsorship
                              </Button>
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Saved Opportunities Queue */}
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="h-4 w-4 text-forest" />
                <h2 className="font-editorial text-2xl text-ink">
                  Saved Opportunities Ready to Schedule
                </h2>
              </div>
              <Link
                href="/employee/explore"
                className="text-xs font-semibold text-forest underline"
              >
                Explore More
              </Link>
            </div>

            {savedOpportunitiesNotYetOnPlan.length === 0 ? (
              <p className="text-xs text-muted">
                All bookmarked opportunities are already scheduled, or bookmark
                items on Explore Opportunities to queue them here.
              </p>
            ) : (
              <div className="space-y-2.5">
                {savedOpportunitiesNotYetOnPlan.map((opp) => (
                  <div
                    key={opp.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas px-4 py-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-ink">{opp.title}</p>
                      <p className="text-muted">
                        {opp.estimated_hours} hrs •{" "}
                        {opp.cost_inr === 0
                          ? "Free"
                          : `₹${opp.cost_inr.toLocaleString("en-IN")} INR`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<Plus className="h-3.5 w-3.5" />}
                      onClick={() => {
                        const added = addOpportunityToRoadmap(opp, 60);
                        pushToast({
                          tone: added ? "success" : "info",
                          title: added
                            ? "Added to Day 60 Horizon (+15 XP)"
                            : "Already scheduled",
                          description: opp.title,
                        });
                      }}
                    >
                      Add to Plan
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: What-If Time & INR Budget Simulator */}
        <div id="simulator" className="space-y-5 lg:col-span-5">
          <PastelCard
            tone="butter"
            eyebrow="[DEMO SIMULATOR] Real-Time What-If Planner"
            title={`${estimatedWeeks} weeks at ${demoState.weeklyHoursSim} hrs/wk`}
            description="Adjust your weekly availability and INR cap below. Calculations run locally on sample plan hours — server-side optimization connects in Phase 4."
            illustration={<SlidersHorizontal className="h-9 w-9 text-forest" />}
          >
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-ink">
                  <span>Weekly Learning Capacity</span>
                  <span className="text-forest">
                    {demoState.weeklyHoursSim} hrs / week
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={25}
                  step={1}
                  value={demoState.weeklyHoursSim}
                  onChange={(e) =>
                    updateSimulatorConstraints(
                      Number(e.target.value),
                      demoState.budgetInrSim
                    )
                  }
                  className="w-full accent-[#294C3B] cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-ink">
                  <span>Simulated Learning Budget (INR)</span>
                  <span className="text-forest">
                    ₹{demoState.budgetInrSim.toLocaleString("en-IN")} INR
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={25000}
                  step={500}
                  value={demoState.budgetInrSim}
                  onChange={(e) =>
                    updateSimulatorConstraints(
                      demoState.weeklyHoursSim,
                      Number(e.target.value)
                    )
                  }
                  className="w-full accent-[#294C3B] cursor-pointer"
                />
              </div>
            </div>
          </PastelCard>

          <Card padding="lg" className="space-y-4">
            <h3 className="font-editorial text-2xl text-ink">
              Simulated Feasibility Summary
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-line bg-canvas p-3">
                <p className="text-muted">Remaining Effort</p>
                <p className="mt-1 text-base font-bold text-ink">
                  {totalRemainingHours} hours
                </p>
              </div>
              <div className="rounded-xl border border-line bg-canvas p-3">
                <p className="text-muted">Remaining Cost</p>
                <p className="mt-1 text-base font-bold text-ink">
                  ₹{totalPlanCostInr.toLocaleString("en-IN")} INR
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-canvas p-3.5 text-xs space-y-1.5">
              <p className="font-semibold text-ink">Pace Assessment: {paceFit}</p>
              {overBudgetInr > 0 ? (
                <p className="flex items-start gap-1.5 text-[var(--status-attention-text)] font-medium">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Paid plan items exceed your ₹
                  {demoState.budgetInrSim.toLocaleString("en-IN")} INR simulator
                  limit by ₹{overBudgetInr.toLocaleString("en-IN")} INR.
                </p>
              ) : (
                <p className="text-forest font-semibold">
                  Within INR simulator budget with ₹
                  {(demoState.budgetInrSim - totalPlanCostInr).toLocaleString(
                    "en-IN"
                  )}{" "}
                  INR headroom.
                </p>
              )}
            </div>

            {overBudgetInr > 0 ? (
              <Link href="/employee/sponsorship">
                <Button size="sm" variant="primary" className="w-full">
                  Request Manager Sponsorship for Gap
                </Button>
              </Link>
            ) : null}
          </Card>
        </div>
      </div>

      <Modal
        open={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        title="Reschedule Learning Activity"
        description={rescheduleTarget?.title}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRescheduleTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!rescheduleTarget || !newDate) return;
                rescheduleRoadmapItem(rescheduleTarget.id, newDate);
                pushToast({
                  tone: "info",
                  title: "Demo schedule updated",
                  description: `${rescheduleTarget.title} moved to ${newDate}`,
                });
                setRescheduleTarget(null);
              }}
            >
              Save Demo Date
            </Button>
          </>
        }
      >
        <Input
          label="New Target Date"
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
        />
      </Modal>
    </div>
  );
}
