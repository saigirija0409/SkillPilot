"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  Circle,
  Compass,
  Flame,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  Button,
  Card,
  PastelCard,
  ProgressBar,
  SkeletonCard,
  SkillChip,
  StatusLabel,
  useToast,
} from "@/components/ui";
import {
  SUPPLEMENTAL_DEMO_OPPORTUNITIES,
  useEmployeeDemo,
} from "@/lib/demo/employeeDemoStore";
import { fetchAuthenticatedMe } from "@/services/api";
import { getCurrentSessionAccessToken } from "@/services/auth";
import {
  fetchDemoOpportunitiesPreview,
  fetchUserProfileBundle,
} from "@/services/profile";
import type {
  AuthMeResponse,
  LearningPreferences,
  Opportunity,
  Profile,
  ResumeRecord,
  UserSkill,
} from "@/types/database";

interface EmployeeDashboardViewProps {
  userId: string;
}

const HERO_MILESTONES = [
  {
    id: "m1",
    step: "01",
    label: "Baseline",
    cx: 54,
    cy: 158,
    color: "#D9E8B5",
    summary: "Role goal, skills ledger, and INR learning budget logged.",
    href: "/employee/settings",
    cta: "Review Settings",
  },
  {
    id: "m2",
    step: "02",
    label: "Constellation",
    cx: 138,
    cy: 112,
    color: "#F9DF91",
    summary: "Map prerequisites and spot developing skill gaps interactively.",
    href: "/employee/skills",
    cta: "Open Constellation",
  },
  {
    id: "m3",
    step: "03",
    label: "30/60/90 Sprint",
    cx: 226,
    cy: 76,
    color: "#F4C9B4",
    summary: "Pace workshops, courses, and build sprints around your week.",
    href: "/employee/roadmap",
    cta: "Open Roadmap",
  },
  {
    id: "m4",
    step: "04",
    label: "Skill Passport",
    cx: 318,
    cy: 38,
    color: "#DDD6F3",
    summary: "Turn practical assessments into demonstrated proof badges.",
    href: "/employee/passport",
    cta: "View Passport",
  },
];

