"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Check,
  Clock,
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
import { fetchAllCatalogOpportunities } from "@/services/profile";
import type { Opportunity } from "@/types/database";

const OPPORTUNITY_TYPES = [
  "all",
  "course",
  "workshop",
  "hackathon",
  "competition",
  "open_source",
  "internal",
  "certification",
  "mentoring",
];

const DIFFICULTY_LEVELS = ["all", "beginner", "intermediate", "advanced"];

const SHELF_TONES = ["pistachio", "butter", "peach", "lavender"] as const;

export function ExploreOpportunitiesView() {
  const { state: demoState, toggleSavedOpportunity, addOpportunityToRoadmap } =
    useEmployeeDemo();
  const { pushToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    setReloadKey((k) => k + 1);
  }

  useEffect(() => {
    let active = true;
    fetchAllCatalogOpportunities(50)
      .then((data) => {
        if (!active) return;
        setItems([...data, ...SUPPLEMENTAL_DEMO_OPPORTUNITIES]);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load learning opportunities."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const filtered = items.filter((item) => {
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
  });

  const featuredCollections = [
    items.find((i) => i.opportunity_type === "hackathon") ?? items[0],
    items.find((i) => i.cost_inr === 0 && i.opportunity_type !== "hackathon") ??
      items[1],
    items.find((i) => i.opportunity_type === "open_source") ?? items[2],
    items.find((i) => i.opportunity_type === "internal") ?? items[3],
  ].filter((x): x is Opportunity => Boolean(x));

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
        eyebrow="Workspace • Editorial Discovery"
        title="Curated"
        italicAccent="Opportunities"
        subtitle="Explore Supabase catalog courses alongside clearly labelled [DEMO] hackathons, competitions, open-source sprints, and internal workshops."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              size="sm"
              variant={savedOnly ? "primary" : "secondary"}
              leftIcon={<Bookmark className="h-3.5 w-3.5" />}
              onClick={() => setSavedOnly((v) => !v)}
            >
              Saved ({demoState.savedOpportunityIds.length})
            </Button>
            <Link href="/employee/roadmap">
              <Button size="sm" variant="ghost">
                Open Roadmap
              </Button>
            </Link>
          </div>
        }
      />

      {/* Spotify-inspired Editorial Discovery Collections */}
      {!savedOnly && query.trim() === "" && typeFilter === "all" ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-editorial text-2xl text-ink">
              Editorial <span className="italic text-forest">Collections</span>
            </h2>
            <span className="text-xs font-semibold text-muted">
              Sample collections • Phase 3 adds hybrid ML ranking
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCollections.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedOpp(item)}
                className="text-left cursor-pointer"
              >
                <PastelCard
                  tone={SHELF_TONES[idx % SHELF_TONES.length]}
                  eyebrow={item.opportunity_type.replace("_", " ")}
                  title={item.title}
                  description={`${item.estimated_hours} hrs • ${
                    item.cost_inr === 0
                      ? "Free (₹0)"
                      : `₹${item.cost_inr.toLocaleString("en-IN")} INR`
                  }`}
                  className="h-full transition hover:-translate-y-0.5"
                />
              </button>
            ))}
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
              placeholder="e.g., sql, hackathon, internal..."
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
                  {t === "all" ? "All Formats" : t.replace("_", " ")}
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
                  {lvl === "all" ? "All Levels" : lvl}
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
          title="No opportunities match those filters"
          description="Try resetting your category, difficulty, or INR budget filter."
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
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((opp) => {
            const bookmarked = demoState.savedOpportunityIds.includes(opp.id);
            const onRoadmap = demoState.roadmapItems.some(
              (r) => r.sourceOpportunityId === opp.id
            );
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
                        label={opp.opportunity_type.replace("_", " ")}
                      />
                      <StatusLabel tone="neutral" label={opp.difficulty_level} />
                    </div>
                    <StatusLabel
                      tone={opp.is_demo ? "in_progress" : "verified"}
                      label={opp.is_demo ? "[DEMO] Sample" : "Supabase Catalog"}
                    />
                  </div>

                  <h2 className="font-editorial text-2xl leading-snug text-ink">
                    {opp.title}
                  </h2>
                  <p className="text-xs font-semibold text-forest">
                    {opp.provider} • {opp.format}
                  </p>
                  <p className="text-sm leading-relaxed text-muted">
                    {opp.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {opp.skill_tags.map((tag) => (
                      <SkillChip key={tag} name={tag} status="self_reported" />
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <div className="flex items-center gap-3 text-xs font-semibold text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {opp.estimated_hours} hrs
                    </span>
                    <span>
                      {opp.cost_inr === 0
                        ? "Free (₹0)"
                        : `₹${opp.cost_inr.toLocaleString("en-IN")} INR`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant={bookmarked ? "pastel" : "ghost"}
                      leftIcon={<Bookmark className="h-3.5 w-3.5" />}
                      onClick={() => {
                        toggleSavedOpportunity(opp.id);
                        pushToast({
                          tone: bookmarked ? "info" : "success",
                          title: bookmarked
                            ? "Removed from Saved"
                            : "Saved Opportunity",
                          description: "Available directly inside My Roadmap.",
                        });
                      }}
                    >
                      {bookmarked ? "Saved" : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant={onRoadmap ? "pastel" : "secondary"}
                      onClick={() => setSelectedOpp(opp)}
                    >
                      {onRoadmap ? "Inspect (On Plan)" : "Inspect"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Opportunity Detail Drawer */}
      <Drawer
        open={Boolean(selectedOpp)}
        onClose={() => setSelectedOpp(null)}
        title={selectedOpp?.title || "Opportunity Detail"}
        description={`${selectedOpp?.provider ?? ""} • ${selectedOpp?.format ?? ""}`}
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
              eyebrow={
                selectedOpp.is_demo
                  ? "[DEMO] Sample Record"
                  : "Supabase Catalog Record"
              }
              title={selectedOpp.difficulty_level}
              description={selectedOpp.description}
            />

            <div className="rounded-2xl border border-line bg-canvas p-4 space-y-2 text-xs text-ink">
              <p className="flex items-center gap-2 font-bold">
                <Search className="h-4 w-4 text-forest" />
                Effort &amp; INR Feasibility
              </p>
              <p className="text-muted leading-relaxed">
                Estimated effort: <strong>{selectedOpp.estimated_hours} hrs</strong>{" "}
                • Fee:{" "}
                <strong>
                  {selectedOpp.cost_inr === 0
                    ? "Free (₹0 INR)"
                    : `₹${selectedOpp.cost_inr.toLocaleString("en-IN")} INR`}
                </strong>
                . No live seat availability is fabricated; external catalog ranking
                connects in Phase 3.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                Add to Demonstration Roadmap
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
                        ? `Added to Day ${targetBucket} Roadmap (+15 XP)`
                        : "Already queued on your Roadmap",
                      description: selectedOpp.title,
                    });
                  }}
                >
                  {demoState.roadmapItems.some(
                    (r) => r.sourceOpportunityId === selectedOpp.id
                  )
                    ? "Already on Roadmap"
                    : `Add to Day ${targetBucket} Plan`}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                  onClick={() => {
                    toggleSavedOpportunity(selectedOpp.id);
                  }}
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
