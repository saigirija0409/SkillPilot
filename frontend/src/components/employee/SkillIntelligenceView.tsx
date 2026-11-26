"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Compass,
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
  useToast,
} from "@/components/ui";
import {
  SKILL_PREREQUISITES,
  SUPPLEMENTAL_DEMO_OPPORTUNITIES,
  useEmployeeDemo,
} from "@/lib/demo/employeeDemoStore";
import {
  fetchAllCatalogOpportunities,
  fetchCatalogData,
  fetchRoleSkillRequirements,
  fetchUserProfileBundle,
  type RoleSkillRequirement,
} from "@/services/profile";
import type { CareerRole, Opportunity, Skill, UserSkill } from "@/types/database";

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
  verificationLabel: string;
  prereqs: string[];
  unlocks: string[];
}

const TIER_COLORS: Record<
  NodeTier,
  { fill: string; stroke: string; badge: string; label: string }
> = {
  acquired: {
    fill: "#D9E8B5",
    stroke: "#294C3B",
    badge: "Pistachio • Acquired",
    label: "Target Met",
  },
  developing: {
    fill: "#F9DF91",
    stroke: "#B5891E",
    badge: "Butter • Developing",
    label: "Developing",
  },
  future: {
    fill: "#DDD6F3",
    stroke: "#5D4E8E",
    badge: "Lavender • Future Skill",
    label: "Future / Missing",
  },
};

