"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Check,
  Clock,
  ExternalLink,
  FolderPlus,
  HandCoins,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";

import {
  Button,
  Card,
  Drawer,
  EditorialHeading,
  EmptyState,
  Input,
  PastelCard,
  Select,
  SkeletonCard,
  SkillChip,
  StatusLabel,
  useToast,
} from "@/components/ui";
import {
  SUPPLEMENTAL_DEMO_OPPORTUNITIES,
  useEmployeeDemo,
} from "@/lib/demo/employeeDemoStore";
import {
  cleanDisplayText,
  formatEnumLabel,
  formatRecommendationAlgorithm,
} from "@/lib/formatters";
import { fetchMlRecommendationsApi } from "@/services/api";
import { getCurrentSessionAccessToken } from "@/services/auth";
import { fetchAllCatalogOpportunities } from "@/services/profile";
import type { RecommendedOpportunityDto } from "@/types/api";
import type { Opportunity } from "@/types/database";

const OPPORTUNITY_TYPES = [
  "all",
  "course",
  "workshop",
  "hackathon",
  "certification",
  "open_source",
  "internal_training",
  "mentoring",
];

const DIFFICULTY_LEVELS = ["all", "beginner", "intermediate", "advanced"];
const SHELF_TONES = ["pistachio", "butter", "peach", "lavender"] as const;

function isNotExpired(deadlineAt?: string | null): boolean {
  if (!deadlineAt) return true;
  const parsed = Date.parse(deadlineAt);
  if (Number.isNaN(parsed)) return true;
  return parsed >= Date.now();
}

