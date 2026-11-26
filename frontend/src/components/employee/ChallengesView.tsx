"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Flame,
  Play,
  Sparkles,
} from "lucide-react";

import {
  Button,
  Card,
  EditorialHeading,
  Modal,
  PastelCard,
  ProgressBar,
  SkillChip,
  StatusLabel,
  Textarea,
  useToast,
} from "@/components/ui";
import {
  SAMPLE_ASSESSMENTS,
  useEmployeeDemo,
  type DemoAssessment,
} from "@/lib/demo/employeeDemoStore";

interface DemoChallenge {
  id: string;
  kind: "Weekly Challenge" | "Practical Project";
  title: string;
  skill: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  minutes: number;
  prompt: string;
}

const DEMO_CHALLENGES: DemoChallenge[] = [
  {
    id: "ch-sql",
    kind: "Weekly Challenge",
    title: "[DEMO] Cohort Retention SQL Window Query",
    skill: "SQL",
    difficulty: "Intermediate",
    minutes: 35,
    prompt:
      "Write a PostgreSQL query using DATE_TRUNC and LAG() to compute month-over-month learner retention without leaking unconsented team rows.",
  },
  {
    id: "ch-ml",
    kind: "Practical Project",
    title: "[DEMO] Hybrid INR Opportunity Ranker",
    skill: "Scikit-Learn",
    difficulty: "Intermediate",
    minutes: 45,
    prompt:
      "Combine cosine skill-tag similarity with deterministic INR budget and weekly capacity filters so out-of-budget courses are never pushed first.",
  },
  {
    id: "ch-sec",
    kind: "Practical Project",
    title: "[DEMO] Asymmetric JWKS Auth Verification Audit",
    skill: "Identity & Access Management",
    difficulty: "Advanced",
    minutes: 40,
    prompt:
      "Inspect a FastAPI bearer token flow and enforce signature, issuer, audience, and database-derived profile permissions.",
  },
];

