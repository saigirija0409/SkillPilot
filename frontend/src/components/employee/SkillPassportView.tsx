"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Award, CheckCircle2, RefreshCw, ShieldAlert } from "lucide-react";

import {
  Button,
  Card,
  EditorialHeading,
  Modal,
  PastelCard,
  ProgressBar,
  SkeletonCard,
  StatusLabel,
} from "@/components/ui";
import { useEmployeeDemo } from "@/lib/demo/employeeDemoStore";
import { fetchUserProfileBundle } from "@/services/profile";
import type { Profile, UserSkill } from "@/types/database";

interface SkillPassportViewProps {
  userId: string;
}

type BadgeTier = "verified" | "demonstrated" | "self_reported" | "inferred";

interface CollectibleBadge {
  id: string;
  skillName: string;
  category: string;
  proficiency: number;
  tier: BadgeTier;
  assessmentScore?: number;
  projectEvidence: string;
  learningHistory: string;
  seedIndex: number;
}

function GeometricBadgeArt({
  tier,
  seedIndex,
}: {
  tier: BadgeTier;
  seedIndex: number;
}) {
  const palette =
    tier === "verified"
      ? { bg: "#D9E8B5", accent: "#294C3B", ring: "#89AC76" }
      : tier === "demonstrated"
        ? { bg: "#F9DF91", accent: "#294C3B", ring: "#B5891E" }
        : tier === "inferred"
          ? { bg: "#DDD6F3", accent: "#4B3D78", ring: "#8A7AC2" }
          : { bg: "#F4C9B4", accent: "#202622", ring: "#B25432" };

  const rotation = (seedIndex * 37) % 180;

  return (
    <svg
      viewBox="0 0 80 80"
      className="h-16 w-16 shrink-0"
      role="img"
      aria-label="Geometric collectible skill badge"
    >
      <circle
        cx="40"
        cy="40"
        r="36"
        fill={palette.bg}
        stroke={palette.accent}
        strokeWidth="1.5"
      />
      <g transform={`rotate(${rotation} 40 40)`}>
        {seedIndex % 3 === 0 ? (
          <polygon
            points="40,14 63,53 17,53"
            fill="none"
            stroke={palette.accent}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        ) : seedIndex % 3 === 1 ? (
          <rect
            x="21"
            y="21"
            width="38"
            height="38"
            rx="8"
            fill="none"
            stroke={palette.accent}
            strokeWidth="2"
          />
        ) : (
          <polygon
            points="40,13 62,27 62,53 40,67 18,53 18,27"
            fill="none"
            stroke={palette.accent}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}
      </g>
      <circle cx="40" cy="40" r="8" fill="#FFFDF8" stroke={palette.ring} strokeWidth="2" />
    </svg>
  );
}

export function SkillPassportView({ userId }: SkillPassportViewProps) {
  const { state: demoState } = useEmployeeDemo();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [tierFilter, setTierFilter] = useState<"all" | BadgeTier>("all");
  const [selectedBadge, setSelectedBadge] = useState<CollectibleBadge | null>(
    null
  );
  const [reloadKey, setReloadKey] = useState(0);

  function handleRetry() {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }

  useEffect(() => {
    let active = true;
    fetchUserProfileBundle(userId)
      .then((bundle) => {
        if (!active) return;
        setProfile(bundle.profile);
        setSkills(bundle.userSkills);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Unable to load Skill Passport."
        );
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
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <Card padding="lg" className="border-[var(--status-attention-border)]">
        <p className="font-editorial text-2xl text-ink">
          Unable to load Skill Passport
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

  // Build collectible badges cleanly separating Verified, [DEMO] Demonstrated, Self-Reported, Inferred
  const badges: CollectibleBadge[] = skills.map((s, idx) => {
    const skillName = s.skills?.name || "Recorded Skill";
    const demoEvidence = demoState.demoSkillEvidence[skillName];
    const isVerified = s.verification_status === "verified";
    const tier: BadgeTier = isVerified
      ? "verified"
      : demoEvidence
        ? "demonstrated"
        : s.verification_status;

    return {
      id: s.id,
      skillName,
      category: s.skills?.category || "Core",
      proficiency: s.proficiency,
      tier,
      assessmentScore: demoEvidence?.scorePct,
      projectEvidence:
        s.evidence_notes ||
        demoEvidence?.evidenceTitle ||
        "Recorded via self-reported onboarding ledger.",
      learningHistory: demoEvidence
        ? `Passed practical skill check on ${demoEvidence.updatedAt}. Formal verified credential requires supervised evaluation.`
        : isVerified
          ? `Verified ${s.verified_at ? `on ${s.verified_at.slice(0, 10)}` : "credential"}.`
          : "Completing courses builds XP; pass an assessment to earn Demonstrated or Verified proof.",
      seedIndex: idx + 1,
    };
  });

  // Also include Demonstrated [DEMO] evidence for skills the user passed even if not yet in user_skills
  Object.values(demoState.demoSkillEvidence).forEach((ev, idx) => {
    const alreadyExists = badges.some(
      (b) => b.skillName.toLowerCase() === ev.skillName.toLowerCase()
    );
    if (!alreadyExists) {
      badges.unshift({
        id: `demo-ev-${ev.skillName}`,
        skillName: ev.skillName,
        category: "Demo Assessment Proof",
        proficiency: 3,
        tier: "demonstrated",
        assessmentScore: ev.scorePct,
        projectEvidence: ev.evidenceTitle,
        learningHistory: `Passed interactive skill check on ${ev.updatedAt}.`,
        seedIndex: idx + 12,
      });
    }
  });

  const verifiedCount = badges.filter((b) => b.tier === "verified").length;
  const demonstratedCount = badges.filter(
    (b) => b.tier === "demonstrated"
  ).length;
  const selfReportedCount = badges.filter(
    (b) => b.tier === "self_reported" || b.tier === "inferred"
  ).length;

  const visibleBadges = badges.filter(
    (b) => tierFilter === "all" || b.tier === tierFilter
  );

  return (
    <div className="space-y-8">
      <EditorialHeading
        eyebrow="Development • Collectible Credentials"
        title="Collectible"
        italicAccent="Skill Passport"
        subtitle="Inspect self-reported skills, sample assessment demonstrated proof, and formally verified credentials side by side."
        actions={
          <Link href="/employee/challenges">
            <Button variant="primary" size="sm">
              Take Sample Assessment
            </Button>
          </Link>
        }
      />

      {/* Passport Overview & Tier Counts */}
      <div className="grid gap-6 lg:grid-cols-12">
        <PastelCard
          tone="pistachio"
          eyebrow={profile?.target_role_name || "Learner Passport"}
          title={profile?.full_name || "SkillPilot Member"}
          description={`${verifiedCount} verified • ${demonstratedCount} demonstrated via assessment • ${selfReportedCount} self-reported / inferred.`}
          className="lg:col-span-5"
        />

        <Card padding="lg" className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-editorial text-2xl text-ink">
              <CheckCircle2 className="h-5 w-5 text-forest" />
              Credential Integrity Rules
            </h2>
            <StatusLabel tone="verified" label="No Auto-Verification" />
          </div>
          <p className="text-xs leading-relaxed text-muted">
            Completing courses or checking off roadmap items awards engagement
            XP only. Passing interactive checks earns{" "}
            <strong>Demonstrated</strong> evidence, while{" "}
            <strong>Verified</strong> credentials remain strictly governed by
            formal evaluation records.
          </p>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: "all", label: `All Badges (${badges.length})` },
                { key: "verified", label: `Verified (${verifiedCount})` },
                {
                  key: "demonstrated",
                  label: `Demonstrated (${demonstratedCount})`,
                },
                {
                  key: "self_reported",
                  label: `Self-Reported (${selfReportedCount})`,
                },
              ] as const
            ).map((tab) => (
              <Button
                key={tab.key}
                size="sm"
                variant={tierFilter === tab.key ? "primary" : "secondary"}
                onClick={() => setTierFilter(tab.key)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Collectible Badge Gallery */}
      {visibleBadges.length === 0 ? (
        <Card padding="lg">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-muted shrink-0" />
            <div className="space-y-2">
              <p className="font-editorial text-2xl text-ink">
                No badges in this tier yet
              </p>
              <p className="text-xs text-muted">
                Pass a SQL or LLM Evaluation check in Challenges to earn a
                Demonstrated badge, or add baseline skills in Settings.
              </p>
              <Link href="/employee/challenges">
                <Button size="sm" variant="secondary">
                  Go to Challenges &amp; Assessments
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleBadges.map((badge) => (
            <button
              key={badge.id}
              type="button"
              onClick={() => setSelectedBadge(badge)}
              className="text-left cursor-pointer"
            >
              <Card
                interactive
                className="flex h-full flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <GeometricBadgeArt
                    tier={badge.tier}
                    seedIndex={badge.seedIndex}
                  />
                  <div className="space-y-1.5">
                    <StatusLabel
                      tone={
                        badge.tier === "verified"
                          ? "verified"
                          : badge.tier === "demonstrated"
                            ? "in_progress"
                            : badge.tier === "inferred"
                              ? "inferred"
                              : "self_reported"
                      }
                      label={
                        badge.tier === "verified"
                          ? "Verified Credential"
                          : badge.tier === "demonstrated"
                            ? "Demonstrated (Demo)"
                            : badge.tier === "inferred"
                              ? "Inferred"
                              : "Self-Reported"
                      }
                    />
                    <h3 className="font-editorial text-2xl leading-tight text-ink">
                      {badge.skillName}
                    </h3>
                    <p className="text-xs text-muted">{badge.category}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-line pt-3">
                  <ProgressBar
                    value={badge.proficiency}
                    max={5}
                    label={`Proficiency ${badge.proficiency}/5`}
                    tone={badge.tier === "verified" ? "forest" : "pistachio"}
                    size="sm"
                  />
                  <p className="text-xs font-semibold text-forest">
                    Click badge to inspect evidence &amp; history
                  </p>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      {/* Badge Evidence Modal */}
      <Modal
        open={Boolean(selectedBadge)}
        onClose={() => setSelectedBadge(null)}
        title={selectedBadge?.skillName || "Skill Badge Details"}
        description={selectedBadge?.category}
        footer={
          <Button variant="primary" onClick={() => setSelectedBadge(null)}>
            Close
          </Button>
        }
      >
        {selectedBadge ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-2xl border border-line bg-canvas p-4">
              <GeometricBadgeArt
                tier={selectedBadge.tier}
                seedIndex={selectedBadge.seedIndex}
              />
              <div className="space-y-1">
                <StatusLabel
                  tone={
                    selectedBadge.tier === "verified"
                      ? "verified"
                      : selectedBadge.tier === "demonstrated"
                        ? "in_progress"
                        : "self_reported"
                  }
                  label={
                    selectedBadge.tier === "demonstrated"
                      ? "Demonstrated Competency"
                      : selectedBadge.tier.replace("_", " ")
                  }
                />
                <p className="text-sm font-bold text-ink">
                  Proficiency Level {selectedBadge.proficiency} of 5
                </p>
                {selectedBadge.assessmentScore !== undefined ? (
                  <p className="text-xs font-semibold text-forest">
                    Latest Sample Assessment Score:{" "}
                    {selectedBadge.assessmentScore}%
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-muted">
                <Award className="h-3.5 w-3.5 text-forest" />
                Project &amp; Assessment Evidence
              </p>
              <p className="rounded-xl border border-line bg-canvas p-3 leading-relaxed text-ink">
                {selectedBadge.projectEvidence}
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <p className="font-bold uppercase tracking-wider text-muted">
                Verification &amp; Learning History
              </p>
              <p className="leading-relaxed text-muted">
                {selectedBadge.learningHistory}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
