"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Newspaper,
  TrendingUp,
} from "lucide-react";

import {
  Button,
  Card,
  Drawer,
  EditorialHeading,
  PastelCard,
  SkillChip,
  StatusLabel,
  useToast,
} from "@/components/ui";
import {
  DEMO_INDUSTRY_ARTICLES,
  useEmployeeDemo,
} from "@/lib/demo/employeeDemoStore";

const TOPICS = [
  "All",
  "AI Engineering",
  "Data & Analytics",
  "Cloud & Security",
  "Product & Leadership",
];

const DEMO_SKILL_TRENDS = [
  { skill: "NLP & Generative AI", shift: "+42% cohort interest [DEMO]", tone: "pistachio" as const },
  { skill: "SQL", shift: "Core benchmark across 4 roles [DEMO]", tone: "butter" as const },
  { skill: "Identity & Access Management", shift: "+28% security briefs [DEMO]", tone: "lavender" as const },
];

export function IndustryPulseView() {
  const { state: demoState, toggleSavedArticle } = useEmployeeDemo();
  const { pushToast } = useToast();

  const [topic, setTopic] = useState("All");
  const [savedOnly, setSavedOnly] = useState(false);
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);

  const featuredArticle = DEMO_INDUSTRY_ARTICLES[0];

  const visibleArticles = DEMO_INDUSTRY_ARTICLES.filter((article) => {
    if (savedOnly && !demoState.savedArticleIds.includes(article.id)) {
      return false;
    }
    if (topic !== "All" && article.topic !== topic) {
      return false;
    }
    return true;
  });

  const activeArticle =
    DEMO_INDUSTRY_ARTICLES.find((a) => a.id === activeArticleId) ?? null;

  return (
    <div className="space-y-9">
      <EditorialHeading
        eyebrow="Development • Editorial Magazine"
        title="Career"
        italicAccent="Industry Pulse"
        subtitle="Sample magazine dispatches linking industry engineering shifts to your skill constellation. Live editorial ingestion connects in Phase 5."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusLabel tone="in_progress" label="[DEMO] Sample Content" />
            <Button
              size="sm"
              variant={savedOnly ? "primary" : "secondary"}
              leftIcon={<Bookmark className="h-3.5 w-3.5" />}
              onClick={() => setSavedOnly((v) => !v)}
            >
              Saved ({demoState.savedArticleIds.length})
            </Button>
          </div>
        }
      />

      {/* Featured Editorial Issue */}
      {!savedOnly && topic === "All" && featuredArticle ? (
        <section className="rounded-[28px] border border-line bg-surface p-6 sm:p-9 shadow-[var(--shadow-card)]">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="space-y-4 lg:col-span-8">
              <div className="flex flex-wrap items-center gap-2">
                <StatusLabel tone="inferred" label={featuredArticle.publishedLabel} />
                <span className="text-xs font-semibold text-muted">
                  {featuredArticle.topic} • {featuredArticle.readTime}
                </span>
              </div>
              <h2 className="font-editorial text-3xl leading-tight text-ink sm:text-4xl">
                {featuredArticle.title}
              </h2>
              <p className="text-sm leading-relaxed text-muted">
                {featuredArticle.summary}
              </p>
              <div className="flex flex-wrap gap-2">
                {featuredArticle.skills.map((s) => (
                  <SkillChip key={s} name={s} status="inferred" />
                ))}
              </div>
              <div className="flex flex-wrap gap-3 pt-1">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setActiveArticleId(featuredArticle.id)}
                >
                  Read Dispatch
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Bookmark className="h-3.5 w-3.5" />}
                  onClick={() => toggleSavedArticle(featuredArticle.id)}
                >
                  {demoState.savedArticleIds.includes(featuredArticle.id)
                    ? "Saved"
                    : "Save Issue"}
                </Button>
              </div>
            </div>

            <div className="space-y-3 lg:col-span-4">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                <TrendingUp className="h-3.5 w-3.5 text-forest" />
                [DEMO] Skill Demand Signals
              </p>
              {DEMO_SKILL_TRENDS.map((t) => (
                <PastelCard
                  key={t.skill}
                  tone={t.tone}
                  eyebrow={t.skill}
                  title={t.shift}
                  description="Match against your skill constellation to plan focus blocks."
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Topic Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {TOPICS.map((t) => (
          <Button
            key={t}
            size="sm"
            variant={topic === t ? "primary" : "secondary"}
            onClick={() => setTopic(t)}
          >
            {t}
          </Button>
        ))}
      </div>

      {/* Article Grid */}
      {visibleArticles.length === 0 ? (
        <Card padding="lg">
          <p className="font-editorial text-2xl text-ink">
            No saved articles in this filter yet
          </p>
          <p className="mt-1 text-xs text-muted">
            Switch back to All Dispatches to bookmark sample industry reads.
          </p>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {visibleArticles.map((article) => {
            const isSaved = demoState.savedArticleIds.includes(article.id);
            return (
              <Card
                key={article.id}
                interactive
                className="flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <StatusLabel tone="inferred" label={article.topic} />
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      <Newspaper className="h-3.5 w-3.5" />
                      {article.readTime}
                    </span>
                  </div>

                  <h3 className="font-editorial text-2xl leading-snug text-ink">
                    {article.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted">
                    {article.summary}
                  </p>

                  <div className="rounded-xl border border-line bg-canvas p-3 text-xs text-ink">
                    <strong>Why it matters:</strong> {article.whyItMatters}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {article.skills.map((s) => (
                      <SkillChip key={s} name={s} status="inferred" />
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
                  <Button
                    size="sm"
                    variant={isSaved ? "pastel" : "ghost"}
                    leftIcon={<Bookmark className="h-3.5 w-3.5" />}
                    onClick={() => {
                      toggleSavedArticle(article.id);
                      pushToast({
                        tone: isSaved ? "info" : "success",
                        title: isSaved ? "Removed bookmark" : "Article saved",
                      });
                    }}
                  >
                    {isSaved ? "Saved" : "Bookmark"}
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setActiveArticleId(article.id)}
                  >
                    Read Takeaways
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Article Reader Drawer */}
      <Drawer
        open={Boolean(activeArticle)}
        onClose={() => setActiveArticleId(null)}
        title={activeArticle?.title || "Article Dispatch"}
        description={
          activeArticle
            ? `${activeArticle.topic} • ${activeArticle.readTime} (${activeArticle.publishedLabel})`
            : undefined
        }
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <Link href="/employee/explore">
              <Button
                size="sm"
                variant="secondary"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Explore Related Courses
              </Button>
            </Link>
            <Button variant="primary" onClick={() => setActiveArticleId(null)}>
              Close
            </Button>
          </div>
        }
      >
        {activeArticle ? (
          <div className="space-y-5">
            <PastelCard
              tone="butter"
              eyebrow="[DEMO] Editorial Summary"
              title="Why It Matters for Your Target Role"
              description={activeArticle.whyItMatters}
            />
            <p className="text-sm leading-relaxed text-ink">
              {activeArticle.summary}
            </p>
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                Key Journal Takeaways
              </p>
              <ul className="space-y-2 text-xs text-ink">
                {activeArticle.takeaways.map((point) => (
                  <li
                    key={point}
                    className="rounded-xl border border-line bg-canvas p-3"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
