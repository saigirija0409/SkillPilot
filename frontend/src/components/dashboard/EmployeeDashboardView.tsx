"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import { StatusBadge } from "@/components/status/StatusBadge";
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

export function EmployeeDashboardView({ userId }: EmployeeDashboardViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [userId, reloadKey]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your SkillPilot dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
        <p className="font-semibold">Unable to load dashboard data</p>
        <p className="mt-1">{error}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const verifiedCount = userSkills.filter(
    (s) => s.verification_status === "verified"
  ).length;
  const selfReportedCount = userSkills.filter(
    (s) => s.verification_status !== "verified"
  ).length;
  const activeResume = resumes.find((r) => r.is_active) ?? resumes[0] ?? null;

  return (
    <div className="space-y-6">
      {profile && !profile.onboarding_completed ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div>
            <p className="font-semibold text-amber-900">
              Complete your onboarding (Step {profile.onboarding_step} of 4)
            </p>
            <p className="text-sm text-amber-800">
              Finish adding your target role, skills, and learning budget so
              Phase 3 skill-gap analysis can personalize your roadmap.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
          >
            Continue Onboarding
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Target Role
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {profile?.target_role_name || "Not set yet"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Current: {profile?.current_job_role || "Not specified"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Skills Recorded
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {userSkills.length} total
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {verifiedCount} verified • {selfReportedCount} self-reported/inferred
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Private Resume
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {activeResume ? activeResume.file_name : "None uploaded"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {preferences
              ? `${preferences.daily_minutes} mins/day • ₹${preferences.budget_inr} INR budget`
              : "Learning preferences not saved yet"}
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-slate-900">
              FastAPI Token Verification (`/api/v1/auth/me`)
            </h2>
          </div>
          <StatusBadge
            tone={authMe?.authenticated ? "healthy" : "error"}
            label={authMe?.authenticated ? "JWT Verified" : "Verification Error"}
          />
        </div>

        {authMe ? (
          <div className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-700 sm:grid-cols-2">
            <p>
              <strong>User ID:</strong>{" "}
              <code className="font-mono">{authMe.user_id}</code>
            </p>
            <p>
              <strong>Auth Method:</strong> {authMe.auth_method}
            </p>
            <p>
              <strong>Role Claim:</strong> {authMe.jwt_role}
            </p>
            <p>
              <strong>Profile Account Type:</strong>{" "}
              {authMe.profile?.account_type ?? "pending"}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-rose-700">
            {apiAuthError || "Could not verify session with FastAPI."}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            Seeded Catalog Preview (Demonstration Data)
          </h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            Demo Seed Only
          </span>
        </div>

        {opportunitiesError ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{opportunitiesError}</span>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded border border-rose-300 bg-white px-2.5 py-1 font-semibold text-rose-800 hover:bg-rose-100"
            >
              Retry
            </button>
          </div>
        ) : opportunities.length === 0 ? (
          <p className="text-sm text-slate-500">
            No catalog records found yet. Run{" "}
            <code className="font-mono">supabase/seed/0001_seed_data.sql</code>.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900">{opp.title}</p>
                  <span className="shrink-0 rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                    {opp.opportunity_type}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{opp.description}</p>
                <p className="mt-2 text-[11px] text-slate-500">
                  {opp.estimated_hours} hrs •{" "}
                  {opp.cost_inr === 0 ? "Free" : `₹${opp.cost_inr} INR`} • Source:{" "}
                  {opp.source_type}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
