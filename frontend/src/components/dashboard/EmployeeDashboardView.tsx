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
  ExternalLink,
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
import { useEmployeeDemo } from "@/lib/demo/employeeDemoStore";
import { cleanDisplayText, formatEnumLabel } from "@/lib/formatters";
import {
  fetchAuthenticatedMe,
  fetchMlRecommendationsApi,
  fetchSkillGapApi,
  listMyRoadmapsApi,
} from "@/services/api";
import { getCurrentSessionAccessToken } from "@/services/auth";
import { fetchUserProfileBundle } from "@/services/profile";
import type {
  RecommendedOpportunityDto,
  RoadmapListItemDto,
  SkillGapResponseDto,
} from "@/types/api";
import type {
  AuthMeResponse,
  LearningPreferences,
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
    label: "Baseline & CV",
    cx: 54,
    cy: 158,
    color: "#D9E8B5",
    summary: "Role goal, skills ledger, and AI resume parser ready.",
    href: "/employee/settings",
    cta: "Upload / Settings",
  },
  {
    id: "m2",
    step: "02",
    label: "Skill Gap API",
    cx: 138,
    cy: 112,
    color: "#F9DF91",
    summary: "Inspect backend skill-gap coverage and prerequisite nodes.",
    href: "/employee/skills",
    cta: "Open Constellation",
  },
  {
    id: "m3",
    step: "03",
    label: "Gemini Plan",
    cx: 226,
    cy: 76,
    color: "#F4C9B4",
    summary: "Generate your persistent 30/60/90 AI learning roadmap.",
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
    summary: "Separate self-reported, inferred, and verified proof cleanly.",
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

  const [gapData, setGapData] = useState<SkillGapResponseDto | null>(null);
  const [mlRecs, setMlRecs] = useState<RecommendedOpportunityDto[]>([]);
  const [mlError, setMlError] = useState<string | null>(null);
  const [savedRoadmaps, setSavedRoadmaps] = useState<RoadmapListItemDto[]>([]);
  const [authMe, setAuthMe] = useState<AuthMeResponse | null>(null);
  const [apiAuthError, setApiAuthError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    setMlError(null);
    setApiAuthError(null);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      try {
        const [bundle, token] = await Promise.all([
          fetchUserProfileBundle(userId),
          getCurrentSessionAccessToken(),
        ]);

        if (!active) return;
        setProfile(bundle.profile);
        setUserSkills(bundle.userSkills);
        setPreferences(bundle.preferences);
        setResumes(bundle.resumes);
        setError(null);

        if (!token) {
          setApiAuthError("No active session access token available.");
          return;
        }

        const [meRes, mlRes, roadmapsRes, gapRes] = await Promise.allSettled([
          fetchAuthenticatedMe(token),
          fetchMlRecommendationsApi(token, {
            targetRoleId: bundle.profile?.target_role_id || undefined,
            limit: 4,
          }),
          listMyRoadmapsApi(token),
          bundle.profile?.target_role_id
            ? fetchSkillGapApi(bundle.profile.target_role_id, token)
            : Promise.reject(new Error("Target role not selected yet")),
        ]);

        if (!active) return;

        if (meRes.status === "fulfilled") {
          setAuthMe(meRes.value);
          setApiAuthError(null);
        } else {
          setAuthMe(null);
          setApiAuthError(
            meRes.reason instanceof Error
              ? meRes.reason.message
              : "FastAPI token check failed"
          );
        }

        if (mlRes.status === "fulfilled") {
          setMlRecs(mlRes.value.recommendations);
          setMlError(null);
        } else {
          setMlRecs([]);
          setMlError(
            mlRes.reason instanceof Error
              ? mlRes.reason.message
              : "ML recommendations failed"
          );
        }

        if (roadmapsRes.status === "fulfilled") {
          setSavedRoadmaps(roadmapsRes.value);
        }

        if (gapRes.status === "fulfilled") {
          setGapData(gapRes.value);
        } else {
          setGapData(null);
        }
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load your workspace baseline."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadWorkspace();
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
  const activeResume = resumes.find((r) => r.is_active) ?? resumes[0] ?? null;
  const budgetCap = preferences?.budget_inr ?? demoState.budgetInrSim;

  const strongCount = gapData
    ? gapData.strengths.length
    : userSkills.filter((s) => s.proficiency >= 4).length;
  const gapCount = gapData
    ? gapData.gaps.length
    : userSkills.filter((s) => s.proficiency < 4).length;
  const demonstratedDemoCount = Object.keys(demoState.demoSkillEvidence).length;

  const nextRecommended = !profile?.onboarding_completed
    ? {
        eyebrow: "Priority Baseline",
        title: "Finish your 4-step career onboarding",
        description:
          "Set your target role and INR preferences so backend skill-gap and roadmap endpoints personalize accurately.",
        href: "/onboarding",
        cta: "Resume Onboarding",
      }
    : !activeResume
      ? {
          eyebrow: "AI Skill Extractor",
          title: "Upload PDF resume for skill extraction",
          description:
            "Parse technical skills automatically into your private competency profile.",
          href: "/employee/settings",
          cta: "Upload Resume & Extract",
        }
      : savedRoadmaps.length === 0
        ? {
            eyebrow: "AI Learning Planner",
            title: "Generate your first 30/60/90 roadmap",
            description:
              "Generate a structured milestone plan tailored to your missing skills and schedule.",
            href: "/employee/roadmap",
            cta: "Generate AI Roadmap",
          }
        : {
            eyebrow: "Active Roadmap",
            title: cleanDisplayText(savedRoadmaps[0].title),
            description: `${savedRoadmaps[0].duration_days}-day personalized plan • ${formatEnumLabel(savedRoadmaps[0].status)}`,
            href: "/employee/roadmap",
            cta: "Continue Learning",
          };

  return (
    <div className="space-y-10">
      {/* Editorial Hero Banner */}
      <section className="relative overflow-hidden rounded-[28px] border border-line bg-surface p-6 sm:p-10 shadow-[var(--shadow-card)]">
        <div className="grid items-center gap-8 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusLabel
                tone="verified"
                label={`Welcome, ${profile?.full_name || firstName}`}
              />
              {gapData ? (
                <StatusLabel
                  tone="verified"
                  label={`${Math.round(gapData.overall_readiness_score)}% ${gapData.target_role_title} Readiness`}
                />
              ) : null}
              <StatusLabel
                tone="in_progress"
                label={`${demoState.xp} XP • ${demoState.streakDays}-day streak`}
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
              . Personalized around your live skill ledger, ML recommendations,
              and adaptive learning roadmap.
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
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                Interactive Journey Preview
              </span>
              <span className="text-xs font-semibold text-forest">
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

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3.5">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-ink">
                  {activeMilestone.step} • {activeMilestone.label}
                </p>
                <p className="text-[13px] text-muted">{activeMilestone.summary}</p>
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

      {/* Daily Quests + Engagement Rhythm + Next Recommended Action */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card padding="lg" className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                Prototype mode · Sample data
              </p>
              <h2 className="font-editorial text-[28px] sm:text-[32px] leading-tight text-ink">
                Today&apos;s Learning Quests
              </h2>
            </div>
            <StatusLabel
              tone="in_progress"
              label={`${completedQuestsCount}/${demoState.quests.length} Completed`}
            />
          </div>

          <div className="space-y-3">
            {demoState.quests.map((quest) => (
              <div
                key={quest.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-canvas px-4 py-3.5 transition hover:border-line-strong"
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
                        ? "XP tracks engagement habit — skill verification requires formal assessment."
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
                  <div className="space-y-0.5">
                    <p
                      className={`text-[15px] font-semibold ${
                        quest.completed
                          ? "line-through text-muted"
                          : "text-ink"
                      }`}
                    >
                      {quest.title}
                    </p>
                    <p className="text-[13px] sm:text-sm text-muted">{quest.subtitle}</p>
                  </div>
                </button>

                <div className="flex items-center gap-2.5">
                  <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold text-forest">
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
            eyebrow="Learning Streak"
            title={`${demoState.xp} XP • ${demoState.streakDays}-day Streak`}
            description="Engagement XP rewards daily consistency across quests. Skill verification always requires a passed assessment."
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

      {/* Live Skill Gap Summary & Saved Supabase Roadmaps */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card padding="lg" className="lg:col-span-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                Live Skill Readiness
              </p>
              <h2 className="font-editorial text-[28px] sm:text-[32px] leading-tight text-ink">
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
            <div className="rounded-2xl border border-[#C5D89B] bg-[#D9E8B5]/65 p-4">
              <p className="font-editorial text-4xl text-ink">{strongCount}</p>
              <p className="mt-1 text-xs sm:text-[13px] font-semibold text-ink">
                Target Met
              </p>
            </div>
            <div className="rounded-2xl border border-[#EBCD75] bg-[#F9DF91]/65 p-4">
              <p className="font-editorial text-4xl text-ink">{gapCount}</p>
              <p className="mt-1 text-xs sm:text-[13px] font-semibold text-ink">
                Skill Gaps
              </p>
            </div>
            <div className="rounded-2xl border border-[#C7BDE4] bg-[#DDD6F3]/65 p-4">
              <p className="font-editorial text-4xl text-ink">
                {demonstratedDemoCount}
              </p>
              <p className="mt-1 text-xs sm:text-[13px] font-semibold text-ink">
                Demonstrated
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {userSkills.length === 0 ? (
              <p className="text-[14px] text-muted">
                Upload a resume in Settings or add skills in Onboarding to
                populate your ledger.
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
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                Active Learning Plans
              </p>
              <h2 className="font-editorial text-[28px] sm:text-[32px] leading-tight text-ink">
                AI Career Roadmaps
              </h2>
            </div>
            <Link href="/employee/roadmap">
              <Button
                size="sm"
                variant="secondary"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Manage Roadmaps
              </Button>
            </Link>
          </div>

          {savedRoadmaps.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line-strong bg-canvas p-5 text-[14px] text-muted space-y-3">
              <p>
                No persisted Gemini roadmap yet for your account. Generate one in
                one click on My Roadmap.
              </p>
              <Link href="/employee/roadmap">
                <Button size="sm" variant="primary">
                  Generate AI Roadmap
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <ProgressBar
                value={100}
                label={`${savedRoadmaps.length} active learning plan(s)`}
                tone="forest"
              />
              {savedRoadmaps.slice(0, 3).map((rm) => (
                <Link
                  key={rm.id}
                  href="/employee/roadmap"
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas px-4 py-3.5 transition hover:border-line-strong"
                >
                  <div className="space-y-1">
                    <p className="text-[15px] font-semibold text-ink">
                      {cleanDisplayText(rm.title)}
                    </p>
                    <p className="text-[13px] text-muted">
                      {rm.duration_days} days •{" "}
                      {rm.career_roles?.title || "Career Plan"}
                    </p>
                  </div>
                  <StatusLabel tone="verified" label={formatEnumLabel(rm.status)} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Live ML Opportunity Recommendations */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                Semantic Skill Matching • Budget Cap ₹{budgetCap.toLocaleString("en-IN")}{" "}
                INR
              </p>
            <h2 className="font-editorial text-[28px] sm:text-[32px] leading-tight text-ink">
              Personalized{" "}
              <span className="italic text-forest">Recommendations</span>
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
                Explore Full Catalog
              </Button>
            </Link>
          </div>
        </div>

        {mlError ? (
          <Card className="border-[var(--status-attention-border)] bg-[var(--status-attention-bg)]">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--status-attention-text)]">
              <span>
                <strong>ML Recommendations Error:</strong> {mlError}
              </span>
              <Button size="sm" variant="secondary" onClick={handleRetry}>
                Retry
              </Button>
            </div>
          </Card>
        ) : mlRecs.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">
              No tailored recommendations yet. Confirm your target career role in
              Settings to generate personalized matches.
            </p>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {mlRecs.map((rec) => (
              <Card key={rec.opportunity_id} interactive padding="md" className="flex h-full flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-pistachio/60 text-forest">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <StatusLabel
                      tone="verified"
                      label={`${Math.round(rec.relevance_score * 100)}% Match`}
                      className="shrink-0"
                    />
                  </div>
                  <h3 className="text-[17px] sm:text-[18px] font-bold leading-snug text-ink">
                    {cleanDisplayText(rec.title)}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-muted line-clamp-3">
                    {cleanDisplayText(rec.match_reason)} —{" "}
                    {cleanDisplayText(rec.description)}
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-3.5 text-[13px] font-semibold text-muted">
                  <span>
                    {rec.estimated_hours} hrs •{" "}
                    {rec.cost_inr === 0
                      ? "Free (₹0)"
                      : `₹${rec.cost_inr.toLocaleString("en-IN")} INR`}
                  </span>
                  {rec.url ? (
                    <a
                      href={rec.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-forest underline underline-offset-2"
                    >
                      Open Link <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Card padding="md" className="bg-canvas">
        <div className="flex flex-wrap items-center justify-between gap-4 text-[13px]">
          <div className="flex flex-wrap items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-forest" />
            <span className="font-semibold text-ink">
              Session Status:{" "}
              {authMe?.authenticated
                ? "Verified Account"
                : apiAuthError || "Verification check pending"}
            </span>
            <span className="text-muted">•</span>
            <span className="inline-flex items-center gap-1 text-muted">
              <Compass className="h-3.5 w-3.5" />
              Resume Vault:{" "}
              {activeResume
                ? `${activeResume.file_name} (${formatEnumLabel(activeResume.parse_status)})`
                : "No PDF uploaded"}
            </span>
          </div>
          <Link
            href="/employee/settings"
            className="font-semibold text-forest underline underline-offset-4"
          >
            Upload Resume, Preferences &amp; Vault
          </Link>
        </div>
      </Card>
    </div>
  );
}
