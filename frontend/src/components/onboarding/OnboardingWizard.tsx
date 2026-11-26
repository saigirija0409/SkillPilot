"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
} from "lucide-react";

import { ResumeManagerCard } from "@/components/resumes/ResumeManagerCard";
import {
  BrandLogo,
  Button,
  Card,
  CompassGrowthIllustration,
  Input,
  JournalSparkIllustration,
  OptionCard,
  PastelCard,
  RoadmapRibbonIllustration,
  Select,
  SkeletonCard,
  SkillChip,
  SkillConstellationIllustration,
  StatusLabel,
  StepProgress,
} from "@/components/ui";
import { signOutUser } from "@/services/auth";
import {
  fetchCatalogData,
  fetchUserProfileBundle,
  logUserActivity,
  replaceSelfReportedSkills,
  saveLearningPreferences,
  saveProfileInfo,
} from "@/services/profile";
import type {
  CareerRole,
  ExperienceLevel,
  PreferredPace,
  ResumeRecord,
  SelectedSkillInput,
  Skill,
} from "@/types/database";

interface OnboardingWizardProps {
  userId: string;
  userEmail: string;
}

const LEARNING_METHODS = [
  "Interactive Courses",
  "Hands-on Projects",
  "Workshops",
  "Certifications",
  "Hackathons",
  "Mentoring",
];

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "entry", label: "Entry Level (0–2 yrs)" },
  { value: "mid", label: "Mid Level (2–5 yrs)" },
  { value: "senior", label: "Senior (5+ yrs)" },
  { value: "lead", label: "Lead / Principal" },
];

const STEP_META = [
  {
    tone: "pistachio" as const,
    eyebrow: "Step 1 of 4 • Foundation",
    title: "Tell us where you're starting from.",
    description:
      "Your current role, industry, and experience level help SkillPilot tailor explanations and realistic milestones.",
    illustration: <JournalSparkIllustration className="h-24 w-24" />,
  },
  {
    tone: "butter" as const,
    eyebrow: "Step 2 of 4 • Direction & Skills",
    title: "Where are you headed next?",
    description:
      "Choose a target role and rate your current skills honestly. Self-reported skills stay distinct from verified credentials.",
    illustration: <CompassGrowthIllustration className="h-24 w-24" />,
  },
  {
    tone: "lavender" as const,
    eyebrow: "Step 3 of 4 • Weekly Rhythm",
    title: "Design a pace that fits your life.",
    description:
      "Set your daily availability, INR learning budget, and preferred formats so recommendations fit your actual week.",
    illustration: <RoadmapRibbonIllustration className="h-24 w-24" />,
  },
  {
    tone: "peach" as const,
    eyebrow: "Step 4 of 4 • Vault & Review",
    title: "Optionally attach a private PDF resume.",
    description:
      "Your resume stays in owner-only encrypted storage. Review your summary and enter your SkillPilot workspace.",
    illustration: <SkillConstellationIllustration className="h-24 w-24" />,
  },
];

