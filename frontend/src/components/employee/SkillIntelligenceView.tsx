"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  ExternalLink,
  Minus,
  Move,
  Plus,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

import {
  Button,
  Card,
  EditorialHeading,
  PastelCard,
  ProgressBar,
  Select,
  SkeletonCard,
  SkillChip,
  StatusLabel,
} from "@/components/ui";
import { SKILL_PREREQUISITES, useEmployeeDemo } from "@/lib/demo/employeeDemoStore";
import { cleanDisplayText, formatEnumLabel } from "@/lib/formatters";
import { fetchMlRecommendationsApi, fetchSkillGapApi } from "@/services/api";
import { getCurrentSessionAccessToken } from "@/services/auth";
import { fetchCatalogData, fetchUserProfileBundle } from "@/services/profile";
import type {
  RecommendedOpportunityDto,
  SkillGapItemDto,
  SkillGapResponseDto,
} from "@/types/api";
import type { CareerRole, Skill, UserSkill } from "@/types/database";

interface SkillIntelligenceViewProps {
  userId: string;
}

type NodeTier = "acquired" | "developing" | "future";

interface ConstellationNode {
  skillId: string;
  name: string;
  category: string;
  x: number;
  y: number;
  tier: NodeTier;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  importanceWeight: number;
  priority: string;
  verificationLabel: string;
  prereqs: string[];
  unlocks: string[];
}

const TIER_COLORS: Record<
  NodeTier,
  { fill: string; stroke: string; badge: string }
> = {
  acquired: {
    fill: "#D9E8B5",
    stroke: "#294C3B",
    badge: "Pistachio • Acquired",
  },
  developing: {
    fill: "#F9DF91",
    stroke: "#B5891E",
    badge: "Butter • Developing",
  },
  future: {
    fill: "#DDD6F3",
    stroke: "#5D4E8E",
    badge: "Lavender • Missing / Future",
  },
};

