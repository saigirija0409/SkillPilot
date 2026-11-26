"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, HandCoins } from "lucide-react";

import {
  Button,
  Card,
  EditorialHeading,
  Input,
  PastelCard,
  Select,
  StatusLabel,
  Textarea,
  useToast,
} from "@/components/ui";
import {
  SUPPLEMENTAL_DEMO_OPPORTUNITIES,
  useEmployeeDemo,
} from "@/lib/demo/employeeDemoStore";
import { fetchAllCatalogOpportunities } from "@/services/profile";
import type { Opportunity } from "@/types/database";

interface SponsorshipViewProps {
  requesterName: string;
}

export function SponsorshipView({ requesterName }: SponsorshipViewProps) {
  const searchParams = useSearchParams();
  const initialOppId = searchParams.get("oppId") ?? "";

  const { state: demoState, submitSponsorshipRequest } = useEmployeeDemo();
  const { pushToast } = useToast();

  const [catalogOpps, setCatalogOpps] = useState<Opportunity[]>(
    SUPPLEMENTAL_DEMO_OPPORTUNITIES
  );
  const [selectedOppId, setSelectedOppId] = useState<string>(initialOppId || "custom");
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("External Training Provider");
  const [targetSkill, setTargetSkill] = useState("SQL");
  const [amountInr, setAmountInr] = useState<number>(3500);
  const [expectedOutcomes, setExpectedOutcomes] = useState("");
  const [justification, setJustification] = useState("");

  useEffect(() => {
    let active = true;
    fetchAllCatalogOpportunities(40)
      .then((data) => {
        if (!active) return;
        const merged = [...data, ...SUPPLEMENTAL_DEMO_OPPORTUNITIES];
        setCatalogOpps(merged);
        if (initialOppId) {
          const found = merged.find((o) => o.id === initialOppId);
          if (found) {
            setSelectedOppId(found.id);
            setTitle(found.title);
            setProvider(found.provider);
            setTargetSkill(found.skill_tags[0] ?? "Role Readiness");
            setAmountInr(found.cost_inr > 0 ? found.cost_inr : 2500);
          }
        }
      })
      .catch(() => {
        // Supplemental items remain selectable
      });

    return () => {
      active = false;
    };
  }, [initialOppId]);

  function handleSelectOpportunity(nextId: string) {
    setSelectedOppId(nextId);
    if (nextId === "custom") return;
    const match = catalogOpps.find((o) => o.id === nextId);
    if (match) {
      setTitle(match.title);
      setProvider(match.provider);
      setTargetSkill(match.skill_tags[0] ?? "Target Competency");
      setAmountInr(match.cost_inr);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    submitSponsorshipRequest({
      opportunityId: selectedOppId !== "custom" ? selectedOppId : undefined,
      title: title.startsWith("[DEMO]") ? title.trim() : `[DEMO] ${title.trim()}`,
      provider: provider.trim() || "Catalog Partner",
      targetSkill: targetSkill.trim() || "Target Role Skill",
      amountInr: Math.max(0, amountInr),
      expectedOutcomes:
        expectedOutcomes.trim() || "Practical competency demonstration",
      justification:
        justification.trim() || "Supports target-role readiness milestone.",
      requesterName,
    });

    pushToast({
      tone: "success",
      title: "Sponsorship Request Submitted (+20 XP)",
      description:
        "Queued in isolated shared demo storage for Manager Portal review.",
    });

    setTitle("");
    setExpectedOutcomes("");
    setJustification("");
    setSelectedOppId("custom");
  }

  return (
    <div className="space-y-8">
      <EditorialHeading
        eyebrow="Support • INR Training Sponsorship"
        title="Learning"
        italicAccent="Sponsorship"
        subtitle="Request team funding in INR for high-impact workshops or certifications. Demo requests persist cleanly across sessions for manager workflow review."
        actions={
          <StatusLabel
            tone="in_progress"
            label="[DEMO] Shared Approval Queue"
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <Card padding="lg" className="lg:col-span-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="font-editorial text-2xl text-ink">
              New Sponsorship Brief
            </h2>

            <Select
              label="Select Catalog Opportunity (or Custom)"
              value={selectedOppId}
              onChange={(e) => handleSelectOpportunity(e.target.value)}
            >
              <option value="custom">Custom Program / Workshop</option>
              {catalogOpps.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opp.title} (
                  {opp.cost_inr === 0
                    ? "Free"
                    : `₹${opp.cost_inr.toLocaleString("en-IN")} INR`}
                  )
                </option>
              ))}
            </Select>

            <Input
              label="Program or Certification Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Production FastAPI & Security Workshop"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Target Skill Addressed"
                required
                value={targetSkill}
                onChange={(e) => setTargetSkill(e.target.value)}
              />
              <Input
                label="Requested Amount (INR)"
                type="number"
                min={0}
                step={250}
                value={amountInr}
                onChange={(e) => setAmountInr(Number(e.target.value))}
              />
            </div>

            <Textarea
              label="Expected Learning Outcomes"
              required
              value={expectedOutcomes}
              onChange={(e) => setExpectedOutcomes(e.target.value)}
              placeholder="What measurable artifact or assessment will you complete?"
            />

            <Textarea
              label="Business Justification"
              required
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="How does this unlock Q1 delivery or reduce a priority team skill gap?"
            />

            <Button type="submit" variant="primary" leftIcon={<CheckCircle2 className="h-4 w-4" />}>
              Submit Demo Sponsorship Request
            </Button>
          </form>
        </Card>

        <div className="space-y-5 lg:col-span-6">
          <PastelCard
            tone="peach"
            eyebrow="Shared Demo Bridge"
            title="Connected to Manager Portal"
            description="Requests submitted here save to isolated demo state so your Manager Portal approval queue can review and approve them without writing to unmigrated production tables."
            illustration={<HandCoins className="h-10 w-10 text-forest" />}
          />

          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-2xl text-ink">
                Request History ({demoState.sponsorshipRequests.length})
              </h3>
              <span className="text-xs font-semibold text-muted">
                Requester: {requesterName}
              </span>
            </div>

            <div className="space-y-3">
              {demoState.sponsorshipRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl border border-line bg-canvas p-4 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-ink">{req.title}</p>
                    <StatusLabel
                      tone={
                        req.status === "Approved (Demo)"
                          ? "verified"
                          : req.status === "Revision Requested (Demo)"
                            ? "attention"
                            : "in_progress"
                      }
                      label={req.status}
                    />
                  </div>
                  <p className="font-semibold text-forest">
                    ₹{req.amountInr.toLocaleString("en-IN")} INR • Skill:{" "}
                    {req.targetSkill} • Submitted {req.submittedAt}
                  </p>
                  <p className="text-muted">
                    <strong>Outcomes:</strong> {req.expectedOutcomes}
                  </p>
                  <p className="text-muted">
                    <strong>Justification:</strong> {req.justification}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