export function OnboardingWizard({ userId, userEmail }: OnboardingWizardProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<number>(1);
  const [skillSearch, setSkillSearch] = useState("");

  const [careerRoles, setCareerRoles] = useState<CareerRole[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<Skill[]>([]);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);

  // Step 1 fields (strictly matching existing DB schema)
  const [fullName, setFullName] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel>("entry");

  // Step 2 fields
  const [targetRoleId, setTargetRoleId] = useState<string>("");
  const [customTargetRole, setCustomTargetRole] = useState<string>("");
  const [selectedSkills, setSelectedSkills] = useState<Record<string, number>>(
    {}
  );

  // Step 3 fields
  const [interestsText, setInterestsText] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState<number>(45);
  const [budgetInr, setBudgetInr] = useState<number>(0);
  const [preferredMethods, setPreferredMethods] = useState<string[]>([
    "Interactive Courses",
    "Hands-on Projects",
  ]);
  const [preferredPace, setPreferredPace] = useState<PreferredPace>("steady");
  const [consentShare, setConsentShare] = useState<boolean>(false);

  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  function handleRetry() {
    setLoading(true);
    setError(null);
    setLoadFailed(false);
    setReloadKey((k) => k + 1);
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOutUser();
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  useEffect(() => {
    let active = true;

    Promise.all([fetchCatalogData(), fetchUserProfileBundle(userId)])
      .then(([catalog, bundle]) => {
        if (!active) return;
        setCareerRoles(catalog.careerRoles);
        setSkillsCatalog(catalog.skills);
        setResumes(bundle.resumes);
        setLoadFailed(false);
        setError(null);

        if (bundle.profile) {
          setFullName(bundle.profile.full_name || "");
          setCurrentRole(bundle.profile.current_job_role || "");
          setIndustry(bundle.profile.industry || "");
          setExperienceLevel(bundle.profile.experience_level || "entry");
          setTargetRoleId(bundle.profile.target_role_id || "");
          setCustomTargetRole(bundle.profile.target_role_name || "");
          setConsentShare(bundle.profile.consent_share_with_manager);
          const resumeStep = Math.min(
            Math.max(bundle.profile.onboarding_step || 1, 1),
            4
          );
          setStep(resumeStep);
        }

        const skillMap: Record<string, number> = {};
        for (const us of bundle.userSkills) {
          skillMap[us.skill_id] = us.proficiency;
        }
        setSelectedSkills(skillMap);

        if (bundle.preferences) {
          setInterestsText(bundle.preferences.interests.join(", "));
          setDailyMinutes(bundle.preferences.daily_minutes);
          setBudgetInr(bundle.preferences.budget_inr);
          setPreferredMethods(bundle.preferences.preferred_methods);
          setPreferredPace(bundle.preferences.preferred_pace);
        }
      })
      .catch((err) => {
        if (!active) return;
        setLoadFailed(true);
        setError(
          err instanceof Error ? err.message : "Failed to load onboarding data."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId, reloadKey]);

  function toggleSkill(skillId: string) {
    setSelectedSkills((prev) => {
      const next = { ...prev };
      if (next[skillId]) {
        delete next[skillId];
      } else {
        next[skillId] = 2;
      }
      return next;
    });
  }

  function updateSkillProficiency(skillId: string, proficiency: number) {
    setSelectedSkills((prev) => ({ ...prev, [skillId]: proficiency }));
  }

  function toggleMethod(method: string) {
    setPreferredMethods((prev) =>
      prev.includes(method)
        ? prev.filter((item) => item !== method)
        : [...prev, method]
    );
  }

  function resolvedTargetRoleName(): string | null {
    const matched = careerRoles.find((r) => r.id === targetRoleId);
    if (matched) return matched.title;
    return customTargetRole.trim() || null;
  }

  async function persistCurrentStep(nextStep: number, markComplete = false) {
    setSaving(true);
    setError(null);
    try {
      if (fullName.trim().length < 2) {
        throw new Error("Full name must be at least 2 characters.");
      }

      await saveProfileInfo(userId, {
        full_name: fullName,
        current_job_role: currentRole,
        industry,
        experience_level: experienceLevel,
        target_role_id: targetRoleId || null,
        target_role_name: resolvedTargetRoleName(),
        onboarding_step: nextStep,
        onboarding_completed: markComplete,
        consent_share_with_manager: consentShare,
      });

      if (step === 2 || markComplete) {
        const skillInputs: SelectedSkillInput[] = Object.entries(
          selectedSkills
        ).map(([skill_id, proficiency]) => ({ skill_id, proficiency }));
        await replaceSelfReportedSkills(userId, skillInputs);
      }

      if (step === 3 || markComplete) {
        const interests = interestsText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        await saveLearningPreferences(userId, {
          interests,
          daily_minutes: dailyMinutes,
          budget_inr: budgetInr,
          preferred_methods: preferredMethods,
          preferred_pace: preferredPace,
        });
      }

      if (markComplete) {
        await logUserActivity(
          userId,
          "onboarding_completed",
          `Completed onboarding targeting ${resolvedTargetRoleName() || "career upskilling"}`
        );
        router.push("/dashboard");
        router.refresh();
      } else {
        setStep(nextStep);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save onboarding step."
      );
    } finally {
      setSaving(false);
    }
  }

  const currentMeta = STEP_META[step - 1] ?? STEP_META[0];
  const filteredSkills = skillsCatalog.filter((skill) => {
    const q = skillSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      skill.name.toLowerCase().includes(q) ||
      skill.category.toLowerCase().includes(q)
    );
  });
  const weeklyHours = ((dailyMinutes * 7) / 60).toFixed(1);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Focused Onboarding Top Header (no dashboard nav clutter) */}
      <header className="border-b border-line bg-surface/90 px-6 py-4 backdrop-blur-sm sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <BrandLogo size="sm" subtitle="Guided Onboarding" />

          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-medium text-muted sm:inline">
              {userEmail}
            </span>
            <StatusLabel tone="in_progress" label={`Step ${step} of 4`} />
            <Button
              variant="ghost"
              size="sm"
              loading={signingOut}
              leftIcon={<LogOut className="h-3.5 w-3.5" />}
              onClick={() => void handleSignOut()}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10 sm:px-10">
        <StepProgress
          currentStep={step}
          steps={[
            "Background",
            "Role & Skills",
            "Pace & Budget",
            "Resume & Finish",
          ]}
        />

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-12">
            <SkeletonCard className="lg:col-span-4" />
            <SkeletonCard className="lg:col-span-8" />
          </div>
        ) : loadFailed ? (
          <Card padding="lg" className="border-[var(--status-attention-border)]">
            <p className="font-editorial text-2xl text-ink">
              Unable to load onboarding profile
            </p>
            <p className="mt-1 text-sm text-muted">{error}</p>
            <div className="mt-5">
              <Button variant="primary" onClick={handleRetry}>
                Retry Loading
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-12">
            {/* Left Expressive Editorial Panel */}
            <div className="lg:col-span-4 lg:sticky lg:top-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <PastelCard
                    tone={currentMeta.tone}
                    eyebrow={currentMeta.eyebrow}
                    title={currentMeta.title}
                    description={currentMeta.description}
                    illustration={currentMeta.illustration}
                    footer={
                      <p className="text-xs font-medium opacity-80">
                        Progress saves after every step so you can resume
                        anytime.
                      </p>
                    }
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Interactive Step Surface */}
            <Card padding="lg" className="lg:col-span-8">
              {error ? (
                <div
                  role="alert"
                  className="mb-6 rounded-xl border border-[var(--status-attention-border)] bg-[var(--status-attention-bg)] px-4 py-3 text-sm text-[var(--status-attention-text)]"
                >
                  {error}
                </div>
              ) : null}

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  {step === 1 ? (
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <h1 className="font-editorial text-3xl text-ink">
                          Professional Background
                        </h1>
                        <p className="text-sm text-muted">
                          Let&apos;s anchor your current role and career stage.
                        </p>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <Input
                          label="Full Name"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Aarav Sharma"
                        />
                        <Input
                          label="Current Job Role"
                          value={currentRole}
                          onChange={(e) => setCurrentRole(e.target.value)}
                          placeholder="Junior Analyst / CS Student"
                        />
                        <Input
                          label="Industry"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          placeholder="FinTech, SaaS, Healthcare..."
                        />
                        <Select
                          label="Experience Level"
                          value={experienceLevel}
                          onChange={(e) =>
                            setExperienceLevel(
                              e.target.value as ExperienceLevel
                            )
                          }
                        >
                          {EXPERIENCE_LEVELS.map((lvl) => (
                            <option key={lvl.value} value={lvl.value}>
                              {lvl.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  ) : null}

                  {step === 2 ? (
                    <div className="space-y-7">
                      <div className="space-y-1">
                        <h1 className="font-editorial text-3xl text-ink">
                          Target Career Role &amp; Current Skills
                        </h1>
                        <p className="text-sm text-muted">
                          Select a destination role and tag skills you already
                          practice. These are recorded as{" "}
                          <strong>self-reported</strong> until assessed.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-ink">
                          Choose a Target Role
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {careerRoles.map((role) => (
                            <OptionCard
                              key={role.id}
                              title={role.title}
                              description={role.description}
                              badge={role.category}
                              accent="pistachio"
                              icon={<Briefcase className="h-4 w-4" />}
                              selected={targetRoleId === role.id}
                              onSelect={() =>
                                setTargetRoleId((prev) =>
                                  prev === role.id ? "" : role.id
                                )
                              }
                            />
                          ))}
                        </div>

                        <Input
                          label="Or enter a custom target role"
                          value={customTargetRole}
                          onChange={(e) => {
                            setCustomTargetRole(e.target.value);
                            if (e.target.value.trim()) setTargetRoleId("");
                          }}
                          placeholder="e.g., AI Product Engineer"
                          hint="Selecting a card above overrides custom role text."
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-ink">
                              Existing Skills ({Object.keys(selectedSkills).length}{" "}
                              selected)
                            </p>
                            <p className="text-xs text-muted">
                              Click chips to toggle, then set proficiency 1–5.
                            </p>
                          </div>

                          <div className="relative w-full sm:w-56">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                            <input
                              type="text"
                              value={skillSearch}
                              onChange={(e) => setSkillSearch(e.target.value)}
                              placeholder="Filter skills..."
                              className="w-full rounded-xl border border-line-strong bg-surface py-1.5 pl-8 pr-3 text-xs text-ink focus:border-forest focus:outline-none"
                            />
                          </div>
                        </div>

                        {Object.keys(selectedSkills).length > 0 ? (
                          <div className="flex flex-wrap gap-2 rounded-2xl border border-line bg-canvas p-4">
                            {Object.entries(selectedSkills).map(([id, lvl]) => {
                              const skill = skillsCatalog.find(
                                (s) => s.id === id
                              );
                              if (!skill) return null;
                              return (
                                <div
                                  key={id}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-2.5 py-1 text-xs"
                                >
                                  <SkillChip
                                    name={skill.name}
                                    level={lvl}
                                    status="self_reported"
                                    onRemove={() => toggleSkill(id)}
                                    className="border-none bg-transparent p-0"
                                  />
                                  <select
                                    aria-label={`${skill.name} proficiency`}
                                    value={lvl}
                                    onChange={(e) =>
                                      updateSkillProficiency(
                                        id,
                                        Number(e.target.value)
                                      )
                                    }
                                    className="rounded-md border border-line bg-canvas px-1.5 py-0.5 text-[11px] font-semibold text-ink"
                                  >
                                    {[1, 2, 3, 4, 5].map((n) => (
                                      <option key={n} value={n}>
                                        L{n}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}

                        <div className="flex max-h-60 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-line bg-surface p-4">
                          {filteredSkills.map((skill) => {
                            const active = selectedSkills[skill.id] !== undefined;
                            return (
                              <SkillChip
                                key={skill.id}
                                name={skill.name}
                                status={active ? "verified" : "self_reported"}
                                level={selectedSkills[skill.id]}
                                onClick={() => toggleSkill(skill.id)}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <h1 className="font-editorial text-3xl text-ink">
                          Availability, INR Budget &amp; Preferences
                        </h1>
                        <p className="text-sm text-muted">
                          Tune how much time and budget you want SkillPilot to
                          plan around.
                        </p>
                      </div>

                      <Input
                        label="Learning Interests"
                        value={interestsText}
                        onChange={(e) => setInterestsText(e.target.value)}
                        placeholder="LLMs, Cloud Architecture, Distributed Systems"
                        hint="Comma-separated topics you're curious to explore."
                      />

                      <div className="grid gap-5 rounded-2xl border border-line bg-canvas p-5 sm:grid-cols-2">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-sm font-semibold text-ink">
                            <label htmlFor="daily-minutes-slider">
                              Daily Availability
                            </label>
                            <span className="text-forest">
                              {dailyMinutes} mins/day (~{weeklyHours} hrs/wk)
                            </span>
                          </div>
                          <input
                            id="daily-minutes-slider"
                            type="range"
                            min={15}
                            max={240}
                            step={15}
                            value={dailyMinutes}
                            onChange={(e) =>
                              setDailyMinutes(Number(e.target.value))
                            }
                            className="w-full accent-[#294C3B] cursor-pointer"
                          />
                          <p className="text-xs text-muted">
                            15 mins to 4 hrs/day (stored as daily minutes).
                          </p>
                        </div>

                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-sm font-semibold text-ink">
                            <label htmlFor="budget-inr-slider">
                              Learning Budget (INR)
                            </label>
                            <span className="text-forest">
                              ₹{budgetInr.toLocaleString("en-IN")} INR
                            </span>
                          </div>
                          <input
                            id="budget-inr-slider"
                            type="range"
                            min={0}
                            max={50000}
                            step={500}
                            value={Math.min(budgetInr, 50000)}
                            onChange={(e) =>
                              setBudgetInr(Number(e.target.value))
                            }
                            className="w-full accent-[#294C3B] cursor-pointer"
                          />
                          <Input
                            type="number"
                            min={0}
                            step={500}
                            value={budgetInr}
                            onChange={(e) =>
                              setBudgetInr(Math.max(0, Number(e.target.value)))
                            }
                            aria-label="Exact budget in INR"
                          />
                        </div>
                      </div>

                      <Select
                        label="Preferred Pace"
                        value={preferredPace}
                        onChange={(e) =>
                          setPreferredPace(e.target.value as PreferredPace)
                        }
                      >
                        <option value="relaxed">Relaxed — steady light sessions</option>
                        <option value="steady">Steady — balanced weekly momentum</option>
                        <option value="intensive">Intensive — accelerated sprint</option>
                      </Select>

                      <div className="space-y-2.5">
                        <p className="text-sm font-semibold text-ink">
                          Preferred Learning Methods
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {LEARNING_METHODS.map((method) => (
                            <OptionCard
                              key={method}
                              title={method}
                              accent="lavender"
                              selected={preferredMethods.includes(method)}
                              onSelect={() => toggleMethod(method)}
                            />
                          ))}
                        </div>
                      </div>

                      <label className="flex items-start gap-3 rounded-2xl border border-line bg-canvas p-4 text-xs leading-relaxed text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentShare}
                          onChange={(e) => setConsentShare(e.target.checked)}
                          className="mt-0.5 accent-[#294C3B]"
                        />
                        <span>
                          Allow my organization&apos;s authorized team manager
                          to view my upskilling progress and skills (applies
                          only if added to an organization team; private PDF
                          resumes remain hidden unless explicitly shared).
                        </span>
                      </label>
                    </div>
                  ) : null}

                  {step === 4 ? (
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <h1 className="font-editorial text-3xl text-ink">
                          Private PDF Resume &amp; Final Review
                        </h1>
                        <p className="text-sm text-muted">
                          Upload an optional synthetic or personal PDF resume,
                          then complete onboarding to enter your workspace.
                        </p>
                      </div>

                      <ResumeManagerCard
                        userId={userId}
                        resumes={resumes}
                        onResumesChanged={setResumes}
                        targetRoleHint={resolvedTargetRoleName()}
                      />

                      <div className="grid gap-4 rounded-2xl border border-line bg-canvas p-5 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                            Learner
                          </p>
                          <p className="mt-1 font-semibold text-ink">
                            {fullName || "Not set"}
                          </p>
                          <p className="text-xs text-muted">
                            {currentRole || "No current role"} •{" "}
                            {industry || "No industry"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                            Target &amp; Rhythm
                          </p>
                          <p className="mt-1 font-semibold text-ink">
                            {resolvedTargetRoleName() || "Not selected"}
                          </p>
                          <p className="text-xs text-muted">
                            {Object.keys(selectedSkills).length} self-reported
                            skills • {dailyMinutes} mins/day • ₹
                            {budgetInr.toLocaleString("en-IN")} INR
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                <Button
                  variant="secondary"
                  disabled={step === 1 || saving}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                >
                  Previous
                </Button>

                {step < 4 ? (
                  <Button
                    variant="primary"
                    loading={saving}
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                    onClick={() => void persistCurrentStep(step + 1, false)}
                  >
                    Save &amp; Continue
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    loading={saving}
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                    onClick={() => void persistCurrentStep(4, true)}
                  >
                    Complete Onboarding
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
