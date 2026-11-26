"use client";

import React, { useEffect, useState } from "react";
import { Building2, RotateCcw, Save, ShieldCheck } from "lucide-react";

import {
  Button,
  Card,
  EditorialHeading,
  Input,
  PastelCard,
  SkeletonCard,
  StatusLabel,
  useToast,
} from "@/components/ui";
import { useManagerDemo } from "@/lib/demo/managerDemoStore";
import { fetchUserProfileBundle, saveProfileInfo } from "@/services/profile";
import type { Profile } from "@/types/database";

interface ManagerSettingsViewProps {
  userId: string;
}

export function ManagerSettingsView({ userId }: ManagerSettingsViewProps) {
  const {
    managerState,
    updateOrganizationSettings,
    resetManagerDemo,
  } = useManagerDemo();
  const { pushToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [currentJobRole, setCurrentJobRole] = useState("");
  const [industry, setIndustry] = useState("");

  useEffect(() => {
    let active = true;
    fetchUserProfileBundle(userId)
      .then((bundle) => {
        if (!active) return;
        setProfile(bundle.profile);
        if (bundle.profile) {
          setFullName(bundle.profile.full_name || "");
          setCurrentJobRole(bundle.profile.current_job_role || "");
          setIndustry(bundle.profile.industry || "");
        }
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load manager profile."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await saveProfileInfo(userId, {
        full_name: fullName,
        current_job_role: currentJobRole,
        industry,
        experience_level: profile.experience_level ?? "lead",
        target_role_id: profile.target_role_id,
        target_role_name: profile.target_role_name,
        onboarding_step: profile.onboarding_step,
        onboarding_completed: profile.onboarding_completed,
        consent_share_with_manager: profile.consent_share_with_manager,
      });
      setProfile(updated);
      pushToast({
        tone: "success",
        title: "Manager profile saved to Supabase",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save manager profile."
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

  return (
    <div className="space-y-8">
      <EditorialHeading
        eyebrow="Support • Organization & Account Settings"
        title="Manager"
        italicAccent="Settings"
        subtitle="Manage your authenticated Supabase account profile alongside local demonstration organization preferences and privacy policies."
        actions={
          <StatusLabel
            tone="verified"
            label={`Server Role: ${profile?.account_type ?? "manager"}`}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Real Supabase Profile Form */}
        <Card padding="lg" className="lg:col-span-6 space-y-5">
          <h2 className="font-editorial text-2xl text-ink">
            Authenticated Manager Account
          </h2>
          {error ? (
            <p className="rounded-xl border border-[var(--status-attention-border)] bg-[var(--status-attention-bg)] px-4 py-3 text-xs text-[var(--status-attention-text)]">
              {error}
            </p>
          ) : null}

          <form onSubmit={handleSaveAccount} className="space-y-4">
            <Input
              label="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="Role Title"
              value={currentJobRole}
              onChange={(e) => setCurrentJobRole(e.target.value)}
            />
            <Input
              label="Industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
            <div className="rounded-xl border border-line bg-canvas p-3 text-xs text-muted">
              <strong>Authorization Integrity:</strong>{" "}
              <code className="font-mono">account_type</code> and{" "}
              <code className="font-mono">organization_id</code> (
              {profile?.organization_id || "unassigned"}) are enforced in
              Supabase and cannot be altered client-side.
            </div>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save Supabase Account
            </Button>
          </form>
        </Card>

        {/* Demo Organization & Governance Controls */}
        <div className="space-y-5 lg:col-span-6">
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-forest" />
                <h2 className="font-editorial text-2xl text-ink">
                  Organization &amp; Alerts
                </h2>
              </div>
              <StatusLabel tone="neutral" label="Local Session State" />
            </div>

            <Input
              label="Demo Organization Display Name"
              value={managerState.organizationDisplayName}
              onChange={(e) =>
                updateOrganizationSettings({
                  organizationDisplayName: e.target.value,
                })
              }
            />

            <div className="space-y-2.5 pt-1 text-xs">
              <label className="flex items-start gap-2.5 rounded-xl border border-line bg-canvas p-3 text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    managerState.managerNotificationPrefs
                      .sponsorshipSubmittedAlert
                  }
                  onChange={(e) =>
                    updateOrganizationSettings({
                      managerNotificationPrefs: {
                        ...managerState.managerNotificationPrefs,
                        sponsorshipSubmittedAlert: e.target.checked,
                      },
                    })
                  }
                  className="mt-0.5 accent-[#294C3B]"
                />
                <span>
                  <strong className="block">Sponsorship Queue Alerts</strong>
                  Highlight pending INR training requests in sidebar &amp; header.
                </span>
              </label>

              <label className="flex items-start gap-2.5 rounded-xl border border-line bg-canvas p-3 text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    managerState.managerNotificationPrefs
                      .requireTwoStepApproval
                  }
                  onChange={(e) =>
                    updateOrganizationSettings({
                      managerNotificationPrefs: {
                        ...managerState.managerNotificationPrefs,
                        requireTwoStepApproval: e.target.checked,
                      },
                    })
                  }
                  className="mt-0.5 accent-[#294C3B]"
                />
                <span>
                  <strong className="block">
                    Two-Step Sponsorship Confirmation
                  </strong>
                  Require confirmation dialog before deducting INR budget.
                </span>
              </label>
            </div>
          </Card>

          <PastelCard
            tone="lavender"
            eyebrow="Authorized Team Governance"
            title="Privacy-first Manager Boundaries"
            description="Managers only inspect consented team skill metrics. Private resumes and personal AI chat threads remain inaccessible."
            illustration={<ShieldCheck className="h-9 w-9 text-forest" />}
            footer={
              <Button
                type="button"
                size="sm"
                variant="secondary"
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                onClick={() => {
                  resetManagerDemo();
                  pushToast({
                    tone: "info",
                    title: "Manager demo preferences reset",
                  });
                }}
              >
                Reset Manager Demo State
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
