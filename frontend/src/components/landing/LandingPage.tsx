"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Layers,
  Lock,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import {
  BrandLogo,
  Button,
  Card,
  CompassGrowthIllustration,
  FadeInUp,
  JournalSparkIllustration,
  PastelCard,
  ProgressBar,
  RoadmapRibbonIllustration,
  SectionHeading,
  SkillChip,
  SkillConstellationIllustration,
  StatusLabel,
} from "@/components/ui";

const INTERACTIVE_ROLE_PREVIEWS = [
  {
    id: "ml-engineer",
    title: "ML Engineer",
    readiness: 68,
    weeklyPace: "6 hrs / week • ₹0–₹2,500 INR",
    focusSkills: [
      { name: "Python", level: 4, status: "verified" as const },
      { name: "Scikit-Learn", level: 3, status: "self_reported" as const },
      { name: "Deep Learning", level: 2, status: "inferred" as const },
      { name: "MLOps Serving", status: "gap" as const },
    ],
    samplePlan: [
      "Days 1–30: Build reproducible Scikit-Learn evaluation pipelines",
      "Days 31–60: Fine-tune embeddings & ship FastAPI inference service",
      "Days 61–90: Containerize model API and pass practical assessment",
    ],
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    readiness: 76,
    weeklyPace: "5 hrs / week • ₹0 INR free track",
    focusSkills: [
      { name: "SQL", level: 4, status: "verified" as const },
      { name: "Data Cleaning", level: 3, status: "self_reported" as const },
      { name: "Statistics", level: 2, status: "inferred" as const },
      { name: "BI Modeling", status: "gap" as const },
    ],
    samplePlan: [
      "Days 1–30: Master window functions, CTEs, and cohort SQL queries",
      "Days 31–60: Design executive KPI storyboards with clean visuals",
      "Days 61–90: Complete A/B experiment interpretation challenge",
    ],
  },
  {
    id: "cloud-engineer",
    title: "Cloud Engineer",
    readiness: 54,
    weeklyPace: "7 hrs / week • ₹3,999 INR lab track",
    focusSkills: [
      { name: "Linux & Bash", level: 4, status: "verified" as const },
      { name: "Docker", level: 3, status: "self_reported" as const },
      { name: "CI/CD Pipelines", level: 2, status: "inferred" as const },
      { name: "Terraform IaC", status: "gap" as const },
    ],
    samplePlan: [
      "Days 1–30: Containerize services and automate CI build checks",
      "Days 31–60: Provision reproducible cloud environments with Terraform",
      "Days 61–90: Harden IAM least-privilege roles and pass review",
    ],
  },
];

