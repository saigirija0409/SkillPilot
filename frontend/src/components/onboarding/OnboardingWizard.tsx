"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { ResumeManagerCard } from "@/components/resumes/ResumeManagerCard";
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
  { value: "entry", label: "Entry Level (0-2 yrs)" },
  { value: "mid", label: "Mid Level (2-5 yrs)" },
  { value: "senior", label: "Senior (5+ yrs)" },
  { value: "lead", label: "Lead / Principal" },
];

export function OnboardingWizard({ userId }: OnboardingWizardProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<number>(1);

  const [careerRoles, setCareerRoles] = useState<CareerRole[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<Skill[]>([]);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);

  // Step 1 fields
  const [fullName, setFullName] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel>("entry");

  // Step 2 fields
  const [targetRoleId, setTargetRoleId] = useState<string>("");
  const [customTargetRole, setCustomTargetRole] = useState<string>("");
  const [selectedSkills, setSelectedSkills] = useState<
    Record<string, number>
  >({});

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

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your onboarding profile...
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
        <p className="font-semibold">Unable to load onboarding data</p>
        <p className="mt-1">{error}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-4 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Onboarding Setup
            </h1>
            <p className="text-sm text-slate-600">
              Step {step} of 4 — Your progress is saved to Supabase after each
              step so you can resume anytime.
            </p>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((idx) => (
              <span
                key={idx}
                className={`h-2.5 w-10 rounded-full ${
                  idx <= step ? "bg-indigo-600" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {step === 1 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              1. Professional Background
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Alex Rivera"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Current Role
                </label>
                <input
                  type="text"
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Junior Data Analyst / CS Student"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Industry
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="FinTech, Healthcare, SaaS..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) =>
                    setExperienceLevel(e.target.value as ExperienceLevel)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <option key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                2. Target Career Role &amp; Self-Reported Skills
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Skills added here are marked as <strong>self-reported</strong>{" "}
                until verified through assessments in Phase 4.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Target Career Role
                </label>
                <select
                  value={targetRoleId}
                  onChange={(e) => setTargetRoleId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Select a seeded role (or custom)</option>
                  {careerRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.title} ({role.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Custom Target Role (optional)
                </label>
                <input
                  type="text"
                  value={customTargetRole}
                  onChange={(e) => setCustomTargetRole(e.target.value)}
                  disabled={Boolean(targetRoleId)}
                  placeholder="e.g., AI Product Engineer"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                Select Existing Skills &amp; Self-Reported Proficiency (1–5)
              </p>
              <div className="grid max-h-80 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
                {skillsCatalog.map((skill) => {
                  const prof = selectedSkills[skill.id];
                  const isSelected = prof !== undefined;
                  return (
                    <div
                      key={skill.id}
                      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${
                        isSelected
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <label className="flex cursor-pointer items-center gap-2 font-medium text-slate-800">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSkill(skill.id)}
                        />
                        <span>{skill.name}</span>
                      </label>
                      {isSelected ? (
                        <select
                          value={prof}
                          onChange={(e) =>
                            updateSkillProficiency(
                              skill.id,
                              Number(e.target.value)
                            )
                          }
                          aria-label={`${skill.name} proficiency`}
                          className="rounded border border-indigo-200 bg-white px-2 py-1 text-xs"
                        >
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <option key={lvl} value={lvl}>
                              Lvl {lvl}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              3. Learning Preferences, Time &amp; Budget
            </h2>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Learning Interests (comma-separated)
              </label>
              <input
                type="text"
                value={interestsText}
                onChange={(e) => setInterestsText(e.target.value)}
                placeholder="LLMs, Cloud Architecture, Distributed Systems"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Daily Available Time (mins)
                </label>
                <input
                  type="number"
                  min={10}
                  max={480}
                  value={dailyMinutes}
                  onChange={(e) => setDailyMinutes(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Learning Budget (INR)
                </label>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={budgetInr}
                  onChange={(e) => setBudgetInr(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Preferred Pace
                </label>
                <select
                  value={preferredPace}
                  onChange={(e) =>
                    setPreferredPace(e.target.value as PreferredPace)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="relaxed">Relaxed</option>
                  <option value="steady">Steady</option>
                  <option value="intensive">Intensive</option>
                </select>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                Preferred Learning Methods
              </p>
              <div className="flex flex-wrap gap-2">
                {LEARNING_METHODS.map((method) => {
                  const selected = preferredMethods.includes(method);
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => toggleMethod(method)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        selected
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {method}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={consentShare}
                onChange={(e) => setConsentShare(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Allow my organization&apos;s authorized team manager to view my
                upskilling progress and skills (only applies if you are added to
                an organization team; resumes remain private unless separately
                shared).
              </span>
            </label>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                4. Optional Private Resume Upload &amp; Final Review
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Upload a synthetic or personal PDF resume if desired, then finish
                onboarding to open your SkillPilot dashboard.
              </p>
            </div>

            <ResumeManagerCard
              userId={userId}
              resumes={resumes}
              onResumesChanged={setResumes}
            />

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p>
                <strong>Name:</strong> {fullName}
              </p>
              <p>
                <strong>Target Role:</strong>{" "}
                {resolvedTargetRoleName() || "Not selected yet"}
              </p>
              <p>
                <strong>Self-Reported Skills:</strong>{" "}
                {Object.keys(selectedSkills).length} selected
              </p>
              <p>
                <strong>Availability &amp; Budget:</strong> {dailyMinutes}{" "}
                mins/day • ₹{budgetInr} INR
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={step === 1 || saving}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          {step < 4 ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void persistCurrentStep(step + 1, false)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save &amp; Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => void persistCurrentStep(4, true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Complete Onboarding
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
