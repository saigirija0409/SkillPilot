"use client";

import React, { useEffect, useState } from "react";
import { Bell, RefreshCw, RotateCcw, Save, ShieldCheck } from "lucide-react";

import { ResumeManagerCard } from "@/components/resumes/ResumeManagerCard";
import {
  Button,
  Card,
  EditorialHeading,
  Input,
  Select,
  SkeletonCard,
  SkillChip,
  StatusLabel,
} from "@/components/ui";
import { useEmployeeDemo } from "@/lib/demo/employeeDemoStore";
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
  const { state: demoState, updateNotificationPrefs, resetDemoState } =
    useEmployeeDemo();
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
      setSavedNotice("Profile and INR learning preferences saved to Supabase.");
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
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (loadFailed) {
    return (
      <Card padding="lg" className="border-[var(--status-attention-border)]">
        <p className="font-editorial text-2xl text-ink">
          Unable to load profile
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

  return (
    <div className="space-y-8">
      <EditorialHeading
        eyebrow="Account &amp; Preferences"
        title="Profile &"
        italicAccent="Settings"
        subtitle={`Account Role: ${profile?.account_type ?? "learner"} (server-enforced; cannot be escalated from client).`}
        actions={
          <StatusLabel
            tone={profile?.onboarding_completed ? "verified" : "in_progress"}
            label={
              profile?.onboarding_completed
                ? "Onboarding Complete"
                : "Onboarding Incomplete"
            }
          />
        }
      />

      <Card padding="lg">
        <form onSubmit={handleSave} className="space-y-5">
          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-[var(--status-attention-border)] bg-[var(--status-attention-bg)] px-4 py-3 text-xs font-medium text-[var(--status-attention-text)]"
            >
              {error}
            </p>
          ) : null}

          {savedNotice ? (
            <p
              role="status"
              className="rounded-xl border border-[var(--status-verified-border)] bg-[var(--status-verified-bg)] px-4 py-3 text-xs font-medium text-[var(--status-verified-text)]"
            >
              {savedNotice}
            </p>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="Current Job Role"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
            />
            <Input
              label="Industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
            <Select
              label="Target Career Role"
              value={targetRoleId}
              onChange={(e) => setTargetRoleId(e.target.value)}
            >
              <option value="">None selected</option>
              {careerRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
              ))}
            </Select>
            <Input
              label="Daily Learning Time (mins)"
              type="number"
              min={10}
              max={480}
              value={dailyMinutes}
              onChange={(e) => setDailyMinutes(Number(e.target.value))}
            />
            <Input
              label="Learning Budget (INR)"
              type="number"
              min={0}
              step={500}
              value={budgetInr}
              onChange={(e) => setBudgetInr(Number(e.target.value))}
            />
          </div>

          <label className="flex items-center gap-2.5 rounded-xl border border-line bg-canvas p-3.5 text-xs text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={consentShare}
              onChange={(e) => setConsentShare(e.target.checked)}
              className="accent-[#294C3B]"
            />
            Consent to share learning progress and skills with my assigned team
            manager
          </label>

          <div className="pt-1">
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      <Card padding="lg">
        <h2 className="font-editorial text-2xl text-ink">
          Recorded Skills ({userSkills.length})
        </h2>
        <p className="mt-1 text-xs text-muted">
          Self-reported and inferred skills remain distinct from verified
          proficiency.
        </p>

        {userSkills.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            No skills recorded yet. Use Onboarding to add your current skills.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2.5">
            {userSkills.map((item) => (
              <SkillChip
                key={item.id}
                name={item.skills?.name || item.skill_id}
                level={item.proficiency}
                status={item.verification_status}
              />
            ))}
          </div>
        )}
      </Card>

      <ResumeManagerCard
        userId={userId}
        resumes={resumes}
        onResumesChanged={setResumes}
        targetRoleHint={profile?.target_role_name}
        onSkillsSaved={() => setReloadKey((k) => k + 1)}
      />

      {/* Local Notification & Privacy Controls (isolated demo settings, no unsupported DB writes) */}
      <Card padding="lg" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Journal Preferences
            </p>
            <h2 className="flex items-center gap-2 font-editorial text-[24px] sm:text-[28px] text-ink">
              <Bell className="h-5 w-5 text-forest" />
              Notifications &amp; Privacy Controls
            </h2>
          </div>
          <StatusLabel tone="neutral" label="Stored Locally in Browser" />
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <label className="flex items-start gap-3 rounded-xl border border-line bg-canvas p-4 text-[14px] text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={demoState.notificationPrefs.dailyDigest}
              onChange={(e) =>
                updateNotificationPrefs({ dailyDigest: e.target.checked })
              }
              className="mt-0.5 accent-[#294C3B]"
            />
            <span>
              <strong className="block">Daily Journal Digest</strong>
              Gentle summary of open roadmap sprints and new catalog matches.
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-line bg-canvas p-4 text-[14px] text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={demoState.notificationPrefs.streakNudge}
              onChange={(e) =>
                updateNotificationPrefs({ streakNudge: e.target.checked })
              }
              className="mt-0.5 accent-[#294C3B]"
            />
            <span>
              <strong className="block">Weekly Momentum Check-in</strong>
              Reminder when weekly learning pace falls below your simulated cap.
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-line bg-canvas p-4 text-[14px] text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={demoState.notificationPrefs.sponsorshipAlerts}
              onChange={(e) =>
                updateNotificationPrefs({
                  sponsorshipAlerts: e.target.checked,
                })
              }
              className="mt-0.5 accent-[#294C3B]"
            />
            <span>
              <strong className="block">Sponsorship Status Alerts</strong>
              Notify when manager reviews your INR training sponsorship request.
            </span>
          </label>

          <div className="rounded-xl border border-line bg-canvas p-3.5 text-xs space-y-2">
            <span className="flex items-center gap-1.5 font-bold text-ink">
              <ShieldCheck className="h-3.5 w-3.5 text-forest" />
              Skill Passport Visibility
            </span>
            <select
              value={demoState.notificationPrefs.publicPassportMode}
              onChange={(e) =>
                updateNotificationPrefs({
                  publicPassportMode: e.target.value as
                    | "verified_only"
                    | "verified_and_demonstrated",
                })
              }
              className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink"
            >
              <option value="verified_and_demonstrated">
                Show Verified + Demonstrated Evidence
              </option>
              <option value="verified_only">
                Show Verified Credentials Only
              </option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-xs text-muted">
            Your Supabase manager sharing consent above controls real team
            visibility. You can reset demo quests, XP, and preview state anytime.
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={resetDemoState}
          >
            Reset Demo Sandbox
          </Button>
        </div>
      </Card>
    </div>
  );
}
