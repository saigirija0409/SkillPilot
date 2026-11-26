"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Compass,
  FolderKanban,
  Layers,
  LayoutDashboard,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import {
  BrandLogo,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CompassGrowthIllustration,
  Drawer,
  EditorialHeading,
  EmptyState,
  FadeInUp,
  Input,
  JournalSparkIllustration,
  Modal,
  OptionCard,
  PastelCard,
  ProgressBar,
  RoadmapRibbonIllustration,
  SectionHeading,
  Select,
  SidebarShell,
  SkeletonCard,
  SkeletonRow,
  SkillChip,
  SkillConstellationIllustration,
  StaggerGroup,
  StaggerItem,
  StatusLabel,
  StepProgress,
  Textarea,
  ToastBanner,
  ToastProvider,
  TopBar,
  useToast,
  type SidebarNavItem,
} from "@/components/ui";

const PALETTE_SWATCHES = [
  { name: "Main Canvas", hex: "#F8F6F0", token: "--bg-canvas", role: "Warm editorial paper background" },
  { name: "Surface", hex: "#FFFDF8", token: "--bg-surface", role: "Cards, modals, and journal sheets" },
  { name: "Forest Green", hex: "#294C3B", token: "--brand-forest", role: "Primary brand, CTAs, active nav", dark: true },
  { name: "Pistachio", hex: "#D9E8B5", token: "--pastel-pistachio", role: "Verified growth & learning highlights" },
  { name: "Butter Yellow", hex: "#F9DF91", token: "--pastel-butter", role: "Milestones & active progress" },
  { name: "Lavender", hex: "#DDD6F3", token: "--pastel-lavender", role: "AI insights & discovery prompts" },
  { name: "Peach", hex: "#F4C9B4", token: "--pastel-peach", role: "Skill gaps & reflection nudges" },
  { name: "Primary Ink", hex: "#202622", token: "--text-primary", role: "Headings and body copy", dark: true },
  { name: "Secondary Text", hex: "#68736C", token: "--text-secondary", role: "Captions, hints, metadata", dark: true },
  { name: "Subtle Border", hex: "#E2DFD5", token: "--border-subtle", role: "1px structural dividers" },
];

