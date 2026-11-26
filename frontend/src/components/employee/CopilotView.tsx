"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, Send, Sparkles } from "lucide-react";

import {
  Button,
  Card,
  EditorialHeading,
  Input,
  PastelCard,
  StatusLabel,
} from "@/components/ui";
import {
  useEmployeeDemo,
  type DemoCopilotMessage,
} from "@/lib/demo/employeeDemoStore";
import {
  fetchBackendHealth,
  fetchMlRecommendationsApi,
  fetchSkillGapApi,
  listMyRoadmapsApi,
} from "@/services/api";
import { getCurrentSessionAccessToken } from "@/services/auth";
import { fetchUserProfileBundle } from "@/services/profile";
import type { RecommendedOpportunityDto, SkillGapResponseDto } from "@/types/api";
import type { LearningPreferences, Profile, UserSkill } from "@/types/database";

interface CopilotViewProps {
  userId: string;
}

const QUICK_PROMPTS = [
  "Which skills should I prioritize this month?",
  "Find free learning options matching my INR budget",
  "Summarize my 30/60/90 roadmap progress",
  "How should I frame an INR sponsorship request?",
];

export function CopilotView({ userId }: CopilotViewProps) {
  const { state: demoState, appendCopilotMessages } = useEmployeeDemo();

  const [input, setInput] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [prefs, setPrefs] = useState<LearningPreferences | null>(null);
  const [gapData, setGapData] = useState<SkillGapResponseDto | null>(null);
  const [mlTopRecs, setMlTopRecs] = useState<RecommendedOpportunityDto[]>([]);
  const [roadmapCount, setRoadmapCount] = useState<number>(0);
  const [backendStatusLabel, setBackendStatusLabel] = useState<string>(
    "Checking FastAPI..."
  );

  useEffect(() => {
    let active = true;

    async function loadContext() {
      const [bundleRes, healthRes, token] = await Promise.all([
        fetchUserProfileBundle(userId).catch(() => null),
        fetchBackendHealth().catch(() => null),
        getCurrentSessionAccessToken().catch(() => null),
      ]);
      if (!active) return;

      if (bundleRes) {
        setProfile(bundleRes.profile);
        setSkills(bundleRes.userSkills);
        setPrefs(bundleRes.preferences);
      }

      if (healthRes) {
        const geminiConfigured = Boolean(
          healthRes.integrations?.gemini?.configured
        );
        setBackendStatusLabel(
          geminiConfigured
            ? "Prototype mode · Sample responses (Live context synced)"
            : "Prototype mode · Sample responses"
        );
      } else {
        setBackendStatusLabel("Prototype mode · Sample data");
      }

      if (token) {
        const [gapRes, mlRes, rmRes] = await Promise.allSettled([
          bundleRes?.profile?.target_role_id
            ? fetchSkillGapApi(bundleRes.profile.target_role_id, token)
            : Promise.reject(new Error("No role")),
          fetchMlRecommendationsApi(token, { limit: 3 }),
          listMyRoadmapsApi(token),
        ]);
        if (!active) return;
        if (gapRes.status === "fulfilled") setGapData(gapRes.value);
        if (mlRes.status === "fulfilled") setMlTopRecs(mlRes.value.recommendations);
        if (rmRes.status === "fulfilled") setRoadmapCount(rmRes.value.length);
      }
    }

    void loadContext();
    return () => {
      active = false;
    };
  }, [userId]);

  function sendDemoPrompt(promptText: string) {
    const trimmed = promptText.trim();
    if (!trimmed) return;

    const targetRole = profile?.target_role_name || "your target role";
    const budgetCap = prefs?.budget_inr ?? demoState.budgetInrSim;
    const missingLabel =
      gapData?.top_missing_skills.slice(0, 3).join(", ") ||
      "core role requirements";
    const topRecLabel = mlTopRecs[0]
      ? `${mlTopRecs[0].title} (${Math.round(mlTopRecs[0].relevance_score * 100)}% ML match)`
      : "Catalog matches";

    const lower = trimmed.toLowerCase();
    let replyText = `Based on your active profile (${targetRole}, ${gapData ? `${Math.round(gapData.overall_readiness_score)}% readiness` : `${skills.length} skills`}), prioritize closing ${missingLabel}. Your strongest catalog match right now is ${topRecLabel}. (Sample assistant guidance)`;
    let suggestedLinks: Array<{ label: string; href: string }> = [
      { label: "Open Skill Constellation", href: "/employee/skills" },
      { label: "Inspect Roadmap", href: "/employee/roadmap" },
    ];

    if (lower.includes("free") || lower.includes("budget") || lower.includes("inr")) {
      replyText = `You have ${demoState.savedOpportunityIds.length} saved opportunities and a simulated budget cap of ₹${demoState.budgetInrSim.toLocaleString("en-IN")} INR (${prefs ? `saved profile budget ₹${prefs.budget_inr.toLocaleString("en-IN")}` : "local preference"}). Filter Explore Opportunities to ₹0–₹${budgetCap.toLocaleString("en-IN")} INR or submit a Sponsorship brief for higher-cost certifications. (Sample assistant guidance)`;
      suggestedLinks = [
        { label: "Filter Explorer by INR", href: "/employee/explore" },
        { label: "Open Sponsorship", href: "/employee/sponsorship" },
      ];
    } else if (lower.includes("sponsor")) {
      replyText = `Tie your sponsorship request directly to a target skill gap for ${targetRole} and include expected project deliverables within 60 days. Your session currently tracks ${demoState.sponsorshipRequests.length} request(s). (Sample assistant guidance)`;
      suggestedLinks = [
        { label: "Draft Sponsorship Request", href: "/employee/sponsorship" },
      ];
    }

    const base = demoState.copilotMessages.length;
    const batch: DemoCopilotMessage[] = [
      {
        id: `u-${base + 1}`,
        role: "user",
        text: trimmed,
      },
      {
        id: `a-${base + 2}`,
        role: "assistant",
        text: replyText,
        toolsUsed: ["demo_profile_snapshot", "demo_budget_check"],
        suggestedLinks,
      },
    ];

    appendCopilotMessages(batch);
    setInput("");
  }

  return (
    <div className="space-y-8">
      <EditorialHeading
        eyebrow="Support • Career Copilot"
        title="Agentic"
        italicAccent="Career Copilot"
        subtitle="Interactive guidance grounded in your current skills, target role benchmarks, and INR budget preferences."
        actions={<StatusLabel tone="neutral" label={backendStatusLabel} />}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Career Context & Prompts Sidebar */}
        <div className="space-y-5 lg:col-span-4 xl:col-span-3">
          <PastelCard
            tone="lavender"
            eyebrow="Grounded Backend Context"
            title={profile?.target_role_name || "Target Role Pending"}
            description={`${gapData ? `${Math.round(gapData.overall_readiness_score)}% readiness` : `${skills.length} skills`} • ₹${(prefs?.budget_inr ?? demoState.budgetInrSim).toLocaleString("en-IN")} INR cap • ${roadmapCount} saved AI roadmap(s).`}
            illustration={<Bot className="h-9 w-9 text-forest" />}
          />

          <Card padding="md" className="space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              Suggested Prompts
            </p>
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendDemoPrompt(q)}
                className="block w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-left text-xs font-semibold text-ink transition hover:border-forest cursor-pointer"
              >
                {q}
              </button>
            ))}
          </Card>
        </div>

        {/* Conversation Thread */}
        <Card padding="lg" className="flex flex-col justify-between lg:col-span-8 xl:col-span-9">
          <div className="max-h-[540px] space-y-4 overflow-y-auto pr-1">
            {demoState.copilotMessages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-2xl border p-4 text-sm ${msg.role === "user"
                  ? "ml-auto max-w-md border-forest bg-forest text-[#FFFDF8]"
                  : "border-line bg-canvas text-ink"
                  }`}
              >
                <p className="leading-relaxed">{msg.text}</p>

                {msg.suggestedLinks && msg.suggestedLinks.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.suggestedLinks.map((act) => (
                      <Link key={act.href} href={act.href}>
                        <Button
                          size="sm"
                          variant="secondary"
                          rightIcon={<ArrowRight className="h-3 w-3" />}
                        >
                          {act.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                ) : null}

                {msg.toolsUsed ? (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-forest" />
                    {msg.toolsUsed.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-line bg-surface px-2 py-0.5 font-mono text-[10px] text-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendDemoPrompt(input);
            }}
            className="mt-5 flex items-end gap-3 border-t border-line pt-4"
          >
            <div className="flex-1">
              <Input
                label="Ask Career Copilot"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about skill gaps, INR budgets, or your next 30-day step..."
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              rightIcon={<Send className="h-3.5 w-3.5" />}
            >
              Send
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
