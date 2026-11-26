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
  computeProjectCoverageForSkills,
  HEATMAP_SKILLS,
  useManagerDemo,
  type ManagerCopilotMessage,
} from "@/lib/demo/managerDemoStore";
import { fetchBackendHealth } from "@/services/api";

const MANAGER_SUGGESTED_PROMPTS = [
  "What are our biggest organizational skill gaps?",
  "Which teams need additional cloud training?",
  "How can we allocate ₹20,000 for upskilling?",
  "What competencies are missing for our upcoming AI project?",
  "Which sponsorship requests address our development priorities?",
];

export function ManagerCopilotView() {
  const {
    managerState,
    employees,
    sponsorships,
    remainingTrainingBudgetInr,
    appendCopilotMessages,
  } = useManagerDemo();

  const [input, setInput] = useState("");
  const [backendStatus, setBackendStatus] = useState("Checking FastAPI...");

  useEffect(() => {
    let active = true;
    fetchBackendHealth()
      .then((h) => {
        if (!active) return;
        const geminiConfigured = Boolean(h.integrations?.gemini?.configured);
        setBackendStatus(
          geminiConfigured
            ? "FastAPI Healthy • Agent Execution Pending Phase 5"
            : "FastAPI Healthy • Demo Preview Active"
        );
      })
      .catch(() => {
        if (active) setBackendStatus("Backend Unreachable • Demo Preview Active");
      });
    return () => {
      active = false;
    };
  }, []);

  const orgSkillAverages = HEATMAP_SKILLS.map((sk) => {
    const avg =
      employees.reduce((acc, e) => acc + (e.skills[sk.name] ?? 0), 0) /
      Math.max(1, employees.length);
    return { skill: sk.name, avg: Number(avg.toFixed(1)) };
  }).sort((a, b) => a.avg - b.avg);

  const pendingReqs = sponsorships.filter(
    (s) => s.status === "Pending Review (Demo)"
  );

  function sendPrompt(promptText: string) {
    const trimmed = promptText.trim();
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();
    let reply = `[DEMO PREVIEW] Across ${employees.length} team profiles, priority gaps are ${orgSkillAverages.slice(0, 2).map((s) => `${s.skill} (${s.avg}/5)`).join(" and ")}. Remaining demo budget: ₹${remainingTrainingBudgetInr.toLocaleString("en-IN")} INR.`;
    let actions: Array<{ label: string; href: string }> = [
      { label: "Open Skill Heatmap", href: "/manager/skills" },
      { label: "Budget Simulator", href: "/manager/budget" },
    ];

    if (lower.includes("cloud")) {
      const cloudNeeds = employees
        .filter((e) => (e.skills["Cloud Computing"] ?? 0) < 3)
        .map((e) => `${e.name} (${e.department})`)
        .join(", ");
      reply = `[DEMO PREVIEW] Team members under level 3/5 in Cloud Computing: ${cloudNeeds || "None — baseline met!"}. Schedule the Production Cloud & Container Hardening Lab (₹5,000/seat INR) inside Training Planner.`;
      actions = [
        { label: "Schedule Cloud Cohort", href: "/manager/training" },
        { label: "View Cloud Matrix", href: "/manager/skills" },
      ];
    } else if (lower.includes("20,000") || lower.includes("allocate")) {
      reply = `[DEMO PREVIEW] With ₹20,000 INR: fund 4 seats in Applied Generative AI Workshop (₹18,000 INR) + 0-cost SQL Retention Lab (₹0 INR), targeting your lowest org gaps while keeping ₹2,000 INR reserve.`;
      actions = [
        { label: "Model in Budget Simulator", href: "/manager/budget" },
        { label: "Training Planner", href: "/manager/training" },
      ];
    } else if (lower.includes("ai project") || lower.includes("missing")) {
      const orgAvgMap: Record<string, number> = {};
      orgSkillAverages.forEach((s) => {
        orgAvgMap[s.skill] = s.avg;
      });
      const cov = computeProjectCoverageForSkills(
        orgAvgMap,
        managerState.projectRequirements
      );
      const missing = cov.breakdown
        .filter((b) => b.gap > 0)
        .map((b) => `${b.req.skill} (-${b.gap.toFixed(1)})`)
        .join(", ");
      reply = `[DEMO PREVIEW] For "${managerState.projectName}" (${cov.overallPct}% org readiness), missing/developing requirements are: ${missing || "All thresholds met"}. Top internal matches await in Talent Discovery.`;
      actions = [
        { label: "Open Project Readiness", href: "/manager/projects" },
        { label: "Internal Talent Discovery", href: "/manager/talent" },
      ];
    } else if (lower.includes("sponsorship")) {
      reply = `[DEMO PREVIEW] You have ${pendingReqs.length} pending request(s): ${pendingReqs.map((r) => `${r.title} for ${r.targetSkill} (₹${r.amountInr.toLocaleString("en-IN")} INR)`).join("; ") || "None pending right now"}.`;
      actions = [
        { label: "Review Sponsorship Queue", href: "/manager/sponsorship" },
      ];
    }

    const base = managerState.copilotMessages.length;
    const batch: ManagerCopilotMessage[] = [
      { id: `mu-${base + 1}`, role: "user", text: trimmed },
      { id: `ma-${base + 2}`, role: "assistant", text: reply, actions },
    ];
    appendCopilotMessages(batch);
    setInput("");
  }

  return (
    <div className="space-y-8">
      <EditorialHeading
        eyebrow="Support • Workforce Strategy Assistant"
        title="Manager"
        italicAccent="Copilot"
        subtitle="AI-assisted strategy workspace grounded in your organization's skill heatmap, project weights, and shared INR sponsorship queue. Live Gemini execution arrives in Phase 5."
        actions={<StatusLabel tone="in_progress" label={backendStatus} />}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Organizational Context & Suggested Prompts */}
        <div className="space-y-5 lg:col-span-4">
          <PastelCard
            tone="lavender"
            eyebrow={managerState.organizationDisplayName}
            title={`₹${remainingTrainingBudgetInr.toLocaleString("en-IN")} INR Remaining`}
            description={`Priority gaps: ${orgSkillAverages.slice(0, 2).map((g) => `${g.skill} (${g.avg}/5)`).join(", ")} • ${pendingReqs.length} pending sponsorship(s).`}
            illustration={<Bot className="h-9 w-9 text-forest" />}
          />

          <Card padding="md" className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              Strategy Prompts
            </p>
            {MANAGER_SUGGESTED_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendPrompt(q)}
                className="block w-full rounded-xl border border-line bg-canvas px-3 py-2 text-left text-xs font-semibold text-ink transition hover:border-forest cursor-pointer"
              >
                {q}
              </button>
            ))}
          </Card>
        </div>

        {/* Conversation Thread */}
        <Card padding="lg" className="flex flex-col justify-between lg:col-span-8">
          <div className="max-h-[450px] space-y-4 overflow-y-auto pr-1">
            {managerState.copilotMessages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-2xl border p-4 text-sm ${
                  msg.role === "user"
                    ? "ml-auto max-w-md border-ink bg-ink text-[#FFFDF8]"
                    : "border-line bg-canvas text-ink"
                }`}
              >
                <p className="leading-relaxed">{msg.text}</p>
                {msg.actions && msg.actions.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.actions.map((act) => (
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
                {msg.role === "assistant" ? (
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-mono text-muted">
                    <Sparkles className="h-3 w-3 text-forest" />
                    DEMO_WORKFORCE_CONTEXT
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendPrompt(input);
            }}
            className="mt-5 flex items-end gap-3 border-t border-line pt-4"
          >
            <div className="flex-1">
              <Input
                label="Ask Strategy Copilot ([DEMO] Preview)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about skill gaps, INR budgets, or team training plans..."
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
