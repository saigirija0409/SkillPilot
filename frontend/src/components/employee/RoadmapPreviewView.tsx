"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import {
  Button,
  Card,
  EditorialHeading,
  PastelCard,
  ProgressBar,
  Select,
  SkeletonCard,
  StatusLabel,
  useToast,
} from "@/components/ui";
import { useEmployeeDemo } from "@/lib/demo/employeeDemoStore";
import { cleanDisplayText, formatEnumLabel } from "@/lib/formatters";
import {
  generateRoadmapApi,
  getRoadmapDetailApi,
  listMyRoadmapsApi,
  updateRoadmapItemStatusApi,
} from "@/services/api";
import { getCurrentSessionAccessToken } from "@/services/auth";
import { fetchCatalogData, fetchUserProfileBundle } from "@/services/profile";
import type {
  RoadmapDetailDto,
  RoadmapItemDto,
  RoadmapListItemDto,
} from "@/types/api";
import type { CareerRole, LearningPreferences, Profile } from "@/types/database";

interface RoadmapPreviewViewProps {
  userId: string;
}

const MILESTONE_POSITIONS = [
  { cx: 88, cy: 130 },
  { cx: 235, cy: 74 },
  { cx: 392, cy: 146 },
  { cx: 558, cy: 76 },
  { cx: 716, cy: 128 },
];