export function ExploreOpportunitiesView() {
  const { state: demoState, toggleSavedOpportunity, addOpportunityToRoadmap } =
    useEmployeeDemo();
  const { pushToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mlError, setMlError] = useState<string | null>(null);
  const [mlAlgorithm, setMlAlgorithm] = useState<string>("none");
  const [mlRecs, setMlRecs] = useState<RecommendedOpportunityDto[]>([]);
  const [items, setItems] = useState<Opportunity[]>([]);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [maxBudgetInr, setMaxBudgetInr] = useState<number>(15000);
  const [savedOnly, setSavedOnly] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [targetBucket, setTargetBucket] = useState<30 | 60 | 90>(60);
  const [reloadKey, setReloadKey] = useState(0);

  function handleRetry() {
    setLoading(true);
    setError(null);
    setMlError(null);
    setReloadKey((k) => k + 1);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      const token = await getCurrentSessionAccessToken();
      const [catalogRes, mlRes] = await Promise.allSettled([
        fetchAllCatalogOpportunities(50),
        token
          ? fetchMlRecommendationsApi(token, { limit: 20 })
          : Promise.reject(new Error("Missing session token for ML ranking")),
      ]);

      if (!active) return;

      if (catalogRes.status === "fulfilled") {
        const liveValid = catalogRes.value.filter((o) =>
          isNotExpired(o.deadline_at)
        );
        setItems([...liveValid, ...SUPPLEMENTAL_DEMO_OPPORTUNITIES]);
        setError(null);
      } else {
        setError(
          catalogRes.reason instanceof Error
            ? catalogRes.reason.message
            : "Failed to load Supabase opportunities."
        );
      }

      if (mlRes.status === "fulfilled") {
        setMlRecs(mlRes.value.recommendations);
        setMlAlgorithm(mlRes.value.algorithm);
        setMlError(null);
      } else {
        setMlRecs([]);
        setMlAlgorithm("error");
        setMlError(
          mlRes.reason instanceof Error
            ? mlRes.reason.message
            : "ML recommendation engine failed."
        );
      }
    }

    void load().finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const mlScoreById = new Map<string, RecommendedOpportunityDto>();
  mlRecs.forEach((r) => mlScoreById.set(r.opportunity_id, r));

  const filtered = items
    .filter((item) => {
      if (savedOnly && !demoState.savedOpportunityIds.includes(item.id)) {
        return false;
      }
      if (typeFilter !== "all" && item.opportunity_type !== typeFilter) {
        return false;
      }
      if (
        difficultyFilter !== "all" &&
        item.difficulty_level.toLowerCase() !== difficultyFilter
      ) {
        return false;
      }
      if (item.cost_inr > maxBudgetInr) {
        return false;
      }
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.provider.toLowerCase().includes(q) ||
        item.skill_tags.some((tag) => tag.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const scoreA = mlScoreById.get(a.id)?.relevance_score ?? -1;
      const scoreB = mlScoreById.get(b.id)?.relevance_score ?? -1;
      return scoreB - scoreA;
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid gap-5 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card padding="lg" className="border-[var(--status-attention-border)]">
        <p className="font-editorial text-2xl text-ink">
          Unable to load catalog
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

  return (
    <div className="space-y-9">
      <EditorialHeading
        eyebrow="Workspace • ML Opportunity Discovery"
        title="Curated"
        italicAccent="Opportunities"
        subtitle="Personalized learning opportunities ranked for your skill gaps alongside curated sample sprints."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusLabel
              tone={mlError ? "attention" : "verified"}
              label={
                mlError
                  ? "Recommendations Unavailable"
                  : `Ranking: ${formatRecommendationAlgorithm(mlAlgorithm)}`
              }
            />
            <Button
              size="sm"
              variant={savedOnly ? "primary" : "secondary"}
              leftIcon={<Bookmark className="h-3.5 w-3.5" />}
              onClick={() => setSavedOnly((v) => !v)}
            >
              Saved ({demoState.savedOpportunityIds.length})
            </Button>
          </div>
        }
      />

      {mlError ? (
        <Card
          padding="md"
          className="border-[var(--status-attention-border)] bg-[var(--status-attention-bg)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--status-attention-text)]">
            <span>
              <strong>ML Recommendation API Notice:</strong> {mlError}. Showing
              unranked Supabase catalog items.
            </span>
            <Button size="sm" variant="secondary" onClick={handleRetry}>
              Retry ML Ranking
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Top ML Ranked Editorial Shelf */}
      {!savedOnly &&
      query.trim() === "" &&
      typeFilter === "all" &&
      mlRecs.length > 0 ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-editorial text-2xl text-ink">
              Top <span className="italic text-forest">ML Matches</span> for
              Your Gaps
            </h2>
            <span className="text-xs font-semibold text-muted">
              Personalized using {formatRecommendationAlgorithm(mlAlgorithm).toLowerCase()}
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {mlRecs.slice(0, 4).map((rec, idx) => {
              const matchedOpp = items.find((i) => i.id === rec.opportunity_id);
              const pct = Math.round(rec.relevance_score * 100);
              return (
                <button
                  key={rec.opportunity_id}
                  type="button"
                  onClick={() => {
                    if (matchedOpp) setSelectedOpp(matchedOpp);
                  }}
                  className="text-left cursor-pointer"
                >
                  <PastelCard
                    tone={SHELF_TONES[idx % SHELF_TONES.length]}
                    eyebrow={`${pct}% Match • ${formatEnumLabel(rec.opportunity_type)}`}
                    title={cleanDisplayText(rec.title)}
                    description={`${cleanDisplayText(rec.match_reason)} • ${
                      rec.cost_inr === 0
                        ? "Free (₹0)"
                        : `₹${rec.cost_inr.toLocaleString("en-IN")} INR`
                    }`}
                    className="h-full transition hover:-translate-y-0.5"
                  />
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Filter Bar */}
      <Card padding="md" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-12 md:items-end">
          <div className="md:col-span-4">
            <Input
              label="Search Title, Provider, or Skill"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., sql, fastapi, docker..."
            />
          </div>

          <div className="md:col-span-3">
            <Select
              label="Category"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {OPPORTUNITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "all" ? "All Formats" : formatEnumLabel(t)}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2">
            <Select
              label="Difficulty"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
            >
              {DIFFICULTY_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl === "all" ? "All Levels" : formatEnumLabel(lvl)}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-3 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-ink">
              <span>Max Budget (INR)</span>
              <span className="text-forest">
                ₹{maxBudgetInr.toLocaleString("en-IN")}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={15000}
              step={500}
              value={maxBudgetInr}
              onChange={(e) => setMaxBudgetInr(Number(e.target.value))}
              className="w-full accent-[#294C3B] cursor-pointer"
            />
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title="No active opportunities match those filters"
          description="Expired events are automatically excluded. Try resetting filters or raising your INR budget."
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setQuery("");
                setTypeFilter("all");
                setDifficultyFilter("all");
                setMaxBudgetInr(15000);
                setSavedOnly(false);
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((opp) => {
            const bookmarked = demoState.savedOpportunityIds.includes(opp.id);
            const mlMatch = mlScoreById.get(opp.id);

            return (
              <Card
                key={opp.id}
                interactive
                className="flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusLabel
                        tone="inferred"
                        label={formatEnumLabel(opp.opportunity_type)}
                      />
                      {mlMatch ? (
                        <StatusLabel
                          tone="verified"
                          label={`${Math.round(mlMatch.relevance_score * 100)}% Match`}
                        />
                      ) : null}
                    </div>
                    {opp.is_demo ? (
                      <StatusLabel tone="neutral" label="Sample Opportunity" />
                    ) : null}
                  </div>

                  <h2 className="font-editorial text-[24px] sm:text-[26px] leading-snug text-ink">
                    {cleanDisplayText(opp.title)}
                  </h2>
                  <p className="text-[13px] sm:text-sm font-semibold text-forest">
                    {cleanDisplayText(opp.provider)} •{" "}
                    {formatEnumLabel(opp.format)}
                  </p>
                  <p className="text-[14px] sm:text-[15px] leading-relaxed text-muted">
                    {cleanDisplayText(opp.description)}
                  </p>

                  {mlMatch ? (
                    <p className="rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-[13px] text-ink">
                      <strong>Relevance:</strong>{" "}
                      {cleanDisplayText(mlMatch.match_reason)}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {opp.skill_tags.map((tag) => (
                      <SkillChip key={tag} name={tag} status="self_reported" />
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <div className="flex items-center gap-3 text-[13px] sm:text-sm font-semibold text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {opp.estimated_hours} hrs
                    </span>
                    <span>
                      {opp.cost_inr === 0
                        ? "Free (₹0)"
                        : `₹${opp.cost_inr.toLocaleString("en-IN")} INR`}
                    </span>
                    {opp.url ? (
                      <a
                        href={opp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-forest underline"
                      >
                        Link <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant={bookmarked ? "pastel" : "ghost"}
                      leftIcon={<Bookmark className="h-3.5 w-3.5" />}
                      onClick={() => toggleSavedOpportunity(opp.id)}
                    >
                      {bookmarked ? "Saved" : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedOpp(opp)}
                    >
                      Inspect
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Drawer
        open={Boolean(selectedOpp)}
        onClose={() => setSelectedOpp(null)}
        title={cleanDisplayText(selectedOpp?.title) || "Opportunity Detail"}
        description={`${cleanDisplayText(selectedOpp?.provider)} • ${formatEnumLabel(selectedOpp?.format)}`}
        footer={
          selectedOpp ? (
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <Link href={`/employee/sponsorship?oppId=${selectedOpp.id}`}>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<HandCoins className="h-3.5 w-3.5" />}
                >
                  Request Sponsorship
                </Button>
              </Link>
              <Button variant="primary" onClick={() => setSelectedOpp(null)}>
                Done
              </Button>
            </div>
          ) : null
        }
      >
        {selectedOpp ? (
          <div className="space-y-5">
            <PastelCard
              tone="lavender"
              eyebrow={selectedOpp.is_demo ? "Sample Opportunity" : "Verified Opportunity"}
              title={formatEnumLabel(selectedOpp.difficulty_level)}
              description={cleanDisplayText(selectedOpp.description)}
            />

            {mlScoreById.get(selectedOpp.id) ? (
              <div className="rounded-2xl border border-[#C5D89B] bg-[#D9E8B5]/40 p-4 text-xs space-y-1">
                <p className="font-bold text-ink">
                  Match Relevance:{" "}
                  {Math.round(
                    (mlScoreById.get(selectedOpp.id)?.relevance_score ?? 0) *
                      100
                  )}
                  % ({formatRecommendationAlgorithm(mlAlgorithm)})
                </p>
                <p className="text-muted">
                  {cleanDisplayText(mlScoreById.get(selectedOpp.id)?.match_reason)}
                </p>
              </div>
            ) : null}

            <div className="rounded-2xl border border-line bg-canvas p-4 space-y-2 text-xs text-ink">
              <p className="flex items-center gap-2 font-bold">
                <Search className="h-4 w-4 text-forest" />
                Effort, Budget &amp; Source
              </p>
              <p className="text-muted leading-relaxed">
                Effort: <strong>{selectedOpp.estimated_hours} hrs</strong> •
                Fee:{" "}
                <strong>
                  {selectedOpp.cost_inr === 0
                    ? "Free (₹0 INR)"
                    : `₹${selectedOpp.cost_inr.toLocaleString("en-IN")} INR`}
                </strong>
              </p>
              {selectedOpp.url ? (
                <a
                  href={selectedOpp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-forest underline"
                >
                  Open Genuine Source Link{" "}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <p className="text-muted">
                  No external URL attached to this catalog record.
                </p>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                Queue into Roadmap Simulator
              </p>
              <div className="flex flex-wrap gap-2">
                {([30, 60, 90] as const).map((horizon) => (
                  <Button
                    key={horizon}
                    size="sm"
                    variant={targetBucket === horizon ? "primary" : "secondary"}
                    onClick={() => setTargetBucket(horizon)}
                  >
                    Day {horizon}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={
                    demoState.roadmapItems.some(
                      (r) => r.sourceOpportunityId === selectedOpp.id
                    ) ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <FolderPlus className="h-3.5 w-3.5" />
                    )
                  }
                  onClick={() => {
                    const added = addOpportunityToRoadmap(
                      selectedOpp,
                      targetBucket
                    );
                    pushToast({
                      tone: added ? "success" : "info",
                      title: added
                        ? `Queued on Day ${targetBucket} (+15 XP)`
                        : "Already queued on your Roadmap",
                      description: cleanDisplayText(selectedOpp.title),
                    });
                  }}
                >
                  Add to Day {targetBucket} Plan
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                  onClick={() => toggleSavedOpportunity(selectedOpp.id)}
                >
                  {demoState.savedOpportunityIds.includes(selectedOpp.id)
                    ? "Remove Bookmark"
                    : "Save Bookmark"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