export function SkillIntelligenceView({ userId }: SkillIntelligenceViewProps) {
  const { state: demoState } = useEmployeeDemo();

  const [loading, setLoading] = useState(true);
  const [gapLoading, setGapLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gapError, setGapError] = useState<string | null>(null);

  const [roles, setRoles] = useState<CareerRole[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [skillGapData, setSkillGapData] = useState<SkillGapResponseDto | null>(
    null
  );
  const [mlRecommendations, setMlRecommendations] = useState<
    RecommendedOpportunityDto[]
  >([]);

  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [selectedSkillName, setSelectedSkillName] = useState<string | null>(
    null
  );

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });
  const [reloadKey, setReloadKey] = useState(0);

  function handleRetry() {
    setLoading(true);
    setError(null);
    setGapError(null);
    setReloadKey((k) => k + 1);
  }

  useEffect(() => {
    let active = true;

    Promise.all([fetchCatalogData(), fetchUserProfileBundle(userId)])
      .then(([catalog, bundle]) => {
        if (!active) return;
        setRoles(catalog.careerRoles);
        setAllSkills(catalog.skills);
        setUserSkills(bundle.userSkills);
        const defaultRole =
          bundle.profile?.target_role_id ||
          catalog.careerRoles[0]?.id ||
          "";
        setSelectedRoleId(defaultRole);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load catalog or profile."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId, reloadKey]);

  useEffect(() => {
    if (!selectedRoleId) return;
    let active = true;

    async function loadBackendAnalysis() {
      const token = await getCurrentSessionAccessToken();
      if (!token) {
        if (active) {
          setGapError("No active session token available.");
          setGapLoading(false);
        }
        return;
      }

      try {
        const [gapRes, mlRes] = await Promise.all([
          fetchSkillGapApi(selectedRoleId, token),
          fetchMlRecommendationsApi(token, {
            targetRoleId: selectedRoleId,
            limit: 12,
          }),
        ]);
        if (!active) return;
        setSkillGapData(gapRes);
        setMlRecommendations(mlRes.recommendations);
        setGapError(null);
        const firstGap = gapRes.gaps[0]?.skill_name || gapRes.strengths[0]?.skill_name;
        if (firstGap) {
          setSelectedSkillName((prev) => prev ?? firstGap);
        }
      } catch (err) {
        if (!active) return;
        setSkillGapData(null);
        setMlRecommendations([]);
        setGapError(
          err instanceof Error
            ? err.message
            : "Backend skill-gap analysis failed."
        );
      } finally {
        if (active) setGapLoading(false);
      }
    }

    void loadBackendAnalysis();
    return () => {
      active = false;
    };
  }, [selectedRoleId, reloadKey]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <Card padding="lg" className="border-[var(--status-attention-border)]">
        <p className="font-editorial text-2xl text-ink">
          Unable to load skill constellation
        </p>
        <p className="mt-1 text-sm text-muted">{error}</p>
        <div className="mt-4">
          <Button
            size="sm"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={handleRetry}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const userSkillMap = new Map<string, UserSkill>();
  for (const us of userSkills) {
    userSkillMap.set(us.skill_id, us);
  }

  // Build graph nodes directly from real backend /api/v1/skills/gap items + user's ledger
  const nodeDraftMap = new Map<
    string,
    {
      skillId: string;
      name: string;
      category: string;
      currentLevel: number;
      requiredLevel: number;
      gap: number;
      importanceWeight: number;
      priority: string;
      verificationLabel: string;
    }
  >();

  const combinedBackendItems: SkillGapItemDto[] = skillGapData
    ? [...skillGapData.strengths, ...skillGapData.gaps]
    : [];

  for (const item of combinedBackendItems) {
    const match = item.skill_id ? userSkillMap.get(item.skill_id) : undefined;
    const demoEvidence = demoState.demoSkillEvidence[item.skill_name];
    nodeDraftMap.set(item.skill_name, {
      skillId: item.skill_id || item.skill_name,
      name: item.skill_name,
      category: item.category || "Core",
      currentLevel: item.current_level,
      requiredLevel: item.required_level,
      gap: Math.max(0, item.gap),
      importanceWeight: item.importance_weight,
      priority: item.priority,
      verificationLabel:
        match?.verification_status === "verified"
          ? "Verified Credential"
          : demoEvidence
            ? `Demonstrated (${demoEvidence.scorePct}% Demo Check)`
            : match
              ? match.verification_status.replace("_", " ")
              : "Unrecorded",
    });
  }

  for (const us of userSkills) {
    const skillName = us.skills?.name;
    if (!skillName || nodeDraftMap.has(skillName)) continue;
    nodeDraftMap.set(skillName, {
      skillId: us.skill_id,
      name: skillName,
      category: us.skills?.category || "Recorded",
      currentLevel: us.proficiency,
      requiredLevel: Math.max(3, us.proficiency),
      gap: 0,
      importanceWeight: 0.1,
      priority: "low",
      verificationLabel: us.verification_status.replace("_", " "),
    });
  }

  if (nodeDraftMap.size === 0) {
    for (const s of allSkills.slice(0, 6)) {
      nodeDraftMap.set(s.name, {
        skillId: s.id,
        name: s.name,
        category: s.category,
        currentLevel: 0,
        requiredLevel: 3,
        gap: 3,
        importanceWeight: 0.1,
        priority: "medium",
        verificationLabel: "Catalog Benchmark",
      });
    }
  }

  const categories = [
    "All",
    ...Array.from(
      new Set(Array.from(nodeDraftMap.values()).map((n) => n.category))
    ),
  ];

  const draftNodes = Array.from(nodeDraftMap.values()).filter(
    (n) => categoryFilter === "All" || n.category === categoryFilter
  );

  const tierGroups: Record<NodeTier, typeof draftNodes> = {
    acquired: [],
    developing: [],
    future: [],
  };

  for (const item of draftNodes) {
    const tier: NodeTier =
      item.currentLevel >= item.requiredLevel && item.currentLevel > 0
        ? "acquired"
        : item.currentLevel > 0
          ? "developing"
          : "future";
    tierGroups[tier].push(item);
  }

  const allNodes: ConstellationNode[] = [];
  const laneConfig: Array<{ tier: NodeTier; y: number }> = [
    { tier: "acquired", y: 110 },
    { tier: "developing", y: 245 },
    { tier: "future", y: 380 },
  ];

  for (const lane of laneConfig) {
    const list = tierGroups[lane.tier];
    const widthSpan = 760;
    const step = widthSpan / Math.max(1, list.length + 1);
    list.forEach((item, idx) => {
      const waveOffset = idx % 2 === 0 ? -16 : 16;
      const prereqs = (SKILL_PREREQUISITES[item.name] ?? []).filter((p) =>
        draftNodes.some((d) => d.name === p)
      );
      const unlocks = draftNodes
        .filter((d) => (SKILL_PREREQUISITES[d.name] ?? []).includes(item.name))
        .map((d) => d.name);

      allNodes.push({
        ...item,
        x: Math.round(70 + step * (idx + 1)),
        y: lane.y + waveOffset,
        tier: lane.tier,
        prereqs,
        unlocks,
      });
    });
  }

  const nodeByName = new Map(allNodes.map((n) => [n.name, n]));
  const selectedNode =
    (selectedSkillName ? nodeByName.get(selectedSkillName) : null) ??
    allNodes[0] ??
    null;

  const readinessPct = skillGapData
    ? Math.round(skillGapData.overall_readiness_score)
    : 0;

  const matchedRecommendations = selectedNode
    ? mlRecommendations
        .filter((rec) =>
          rec.skill_tags.some(
            (t) =>
              t.toLowerCase().includes(selectedNode.name.toLowerCase()) ||
              selectedNode.name.toLowerCase().includes(t.toLowerCase())
          )
        )
        .slice(0, 3)
    : [];

  return (
    <div className="space-y-8">
      <EditorialHeading
        eyebrow="Workspace • Live Skill Constellation"
        title="Living"
        italicAccent="Skill Constellation"
        subtitle="Interactive skill constellation comparing your current proficiency ledger and prerequisites against target role benchmarks."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusLabel
              tone={gapError ? "attention" : "verified"}
              label={
                gapError
                  ? "API Error"
                  : `Readiness: ${readinessPct}% (${skillGapData?.skills_matched ?? 0}/${skillGapData?.skills_total ?? 0} met)`
              }
            />
            <Link href="/employee/explore">
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                ML Recommendations
              </Button>
            </Link>
          </div>
        }
      />

      {gapError ? (
        <Card padding="md" className="border-[var(--status-attention-border)] bg-[var(--status-attention-bg)]">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--status-attention-text)]">
            <span>
              <strong>Skill-Gap API Error:</strong> {gapError}
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setGapLoading(true);
                setReloadKey((k) => k + 1);
              }}
            >
              Retry Backend Call
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Controls & Legend */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-full sm:max-w-xs">
            <Select
              label="Target Role Benchmark"
              value={selectedRoleId}
              onChange={(e) => {
                setGapLoading(true);
                setSelectedSkillName(null);
                setSelectedRoleId(e.target.value);
              }}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title} ({role.category})
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C5D89B] bg-[#D9E8B5] px-3 py-1 text-xs font-semibold text-ink">
              Acquired ({tierGroups.acquired.length})
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EBCD75] bg-[#F9DF91] px-3 py-1 text-xs font-semibold text-ink">
              Developing ({tierGroups.developing.length})
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C7BDE4] bg-[#DDD6F3] px-3 py-1 text-xs font-semibold text-ink">
              Missing / Future ({tierGroups.future.length})
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={categoryFilter === cat ? "primary" : "secondary"}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          {skillGapData?.top_missing_skills.length ? (
            <p className="text-xs font-semibold text-[#8C371C]">
              Top Gaps: {skillGapData.top_missing_skills.join(" • ")}
            </p>
          ) : null}
        </div>
      </Card>

      {/* Constellation Canvas + Detail Inspector */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card padding="sm" className="relative overflow-hidden lg:col-span-8 2xl:col-span-9">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
              <Move className="h-3.5 w-3.5 text-forest" />
              Drag to pan • Zoom {Math.round(zoom * 100)}%
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                aria-label="Zoom out"
                onClick={() =>
                  setZoom((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))
                }
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                aria-label="Zoom in"
                onClick={() =>
                  setZoom((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))
                }
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
              >
                Reset
              </Button>
            </div>
          </div>

          <div
            className="relative h-[520px] xl:h-[600px] w-full overflow-hidden rounded-b-2xl bg-[radial-gradient(#E2DFD5_1px,transparent_1px)] [background-size:22px_22px] bg-canvas select-none"
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest("[data-skill-node='true']")) {
                return;
              }
              setDragging(true);
              setDragOrigin({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            }}
            onPointerMove={(e) => {
              if (!dragging) return;
              setPan({
                x: e.clientX - dragOrigin.x,
                y: e.clientY - dragOrigin.y,
              });
            }}
            onPointerUp={() => setDragging(false)}
            onPointerLeave={() => setDragging(false)}
            style={{ cursor: dragging ? "grabbing" : "grab" }}
          >
            {gapLoading ? (
              <div className="absolute right-4 top-4 z-10 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted">
                Updating benchmark coverage...
              </div>
            ) : null}

            <svg
              viewBox="0 0 900 475"
              className="h-full w-full"
              role="img"
              aria-label="Interactive skill prerequisite constellation"
            >
              <defs>
                <marker
                  id="arrowPrereq"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#294C3B" />
                </marker>
              </defs>

              <g
                transform={`translate(${pan.x + (900 * (1 - zoom)) / 2}, ${pan.y + (475 * (1 - zoom)) / 2}) scale(${zoom})`}
              >
                <text x="24" y="108" fontSize="11" fontWeight="700" fill="#68736C">
                  ACQUIRED
                </text>
                <line
                  x1="24"
                  y1="178"
                  x2="876"
                  y2="178"
                  stroke="#E2DFD5"
                  strokeDasharray="4 4"
                />
                <text x="24" y="242" fontSize="11" fontWeight="700" fill="#68736C">
                  DEVELOPING
                </text>
                <line
                  x1="24"
                  y1="312"
                  x2="876"
                  y2="312"
                  stroke="#E2DFD5"
                  strokeDasharray="4 4"
                />
                <text x="24" y="376" fontSize="11" fontWeight="700" fill="#68736C">
                  MISSING / FUTURE
                </text>

                {allNodes.map((node) =>
                  node.prereqs.map((prereqName) => {
                    const source = nodeByName.get(prereqName);
                    if (!source) return null;
                    const highlighted =
                      selectedNode?.name === node.name ||
                      selectedNode?.name === source.name;
                    const midX = (source.x + node.x) / 2;
                    const midY = (source.y + node.y) / 2 - 22;

                    return (
                      <path
                        key={`${source.name}->${node.name}`}
                        d={`M ${source.x} ${source.y} Q ${midX} ${midY} ${node.x} ${node.y}`}
                        fill="none"
                        stroke={highlighted ? "#294C3B" : "#C9C3B4"}
                        strokeWidth={highlighted ? 2.4 : 1.4}
                        strokeDasharray={highlighted ? undefined : "5 4"}
                        markerEnd={highlighted ? "url(#arrowPrereq)" : undefined}
                      />
                    );
                  })
                )}

                {allNodes.map((node) => {
                  const style = TIER_COLORS[node.tier];
                  const isSelected = selectedNode?.name === node.name;
                  const shortLabel =
                    node.name.length > 20
                      ? `${node.name.slice(0, 18)}…`
                      : node.name;

                  return (
                    <g
                      key={node.name}
                      data-skill-node="true"
                      onClick={() => setSelectedSkillName(node.name)}
                      className="cursor-pointer"
                    >
                      {isSelected ? (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={38}
                          fill={style.fill}
                          fillOpacity={0.42}
                        />
                      ) : null}

                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={isSelected ? 30 : 25}
                        fill={style.fill}
                        stroke={isSelected ? "#294C3B" : style.stroke}
                        strokeWidth={isSelected ? 3 : 1.8}
                      />

                      <text
                        x={node.x}
                        y={node.y + 4}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="700"
                        fill="#202622"
                      >
                        {node.currentLevel}/{node.requiredLevel}
                      </text>

                      <rect
                        x={node.x - 66}
                        y={node.y + 33}
                        width={132}
                        height={22}
                        rx={11}
                        fill="#FFFDF8"
                        stroke="#E2DFD5"
                      />
                      <text
                        x={node.x}
                        y={node.y + 48}
                        textAnchor="middle"
                        fontSize="10.5"
                        fontWeight="600"
                        fill="#202622"
                      >
                        {shortLabel}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </Card>

        <div className="space-y-5 lg:col-span-4 2xl:col-span-3">
          {selectedNode ? (
            <Card padding="lg" className="space-y-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusLabel
                    tone={
                      selectedNode.tier === "acquired"
                        ? "verified"
                        : selectedNode.tier === "developing"
                          ? "in_progress"
                          : "inferred"
                    }
                    label={TIER_COLORS[selectedNode.tier].badge}
                  />
                  <span className="text-xs font-bold uppercase text-muted">
                    Priority: {selectedNode.priority}
                  </span>
                </div>

                <h2 className="font-editorial text-3xl leading-tight text-ink">
                  {selectedNode.name}
                </h2>
                <p className="text-xs text-muted">
                  Category: {selectedNode.category} • Evidence:{" "}
                  <strong className="text-ink">
                    {selectedNode.verificationLabel}
                  </strong>
                </p>
              </div>

              <div className="space-y-2 rounded-2xl border border-line bg-canvas p-4">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted">Backend Gap Analysis</span>
                  <span className="text-forest">
                    {selectedNode.currentLevel}/5 vs{" "}
                    {selectedNode.requiredLevel}/5
                  </span>
                </div>
                <ProgressBar
                  value={selectedNode.currentLevel}
                  max={selectedNode.requiredLevel}
                  showValue={false}
                  size="md"
                  tone={selectedNode.gap === 0 ? "pistachio" : "butter"}
                />
                <p className="text-xs text-muted">
                  {selectedNode.gap === 0
                    ? "Target met for this role benchmark."
                    : `Skill gap: -${selectedNode.gap} level${selectedNode.gap > 1 ? "s" : ""} (Weight ${Math.round(selectedNode.importanceWeight * 100)}%)`}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Prerequisites &amp; Unlocks
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.prereqs.map((p) => (
                    <button
                      key={`pre-${p}`}
                      type="button"
                      onClick={() => setSelectedSkillName(p)}
                      className="rounded-full border border-line bg-canvas px-2.5 py-1 text-xs font-semibold text-ink hover:border-forest cursor-pointer"
                    >
                      Requires: {p}
                    </button>
                  ))}
                  {selectedNode.unlocks.map((u) => (
                    <button
                      key={`unl-${u}`}
                      type="button"
                      onClick={() => setSelectedSkillName(u)}
                      className="rounded-full border border-[#C7BDE4] bg-[#DDD6F3]/60 px-2.5 py-1 text-xs font-semibold text-ink hover:border-forest cursor-pointer"
                    >
                      Unlocks: {u}
                    </button>
                  ))}
                  {selectedNode.prereqs.length === 0 &&
                  selectedNode.unlocks.length === 0 ? (
                    <span className="text-xs text-muted">
                      Standalone benchmark skill node.
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2.5 border-t border-line pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  ML Ranked Opportunities
                </p>
                {matchedRecommendations.length === 0 ? (
                  <Link href="/employee/explore">
                    <Button size="sm" variant="secondary" className="w-full">
                      Explore All ML Recommendations
                    </Button>
                  </Link>
                ) : (
                  matchedRecommendations.map((rec) => (
                    <div
                      key={rec.opportunity_id}
                      className="rounded-xl border border-line bg-canvas p-3.5 space-y-2 text-[13px]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <StatusLabel
                          tone="verified"
                          label={`${Math.round(rec.relevance_score * 100)}% Match`}
                          className="shrink-0"
                        />
                        <span className="text-xs font-semibold text-forest">
                          {rec.cost_inr === 0
                            ? "Free"
                            : `₹${rec.cost_inr.toLocaleString("en-IN")} INR`}
                        </span>
                      </div>
                      <p className="text-[15px] font-bold leading-snug text-ink">
                        {cleanDisplayText(rec.title)}
                      </p>
                      <p className="text-muted leading-relaxed">
                        {cleanDisplayText(rec.match_reason)} •{" "}
                        {formatEnumLabel(rec.format)}
                      </p>
                      {rec.url ? (
                        <div className="pt-0.5">
                          <a
                            href={rec.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-forest underline underline-offset-2"
                          >
                            Source <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </Card>
          ) : null}

          {skillGapData ? (
            <PastelCard
              tone="pistachio"
              eyebrow="Live Backend Calculation"
              title={`${readinessPct}% ${skillGapData.target_role_title} Readiness`}
              description={`${skillGapData.skills_matched} of ${skillGapData.skills_total} required competencies matched.`}
            />
          ) : null}
        </div>
      </div>

      <Card padding="lg">
        <div className="flex items-center gap-2 pb-2">
          <Compass className="h-4 w-4 text-forest" />
          <h2 className="font-editorial text-2xl text-ink">
            Active Skill Ledger ({userSkills.length})
          </h2>
        </div>
        {userSkills.length === 0 ? (
          <p className="text-sm text-muted">
            No skills recorded yet. Upload a PDF resume in{" "}
            <Link
              href="/employee/settings"
              className="font-semibold text-forest underline"
            >
              Settings
            </Link>{" "}
            to extract skills automatically.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {userSkills.map((us) => (
              <SkillChip
                key={us.id}
                name={us.skills?.name || "Skill"}
                level={us.proficiency}
                status={us.verification_status}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