export function EmployeeDashboardView({ userId }: EmployeeDashboardViewProps) {
  const { state: demoState, toggleQuest } = useEmployeeDemo();
  const { pushToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMilestoneId, setActiveMilestoneId] = useState<string>("m2");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [preferences, setPreferences] = useState<LearningPreferences | null>(
    null
  );
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [opportunitiesError, setOpportunitiesError] = useState<string | null>(
    null
  );

  const [authMe, setAuthMe] = useState<AuthMeResponse | null>(null);
  const [apiAuthError, setApiAuthError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    setOpportunitiesError(null);
    setApiAuthError(null);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      fetchUserProfileBundle(userId),
      fetchDemoOpportunitiesPreview(),
      getCurrentSessionAccessToken(),
    ])
      .then(async ([bundleResult, oppsResult, tokenResult]) => {
        if (!active) return;

        if (bundleResult.status === "fulfilled") {
          setProfile(bundleResult.value.profile);
          setUserSkills(bundleResult.value.userSkills);
          setPreferences(bundleResult.value.preferences);
          setResumes(bundleResult.value.resumes);
          setError(null);
        } else {
          setError(
            bundleResult.reason instanceof Error
              ? bundleResult.reason.message
              : "Failed to load your profile data."
          );
        }

        if (oppsResult.status === "fulfilled") {
          setOpportunities(oppsResult.value);
          setOpportunitiesError(null);
        } else {
          setOpportunities([]);
          setOpportunitiesError(
            oppsResult.reason instanceof Error
              ? oppsResult.reason.message
              : "Failed to load learning opportunities."
          );
        }

        if (tokenResult.status === "fulfilled" && tokenResult.value) {
          try {
            const me = await fetchAuthenticatedMe(tokenResult.value);
            if (active) {
              setAuthMe(me);
              setApiAuthError(null);
            }
          } catch (apiErr) {
            if (active) {
              setAuthMe(null);
              setApiAuthError(
                apiErr instanceof Error
                  ? apiErr.message
                  : "FastAPI token check failed"
              );
            }
          }
        } else if (active) {
          setAuthMe(null);
          setApiAuthError("No active session access token available.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId, reloadKey]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid gap-6 md:grid-cols-3">
          <SkeletonCard />
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
          Unable to load your workspace
        </p>
        <p className="mt-1 text-sm text-muted">{error}</p>
        <div className="mt-5">
          <Button
            variant="primary"
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

  const firstName = profile?.full_name?.split(" ")[0] || "Explorer";
  const activeMilestone =
    HERO_MILESTONES.find((m) => m.id === activeMilestoneId) ?? HERO_MILESTONES[1];

  const completedQuestsCount = demoState.quests.filter((q) => q.completed).length;
  const upcomingActivities = demoState.roadmapItems
    .filter((item) => !item.completed)
    .slice(0, 3);
  const completedRoadmapCount = demoState.roadmapItems.filter(
    (item) => item.completed
  ).length;

  const activeResume = resumes.find((r) => r.is_active) ?? resumes[0] ?? null;
  const budgetCap = preferences?.budget_inr ?? demoState.budgetInrSim;

  const acquiredCount = userSkills.filter((s) => s.proficiency >= 4).length;
  const developingCount = userSkills.filter(
    (s) => s.proficiency > 0 && s.proficiency < 4
  ).length;
  const demonstratedDemoCount = Object.keys(demoState.demoSkillEvidence).length;

  const personalizedCollection = [
    ...opportunities,
    ...SUPPLEMENTAL_DEMO_OPPORTUNITIES.slice(0, 2),
  ]
    .filter((item) => item.cost_inr <= Math.max(budgetCap, 5000))
    .slice(0, 4);

  const nextRecommended = !profile?.onboarding_completed
    ? {
        eyebrow: "Priority Baseline",
        title: "Finish your 4-step career onboarding",
        description:
          "Set your target role and INR preferences to anchor every recommendation.",
        href: "/onboarding",
        cta: "Resume Onboarding",
      }
    : !activeResume
      ? {
          eyebrow: "Vault Recommendation",
          title: "Upload your current PDF resume",
          description:
            "Keep an encrypted baseline copy ready in your private vault for skill extraction.",
          href: "/employee/settings",
          cta: "Open Settings & Vault",
        }
      : {
          eyebrow: "Suggested Next Step",
          title:
            upcomingActivities[0]?.title ||
            "Practice a SQL or AI Engineering check",
          description:
            upcomingActivities[0]?.notes ||
            "Small 35-minute sessions keep momentum compounding cleanly.",
          href: upcomingActivities[0] ? "/employee/roadmap" : "/employee/challenges",
          cta: upcomingActivities[0] ? "Continue Learning" : "Start Assessment",
        };

  return (
    <div className="space-y-10">
      {/* Editorial Hero Banner with Interactive Career Journey SVG */}
      <section className="relative overflow-hidden rounded-[28px] border border-line bg-surface p-6 sm:p-10 shadow-[var(--shadow-card)]">
        <div className="grid items-center gap-8 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusLabel
                tone="verified"
                label={`Welcome, ${profile?.full_name || firstName}`}
              />
              <StatusLabel
                tone="in_progress"
                label={`[DEMO] ${demoState.xp} XP • ${demoState.streakDays}-day streak`}
              />
            </div>

            <h1 className="font-editorial text-4xl leading-[1.03] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Small steps.{" "}
              <span className="italic text-forest">Bigger possibilities.</span>
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Charting your path from{" "}
              <strong className="font-semibold text-ink">
                {profile?.current_job_role || "Current Role"}
              </strong>{" "}
              toward{" "}
              <strong className="font-semibold text-forest">
                {profile?.target_role_name || "Your Target Role"}
              </strong>
              . Every reflection, challenge, and scheduled sprint builds toward
              verifiable mastery.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/employee/roadmap">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Continue Learning
                </Button>
              </Link>
              <Link href="/employee/roadmap#simulator">
                <Button
                  variant="secondary"
                  size="lg"
                  leftIcon={<CalendarDays className="h-4 w-4" />}
                >
                  Plan My Weeks
                </Button>
              </Link>
            </div>
          </div>

          {/* Interactive Career Journey SVG Preview */}
          <div className="rounded-2xl border border-line bg-canvas p-5 lg:col-span-5">
            <div className="flex items-center justify-between gap-2 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                Interactive Journey Preview
              </span>
              <span className="text-[11px] font-semibold text-forest">
                Click a milestone
              </span>
            </div>

            <svg
              viewBox="0 0 368 195"
              className="w-full overflow-visible"
              role="img"
              aria-label="Interactive career milestone path"
            >
              <defs>
                <linearGradient id="journeyPath" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#D9E8B5" />
                  <stop offset="50%" stopColor="#F9DF91" />
                  <stop offset="100%" stopColor="#DDD6F3" />
                </linearGradient>
              </defs>

              <path
                d="M 54 158 C 96 158, 102 112, 138 112 C 176 112, 188 76, 226 76 C 266 76, 282 38, 318 38"
                fill="none"
                stroke="#E2DFD5"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M 54 158 C 96 158, 102 112, 138 112 C 176 112, 188 76, 226 76 C 266 76, 282 38, 318 38"
                fill="none"
                stroke="url(#journeyPath)"
                strokeWidth="4.5"
                strokeDasharray="7 5"
                strokeLinecap="round"
              />

              {HERO_MILESTONES.map((node) => {
                const selected = node.id === activeMilestone.id;
                return (
                  <g
                    key={node.id}
                    onClick={() => setActiveMilestoneId(node.id)}
                    className="cursor-pointer"
                  >
                    {selected ? (
                      <circle
                        cx={node.cx}
                        cy={node.cy}
                        r={24}
                        fill={node.color}
                        fillOpacity={0.35}
                      />
                    ) : null}
                    <circle
                      cx={node.cx}
                      cy={node.cy}
                      r={selected ? 18 : 14}
                      fill={node.color}
                      stroke="#294C3B"
                      strokeWidth={selected ? 2.5 : 1.5}
                    />
                    <text
                      x={node.cx}
                      y={node.cy + 4}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill="#202622"
                    >
                      {node.step}
                    </text>
                    <text
                      x={node.cx}
                      y={node.cy + 30}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight={selected ? "700" : "600"}
                      fill="#202622"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-ink">
                  {activeMilestone.step} • {activeMilestone.label}
                </p>
                <p className="text-xs text-muted">{activeMilestone.summary}</p>
              </div>
              <Link href={activeMilestone.href}>
                <Button size="sm" variant="secondary">
                  {activeMilestone.cta}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Quests + Engagement Momentum + Next Recommended Action */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card padding="lg" className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                [DEMO] Daily Learning Journal Quests
              </p>
              <h2 className="font-editorial text-3xl text-ink">
                Today&apos;s Gentle Momentum
              </h2>
            </div>
            <StatusLabel
              tone="in_progress"
              label={`${completedQuestsCount}/${demoState.quests.length} Completed`}
            />
          </div>

          <div className="space-y-2.5">
            {demoState.quests.map((quest) => (
              <div
                key={quest.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-canvas px-4 py-3 transition hover:border-line-strong"
              >
                <button
                  type="button"
                  onClick={() => {
                    const willComplete = !quest.completed;
                    toggleQuest(quest.id);
                    pushToast({
                      tone: willComplete ? "success" : "info",
                      title: willComplete
                        ? `+${quest.xp} Engagement XP logged`
                        : "Quest unchecked",
                      description: willComplete
                        ? "XP tracks engagement habit — skill verification still requires graded checks."
                        : undefined,
                    });
                  }}
                  className="flex flex-1 items-start gap-3 text-left cursor-pointer"
                >
                  {quest.completed ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-forest shrink-0" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 text-muted shrink-0" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        quest.completed
                          ? "line-through text-muted"
                          : "text-ink"
                      }`}
                    >
                      {quest.title}
                    </p>
                    <p className="text-xs text-muted">{quest.subtitle}</p>
                  </div>
                </button>

                <div className="flex items-center gap-2.5">
                  <span className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] font-bold text-forest">
                    +{quest.xp} XP
                  </span>
                  <Link href={quest.href}>
                    <Button size="sm" variant="ghost">
                      Open
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-5">
          <PastelCard
            tone="butter"
            eyebrow="[DEMO] Engagement Rhythm"
            title={`${demoState.xp} XP • ${demoState.streakDays}-day Streak`}
            description="Engagement XP rewards daily consistency across quests and roadmap sessions. Formal proficiency remains tied to Skill Passport assessments."
            illustration={<Flame className="h-10 w-10 text-forest" />}
            footer={
              <Link href="/employee/challenges">
                <Button
                  size="sm"
                  variant="primary"
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  Open Challenges &amp; Assessments
                </Button>
              </Link>
            }
          />

          <PastelCard
            tone="peach"
            eyebrow={nextRecommended.eyebrow}
            title={nextRecommended.title}
            description={nextRecommended.description}
            footer={
              <Link href={nextRecommended.href}>
                <Button
                  size="sm"
                  variant="secondary"
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  {nextRecommended.cta}
                </Button>
              </Link>
            }
          />
        </div>
      </div>

      {/* Skill Constellation Preview & Upcoming Roadmap Activities */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card padding="lg" className="lg:col-span-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                Skill Graph Preview
              </p>
              <h2 className="font-editorial text-3xl text-ink">
                Your Skill Constellation
              </h2>
            </div>
            <Link href="/employee/skills">
              <Button
                size="sm"
                variant="secondary"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Explore Graph
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-[#C5D89B] bg-[#D9E8B5]/65 p-3">
              <p className="font-editorial text-3xl text-ink">{acquiredCount}</p>
              <p className="text-[11px] font-semibold text-ink">
                Strong (4-5/5)
              </p>
            </div>
            <div className="rounded-2xl border border-[#EBCD75] bg-[#F9DF91]/65 p-3">
              <p className="font-editorial text-3xl text-ink">
                {developingCount}
              </p>
              <p className="text-[11px] font-semibold text-ink">
                Developing (1-3/5)
              </p>
            </div>
            <div className="rounded-2xl border border-[#C7BDE4] bg-[#DDD6F3]/65 p-3">
              <p className="font-editorial text-3xl text-ink">
                {demonstratedDemoCount}
              </p>
              <p className="text-[11px] font-semibold text-ink">
                Demonstrated (Demo)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {userSkills.length === 0 ? (
              <p className="text-xs text-muted">
                Add your baseline skills in Onboarding or Settings to populate
                your constellation.
              </p>
            ) : (
              userSkills.slice(0, 6).map((us) => (
                <SkillChip
                  key={us.id}
                  name={us.skills?.name || "Skill"}
                  level={us.proficiency}
                  status={us.verification_status}
                />
              ))
            )}
          </div>
        </Card>

        <Card padding="lg" className="lg:col-span-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                [DEMO] Adaptive Schedule
              </p>
              <h2 className="font-editorial text-3xl text-ink">
                Upcoming Activities
              </h2>
            </div>
            <Link href="/employee/roadmap">
              <Button
                size="sm"
                variant="secondary"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Full Roadmap
              </Button>
            </Link>
          </div>

          <ProgressBar
            value={completedRoadmapCount}
            max={demoState.roadmapItems.length}
            label="30/60/90 Demo Plan Progress"
            tone="forest"
          />

          <div className="space-y-2.5">
            {upcomingActivities.length === 0 ? (
              <p className="text-sm text-muted">
                All current roadmap items completed! Add saved opportunities to
                queue new sprints.
              </p>
            ) : (
              upcomingActivities.map((item) => (
                <Link
                  key={item.id}
                  href="/employee/roadmap"
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas px-4 py-3 transition hover:border-line-strong"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-ink">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted">
                      Day {item.bucket} tier • {item.estimatedHours} hrs • Target:{" "}
                      {item.scheduledDate}
                    </p>
                  </div>
                  <StatusLabel tone="in_progress" label={item.type} />
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Personalized Opportunity Collections */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              Curated For Your INR Budget ({budgetCap.toLocaleString("en-IN")}{" "}
              INR cap)
            </p>
            <h2 className="font-editorial text-3xl text-ink">
              Personalized Opportunity{" "}
              <span className="italic text-forest">Collections</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <StatusLabel
              tone="inferred"
              label={`${demoState.savedOpportunityIds.length} Saved`}
              icon={<Bookmark className="h-3 w-3" />}
            />
            <Link href="/employee/explore">
              <Button
                variant="secondary"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Explore All Opportunities
              </Button>
            </Link>
          </div>
        </div>

        {opportunitiesError ? (
          <Card className="border-[var(--status-attention-border)] bg-[var(--status-attention-bg)]">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--status-attention-text)]">
              <span>{opportunitiesError}</span>
              <Button size="sm" variant="secondary" onClick={handleRetry}>
                Retry
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {personalizedCollection.map((opp) => (
              <Link key={opp.id} href="/employee/explore">
                <Card interactive padding="md" className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-forest shrink-0" />
                      <p className="text-sm font-bold text-ink">{opp.title}</p>
                    </div>
                    <StatusLabel
                      tone={opp.is_demo ? "in_progress" : "inferred"}
                      label={opp.is_demo ? "Demo Seed" : opp.opportunity_type}
                    />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {opp.description}
                  </p>
                  <p className="mt-3 text-[11px] font-semibold text-muted">
                    {opp.estimated_hours} hrs •{" "}
                    {opp.cost_inr === 0
                      ? "Free (₹0)"
                      : `₹${opp.cost_inr.toLocaleString("en-IN")} INR`}{" "}
                    • {opp.difficulty_level}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Compact FastAPI + Supabase Health & Preferences Strip */}
      <Card padding="md" className="bg-canvas">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-forest" />
            <span className="font-semibold text-ink">
              FastAPI Session:{" "}
              {authMe?.authenticated
                ? `Verified (${authMe.auth_method})`
                : apiAuthError || "Verification check pending"}
            </span>
            <span className="text-muted">•</span>
            <span className="inline-flex items-center gap-1 text-muted">
              <Compass className="h-3.5 w-3.5" />
              Vault:{" "}
              {activeResume ? activeResume.file_name : "No PDF uploaded"}
            </span>
          </div>
          <Link
            href="/employee/settings"
            className="font-semibold text-forest underline underline-offset-4"
          >
            Manage Profile, Budget &amp; Vault
          </Link>
        </div>
      </Card>
    </div>
  );
}
