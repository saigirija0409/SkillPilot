"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";

import { ResumeManagerCard } from "@/components/resumes/ResumeManagerCard";
import { StatusBadge } from "@/components/status/StatusBadge";
import {
  fetchCatalogData,
  fetchUserProfileBundle,
  saveLearningPreferences,
  saveProfileInfo,
} from "@/services/profile";
import type {
  CareerRole,
  ExperienceLevel,
  PreferredPace,
  Profile,
  ResumeRecord,
  UserSkill,
} from "@/types/database";

interface ProfileEditorProps {
  userId: string;
}

export function ProfileEditor({ userId }: ProfileEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [careerRoles, setCareerRoles] = useState<CareerRole[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);

  const [fullName, setFullName] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel>("entry");
  const [targetRoleId, setTargetRoleId] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState(45);
  const [budgetInr, setBudgetInr] = useState(0);
  const [preferredPace, setPreferredPace] = useState<PreferredPace>("steady");
  const [consentShare, setConsentShare] = useState(false);

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
        setProfile(bundle.profile);
        setUserSkills(bundle.userSkills);
        setResumes(bundle.resumes);
        setLoadFailed(false);
        setError(null);

        if (bundle.profile) {
          setFullName(bundle.profile.full_name || "");
          setCurrentRole(bundle.profile.current_job_role || "");
          setIndustry(bundle.profile.industry || "");
          setExperienceLevel(bundle.profile.experience_level || "entry");
          setTargetRoleId(bundle.profile.target_role_id || "");
          setConsentShare(bundle.profile.consent_share_with_manager);
        }
        if (bundle.preferences) {
          setDailyMinutes(bundle.preferences.daily_minutes);
          setBudgetInr(bundle.preferences.budget_inr);
          setPreferredPace(bundle.preferences.preferred_pace);
        }
      })
      .catch((err) => {
        if (!active) return;
        setLoadFailed(true);
        setError(
          err instanceof Error ? err.message : "Failed to load profile."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId, reloadKey]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSavedNotice(null);

    try {
      const matchedRole = careerRoles.find((r) => r.id === targetRoleId);
      const updated = await saveProfileInfo(userId, {
        full_name: fullName,
        current_job_role: currentRole,
        industry,
        experience_level: experienceLevel,
        target_role_id: targetRoleId || null,
        target_role_name:
          matchedRole?.title || profile?.target_role_name || null,
        onboarding_step: profile?.onboarding_step || 1,
        onboarding_completed: Boolean(profile?.onboarding_completed),
        consent_share_with_manager: consentShare,
      });

      await saveLearningPreferences(userId, {
        interests: [],
        daily_minutes: dailyMinutes,
        budget_inr: budgetInr,
        preferred_methods: [],
        preferred_pace: preferredPace,
      });

      setProfile(updated);
      setSavedNotice("Profile and learning preferences saved to Supabase.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save profile changes."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading profile...
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
        <p className="font-semibold">Unable to load profile</p>
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
      <form
        onSubmit={handleSave}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Your Profile</h1>
            <p className="text-xs text-slate-500">
              Account Role: <strong>{profile?.account_type ?? "learner"}</strong>{" "}
              (managed server-side; cannot be changed by user)
            </p>
          </div>
          <StatusBadge
            tone={profile?.onboarding_completed ? "healthy" : "warning"}
            label={
              profile?.onboarding_completed
                ? "Onboarding Complete"
                : "Onboarding Incomplete"
            }
          />
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {error}
          </p>
        ) : null}

        {savedNotice ? (
          <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            {savedNotice}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Target Career Role
            </label>
            <select
              value={targetRoleId}
              onChange={(e) => setTargetRoleId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">None selected</option>
              {careerRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Daily Learning Time (mins)
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
        </div>

        <label className="mt-4 flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={consentShare}
            onChange={(e) => setConsentShare(e.target.checked)}
          />
          Consent to share learning progress and skills with my assigned team
          manager
        </label>

        <div className="mt-5">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </form>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          Recorded Skills ({userSkills.length})
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Self-reported and inferred skills remain distinct from verified
          proficiency.
        </p>

        {userSkills.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No skills recorded yet. Use Onboarding to add your current skills.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {userSkills.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {item.skills?.name || item.skill_id}
                  </p>
                  <p className="text-slate-500">
                    Proficiency: {item.proficiency}/5
                  </p>
                </div>
                <StatusBadge
                  tone={
                    item.verification_status === "verified"
                      ? "healthy"
                      : "warning"
                  }
                  label={item.verification_status}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <ResumeManagerCard
        userId={userId}
        resumes={resumes}
        onResumesChanged={setResumes}
      />
    </div>
  );
}