export function RoadmapPreviewView({ userId }: RoadmapPreviewViewProps) {
  const { state: demoState, updateSimulatorConstraints } = useEmployeeDemo();
  const { pushToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [prefs, setPrefs] = useState<LearningPreferences | null>(null);
  const [roles, setRoles] = useState<CareerRole[]>([]);
  const [roadmapsList, setRoadmapsList] = useState<RoadmapListItemDto[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<RoadmapDetailDto | null>(
    null
  );

  // Generation parameters
  const [genRoleId, setGenRoleId] = useState<string>("");
  const [genDuration, setGenDuration] = useState<30 | 60 | 90>(90);
  const [bucket, setBucket] = useState<30 | 60 | 90 | "all">("all");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [selectedSvgIdx, setSelectedSvgIdx] = useState<number>(0);
  const [reloadKey, setReloadKey] = useState(0);

  function handleRetry() {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }

  useEffect(() => {
    let active = true;

    async function loadAll() {
      const token = await getCurrentSessionAccessToken();
      if (!token) {
        if (active) {
          setError("No active session token available.");
          setLoading(false);
        }
        return;
      }

      try {
        const [bundle, catalog, myRoadmaps] = await Promise.all([
          fetchUserProfileBundle(userId),
          fetchCatalogData(),
          listMyRoadmapsApi(token),
        ]);

        if (!active) return;
        setProfile(bundle.profile);
        setPrefs(bundle.preferences);
        setRoles(catalog.careerRoles);
        setRoadmapsList(myRoadmaps);

        const defaultRole =
          bundle.profile?.target_role_id ||
          catalog.careerRoles[0]?.id ||
          "";
        setGenRoleId(defaultRole);

        if (myRoadmaps.length > 0) {
          const detail = await getRoadmapDetailApi(myRoadmaps[0].id, token);
          if (!active) return;
          setActiveRoadmap(detail);
        } else {
          setActiveRoadmap(null);
        }
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Unable to load your roadmaps."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadAll();
    return () => {
      active = false;
    };
  }, [userId, reloadKey]);

  async function handleSelectRoadmap(roadmapId: string) {
    const token = await getCurrentSessionAccessToken();
    if (!token) return;
    try {
      const detail = await getRoadmapDetailApi(roadmapId, token);
      setActiveRoadmap(detail);
      setBucket("all");
    } catch (err) {
      pushToast({
        tone: "warning",
        title: "Could not switch roadmap",
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  async function handleGenerateAiRoadmap() {
    if (!genRoleId) {
      setError("Select a target career role before generating a roadmap.");
      return;
    }
    setGenerating(true);
    setError(null);

    try {
      const token = await getCurrentSessionAccessToken();
      if (!token) {
        throw new Error("Session expired. Sign in again.");
      }

      const generated = await generateRoadmapApi(
        {
          user_id: userId,
          target_role_id: genRoleId,
          duration_days: genDuration,
          daily_minutes_budget: prefs?.daily_minutes ?? 45,
          total_budget_inr: prefs?.budget_inr ?? demoState.budgetInrSim,
          force_regenerate: true,
        },
        token
      );

      if (generated.roadmap_id) {
        const [myList, detail] = await Promise.all([
          listMyRoadmapsApi(token),
          getRoadmapDetailApi(generated.roadmap_id, token),
        ]);
        setRoadmapsList(myList);
        setActiveRoadmap(detail);
      } else {
        // Backend returned transient plan if DB persistence failed
        setActiveRoadmap({
          id: "transient",
          user_id: userId,
          target_role_id: generated.target_role_id,
          title: generated.title,
          duration_days: generated.duration_days,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: generated.items,
        });
      }

      pushToast({
        tone: "success",
        title: `Generated ${generated.duration_days}-day Gemini Roadmap`,
        description: `${generated.items.length} structured activities created for ${generated.target_role_title}.`,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gemini roadmap generation failed."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleToggleRealItem(item: RoadmapItemDto) {
    if (!item.id) {
      pushToast({
        tone: "info",
        title: "Regenerate and persist roadmap to track DB progress",
      });
      return;
    }

    const token = await getCurrentSessionAccessToken();
    if (!token) return;

    const nextStatus = item.status === "completed" ? "pending" : "completed";
    setBusyItemId(item.id);
    try {
      const updated = await updateRoadmapItemStatusApi(
        item.id,
        nextStatus,
        token
      );
      setActiveRoadmap((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((it) =>
                it.id === item.id ? { ...it, ...updated } : it
              ),
            }
          : prev
      );
      pushToast({
        tone: nextStatus === "completed" ? "success" : "info",
        title:
          nextStatus === "completed"
            ? "Activity marked completed in Supabase"
            : "Activity reset to pending",
        description:
          nextStatus === "completed"
            ? "Skill verification still requires passing a formal assessment."
            : undefined,
      });
    } catch (err) {
      pushToast({
        tone: "warning",
        title: "Failed to update roadmap item",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusyItemId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const realItems = activeRoadmap?.items ?? [];
  const visibleItems = realItems.filter(
    (item) => bucket === "all" || Number(item.day_bucket) === bucket
  );
  const completedCount = realItems.filter(
    (i) => i.status === "completed"
  ).length;

  const svgItems = realItems.slice(0, 5);
  const highlightedSvgItem = svgItems[selectedSvgIdx] ?? svgItems[0] ?? null;

  // What-If Simulator math against real active items (or baseline minutes if none yet)
  const remainingMinutes = realItems
    .filter((i) => i.status !== "completed")
    .reduce((acc, i) => acc + (i.estimated_minutes || 60), 0);
  const remainingHours = Math.round(remainingMinutes / 60);
  const simulatedWeeks =
    demoState.weeklyHoursSim > 0 && remainingHours > 0
      ? Math.ceil(remainingHours / demoState.weeklyHoursSim)
      : 0;
  const totalRealCost = realItems.reduce((acc, i) => acc + (i.cost_inr ?? 0), 0);
  const overBudgetInr = Math.max(0, totalRealCost - demoState.budgetInrSim);

  return (
    <div className="space-y-9">
      <EditorialHeading
        eyebrow="Workspace • Adaptive Learning Path"
        title="Adaptive"
        italicAccent="Career Roadmap"
        subtitle="Generate a personalized 30/60/90-day career roadmap backed by live AI recommendations and real progress tracking."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusLabel
              tone={activeRoadmap ? "verified" : "in_progress"}
              label={
                activeRoadmap
                  ? `${completedCount}/${realItems.length} Activities Completed`
                  : "Ready to Personalize"
              }
            />
            <Link href="/employee/explore">
              <Button size="sm" variant="secondary">
                Recommended Opportunities
              </Button>
            </Link>
          </div>
        }
      />

      {error ? (
        <Card padding="md" className="border-[var(--status-attention-border)] bg-[var(--status-attention-bg)]">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--status-attention-text)]">
            <span>
              <strong>Roadmap API Error:</strong> {error}
            </span>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={handleRetry}
            >
              Retry
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Gemini Generator Control Bar */}
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid flex-1 gap-4 sm:grid-cols-3">
            <Select
              label="Target Role"
              value={genRoleId}
              onChange={(e) => setGenRoleId(e.target.value)}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </Select>

            <Select
              label="Roadmap Horizon"
              value={String(genDuration)}
              onChange={(e) =>
                setGenDuration(Number(e.target.value) as 30 | 60 | 90)
              }
            >
              <option value="30">30 Days (Focused Sprint)</option>
              <option value="60">60 Days (Core Role Pivot)</option>
              <option value="90">90 Days (Full Mastery)</option>
            </Select>

            {roadmapsList.length > 0 ? (
              <Select
                label="Saved Roadmaps"
                value={activeRoadmap?.id ?? ""}
                onChange={(e) => void handleSelectRoadmap(e.target.value)}
              >
                {roadmapsList.map((rm) => (
                  <option key={rm.id} value={rm.id}>
                    {rm.title} ({rm.duration_days}d)
                  </option>
                ))}
              </Select>
            ) : (
              <div className="rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-xs text-muted">
                Using profile target:{" "}
                <strong className="text-ink">
                  {profile?.target_role_name || "Select role"}
                </strong>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            loading={generating}
            leftIcon={<Sparkles className="h-4 w-4" />}
            onClick={() => void handleGenerateAiRoadmap()}
          >
            {activeRoadmap
              ? "Regenerate with Gemini AI"
              : "Generate AI Roadmap"}
          </Button>
        </div>
      </Card>

      {/* Winding Career Journey SVG Illustration */}
      {svgItems.length > 0 ? (
        <Card padding="lg" className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                {cleanDisplayText(activeRoadmap?.title)} • Winding Path
              </p>
              <h2 className="font-editorial text-[24px] sm:text-[28px] text-ink">
                Inspect milestones along your live Gemini plan
              </h2>
            </div>
            <div className="w-full sm:w-64">
              <ProgressBar
                value={completedCount}
                max={Math.max(1, realItems.length)}
                label="Overall Milestone Progress"
                tone="forest"
              />
            </div>
          </div>

        <div className="rounded-2xl border border-line bg-canvas p-5 overflow-x-auto">
          <svg
            viewBox="0 0 800 220"
            className="min-w-[620px] w-full max-h-[260px]"
              role="img"
              aria-label="Winding AI learning roadmap"
            >
              <defs>
                <linearGradient id="windingRoadLive" x1="0%" y1="0%" x2="100%" y2="0%">
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
                stroke="url(#windingRoadLive)"
                strokeWidth="6"
                strokeDasharray="9 6"
                strokeLinecap="round"
              />

              {svgItems.map((item, idx) => {
                const pos = MILESTONE_POSITIONS[idx] ?? {
                  cx: 80 + idx * 140,
                  cy: 110,
                };
                const selected = idx === selectedSvgIdx;
                const done = item.status === "completed";
                const nodeFill = done
                  ? "#D9E8B5"
                  : Number(item.day_bucket) === 30
                    ? "#F9DF91"
                    : Number(item.day_bucket) === 60
                      ? "#F4C9B4"
                      : "#DDD6F3";

                return (
                  <g
                    key={item.id ?? `${item.title}-${idx}`}
                    onClick={() => setSelectedSvgIdx(idx)}
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
                      {done ? "✓" : `D${item.day_bucket}`}
                    </text>
                    <text
                      x={pos.cx}
                      y={pos.cy + 36}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="600"
                      fill="#202622"
                    >
                      {item.item_type.replace("_", " ")}
                    </text>
                  </g>
                );
              })}
            </svg>

            {highlightedSvgItem ? (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3.5 text-[13px] sm:text-sm">
                <p className="font-bold text-ink">
                  {cleanDisplayText(highlightedSvgItem.title)}
                </p>
                <p className="text-muted">
                  Day {highlightedSvgItem.day_bucket} •{" "}
                  {highlightedSvgItem.estimated_minutes} mins
                  {highlightedSvgItem.notes || highlightedSvgItem.rationale
                    ? ` • ${cleanDisplayText(highlightedSvgItem.notes || highlightedSvgItem.rationale)}`
                    : ""}
                </p>
                {highlightedSvgItem.id ? (
                  <Button
                    size="sm"
                    variant={
                      highlightedSvgItem.status === "completed"
                        ? "pastel"
                        : "primary"
                    }
                    disabled={busyItemId === highlightedSvgItem.id}
                    onClick={() => void handleToggleRealItem(highlightedSvgItem)}
                  >
                    {highlightedSvgItem.status === "completed"
                      ? "Completed ✓"
                      : "Mark Complete"}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* Main Horizon Items + What-If Simulator */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7 xl:col-span-8">
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
                    {day === "all" ? "All Horizons" : `First ${day} Days`}
                  </Button>
                ))}
              </div>
              <span className="text-xs font-semibold text-muted">
                {visibleItems.length} item(s)
              </span>
            </div>

            {visibleItems.length === 0 ? (
              <PastelCard
                tone="butter"
                eyebrow="Ready to Generate"
                title="Generate your first live Gemini 30/60/90 Roadmap"
                description="Select Generate AI Roadmap above to synthesize your skill gaps and learning opportunities into a structured 30/60/90-day plan."
                footer={
                  <Button
                    variant="primary"
                    size="sm"
                    loading={generating}
                    leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                    onClick={() => void handleGenerateAiRoadmap()}
                  >
                    Generate AI Roadmap Now
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {visibleItems.map((item, idx) => {
                  const key = item.id ?? `${item.title}-${idx}`;
                  const done = item.status === "completed";
                  const isExpanded = expandedKey === key;

                  return (
                    <div
                      key={key}
                      className="rounded-2xl border border-line bg-canvas p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <button
                          type="button"
                          disabled={busyItemId === item.id}
                          onClick={() => void handleToggleRealItem(item)}
                          className="flex flex-1 items-start gap-3 text-left cursor-pointer disabled:opacity-60"
                        >
                          {done ? (
                            <CheckCircle2 className="mt-0.5 h-5 w-5 text-forest shrink-0" />
                          ) : (
                            <Circle className="mt-0.5 h-5 w-5 text-muted shrink-0" />
                          )}
                          <div>
                            <p
                              className={`text-sm font-bold ${
                                done ? "line-through text-muted" : "text-ink"
                              }`}
                            >
                              {cleanDisplayText(item.title)}
                            </p>
                            <p className="mt-0.5 text-xs text-muted">
                              Day {item.day_bucket} •{" "}
                              {formatEnumLabel(item.item_type)} •{" "}
                              {item.estimated_minutes} mins
                              {item.provider ? ` • ${cleanDisplayText(item.provider)}` : ""}
                            </p>
                          </div>
                        </button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setExpandedKey(isExpanded ? null : key)
                          }
                          aria-label="Toggle item details"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {isExpanded ? (
                        <div className="space-y-2 border-t border-line pt-3 text-xs">
                          <p className="text-ink leading-relaxed">
                            {item.notes || item.rationale || "Milestone activity."}
                          </p>
                          {item.url ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-forest underline"
                            >
                              Open Source Link{" "}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right: What-If Time & INR Budget Simulator */}
        <div id="simulator" className="space-y-5 lg:col-span-5 xl:col-span-4">
          <PastelCard
            tone="butter"
            eyebrow="Prototype mode · Weekly Capacity Simulator"
            title={
              remainingHours > 0
                ? `${simulatedWeeks} weeks at ${demoState.weeklyHoursSim} hrs/wk`
                : `${demoState.weeklyHoursSim} hrs/wk pace ready`
            }
            description="Test how weekly capacity and INR budget adjustments pace your active roadmap before regenerating."
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
                  <span>Simulated Budget Cap (INR)</span>
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

          <Card padding="lg" className="space-y-3 text-xs">
            <h3 className="font-editorial text-2xl text-ink">
              Simulated Feasibility
            </h3>
            <p className="text-muted">
              Remaining roadmap effort: <strong>{remainingHours} hrs</strong> •
              Estimated plan cost:{" "}
              <strong>₹{totalRealCost.toLocaleString("en-IN")} INR</strong>.
            </p>
            {overBudgetInr > 0 ? (
              <p className="flex items-start gap-1.5 text-[var(--status-attention-text)] font-medium">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Plan cost exceeds simulator cap by ₹
                {overBudgetInr.toLocaleString("en-IN")} INR.
              </p>
            ) : (
              <p className="font-semibold text-forest">
                Within INR cap cleanly.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