export function SkillIntelligenceView({ userId }: SkillIntelligenceViewProps) {
  const { state: demoState, addOpportunityToRoadmap } = useEmployeeDemo();
  const { pushToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [reqLoading, setReqLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [roles, setRoles] = useState<CareerRole[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [requirements, setRequirements] = useState<RoleSkillRequirement[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [selectedSkillName, setSelectedSkillName] = useState<string | null>(
    null
  );

  // Interactive zoom & pan controls
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });

  const [reloadKey, setReloadKey] = useState(0);

  function handleRetry() {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }

  useEffect(() => {
    let active = true;

    Promise.all([
      fetchCatalogData(),
      fetchUserProfileBundle(userId),
      fetchAllCatalogOpportunities(40),
    ])
      .then(([catalog, bundle, catalogOpps]) => {
        if (!active) return;
        setRoles(catalog.careerRoles);
        setAllSkills(catalog.skills);
        setUserSkills(bundle.userSkills);
        setOpportunities([...catalogOpps, ...SUPPLEMENTAL_DEMO_OPPORTUNITIES]);
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
            : "Unable to load skill intelligence."
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

    fetchRoleSkillRequirements(selectedRoleId)
      .then((reqs) => {
        if (!active) return;
        setRequirements(reqs);
        if (reqs[0]?.skills?.name) {
          setSelectedSkillName((prev) => prev ?? reqs[0]?.skills?.name ?? null);
        }
      })
      .catch(() => {
        if (!active) return;
        setRequirements([]);
      })
      .finally(() => {
        if (active) setReqLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedRoleId]);

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

  // Merge required role skills + user extra skills so graph shows full constellation
  const nodeDraftMap = new Map<
    string,
    {
      skillId: string;
      name: string;
      category: string;
      currentLevel: number;
      requiredLevel: number;
      importanceWeight: number;
      verificationLabel: string;
    }
  >();

  for (const req of requirements) {
    const skillName = req.skills?.name || "Required Skill";
    const match = userSkillMap.get(req.skill_id);
    const demoEvidence = demoState.demoSkillEvidence[skillName];
    nodeDraftMap.set(skillName, {
      skillId: req.skill_id,
      name: skillName,
      category: req.skills?.category || "Core",
      currentLevel: match?.proficiency ?? 0,
      requiredLevel: req.required_level,
      importanceWeight: Number(req.importance_weight),
      verificationLabel:
        match?.verification_status === "verified"
          ? "Verified Credential"
          : demoEvidence
            ? `Demonstrated (${demoEvidence.scorePct}% Demo Check)`
            : match
              ? "Self-Reported"
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
      importanceWeight: 0.1,
      verificationLabel:
        us.verification_status === "verified"
          ? "Verified Credential"
          : demoState.demoSkillEvidence[skillName]
            ? "Demonstrated (Demo Check)"
            : "Self-Reported",
    });
  }

  // Fallback if role has few nodes so prerequisite constellation stays meaningful
  if (nodeDraftMap.size < 6) {
    for (const s of allSkills.slice(0, 8 - nodeDraftMap.size)) {
      if (!nodeDraftMap.has(s.name)) {
        const match = userSkillMap.get(s.id);
        nodeDraftMap.set(s.name, {
          skillId: s.id,
          name: s.name,
          category: s.category,
          currentLevel: match?.proficiency ?? 0,
          requiredLevel: 3,
          importanceWeight: 0.08,
          verificationLabel: match ? "Self-Reported" : "Future Exploratory",
        });
      }
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

  // Compute deterministic Constellation coordinates across 3 orbital tiers
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
        gap: Math.max(0, item.requiredLevel - item.currentLevel),
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

  // Overall role readiness from role requirements
  const totalWeight = requirements.reduce(
    (acc, r) => acc + Number(r.importance_weight),
    0
  );
  const earnedWeight = requirements.reduce((acc, r) => {
    const match = userSkillMap.get(r.skill_id);
    const curr = match?.proficiency ?? 0;
    const ratio = r.required_level > 0 ? Math.min(1, curr / r.required_level) : 1;
    return acc + ratio * Number(r.importance_weight);
  }, 0);
  const readinessPct =
    totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  const activeRole = roles.find((r) => r.id === selectedRoleId);

  const recommendedOppsForNode = selectedNode
    ? opportunities
        .filter((opp) =>
          opp.skill_tags.some(
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
        eyebrow="Workspace • Interactive Skill Constellation"
        title="Living"
        italicAccent="Skill Constellation"
        subtitle="Explore how acquired, developing, and future skills interconnect for your target role. Drag to pan, zoom to inspect prerequisites, or select any node."
        actions={
          <Link href="/employee/explore">
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Find Matching Learning
            </Button>
          </Link>
        }
      />

      {/* Role + Category Filters & Color Legend */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-full sm:max-w-xs">
            <Select
              label="Target Role Benchmark"
              value={selectedRoleId}
              onChange={(e) => {
                setReqLoading(true);
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
              Future Skills ({tierGroups.future.length})
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

          <p className="text-xs font-semibold text-forest">
            {activeRole?.title || "Role"} Readiness: {readinessPct}% weighted match
          </p>
        </div>
      </Card>

      {/* Main Constellation Canvas + Expandable Detail Panel */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card padding="sm" className="relative overflow-hidden lg:col-span-8">
          {/* Zoom & Pan Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
              <Move className="h-3.5 w-3.5 text-forest" />
              Drag canvas to pan • Zoom {Math.round(zoom * 100)}%
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                aria-label="Zoom out"
                onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                aria-label="Zoom in"
                onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))}
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
            className="relative h-[490px] w-full overflow-hidden rounded-b-2xl bg-[radial-gradient(#E2DFD5_1px,transparent_1px)] [background-size:22px_22px] bg-canvas select-none"
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
            {reqLoading ? (
              <div className="absolute right-4 top-4 z-10 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted">
                Updating benchmarks...
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
                {/* Orbital tier guide labels */}
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
                  FUTURE
                </text>

                {/* Prerequisite connectors */}
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

                {/* Skill Nodes */}
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

        {/* Expandable Skill Detail Inspector */}
        <div className="space-y-5 lg:col-span-4">
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
                  <span className="text-xs font-semibold text-muted">
                    Weight {Math.round(selectedNode.importanceWeight * 100)}%
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
                  <span className="text-muted">Proficiency Progress</span>
                  <span className="text-forest">
                    {selectedNode.currentLevel}/5 current vs{" "}
                    {selectedNode.requiredLevel}/5 target
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
                    : `Priority skill gap: +${selectedNode.gap} level${selectedNode.gap > 1 ? "s" : ""} recommended.`}
                </p>
              </div>

              {/* Prerequisites & Unlocks */}
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Prerequisites ({selectedNode.prereqs.length})
                  </p>
                  {selectedNode.prereqs.length === 0 ? (
                    <p className="mt-1 text-xs text-muted">
                      Foundational entry skill — no prior nodes required.
                    </p>
                  ) : (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {selectedNode.prereqs.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setSelectedSkillName(p)}
                          className="rounded-full border border-line bg-canvas px-2.5 py-1 text-xs font-semibold text-ink hover:border-forest cursor-pointer"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Unlocks Downstream ({selectedNode.unlocks.length})
                  </p>
                  {selectedNode.unlocks.length === 0 ? (
                    <p className="mt-1 text-xs text-muted">
                      Advanced milestone skill node.
                    </p>
                  ) : (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {selectedNode.unlocks.map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setSelectedSkillName(u)}
                          className="rounded-full border border-[#C7BDE4] bg-[#DDD6F3]/60 px-2.5 py-1 text-xs font-semibold text-ink hover:border-forest cursor-pointer"
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recommended Learning Activities */}
              <div className="space-y-2.5 border-t border-line pt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Recommended Learning Activities
                </p>

                {recommendedOppsForNode.length === 0 ? (
                  <Link href="/employee/explore">
                    <Button size="sm" variant="secondary" className="w-full">
                      Browse Catalog for {selectedNode.name}
                    </Button>
                  </Link>
                ) : (
                  recommendedOppsForNode.map((opp) => {
                    const inRoadmap = demoState.roadmapItems.some(
                      (i) => i.sourceOpportunityId === opp.id
                    );
                    return (
                      <div
                        key={opp.id}
                        className="rounded-xl border border-line bg-canvas p-3 space-y-2"
                      >
                        <p className="text-xs font-bold text-ink">{opp.title}</p>
                        <div className="flex items-center justify-between gap-2 text-[11px] text-muted">
                          <span>
                            {opp.estimated_hours} hrs •{" "}
                            {opp.cost_inr === 0
                              ? "Free"
                              : `₹${opp.cost_inr.toLocaleString("en-IN")}`}
                          </span>
                          <Button
                            size="sm"
                            variant={inRoadmap ? "pastel" : "secondary"}
                            leftIcon={
                              inRoadmap ? (
                                <Check className="h-3 w-3" />
                              ) : undefined
                            }
                            onClick={() => {
                              const added = addOpportunityToRoadmap(opp, 30);
                              pushToast({
                                tone: added ? "success" : "info",
                                title: added
                                  ? "Added to 30-day Roadmap (+15 XP)"
                                  : "Already on your Roadmap",
                                description: opp.title,
                              });
                            }}
                          >
                            {inRoadmap ? "On Roadmap" : "Add to Plan"}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          ) : null}

          <PastelCard
            tone="pistachio"
            eyebrow="Integrity Safeguard"
            title={`${readinessPct}% Role Benchmark`}
            description="Your recorded Supabase ledger stays cleanly isolated from demo roadmap and assessment previews."
          />
        </div>
      </div>

      {/* Recorded Ledger Summary */}
      <Card padding="lg">
        <div className="flex items-center gap-2 pb-2">
          <Compass className="h-4 w-4 text-forest" />
          <h2 className="font-editorial text-2xl text-ink">
            Live Supabase Skill Ledger ({userSkills.length})
          </h2>
        </div>
        {userSkills.length === 0 ? (
          <p className="text-sm text-muted">
            No skills recorded yet. Visit{" "}
            <Link href="/onboarding" className="font-semibold text-forest underline">
              Onboarding
            </Link>{" "}
            or Settings to add baseline competencies.
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
