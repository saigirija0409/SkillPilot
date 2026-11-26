"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  HandCoins,
  XCircle,
} from "lucide-react";

import {
  Button,
  Card,
  Drawer,
  EditorialHeading,
  EmptyState,
  Modal,
  PastelCard,
  StatusLabel,
  Textarea,
  useToast,
} from "@/components/ui";
import type { DemoSponsorshipRequest } from "@/lib/demo/employeeDemoStore";
import { useManagerDemo } from "@/lib/demo/managerDemoStore";

type FilterStatus =
  | "All"
  | "Pending Review (Demo)"
  | "Approved (Demo)"
  | "Revision Requested (Demo)";

export function ManagerSponsorshipView() {
  const {
    managerState,
    sponsorships,
    approvedSponsorshipSpentInr,
    remainingTrainingBudgetInr,
    approveSponsorshipRequest,
    rejectSponsorshipRequest,
  } = useManagerDemo();
  const { pushToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<FilterStatus>("All");
  const [selectedReq, setSelectedReq] =
    useState<DemoSponsorshipRequest | null>(null);
  const [managerNote, setManagerNote] = useState("");
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | null
  >(null);

  const visible = sponsorships.filter(
    (s) => statusFilter === "All" || s.status === statusFilter
  );

  function openDetail(req: DemoSponsorshipRequest) {
    setSelectedReq(req);
    setManagerNote(managerState.managerNotesByRequestId[req.id] ?? "");
  }

  function executeConfirmedAction() {
    if (!selectedReq || !confirmAction) return;

    if (confirmAction === "approve") {
      const res = approveSponsorshipRequest(selectedReq.id, managerNote);
      if (!res.ok) {
        pushToast({
          tone: "warning",
          title: "Cannot approve request",
          description: res.error,
        });
        setConfirmAction(null);
        return;
      }
      pushToast({
        tone: "success",
        title: "Sponsorship Approved & Budget Deducted",
        description: `${selectedReq.title} (₹${selectedReq.amountInr.toLocaleString("en-IN")} INR) synced to employee history.`,
      });
    } else {
      rejectSponsorshipRequest(selectedReq.id, managerNote);
      pushToast({
        tone: "info",
        title: "Revision Requested",
        description:
          "Employee sponsorship status updated cleanly in shared demo state.",
      });
    }

    setConfirmAction(null);
    setSelectedReq(null);
  }

  const liveSelectedReq = selectedReq
    ? sponsorships.find((s) => s.id === selectedReq.id) ?? selectedReq
    : null;

  return (
    <div className="space-y-8">
      <EditorialHeading
        eyebrow="Development • Shared Approval Queue"
        title="Sponsorship"
        italicAccent="Requests"
        subtitle="Connected directly to the Employee Portal's sponsorship state. Approvals deduct INR budget safely and guard against duplicate deductions."
        actions={
          <Link href="/manager/budget">
            <Button size="sm" variant="secondary">
              Adjust Total Budget
            </Button>
          </Link>
        }
      />

      {/* Budget Guardrail Banner */}
      <div className="grid gap-5 md:grid-cols-3">
        <PastelCard
          tone="pistachio"
          eyebrow="[DEMO] Total Org Budget"
          title={`₹${managerState.totalTrainingBudgetInr.toLocaleString("en-IN")} INR`}
          description="Configured in Budget Simulator."
        />
        <PastelCard
          tone="peach"
          eyebrow="Approved Deducted"
          title={`₹${approvedSponsorshipSpentInr.toLocaleString("en-IN")} INR`}
          description={`${sponsorships.filter((s) => s.status === "Approved (Demo)").length} request(s) funded cleanly without double counting.`}
        />
        <PastelCard
          tone={remainingTrainingBudgetInr > 0 ? "butter" : "lavender"}
          eyebrow="Available Balance"
          title={`₹${remainingTrainingBudgetInr.toLocaleString("en-IN")} INR`}
          description="Approvals exceeding remaining balance are blocked automatically."
          illustration={<HandCoins className="h-9 w-9 text-forest" />}
        />
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            "All",
            "Pending Review (Demo)",
            "Approved (Demo)",
            "Revision Requested (Demo)",
          ] as const
        ).map((tab) => (
          <Button
            key={tab}
            size="sm"
            variant={statusFilter === tab ? "primary" : "secondary"}
            onClick={() => setStatusFilter(tab)}
          >
            {tab === "All"
              ? `All (${sponsorships.length})`
              : `${tab.replace(" (Demo)", "")} (${sponsorships.filter((s) => s.status === tab).length})`}
          </Button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No requests match this status"
          description="Requests submitted from Employee Portal Sponsorship appear here immediately."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((req) => {
            const insufficientFunds =
              req.status === "Pending Review (Demo)" &&
              req.amountInr > remainingTrainingBudgetInr;
            return (
              <Card
                key={req.id}
                interactive
                className="flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
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
                    <span className="text-sm font-bold text-forest">
                      ₹{req.amountInr.toLocaleString("en-IN")} INR
                    </span>
                  </div>

                  <h2 className="font-editorial text-2xl leading-snug text-ink">
                    {req.title}
                  </h2>
                  <p className="text-xs font-semibold text-muted">
                    Employee: {req.requesterName || "SkillPilot Learner"} •
                    Skill Gap: {req.targetSkill} • {req.submittedAt}
                  </p>
                  <p className="text-xs leading-relaxed text-ink">
                    <strong>Outcome:</strong> {req.expectedOutcomes}
                  </p>
                  <p className="text-xs leading-relaxed text-muted">
                    <strong>Justification:</strong> {req.justification}
                  </p>

                  {insufficientFunds ? (
                    <p className="flex items-center gap-1.5 rounded-xl border border-[#E3B29B] bg-[#F4C9B4]/50 px-3 py-2 text-xs font-semibold text-[#8C371C]">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Exceeds remaining INR balance — increase budget to approve.
                    </p>
                  ) : null}
                </div>

                <div className="border-t border-line pt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => openDetail(req)}
                  >
                    Inspect &amp; Decide
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      <Drawer
        open={Boolean(liveSelectedReq)}
        onClose={() => setSelectedReq(null)}
        title={liveSelectedReq?.title || "Sponsorship Review"}
        description={
          liveSelectedReq
            ? `${liveSelectedReq.requesterName || "Employee"} • ₹${liveSelectedReq.amountInr.toLocaleString("en-IN")} INR`
            : undefined
        }
        footer={
          liveSelectedReq ? (
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <Button variant="ghost" onClick={() => setSelectedReq(null)}>
                Close
              </Button>
              {liveSelectedReq.status !== "Approved (Demo)" ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<XCircle className="h-3.5 w-3.5" />}
                    onClick={() => setConfirmAction("reject")}
                  >
                    Request Revision
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={
                      liveSelectedReq.amountInr > remainingTrainingBudgetInr
                    }
                    leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    onClick={() => setConfirmAction("approve")}
                  >
                    Approve &amp; Deduct INR
                  </Button>
                </div>
              ) : (
                <StatusLabel tone="verified" label="Already Approved & Deducted" />
              )}
            </div>
          ) : null
        }
      >
        {liveSelectedReq ? (
          <div className="space-y-5">
            <PastelCard
              tone={
                liveSelectedReq.status === "Approved (Demo)"
                  ? "pistachio"
                  : "butter"
              }
              eyebrow={liveSelectedReq.status}
              title={`₹${liveSelectedReq.amountInr.toLocaleString("en-IN")} INR`}
              description={`Target gap: ${liveSelectedReq.targetSkill} • Submitted ${liveSelectedReq.submittedAt}`}
            />

            <div className="space-y-2 rounded-xl border border-line bg-canvas p-4 text-xs">
              <p>
                <strong>Expected Outcomes:</strong>{" "}
                {liveSelectedReq.expectedOutcomes}
              </p>
              <p className="text-muted">
                <strong>Justification:</strong> {liveSelectedReq.justification}
              </p>
            </div>

            {liveSelectedReq.status !== "Approved (Demo)" &&
            liveSelectedReq.amountInr > remainingTrainingBudgetInr ? (
              <div className="rounded-xl border border-[var(--status-attention-border)] bg-[var(--status-attention-bg)] p-3 text-xs font-semibold text-[var(--status-attention-text)]">
                Insufficient remaining balance (₹
                {remainingTrainingBudgetInr.toLocaleString("en-IN")} INR
                available). Increase the organization training cap in Budget
                Simulator before approving.
              </div>
            ) : null}

            <Textarea
              label="Manager Decision Notes"
              value={managerNote}
              onChange={(e) => setManagerNote(e.target.value)}
              placeholder="Record approval context, deliverables expected within 60 days, or revision feedback..."
            />
          </div>
        ) : null}
      </Drawer>

      {/* Confirmation Dialog */}
      <Modal
        open={Boolean(confirmAction && liveSelectedReq)}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction === "approve"
            ? "Confirm INR Sponsorship Approval"
            : "Confirm Revision Request"
        }
        description={liveSelectedReq?.title}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={executeConfirmedAction}>
              {confirmAction === "approve"
                ? `Approve & Deduct ₹${liveSelectedReq?.amountInr.toLocaleString("en-IN") ?? 0}`
                : "Send Revision Notice"}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink">
          {confirmAction === "approve"
            ? `Approving updates the employee's sponsorship status in shared demo state and deducts ₹${liveSelectedReq?.amountInr.toLocaleString("en-IN") ?? 0} INR from your remaining ₹${remainingTrainingBudgetInr.toLocaleString("en-IN")} INR balance.`
            : "This updates the request status to Revision Requested (Demo) so the learner sees your manager notes."}
        </p>
      </Modal>
    </div>
  );
}