export function LandingPage() {
  const [activeRoleId, setActiveRoleId] = useState(
    INTERACTIVE_ROLE_PREVIEWS[0].id
  );
  const activeRole =
    INTERACTIVE_ROLE_PREVIEWS.find((r) => r.id === activeRoleId) ??
    INTERACTIVE_ROLE_PREVIEWS[0];

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Top Editorial Navigation */}
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-10">
          <Link href="/" aria-label="SkillPilot home">
            <BrandLogo size="sm" />
          </Link>

          <nav
            aria-label="Landing sections"
            className="hidden items-center gap-7 text-sm font-semibold text-muted md:flex"
          >
            <a href="#how-it-works" className="transition hover:text-ink">
              How it works
            </a>
            <a href="#interactive" className="transition hover:text-ink">
              Interactive preview
            </a>
            <a href="#employee" className="transition hover:text-ink">
              For learners
            </a>
            <a href="#manager" className="transition hover:text-ink">
              For managers
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-14 sm:px-10 sm:pt-20 lg:pb-28">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <FadeInUp className="space-y-7 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-forest">
                <Sparkles className="h-3.5 w-3.5" />
                Career Journal &amp; Workforce Intelligence
              </div>

              <h1 className="font-editorial text-5xl leading-[1.03] tracking-tight text-ink sm:text-6xl lg:text-[68px]">
                Your potential.{" "}
                <span className="italic text-forest">Without limits.</span>
              </h1>

              <p className="max-w-xl text-lg leading-relaxed text-muted">
                SkillPilot turns scattered upskilling into an intentional career
                journal—detecting priority skill gaps, pacing adaptive
                30/60/90-day plans around your week, and giving teams clear,
                consented readiness intelligence.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Link href="/signup">
                  <Button
                    variant="primary"
                    size="lg"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Get Started
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="secondary" size="lg">
                    Sign In
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted">
                <StatusLabel tone="verified" label="Verified vs. Self-Reported Skills" />
                <StatusLabel tone="inferred" label="Private Resume Storage" />
                <StatusLabel tone="in_progress" label="30/60/90 Day Pacing" />
              </div>
            </FadeInUp>

            {/* Animated Interactive Geometric Growth Illustration */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-3xl border border-line bg-surface p-7 shadow-[var(--shadow-elevated)]"
              >
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Growth Trajectory
                  </span>
                  <StatusLabel tone="verified" label="Adaptive Path" />
                </div>

                <div className="my-6 flex justify-center">
                  <svg
                    viewBox="0 0 320 220"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    role="img"
                    aria-label="Animated geometric illustration representing career growth"
                    className="h-52 w-full max-w-[320px]"
                  >
                    <rect
                      x="8"
                      y="10"
                      width="304"
                      height="200"
                      rx="24"
                      fill="#F8F6F0"
                      stroke="#E2DFD5"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M42 164C92 146 130 118 164 88C198 58 232 54 274 44"
                      stroke="#294C3B"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <motion.circle
                      cx="72"
                      cy="152"
                      r="16"
                      fill="#F4C9B4"
                      stroke="#294C3B"
                      strokeWidth="2"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.circle
                      cx="154"
                      cy="96"
                      r="20"
                      fill="#D9E8B5"
                      stroke="#294C3B"
                      strokeWidth="2"
                      animate={{ y: [0, 5, 0] }}
                      transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.circle
                      cx="228"
                      cy="56"
                      r="14"
                      fill="#DDD6F3"
                      stroke="#294C3B"
                      strokeWidth="2"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <circle cx="274" cy="44" r="10" fill="#F9DF91" stroke="#294C3B" strokeWidth="2" />
                    <rect x="34" y="30" width="94" height="28" rx="14" fill="#FFFDF8" stroke="#E2DFD5" />
                    <circle cx="50" cy="44" r="5" fill="#294C3B" />
                    <rect x="62" y="40" width="52" height="8" rx="4" fill="#D9E8B5" />
                  </svg>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-pistachio/50 p-3">
                    <p className="font-editorial text-2xl text-ink">30d</p>
                    <p className="text-[11px] font-semibold text-muted">Foundations</p>
                  </div>
                  <div className="rounded-xl bg-butter/55 p-3">
                    <p className="font-editorial text-2xl text-ink">60d</p>
                    <p className="text-[11px] font-semibold text-muted">Applied Build</p>
                  </div>
                  <div className="rounded-xl bg-lavender/60 p-3">
                    <p className="font-editorial text-2xl text-ink">90d</p>
                    <p className="text-[11px] font-semibold text-muted">Verification</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How SkillPilot Works */}
        <section id="how-it-works" className="border-y border-line bg-surface py-20">
          <div className="mx-auto max-w-6xl space-y-10 px-6 sm:px-10">
            <SectionHeading
              title="How SkillPilot"
              italicWord="works"
              description="Four deliberate steps from honest self-reflection to verified readiness—built around real learning time and INR budgets."
              badge="Workflow"
            />

            <div className="grid gap-6 lg:grid-cols-12">
              <PastelCard
                tone="pistachio"
                eyebrow="01 • Baseline"
                title="Capture your starting line"
                description="Combine your target career role, self-reported proficiency, weekly time, and optional private PDF resume."
                illustration={<JournalSparkIllustration className="h-20 w-20" />}
                className="lg:col-span-4"
              />
              <PastelCard
                tone="butter"
                eyebrow="02 • Diagnose"
                title="See priority gaps clearly"
                description="Deterministic role benchmarking highlights exactly which skills matter most—keeping inferred and verified levels distinct."
                illustration={<CompassGrowthIllustration className="h-20 w-20" />}
                className="lg:col-span-4"
              />
              <PastelCard
                tone="lavender"
                eyebrow="03 • Execute"
                title="Follow a grounded roadmap"
                description="Pace courses, practical challenges, workshops, and mentoring across 30, 60, and 90 days—and reschedule life when needed."
                illustration={<RoadmapRibbonIllustration className="h-20 w-20" />}
                className="lg:col-span-4"
              />
            </div>
          </div>
        </section>

        {/* Interactive Career Development Preview */}
        <section id="interactive" className="mx-auto max-w-6xl space-y-10 px-6 py-20 sm:px-10">
          <SectionHeading
            title="Explore an interactive"
            italicWord="career preview"
            description="Select a sample target role below to see how SkillPilot separates verification states and structures 30/60/90-day focus."
            badge="Interactive Demo"
          />

          <div className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-4">
              {INTERACTIVE_ROLE_PREVIEWS.map((role) => {
                const active = role.id === activeRole.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setActiveRoleId(role.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-5 text-left transition cursor-pointer ${
                      active
                        ? "border-forest bg-forest text-[#FFFDF8] shadow-[var(--shadow-card)]"
                        : "border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-muted/60"
                    }`}
                  >
                    <div>
                      <p className="font-editorial text-2xl leading-tight">
                        {role.title}
                      </p>
                      <p
                        className={`mt-1 text-xs ${
                          active ? "text-pistachio" : "text-muted"
                        }`}
                      >
                        {role.weeklyPace}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </button>
                );
              })}
            </div>

            <Card padding="lg" className="lg:col-span-8">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Illustrative Role Preview
                  </p>
                  <h3 className="mt-1 font-editorial text-3xl text-ink">
                    {activeRole.title}
                  </h3>
                </div>
                <StatusLabel tone="in_progress" label={activeRole.weeklyPace} />
              </div>

              <div className="mt-6 space-y-6">
                <ProgressBar
                  value={activeRole.readiness}
                  label="Sample Baseline Readiness"
                  tone="forest"
                />

                <div className="space-y-2.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    Skill Verification Mix
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeRole.focusSkills.map((skill) => (
                      <SkillChip
                        key={skill.name}
                        name={skill.name}
                        level={skill.level}
                        status={skill.status}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 rounded-2xl border border-line bg-canvas p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-forest">
                    Sample 30 / 60 / 90 Focus
                  </p>
                  <ul className="space-y-2 text-sm text-ink">
                    {activeRole.samplePlan.map((line) => (
                      <li key={line} className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Employee & Manager Experience Previews (Asymmetric Editorial Layout) */}
        <section className="border-t border-line bg-surface py-20">
          <div className="mx-auto max-w-6xl space-y-12 px-6 sm:px-10">
            <div id="employee" className="grid items-center gap-8 lg:grid-cols-12">
              <div className="space-y-5 lg:col-span-6">
                <StatusLabel tone="verified" label="Employee & Learner Portal" />
                <h2 className="font-editorial text-4xl leading-tight text-ink">
                  A learning space that feels like{" "}
                  <span className="italic text-forest">your notebook</span>, not
                  an HR spreadsheet.
                </h2>
                <p className="text-base leading-relaxed text-muted">
                  Dedicated multi-page workspaces for Skill Intelligence,
                  Opportunity Discovery, Adaptive Roadmaps, Practical Challenges,
                  and an honest Skill Passport that separates course effort from
                  verified mastery.
                </p>
                <ul className="space-y-2.5 text-sm text-ink">
                  <li className="flex items-center gap-2.5">
                    <Compass className="h-4 w-4 text-forest" />
                    Private PDF resume vault scoped strictly to your account
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Layers className="h-4 w-4 text-forest" />
                    INR-aware budget and daily availability planning
                  </li>
                </ul>
              </div>

              <PastelCard
                tone="peach"
                eyebrow="Learner Workspace"
                title="10 dedicated destinations"
                description="Overview, Skill Intelligence, Explore Opportunities, My Roadmap, Challenges, Skill Passport, Industry Pulse, AI Copilot, Sponsorship, and Settings."
                illustration={<SkillConstellationIllustration className="h-24 w-24" />}
                className="lg:col-span-6"
              />
            </div>

            <div id="manager" className="grid items-center gap-8 lg:grid-cols-12">
              <PastelCard
                tone="forest"
                eyebrow="Manager Portal"
                title="Consented workforce intelligence"
                description="Workforce Overview, Teams & Employees, Skill Heatmap, Project Readiness, Talent Discovery, Training Planner, Budget Simulator, Sponsorship Requests, and Learning Analytics."
                illustration={<CompassGrowthIllustration className="h-24 w-24" />}
                className="order-2 lg:order-1 lg:col-span-6"
              />

              <div className="order-1 space-y-5 lg:order-2 lg:col-span-6">
                <StatusLabel tone="inferred" label="Manager & Organization Portal" />
                <h2 className="font-editorial text-4xl leading-tight text-ink">
                  Analytical clarity with{" "}
                  <span className="italic text-forest">strict privacy</span>{" "}
                  boundaries.
                </h2>
                <p className="text-base leading-relaxed text-muted">
                  Managers only access authorized organization teams and
                  explicitly consented learner insights—enforced at the database
                  Row Level Security and FastAPI verification layers.
                </p>
                <ul className="space-y-2.5 text-sm text-ink">
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-forest" />
                    Server-verified manager roles (never client-selectable)
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 text-forest" />
                    Team skill coverage and private resumes remain separated
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Lock className="h-4 w-4 text-forest" />
                    Organization boundaries enforced across PostgreSQL &amp; API
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Final Call to Action */}
        <section className="mx-auto max-w-6xl px-6 py-20 sm:px-10">
          <div className="rounded-3xl border border-[#1F3B2D] bg-forest px-8 py-14 text-center text-[#FFFDF8] sm:px-14">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pistachio">
              Start your SkillPilot journal
            </p>
            <h2 className="mx-auto mt-4 max-w-2xl font-editorial text-4xl leading-tight sm:text-5xl">
              Chart your next chapter with{" "}
              <span className="italic text-butter">clarity and momentum.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-pistachio/90 sm:text-base">
              Create your learner account in under a minute, resume onboarding
              across devices, and keep your career records strictly under your
              control.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/signup">
                <Button
                  variant="pastel"
                  size="lg"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Create Free Account
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="secondary"
                  size="lg"
                  className="border-pistachio/40 bg-transparent text-[#FFFDF8] hover:bg-[#365E4A]"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-surface py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center sm:px-10">
          <BrandLogo size="sm" subtitle="Workforce & Career Intelligence" />

          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-muted">
            <Link href="/login" className="hover:text-ink">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-ink">
              Get Started
            </Link>
            <Link href="/design-system" className="hover:text-ink">
              Design System
            </Link>
            <Link href="/status" className="hover:text-ink">
              System Diagnostics
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