const SAMPLE_NAV: SidebarNavItem[] = [
  { label: "Journal Home", href: "#journal", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Skill Atlas", href: "#atlas", icon: <Compass className="h-4 w-4" />, badge: "4 gaps" },
  { label: "30/60/90 Roadmap", href: "#roadmap", icon: <FolderKanban className="h-4 w-4" /> },
  { label: "Team Intelligence", href: "#team", icon: <Users className="h-4 w-4" /> },
];

function ShowcaseInner() {
  const { pushToast } = useToast();

  // Interactive preview states (strictly illustrative; no private user data)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNavHref, setActiveNavHref] = useState("#journal");
  const [selectedTracks, setSelectedTracks] = useState<string[]>(["hands-on"]);
  const [progressValue, setProgressValue] = useState(64);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sampleSkills, setSampleSkills] = useState([
    { id: "py", name: "Python", level: 4, status: "verified" as const },
    { id: "sql", name: "SQL Modeling", level: 3, status: "self_reported" as const },
    { id: "llm", name: "Semantic Embeddings", level: 2, status: "inferred" as const },
    { id: "k8s", name: "Kubernetes", status: "gap" as const },
  ]);

  function toggleTrack(id: string) {
    setSelectedTracks((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="border-b border-line bg-butter/40 px-6 py-2.5 text-center text-xs font-medium text-ink">
        Development-only Design System Preview (<code className="font-mono">/design-system</code>) — Illustrative sample components only; existing auth &amp; backend flows remain untouched.{" "}
        <Link href="/" className="ml-2 font-bold text-forest underline underline-offset-4">
          Return to App Home
        </Link>
      </div>

      <main className="mx-auto max-w-6xl space-y-16 px-6 py-12 sm:px-10 sm:py-16">
        {/* 1. Editorial Hero & Brand Identity */}
        <FadeInUp>
          <EditorialHeading
            eyebrow="SkillPilot Design Language • v1"
            title="Playful professionalism for"
            italicAccent="intentional careers."
            subtitle="An editorial career journal uniting warm paper surfaces, forest-green precision, and tactile pastel moments—crafted for both individual learners and workforce leaders."
            actions={
              <>
                <Button
                  variant="secondary"
                  onClick={() =>
                    pushToast({
                      title: "Journal milestone saved",
                      description: "Your sample 30-day focus block was updated.",
                      tone: "success",
                    })
                  }
                >
                  Trigger Toast
                </Button>
                <Button
                  variant="primary"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  onClick={() => setModalOpen(true)}
                >
                  Inspect Modal
                </Button>
              </>
            }
          />
        </FadeInUp>

        {/* Brand Lockups */}
        <section className="space-y-6">
          <SectionHeading
            title="Brand"
            italicWord="Identity"
            description="Custom geometric compass-path mark paired with expressive Instrument Serif wordmarks."
            badge="Logo & Wordmark"
          />

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="flex items-center justify-between">
              <BrandLogo size="lg" subtitle="Career Journal" />
            </Card>
            <Card className="flex items-center justify-between">
              <BrandLogo size="md" subtitle="Manager Portal" />
            </Card>
            <Card className="flex items-center justify-between bg-forest border-forest text-[#FFFDF8]">
              <div className="flex items-center gap-4">
                <BrandLogo size="md" showWordmark={false} />
                <div>
                  <p className="font-editorial text-2xl text-[#FFFDF8]">
                    Compact <span className="italic text-pistachio">Mark</span>
                  </p>
                  <p className="text-xs text-pistachio/90">Sidebar collapsed state</p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* 2. Colour Palette */}
        <section className="space-y-6">
          <SectionHeading
            title="Colour"
            italicWord="Palette"
            description="Warm cream paper, forest green authority, and four soft pastel accents for visual rhythm without neon glare."
            badge="CSS Tokens"
          />

          <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PALETTE_SWATCHES.map((swatch) => (
              <StaggerItem key={swatch.hex}>
                <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
                  <div
                    className="flex h-24 items-end justify-between p-3"
                    style={{ backgroundColor: swatch.hex }}
                  >
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${
                        swatch.dark
                          ? "bg-surface/90 text-ink"
                          : "bg-ink/8 text-ink"
                      }`}
                    >
                      {swatch.hex}
                    </span>
                  </div>
                  <div className="space-y-1 p-4">
                    <p className="text-sm font-bold text-ink">{swatch.name}</p>
                    <p className="font-mono text-[11px] text-forest">{swatch.token}</p>
                    <p className="text-xs leading-snug text-muted">{swatch.role}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        {/* 3. Typography */}
        <section className="space-y-6">
          <SectionHeading
            title="Editorial"
            italicWord="Typography"
            description="Instrument Serif brings warmth and reflection to headings; Manrope keeps forms, labels, and tables crisp."
            badge="Instrument Serif + Manrope"
          />

          <div className="grid gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-7 space-y-5" padding="lg">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Display &amp; Section Scale
              </p>
              <div className="space-y-4">
                <p className="font-editorial text-4xl leading-[1.08] text-ink sm:text-5xl">
                  Bridge the gap between <span className="italic text-forest">curiosity</span> and mastery.
                </p>
                <p className="font-editorial text-3xl leading-tight text-ink">
                  Your 90-day learning journal, thoughtfully paced.
                </p>
                <p className="font-editorial text-2xl text-ink">
                  Section Heading — <span className="italic">Refined emphasis</span>
                </p>
              </div>
            </Card>

            <Card className="lg:col-span-5 space-y-4" padding="lg">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Body &amp; Microcopy (Manrope)
              </p>
              <p className="text-base leading-relaxed text-ink">
                SkillPilot pairs deterministic skill-gap scoring with adaptive weekly blocks so every hour spent learning moves you visibly closer to your target role.
              </p>
              <p className="text-sm leading-relaxed text-muted">
                Secondary metadata: 45 mins/day • Budget ₹2,500 INR • Self-reported proficiency remains distinct from verified assessment credentials.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <StatusLabel tone="verified" label="Verified Proficiency" />
                <StatusLabel tone="inferred" label="AI Inferred" />
                <StatusLabel tone="in_progress" label="Active Sprint" />
                <StatusLabel tone="self_reported" label="Self-Reported" />
                <StatusLabel tone="attention" label="Priority Gap" />
              </div>
            </Card>
          </div>
        </section>

        {/* 4. Asymmetric Editorial Pastel Cards + Geometric Illustrations */}
        <section className="space-y-6">
          <SectionHeading
            title="Pastel Feature"
            italicWord="Surfaces"
            description="Asymmetrical editorial blocks combining soft pastel surfaces with organic geometric SVG illustrations."
            badge="Cards & Illustrations"
          />

          <div className="grid gap-6 lg:grid-cols-12">
            <PastelCard
              tone="pistachio"
              eyebrow="Skill Readiness"
              title="Close high-leverage gaps first"
              description="Compare verified and self-reported capabilities against role benchmarks without noisy corporate clutter."
              illustration={<CompassGrowthIllustration />}
              className="lg:col-span-7"
              footer={
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  Explore Role Map
                </Button>
              }
            />

            <PastelCard
              tone="butter"
              eyebrow="Daily Rhythm"
              title="30 / 60 / 90 day cadence"
              description="Adaptable study blocks grounded in real catalog workshops, open-source sprints, and mentoring."
              illustration={<RoadmapRibbonIllustration />}
              className="lg:col-span-5"
            />

            <PastelCard
              tone="lavender"
              eyebrow="Agentic Copilot"
              title="Explainable opportunity matching"
              description="Semantic similarity paired with time, budget, and deadline reasoning—never black-box suggestions."
              illustration={<SkillConstellationIllustration />}
              className="lg:col-span-5"
            />

            <PastelCard
              tone="peach"
              eyebrow="Skill Passport"
              title="Honest proof of growth"
              description="Course completion logs your effort; practical assessments earn verified proficiency badges."
              illustration={<JournalSparkIllustration />}
              className="lg:col-span-7"
              footer={
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setDrawerOpen(true)}>
                    Open Detail Drawer
                  </Button>
                </div>
              }
            />
          </div>
        </section>

        {/* 5. Buttons, Progress & Skill Chips */}
        <section className="space-y-6">
          <SectionHeading
            title="Interactive"
            italicWord="Controls"
            description="Tactile buttons, animated progress indicators, and verification-aware skill chips."
            badge="Buttons, Progress & Chips"
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Button Hierarchy</CardTitle>
                <CardDescription>
                  Clear visual weight across Primary, Secondary, Pastel, and Ghost actions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">Primary Action</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="pastel">Pastel Highlight</Button>
                  <Button variant="ghost">Ghost Link</Button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm" leftIcon={<Sparkles className="h-3.5 w-3.5" />}>
                    Small Button
                  </Button>
                  <Button size="md" loading>
                    Saving Plan
                  </Button>
                  <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Large CTA
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skill Chips &amp; Progress</CardTitle>
                <CardDescription>
                  Click the sample slider controls or remove chips to test live transitions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ProgressBar
                  value={progressValue}
                  label="Career Readiness Snapshot (Sample)"
                  tone="forest"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setProgressValue((v) => Math.max(15, v - 15))}
                  >
                    -15%
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setProgressValue((v) => Math.min(100, v + 15))}
                  >
                    +15%
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {sampleSkills.map((skill) => (
                    <SkillChip
                      key={skill.id}
                      name={skill.name}
                      level={skill.level}
                      status={skill.status}
                      onRemove={() =>
                        setSampleSkills((prev) =>
                          prev.filter((item) => item.id !== skill.id)
                        )
                      }
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Multi-Step Journey Indicator</CardTitle>
            </CardHeader>
            <CardContent>
              <StepProgress
                currentStep={2}
                steps={[
                  "Professional Profile",
                  "Target Role & Skills",
                  "Time & INR Budget",
                  "Private PDF Resume",
                ]}
              />
            </CardContent>
          </Card>
        </section>

        {/* 6. Forms & Selectable Option Cards */}
        <section className="space-y-6">
          <SectionHeading
            title="Forms &"
            italicWord="Choices"
            description="Readable inputs with validation states alongside tactile selectable option cards."
            badge="Inputs & Option Cards"
          />

          <div className="grid gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-6">
              <CardHeader>
                <CardTitle>Form Controls</CardTitle>
                <CardDescription>
                  Designed for calm, accessible onboarding and profile editing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Target Career Role"
                  defaultValue="Machine Learning Engineer"
                  hint="Used to benchmark required skill levels."
                />
                <Select label="Experience Level" defaultValue="mid">
                  <option value="student">Student</option>
                  <option value="entry">Entry Level (0–2 yrs)</option>
                  <option value="mid">Mid Level (2–5 yrs)</option>
                  <option value="senior">Senior (5+ yrs)</option>
                </Select>
                <Input
                  label="Monthly Budget (INR)"
                  type="number"
                  defaultValue="-100"
                  error="Learning budget cannot be negative."
                />
                <Textarea
                  label="Career Reflection Note"
                  placeholder="What kind of practical project excites you most this quarter?"
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-6">
              <CardHeader>
                <CardTitle>Selectable Option Cards</CardTitle>
                <CardDescription>
                  Keyboard-accessible selection cards for onboarding preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <OptionCard
                  title="Hands-on Applied Projects"
                  description="Build portfolio-ready artifacts using real datasets and code reviews."
                  badge="Recommended"
                  accent="pistachio"
                  icon={<Target className="h-4 w-4" />}
                  selected={selectedTracks.includes("hands-on")}
                  onSelect={() => toggleTrack("hands-on")}
                />
                <OptionCard
                  title="Structured Courses & Labs"
                  description="Guided conceptual modules with checkpoints and practice quizzes."
                  accent="forest"
                  icon={<BookOpen className="h-4 w-4" />}
                  selected={selectedTracks.includes("courses")}
                  onSelect={() => toggleTrack("courses")}
                />
                <OptionCard
                  title="Peer Workshops & Mentoring"
                  description="Live cohort feedback sessions and architecture critiques."
                  accent="lavender"
                  icon={<Award className="h-4 w-4" />}
                  selected={selectedTracks.includes("mentoring")}
                  onSelect={() => toggleTrack("mentoring")}
                />
              </CardContent>
              <CardFooter>
                <span className="text-xs text-muted">
                  Selected: {selectedTracks.length} learning mode(s)
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedTracks(["hands-on"])}
                >
                  Reset Selection
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* 7. Navigation Shell Foundation */}
        <section className="space-y-6">
          <SectionHeading
            title="Workspace"
            italicWord="Chrome"
            description="Collapsible sidebar and spacious top bar foundation ready for Employee and Manager portals."
            badge="Sidebar & TopBar"
          />

          <div className="overflow-hidden rounded-2xl border border-line bg-canvas shadow-[var(--shadow-card)]">
            <div className="flex min-h-[380px]">
              <SidebarShell
                items={SAMPLE_NAV.map((item) => ({ ...item, href: item.href }))}
                activeHref={activeNavHref}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
                mobileOpen={mobileMenuOpen}
                onCloseMobile={() => setMobileMenuOpen(false)}
                portalLabel="Journal Preview"
                footer={
                  <p className="px-2 text-xs text-muted">
                    {sidebarCollapsed ? "SP" : "Press collapse icon to test width"}
                  </p>
                }
              />

              <div className="flex flex-1 flex-col">
                <TopBar
                  title="Employee Learning Journal"
                  subtitle="Interactive sidebar & topbar preview"
                  onOpenMobileMenu={() => setMobileMenuOpen(true)}
                  rightSlot={
                    <>
                      <StatusLabel tone="verified" label="Portal Ready" />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSidebarCollapsed((c) => !c)}
                      >
                        <Layers className="h-3.5 w-3.5" />
                        {sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                      </Button>
                    </>
                  }
                />

                <div className="flex-1 p-6 space-y-4">
                  <p className="text-sm text-muted">
                    Click any sidebar item or toggle collapse to test the responsive navigation shell:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_NAV.map((item) => (
                      <Button
                        key={item.href}
                        size="sm"
                        variant={activeNavHref === item.href ? "primary" : "secondary"}
                        onClick={() => setActiveNavHref(item.href)}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. States: Skeletons, Empty State & Inline Toasts */}
        <section className="space-y-6">
          <SectionHeading
            title="Feedback,"
            italicWord="Loading & Empty"
            description="Calm loading skeletons, thoughtful empty states, and dismissible notifications."
            badge="Skeletons, Empty & Toasts"
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonRow />
            </div>

            <div className="space-y-4">
              <EmptyState
                title="No learning roadmap generated yet"
                description="Once you confirm your skills and target role, SkillPilot builds an adaptive 30/60/90-day plan tailored to your daily minutes and INR budget."
                illustration={<CompassGrowthIllustration className="h-20 w-20" />}
                action={
                  <Button size="sm" onClick={() => setDrawerOpen(true)}>
                    Preview Action Drawer
                  </Button>
                }
              />
              <ToastBanner
                tone="info"
                title="Sample notification banner"
                description="Subtle, high-contrast feedback with Escape/dismiss support."
              />
            </div>
          </div>
        </section>
      </main>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirm Roadmap Adjustment"
        description="Modals support Escape-key dismissal, backdrop click, and calm paper contrast."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setModalOpen(false);
                pushToast({
                  title: "Modal action confirmed",
                  description: "Toast notification triggered cleanly.",
                  tone: "success",
                });
              }}
            >
              Confirm &amp; Notify
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          When rescheduling an incomplete activity in Phase 4, SkillPilot preserves all completed progress and keeps course completion separate from verified skill proficiency.
        </p>
      </Modal>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Opportunity Match Breakdown"
        description="Slide-over drawer for explainable skill recommendations."
        footer={
          <Button variant="primary" onClick={() => setDrawerOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="space-y-4">
          <PastelCard
            tone="pistachio"
            eyebrow="Sample Explanation"
            title="High relevance to ML Engineer"
            description="Covers 2 missing priority skills within your 45 mins/day availability and ₹0 INR free tier."
          />
          <ProgressBar value={88} label="Sample Match Score" tone="pistachio" />
        </div>
      </Drawer>
    </div>
  );
}

export function DesignSystemShowcase() {
  return (
    <ToastProvider>
      <ShowcaseInner />
    </ToastProvider>
  );
}