export function ChallengesView() {
  const {
    state: demoState,
    toggleQuest,
    recordChallengeAttempt,
    submitAssessmentResult,
  } = useEmployeeDemo();
  const { pushToast } = useToast();

  const [difficulty, setDifficulty] = useState<string>("All");
  const [activeChallenge, setActiveChallenge] = useState<DemoChallenge | null>(
    null
  );
  const [submissionNote, setSubmissionNote] = useState("");

  // Interactive Assessment Runner state
  const [activeAssessment, setActiveAssessment] =
    useState<DemoAssessment | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number>
  >({});
  const [submittedAssessment, setSubmittedAssessment] = useState<{
    scorePct: number;
    correctCount: number;
    total: number;
    passed: boolean;
  } | null>(null);

  const visibleChallenges = DEMO_CHALLENGES.filter(
    (c) => difficulty === "All" || c.difficulty === difficulty
  );

  function openAssessment(assessment: DemoAssessment) {
    setActiveAssessment(assessment);
    setQuestionIndex(0);
    setSelectedAnswers({});
    setSubmittedAssessment(null);
  }

  function handleSubmitAssessment() {
    if (!activeAssessment) return;
    const total = activeAssessment.questions.length;
    const correctCount = activeAssessment.questions.reduce((acc, q) => {
      return selectedAnswers[q.id] === q.correctIndex ? acc + 1 : acc;
    }, 0);
    const scorePct = Math.round((correctCount / Math.max(1, total)) * 100);
    const passed = scorePct >= activeAssessment.passingScore;

    submitAssessmentResult(
      activeAssessment.id,
      activeAssessment.skillName,
      scorePct,
      passed,
      activeAssessment.xpReward
    );

    setSubmittedAssessment({ scorePct, correctCount, total, passed });
    pushToast({
      tone: passed ? "success" : "info",
      title: passed
        ? `Assessment Passed (${scorePct}%) — Skill Passport Updated!`
        : `Assessment Completed (${scorePct}%)`,
      description: passed
        ? `Added [DEMO] Demonstrated evidence for ${activeAssessment.skillName}.`
        : `Score 75%+ to unlock Demonstrated Evidence for ${activeAssessment.skillName}.`,
    });
  }

  const currentQuestion =
    activeAssessment?.questions[questionIndex] ?? null;

  return (
    <div className="space-y-9">
      <EditorialHeading
        eyebrow="Development • Practice & Assessments"
        title="Challenges &"
        italicAccent="Skill Checks"
        subtitle="Build momentum with daily quests and practical projects, then test understanding with interactive assessments. XP reflects engagement, never automatic skill verification."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusLabel
              tone="in_progress"
              label={`[DEMO] ${demoState.xp} XP • ${demoState.streakDays}-day streak`}
            />
            <Link href="/employee/passport">
              <Button size="sm" variant="secondary">
                Open Skill Passport
              </Button>
            </Link>
          </div>
        }
      />

      {/* Interactive Sample Assessments */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              [DEMO] Interactive Multi-Choice Checks
            </p>
            <h2 className="font-editorial text-3xl text-ink">
              Sample Skill{" "}
              <span className="italic text-forest">Assessments</span>
            </h2>
          </div>
          <StatusLabel
            tone="inferred"
            label="Unlocks Demonstrated Evidence (Not Verified)"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {SAMPLE_ASSESSMENTS.map((assessment) => {
            const record = demoState.assessmentRecords[assessment.id];
            return (
              <PastelCard
                key={assessment.id}
                tone={record?.passed ? "pistachio" : "lavender"}
                eyebrow={`${assessment.skillName} • ${assessment.questions.length} Questions • ${assessment.durationMinutes} mins`}
                title={assessment.title}
                description={
                  record
                    ? `Latest attempt: ${record.scorePct}% (${record.passed ? "Passed — Demonstrated badge active in Skill Passport" : "Try again to reach 75%"})`
                    : `Pass with ${assessment.passingScore}%+ to unlock [DEMO] Demonstrated evidence on your Skill Passport and +${assessment.xpReward} Engagement XP.`
                }
                illustration={<ClipboardCheck className="h-9 w-9 text-forest" />}
                footer={
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => openAssessment(assessment)}
                  >
                    {record ? "Retake Sample Assessment" : "Start Assessment"}
                  </Button>
                }
              />
            );
          })}
        </div>
      </section>

      {/* Daily Quests Synced With Overview */}
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              [DEMO] Synced With Overview
            </p>
            <h2 className="font-editorial text-2xl text-ink">Daily Quests</h2>
          </div>
          <StatusLabel
            tone="in_progress"
            label={`${demoState.quests.filter((q) => q.completed).length}/${demoState.quests.length} Complete`}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {demoState.quests.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => toggleQuest(q.id)}
              className="flex items-start gap-3 rounded-2xl border border-line bg-canvas p-4 text-left transition hover:border-line-strong cursor-pointer"
            >
              {q.completed ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-forest shrink-0" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 text-muted shrink-0" />
              )}
              <div className="space-y-1">
                <p
                  className={`text-sm font-semibold ${
                    q.completed ? "line-through text-muted" : "text-ink"
                  }`}
                >
                  {q.title}
                </p>
                <p className="text-[11px] font-bold text-forest">
                  +{q.xp} Engagement XP
                </p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Weekly Challenges & Practical Projects */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-editorial text-3xl text-ink">
              Weekly Challenges &amp;{" "}
              <span className="italic text-forest">Practical Projects</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", "Beginner", "Intermediate", "Advanced"].map((lvl) => (
              <Button
                key={lvl}
                size="sm"
                variant={difficulty === lvl ? "primary" : "secondary"}
                onClick={() => setDifficulty(lvl)}
              >
                {lvl}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {visibleChallenges.map((ch) => {
            const done = demoState.completedChallengeIds.includes(ch.id);
            return (
              <Card
                key={ch.id}
                interactive
                className="flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <StatusLabel
                      tone={done ? "verified" : "in_progress"}
                      label={done ? "Submitted (Demo)" : ch.kind}
                    />
                    <span className="text-xs font-semibold text-muted">
                      {ch.difficulty} • {ch.minutes}m
                    </span>
                  </div>

                  <h3 className="font-editorial text-2xl leading-snug text-ink">
                    {ch.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted">
                    {ch.prompt}
                  </p>
                  <SkillChip name={ch.skill} status="self_reported" />
                </div>

                <div className="mt-5 border-t border-line pt-4">
                  <Button
                    size="sm"
                    variant={done ? "pastel" : "primary"}
                    className="w-full"
                    leftIcon={
                      done ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )
                    }
                    onClick={() => {
                      setActiveChallenge(ch);
                      setSubmissionNote(demoState.challengeNotes[ch.id] ?? "");
                    }}
                  >
                    {done ? "Review Demo Attempt" : "Open Challenge Brief"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <PastelCard
        tone="peach"
        eyebrow="Competency Integrity"
        title="Engagement XP vs Verified Proof"
        description="Quests and challenge drafts grow your streak and XP momentum; verified skill levels remain strictly tied to formal evaluation."
        illustration={<Flame className="h-10 w-10 text-forest" />}
      />

      {/* Practical Challenge Modal */}
      <Modal
        open={Boolean(activeChallenge)}
        onClose={() => setActiveChallenge(null)}
        title={activeChallenge?.title || "Challenge Brief"}
        description={`${activeChallenge?.skill ?? ""} • ${activeChallenge?.minutes ?? 0} mins (Demo Submission)`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setActiveChallenge(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!activeChallenge) return;
                recordChallengeAttempt(activeChallenge.id, submissionNote);
                pushToast({
                  tone: "success",
                  title: "Challenge draft logged (+50 Engagement XP)",
                  description: activeChallenge.title,
                });
                setActiveChallenge(null);
              }}
            >
              Record Demo Attempt
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-ink">
            {activeChallenge?.prompt}
          </p>
          <Textarea
            label="Architecture Notes or Solution Draft (Demo)"
            value={submissionNote}
            onChange={(e) => setSubmissionNote(e.target.value)}
            placeholder="Outline your query, constraints, or edge cases..."
          />
        </div>
      </Modal>

      {/* Interactive MCQ Assessment Modal */}
      <Modal
        open={Boolean(activeAssessment)}
        onClose={() => setActiveAssessment(null)}
        title={activeAssessment?.title || "Sample Assessment"}
        description={
          activeAssessment
            ? `${activeAssessment.skillName} • Pass threshold ${activeAssessment.passingScore}%`
            : undefined
        }
        className="max-w-2xl"
      >
        {activeAssessment ? (
          submittedAssessment ? (
            <div className="space-y-5">
              <PastelCard
                tone={submittedAssessment.passed ? "pistachio" : "butter"}
                eyebrow={
                  submittedAssessment.passed
                    ? "Completion Celebration"
                    : "Review & Try Again"
                }
                title={`Score: ${submittedAssessment.scorePct}% (${submittedAssessment.correctCount}/${submittedAssessment.total})`}
                description={
                  submittedAssessment.passed
                    ? `Well done! Demonstrated evidence for ${activeAssessment.skillName} is now visible on your Skill Passport (kept distinct from Verified status).`
                    : `You scored ${submittedAssessment.scorePct}%. Review the explanations below and aim for ${activeAssessment.passingScore}%+ to unlock Demonstrated evidence.`
                }
                illustration={
                  submittedAssessment.passed ? (
                    <Sparkles className="h-9 w-9 text-forest" />
                  ) : (
                    <Award className="h-9 w-9 text-forest" />
                  )
                }
              />

              <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                {activeAssessment.questions.map((q, idx) => {
                  const chosen = selectedAnswers[q.id];
                  const isCorrect = chosen === q.correctIndex;
                  return (
                    <div
                      key={q.id}
                      className="rounded-xl border border-line bg-canvas p-3.5 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-ink">
                          Q{idx + 1}. {q.prompt}
                        </span>
                        <StatusLabel
                          tone={isCorrect ? "verified" : "attention"}
                          label={isCorrect ? "Correct" : "Review"}
                        />
                      </div>
                      <p className="text-muted">
                        <strong>Answer:</strong> {q.options[q.correctIndex]}
                      </p>
                      <p className="text-muted">{q.explanation}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Link href="/employee/passport">
                  <Button variant="secondary" size="sm">
                    Inspect Skill Passport
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveAssessment(null)}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : currentQuestion ? (
            <div className="space-y-5">
              <ProgressBar
                value={questionIndex + 1}
                max={activeAssessment.questions.length}
                label={`Question ${questionIndex + 1} of ${activeAssessment.questions.length}`}
                tone="forest"
              />

              <p className="text-base font-semibold leading-snug text-ink">
                {currentQuestion.prompt}
              </p>

              <div className="space-y-2.5">
                {currentQuestion.options.map((opt, optIdx) => {
                  const chosen = selectedAnswers[currentQuestion.id] === optIdx;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setSelectedAnswers((prev) => ({
                          ...prev,
                          [currentQuestion.id]: optIdx,
                        }))
                      }
                      className={`w-full rounded-xl border p-3.5 text-left text-xs font-semibold transition cursor-pointer ${
                        chosen
                          ? "border-forest bg-[#D9E8B5]/60 text-ink"
                          : "border-line bg-canvas text-ink hover:border-line-strong"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={questionIndex === 0}
                  leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
                  onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))}
                >
                  Previous
                </Button>

                {questionIndex < activeAssessment.questions.length - 1 ? (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={selectedAnswers[currentQuestion.id] === undefined}
                    rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                    onClick={() =>
                      setQuestionIndex((i) =>
                        Math.min(activeAssessment.questions.length - 1, i + 1)
                      )
                    }
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={
                      Object.keys(selectedAnswers).length <
                      activeAssessment.questions.length
                    }
                    onClick={handleSubmitAssessment}
                  >
                    Submit Assessment
                  </Button>
                )}
              </div>
            </div>
          ) : null
        ) : null}
      </Modal>
    </div>
  );
}
