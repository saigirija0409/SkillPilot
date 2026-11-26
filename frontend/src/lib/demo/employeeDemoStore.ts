"use client";

import { useSyncExternalStore } from "react";

import type { Opportunity } from "@/types/database";

export const EMPLOYEE_DEMO_STORAGE_KEY = "skillpilot_employee_demo_v1";
export const SHARED_SPONSORSHIP_STORAGE_KEY = "skillpilot_shared_sponsorship_v1";

export interface DemoQuest {
  id: string;
  title: string;
  subtitle: string;
  xp: number;
  href: string;
  completed: boolean;
}

export interface DemoRoadmapItem {
  id: string;
  bucket: 30 | 60 | 90;
  title: string;
  type: string;
  category: string;
  estimatedHours: number;
  costInr: number;
  scheduledDate: string;
  prerequisiteTitle?: string;
  notes: string;
  completed: boolean;
  sourceOpportunityId?: string;
}

export interface DemoAssessmentQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface DemoAssessment {
  id: string;
  title: string;
  skillName: string;
  durationMinutes: number;
  passingScore: number;
  xpReward: number;
  questions: DemoAssessmentQuestion[];
}

export interface DemoAssessmentRecord {
  assessmentId: string;
  skillName: string;
  scorePct: number;
  passed: boolean;
  completedAt: string;
  xpEarned: number;
}

export interface DemoSkillEvidenceRecord {
  skillName: string;
  status: "demonstrated";
  scorePct: number;
  evidenceTitle: string;
  updatedAt: string;
}

export interface DemoSponsorshipRequest {
  id: string;
  opportunityId?: string;
  title: string;
  provider: string;
  targetSkill: string;
  amountInr: number;
  expectedOutcomes: string;
  justification: string;
  status: "Pending Review (Demo)" | "Approved (Demo)" | "Revision Requested (Demo)";
  submittedAt: string;
  requesterName?: string;
}

export interface DemoCopilotMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  toolsUsed?: string[];
  suggestedLinks?: Array<{ label: string; href: string }>;
}

export interface DemoNotificationPrefs {
  dailyDigest: boolean;
  streakNudge: boolean;
  sponsorshipAlerts: boolean;
  publicPassportMode: "verified_only" | "verified_and_demonstrated";
}

export interface EmployeeDemoState {
  xp: number;
  streakDays: number;
  quests: DemoQuest[];
  savedOpportunityIds: string[];
  roadmapItems: DemoRoadmapItem[];
  weeklyHoursSim: number;
  budgetInrSim: number;
  completedChallengeIds: string[];
  challengeNotes: Record<string, string>;
  assessmentRecords: Record<string, DemoAssessmentRecord>;
  demoSkillEvidence: Record<string, DemoSkillEvidenceRecord>;
  savedArticleIds: string[];
  copilotMessages: DemoCopilotMessage[];
  sponsorshipRequests: DemoSponsorshipRequest[];
  notificationPrefs: DemoNotificationPrefs;
}

export const INITIAL_DEMO_QUESTS: DemoQuest[] = [
  {
    id: "q-constellation",
    title: "Inspect top skill gap in Constellation",
    subtitle: "Compare your recorded skills against target benchmarks",
    xp: 25,
    href: "/employee/skills",
    completed: false,
  },
  {
    id: "q-explore",
    title: "Bookmark an INR-matched opportunity",
    subtitle: "Save a course, workshop, or sprint under your budget",
    xp: 30,
    href: "/employee/explore",
    completed: false,
  },
  {
    id: "q-assessment",
    title: "Complete the SQL & Retention Knowledge Check",
    subtitle: "Build demonstrated evidence without modifying verified state",
    xp: 75,
    href: "/employee/challenges",
    completed: false,
  },
];

export const INITIAL_DEMO_ROADMAP: DemoRoadmapItem[] = [
  {
    id: "rm-1",
    bucket: 30,
    title: "SQL Analytics & Window Functions Lab",
    type: "Course",
    category: "Data & Analytics",
    estimatedHours: 6,
    costInr: 0,
    scheduledDate: "2026-12-02",
    notes: "Master CTEs, window partitions, and retention cohort queries.",
    completed: true,
  },
  {
    id: "rm-2",
    bucket: 30,
    title: "Statistics & Experiment Design Workshop",
    type: "Workshop",
    category: "Data & Analytics",
    estimatedHours: 8,
    costInr: 1500,
    scheduledDate: "2026-12-10",
    prerequisiteTitle: "SQL Analytics & Window Functions Lab",
    notes: "Hypothesis testing, p-values, and uplift intervals in Python.",
    completed: false,
  },
  {
    id: "rm-3",
    bucket: 60,
    title: "Applied Scikit-Learn Pipelines & Evaluation",
    type: "Build Sprint",
    category: "AI & ML",
    estimatedHours: 12,
    costInr: 2499,
    scheduledDate: "2027-01-06",
    prerequisiteTitle: "Statistics & Experiment Design Workshop",
    notes: "Cross-validation pipelines, leakage prevention, and calibration curves.",
    completed: false,
  },
  {
    id: "rm-4",
    bucket: 60,
    title: "FastAPI & Docker Container Reliability Lab",
    type: "Internal Workshop",
    category: "Engineering",
    estimatedHours: 7,
    costInr: 0,
    scheduledDate: "2027-01-18",
    notes: "Async endpoints, schema validation, and clean service healthchecks.",
    completed: false,
  },
  {
    id: "rm-5",
    bucket: 90,
    title: "Agentic RAG & Evaluation Capstone Hackathon",
    type: "Hackathon",
    category: "AI & ML",
    estimatedHours: 16,
    costInr: 3500,
    scheduledDate: "2027-02-08",
    prerequisiteTitle: "Applied Scikit-Learn Pipelines & Evaluation",
    notes: "Build an evaluation harness and retrieval assistant workflow.",
    completed: false,
  },
];

export const INITIAL_SPONSORSHIP_REQUESTS: DemoSponsorshipRequest[] = [
  {
    id: "sr-demo-1",
    title: "Cloud Containers & IaC Certification Lab",
    provider: "SkillPilot Partner Catalog",
    targetSkill: "Docker & Containers",
    amountInr: 3999,
    expectedOutcomes:
      "Production container hardening & CI deployment proficiency.",
    justification:
      "Closes an intermediate infrastructure gap ahead of Q1 microservices migration.",
    status: "Pending Review (Demo)",
    submittedAt: "2026-11-24",
    requesterName: "Ananya Rao",
  },
];

export const INITIAL_COPILOT_MESSAGES: DemoCopilotMessage[] = [
  {
    id: "cp-welcome",
    role: "assistant",
    text: "Hello! I'm your Career Copilot preview. I combine your live profile, skill-gap analysis, and ML-ranked opportunities to help plan your next learning steps.",
    toolsUsed: ["profile_context", "inr_budget_matcher"],
    suggestedLinks: [
      { label: "Inspect Skill Constellation", href: "/employee/skills" },
      { label: "Open Explorer", href: "/employee/explore" },
    ],
  },
];

export const INITIAL_EMPLOYEE_DEMO_STATE: EmployeeDemoState = {
  xp: 180,
  streakDays: 4,
  quests: INITIAL_DEMO_QUESTS,
  savedOpportunityIds: ["demo-hack-1"],
  roadmapItems: INITIAL_DEMO_ROADMAP,
  weeklyHoursSim: 6,
  budgetInrSim: 5000,
  completedChallengeIds: [],
  challengeNotes: {},
  assessmentRecords: {},
  demoSkillEvidence: {},
  savedArticleIds: ["pulse-evals"],
  copilotMessages: INITIAL_COPILOT_MESSAGES,
  sponsorshipRequests: INITIAL_SPONSORSHIP_REQUESTS,
  notificationPrefs: {
    dailyDigest: true,
    streakNudge: true,
    sponsorshipAlerts: true,
    publicPassportMode: "verified_and_demonstrated",
  },
};

export const SUPPLEMENTAL_DEMO_OPPORTUNITIES: Opportunity[] = [
  {
    id: "demo-hack-1",
    title: "FinTech & AI Agents Weekend Hackathon (India)",
    provider: "Bengaluru Builder Collective",
    opportunity_type: "hackathon",
    description:
      "48-hour collaborative build sprint shipping compliant financial retrieval assistants with transparent evaluation suites.",
    skill_tags: ["Python", "NLP & Generative AI", "FastAPI & REST APIs"],
    difficulty_level: "intermediate",
    estimated_hours: 16,
    cost_inr: 0,
    format: "Hybrid Weekend Sprint",
    source_type: "demo_seed",
    is_demo: true,
  },
  {
    id: "demo-comp-2",
    title: "National Open-Source Telemetry Competition",
    provider: "OSS India Fellowship",
    opportunity_type: "competition",
    description:
      "Fix latency regressions, add OpenTelemetry traces, and document benchmark results across community Python repositories.",
    skill_tags: ["Python", "Git & CI/CD", "Automated Testing"],
    difficulty_level: "intermediate",
    estimated_hours: 14,
    cost_inr: 0,
    format: "Remote Async Competition",
    source_type: "demo_seed",
    is_demo: true,
  },
  {
    id: "demo-oss-3",
    title: "Open-Source Data Quality Sprint: SQL & dbt",
    provider: "Data Guild Mentors",
    opportunity_type: "open_source",
    description:
      "Contribute validated PostgreSQL transformation tests and schema contracts under mentor code review.",
    skill_tags: ["SQL", "Data Cleaning & Wrangling", "Data Modeling"],
    difficulty_level: "beginner",
    estimated_hours: 10,
    cost_inr: 0,
    format: "Cohort Mentored PRs",
    source_type: "demo_seed",
    is_demo: true,
  },
  {
    id: "demo-int-4",
    title: "Internal Engineering Guild: Production Postgres & RLS",
    provider: "Internal Platform Team",
    opportunity_type: "internal",
    description:
      "Live internal workshop covering multi-tenant Row Level Security policies, indexing, and safe schema migrations.",
    skill_tags: ["SQL", "Identity & Access Management", "System Architecture"],
    difficulty_level: "advanced",
    estimated_hours: 5,
    cost_inr: 0,
    format: "Internal Live Workshop",
    source_type: "demo_seed",
    is_demo: true,
  },
];

export const SAMPLE_ASSESSMENTS: DemoAssessment[] = [
  {
    id: "assess-sql-retention",
    title: "SQL Analytics & Retention Assessment",
    skillName: "SQL",
    durationMinutes: 8,
    passingScore: 75,
    xpReward: 120,
    questions: [
      {
        id: "q1",
        prompt:
          "Which PostgreSQL window function lets you compare each user's current month activity against their immediately preceding month within the same cohort partition?",
        options: [
          "GROUP BY ROLLUP()",
          "LAG(activity_month) OVER (PARTITION BY user_id ORDER BY activity_month)",
          "COALESCE(activity_month, 0)",
          "DISTINCT ON (activity_month)",
        ],
        correctIndex: 1,
        explanation:
          "LAG() partitioned by user_id and ordered chronologically retrieves the previous period's row without collapsing individual rows.",
      },
      {
        id: "q2",
        prompt:
          "Why is truncating timestamps with DATE_TRUNC('month', created_at) preferred before joining cohort retention tables?",
        options: [
          "It deletes duplicate rows automatically",
          "It normalizes events into consistent monthly buckets so date arithmetic aligns cleanly",
          "It disables Row Level Security checks",
          "It converts timestamps into client local strings",
        ],
        correctIndex: 1,
        explanation:
          "DATE_TRUNC aligns variable timestamps to the first instant of each month, enabling deterministic interval comparisons.",
      },
      {
        id: "q3",
        prompt:
          "When computing team-level skill metrics in a multi-tenant schema, what safeguards private learner rows?",
        options: [
          "Filtering only on the frontend client",
          "PostgreSQL RLS policies plus explicit manager consent checks on aggregated queries",
          "Using SELECT * without WHERE filters",
          "Disabling indexes on user_id",
        ],
        correctIndex: 1,
        explanation:
          "Enforcing RLS and consent checks at the database layer prevents unconsented learner records from leaking regardless of caller.",
      },
      {
        id: "q4",
        prompt:
          "What is the safest way to handle zero active learners in a retention denominator?",
        options: [
          "Divide directly and catch HTTP 500",
          "Use NULLIF(cohort_size, 0) in SQL so division produces NULL rather than division-by-zero errors",
          "Substitute 1 blindly for cohort_size",
          "Ignore cohorts with fewer than 1000 learners",
        ],
        correctIndex: 1,
        explanation:
          "NULLIF(cohort_size, 0) safely prevents division-by-zero failures and allows COALESCE or UI formatting to display 0% cleanly.",
      },
    ],
  },
  {
    id: "assess-ai-eval",
    title: "LLM Evaluation & Retrieval Engineering Check",
    skillName: "NLP & Generative AI",
    durationMinutes: 10,
    passingScore: 75,
    xpReward: 130,
    questions: [
      {
        id: "ai-q1",
        prompt:
          "Why should tool-calling career copilots validate generated course IDs against the PostgreSQL catalog before rendering recommendations?",
        options: [
          "To prevent hallucinated courses, fabricated prices, or broken links",
          "To increase prompt token length",
          "Because LLMs compute bcrypt hashes natively",
          "To skip authentication checks",
        ],
        correctIndex: 0,
        explanation:
          "Grounding recommendations in verified database catalog rows eliminates fabricated URLs and mismatched INR pricing.",
      },
      {
        id: "ai-q2",
        prompt:
          "When building hybrid search for learning opportunities, what pair of signals works best together?",
        options: [
          "Random shuffling + font size",
          "Semantic embedding similarity + deterministic budget/time feasibility filters",
          "CSS animations + cookie length",
          "Hardcoded static order only",
        ],
        correctIndex: 1,
        explanation:
          "Vector similarity captures topical intent while hard filters enforce real INR budget and weekly time constraints.",
      },
      {
        id: "ai-q3",
        prompt:
          "What distinguishes demonstrated or verified competency from XP engagement metrics?",
        options: [
          "Nothing—100 XP automatically equals Senior proficiency",
          "XP reflects habit consistency, whereas competency evidence requires evaluated assessment or project artifacts",
          "XP grants admin privileges",
          "Completing a video automatically grants level 5 verification",
        ],
        correctIndex: 1,
        explanation:
          "Keeping XP engagement strictly separate from demonstrated/verified skill proof preserves trust for learners and managers.",
      },
      {
        id: "ai-q4",
        prompt:
          "How should an AI assistant handle actions that mutate a learner's official roadmap or sponsorship request?",
        options: [
          "Mutate silently without telling the learner",
          "Present proposed structured actions with clear diff/cost previews and require explicit user confirmation",
          "Broadcast private notes to all teams",
          "Bypass JWT verification for speed",
        ],
        correctIndex: 1,
        explanation:
          "Human-in-the-loop confirmation ensures transparent, reversible state updates under authenticated user credentials.",
      },
    ],
  },
];

export const DEMO_INDUSTRY_ARTICLES = [
  {
    id: "pulse-evals",
    topic: "AI Engineering",
    readTime: "6 min read",
    publishedLabel: "Issue 14 • Feature",
    featured: true,
    title: "Why Deterministic Evals Outlast Clever Prompt Tweaks",
    summary:
      "Production AI teams are shifting engineering hours from ad-hoc prompt crafting toward structured regression datasets, grounded citations, and cost telemetry.",
    whyItMatters:
      "Directly raises your reliability edge for ML Engineer, AI Engineer, and Senior Full-Stack benchmarks.",
    takeaways: [
      "Pair structured schema validation with golden-set pass rates.",
      "Track INR cost-per-task alongside accuracy before upgrading models.",
      "Keep human confirmation gates on any state-mutating tool action.",
    ],
    skills: ["NLP & Generative AI", "Automated Testing", "Python"],
  },
  {
    id: "pulse-sql",
    topic: "Data & Analytics",
    readTime: "4 min read",
    publishedLabel: "Data Dispatch",
    featured: false,
    title: "Modern SQL Window Functions for Product Retention Cohorts",
    summary:
      "Before reaching for complex BI stacks, analytics teams use CTE pipelines, LAG/LEAD offsets, and clean schema contracts in PostgreSQL.",
    whyItMatters:
      "Strengthens high-weight competencies across Data Analyst and Data Scientist roles.",
    takeaways: [
      "Separate event normalization CTEs from retention percentage math.",
      "Guard denominators with NULLIF to prevent pipeline exceptions.",
    ],
    skills: ["SQL", "Data Cleaning & Wrangling", "Data Modeling"],
  },
  {
    id: "pulse-iam",
    topic: "Cloud & Security",
    readTime: "5 min read",
    publishedLabel: "Security Brief",
    publishedAt: "Nov 2026",
    featured: false,
    title: "Asymmetric JWKS Verification in Zero-Trust FastAPI Services",
    summary:
      "Modern auth stacks rotate EC/RSA public keys over JWKS endpoints rather than distributing symmetric secrets to downstream microservices.",
    whyItMatters:
      "Core pattern for Cloud Engineer, DevOps, and Backend Architect interviews.",
    takeaways: [
      "Enforce strict issuer, audience, and expiry verification on every request.",
      "Derive authorization solely from verified profile rows, never client headers.",
    ],
    skills: ["Identity & Access Management", "FastAPI & REST APIs"],
  },
  {
    id: "pulse-india-upskill",
    topic: "Product & Leadership",
    readTime: "4 min read",
    publishedLabel: "Workforce Report",
    featured: false,
    title: "Micro-Sprints & INR Training Sponsorships in Indian Tech Teams",
    summary:
      "High-retention engineering orgs fund targeted ₹2,500–₹8,000 workshops tied to measurable 60-day delivery milestones rather than unused annual MOOC licenses.",
    whyItMatters:
      "Helps you write outcome-backed sponsorship justifications that managers approve quickly.",
    takeaways: [
      "Tie each INR request to a single measurable team project bottleneck.",
      "Combine free open-source practice with paid capstone feedback.",
    ],
    skills: ["System Architecture", "Technical Communication"],
  },
];

// Graph prerequisites metadata used by the Skill Constellation SVG view
export const SKILL_PREREQUISITES: Record<string, string[]> = {
  SQL: [],
  Python: [],
  "Git & CI/CD": [],
  "TypeScript / JavaScript": [],
  "Statistics & Probability": ["SQL"],
  "Data Cleaning & Wrangling": ["SQL", "Python"],
  "Data Modeling": ["SQL"],
  "FastAPI & REST APIs": ["Python"],
  "React & Next.js": ["TypeScript / JavaScript"],
  "Automated Testing": ["Python", "Git & CI/CD"],
  "Docker & Containers": ["Git & CI/CD"],
  "Machine Learning": ["Python", "Statistics & Probability", "Data Cleaning & Wrangling"],
  "Scikit-Learn": ["Python", "Statistics & Probability"],
  "NLP & Generative AI": ["Python", "Machine Learning"],
  "Identity & Access Management": ["FastAPI & REST APIs"],
  "System Architecture": ["FastAPI & REST APIs", "Docker & Containers"],
  "Cloud Platforms (AWS / GCP)": ["Docker & Containers"],
};

const listeners = new Set<() => void>();
let cachedRawJson: string | null = null;
let cachedSnapshot: EmployeeDemoState = INITIAL_EMPLOYEE_DEMO_STATE;
let listenersBound = false;

function readStateFromStorage(): EmployeeDemoState {
  if (typeof window === "undefined") {
    return INITIAL_EMPLOYEE_DEMO_STATE;
  }

  try {
    const raw = window.localStorage.getItem(EMPLOYEE_DEMO_STORAGE_KEY);
    if (raw === cachedRawJson) {
      return cachedSnapshot;
    }

    cachedRawJson = raw;
    if (!raw) {
      cachedSnapshot = INITIAL_EMPLOYEE_DEMO_STATE;
      return cachedSnapshot;
    }

    const parsed = JSON.parse(raw) as Partial<EmployeeDemoState>;
    const sharedRaw = window.localStorage.getItem(SHARED_SPONSORSHIP_STORAGE_KEY);
    const sharedSponsorships = sharedRaw
      ? (JSON.parse(sharedRaw) as DemoSponsorshipRequest[])
      : undefined;

    cachedSnapshot = {
      ...INITIAL_EMPLOYEE_DEMO_STATE,
      ...parsed,
      notificationPrefs: {
        ...INITIAL_EMPLOYEE_DEMO_STATE.notificationPrefs,
        ...(parsed.notificationPrefs ?? {}),
      },
      sponsorshipRequests:
        Array.isArray(sharedSponsorships) && sharedSponsorships.length > 0
          ? sharedSponsorships
          : Array.isArray(parsed.sponsorshipRequests)
            ? parsed.sponsorshipRequests
            : INITIAL_SPONSORSHIP_REQUESTS,
    };
    return cachedSnapshot;
  } catch {
    return INITIAL_EMPLOYEE_DEMO_STATE;
  }
}

function writeState(next: EmployeeDemoState) {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(next);
    window.localStorage.setItem(EMPLOYEE_DEMO_STORAGE_KEY, serialized);
    window.localStorage.setItem(
      SHARED_SPONSORSHIP_STORAGE_KEY,
      JSON.stringify(next.sponsorshipRequests)
    );
    cachedRawJson = serialized;
    cachedSnapshot = next;
  } catch {
    cachedSnapshot = next;
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  if (typeof window !== "undefined" && !listenersBound) {
    listenersBound = true;
    window.addEventListener("storage", (e) => {
      if (
        e.key === EMPLOYEE_DEMO_STORAGE_KEY ||
        e.key === SHARED_SPONSORSHIP_STORAGE_KEY
      ) {
        cachedRawJson = null;
        listeners.forEach((cb) => cb());
      }
    });
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getServerSnapshot(): EmployeeDemoState {
  return INITIAL_EMPLOYEE_DEMO_STATE;
}

export function useEmployeeDemo() {
  const state = useSyncExternalStore(
    subscribe,
    readStateFromStorage,
    getServerSnapshot
  );

  function update(updater: (current: EmployeeDemoState) => EmployeeDemoState) {
    const current = readStateFromStorage();
    writeState(updater(current));
  }

  return {
    state,

    toggleQuest(questId: string) {
      update((curr) => {
        const target = curr.quests.find((q) => q.id === questId);
        if (!target) return curr;
        const nextCompleted = !target.completed;
        return {
          ...curr,
          xp: Math.max(0, curr.xp + (nextCompleted ? target.xp : -target.xp)),
          streakDays: nextCompleted
            ? Math.max(curr.streakDays, 5)
            : curr.streakDays,
          quests: curr.quests.map((q) =>
            q.id === questId ? { ...q, completed: nextCompleted } : q
          ),
        };
      });
    },

    toggleSavedOpportunity(oppId: string) {
      update((curr) => {
        const exists = curr.savedOpportunityIds.includes(oppId);
        return {
          ...curr,
          savedOpportunityIds: exists
            ? curr.savedOpportunityIds.filter((id) => id !== oppId)
            : [...curr.savedOpportunityIds, oppId],
        };
      });
    },

    addOpportunityToRoadmap(
      opp: Opportunity,
      bucket: 30 | 60 | 90 = 60
    ): boolean {
      let added = false;
      update((curr) => {
        const alreadyExists = curr.roadmapItems.some(
          (item) => item.sourceOpportunityId === opp.id
        );
        if (alreadyExists) return curr;
        added = true;
        const newItem: DemoRoadmapItem = {
          id: `rm-opp-${opp.id}`,
          bucket,
          title: opp.title,
          type: opp.opportunity_type.replace("_", " "),
          category: opp.skill_tags[0] ?? "General Upskilling",
          estimatedHours: opp.estimated_hours,
          costInr: opp.cost_inr,
          scheduledDate:
            bucket === 30
              ? "2026-12-14"
              : bucket === 60
                ? "2027-01-12"
                : "2027-02-14",
          notes: opp.description,
          completed: false,
          sourceOpportunityId: opp.id,
        };
        return {
          ...curr,
          xp: curr.xp + 15,
          savedOpportunityIds: curr.savedOpportunityIds.includes(opp.id)
            ? curr.savedOpportunityIds
            : [...curr.savedOpportunityIds, opp.id],
          roadmapItems: [...curr.roadmapItems, newItem],
        };
      });
      return added;
    },

    toggleRoadmapItem(itemId: string) {
      update((curr) => {
        const target = curr.roadmapItems.find((i) => i.id === itemId);
        if (!target) return curr;
        const nextCompleted = !target.completed;
        return {
          ...curr,
          xp: Math.max(0, curr.xp + (nextCompleted ? 35 : -35)),
          roadmapItems: curr.roadmapItems.map((i) =>
            i.id === itemId ? { ...i, completed: nextCompleted } : i
          ),
        };
      });
    },

    rescheduleRoadmapItem(itemId: string, scheduledDate: string) {
      update((curr) => ({
        ...curr,
        roadmapItems: curr.roadmapItems.map((i) =>
          i.id === itemId ? { ...i, scheduledDate } : i
        ),
      }));
    },

    updateSimulatorConstraints(weeklyHoursSim: number, budgetInrSim: number) {
      update((curr) => ({
        ...curr,
        weeklyHoursSim,
        budgetInrSim,
      }));
    },

    recordChallengeAttempt(challengeId: string, note: string) {
      update((curr) => {
        const firstTime = !curr.completedChallengeIds.includes(challengeId);
        return {
          ...curr,
          xp: firstTime ? curr.xp + 50 : curr.xp,
          completedChallengeIds: firstTime
            ? [...curr.completedChallengeIds, challengeId]
            : curr.completedChallengeIds,
          challengeNotes: {
            ...curr.challengeNotes,
            [challengeId]: note,
          },
        };
      });
    },

    submitAssessmentResult(
      assessmentId: string,
      skillName: string,
      scorePct: number,
      passed: boolean,
      xpReward: number
    ) {
      const todayIso = new Date().toISOString().slice(0, 10);
      update((curr) => {
        const prevRecord = curr.assessmentRecords[assessmentId];
        const awardXp = !prevRecord && passed ? xpReward : !prevRecord ? 25 : 0;

        const nextQuests = passed
          ? curr.quests.map((q) =>
              q.id === "q-assessment" ? { ...q, completed: true } : q
            )
          : curr.quests;

        const nextEvidence = passed
          ? {
              ...curr.demoSkillEvidence,
              [skillName]: {
                skillName,
                status: "demonstrated" as const,
                scorePct,
                evidenceTitle: `Passed sample assessment (${scorePct}%)`,
                updatedAt: todayIso,
              },
            }
          : curr.demoSkillEvidence;

        return {
          ...curr,
          xp: curr.xp + awardXp,
          quests: nextQuests,
          assessmentRecords: {
            ...curr.assessmentRecords,
            [assessmentId]: {
              assessmentId,
              skillName,
              scorePct,
              passed,
              completedAt: todayIso,
              xpEarned: awardXp,
            },
          },
          demoSkillEvidence: nextEvidence,
        };
      });
    },

    toggleSavedArticle(articleId: string) {
      update((curr) => {
        const exists = curr.savedArticleIds.includes(articleId);
        return {
          ...curr,
          savedArticleIds: exists
            ? curr.savedArticleIds.filter((id) => id !== articleId)
            : [...curr.savedArticleIds, articleId],
        };
      });
    },

    appendCopilotMessages(newMessages: DemoCopilotMessage[]) {
      update((curr) => ({
        ...curr,
        copilotMessages: [...curr.copilotMessages, ...newMessages],
      }));
    },

    submitSponsorshipRequest(
      req: Omit<DemoSponsorshipRequest, "id" | "status" | "submittedAt">
    ) {
      const todayIso = new Date().toISOString().slice(0, 10);
      update((curr) => {
        const created: DemoSponsorshipRequest = {
          ...req,
          id: `sr-${curr.sponsorshipRequests.length + 1}-${todayIso}`,
          status: "Pending Review (Demo)",
          submittedAt: todayIso,
        };
        return {
          ...curr,
          xp: curr.xp + 20,
          sponsorshipRequests: [created, ...curr.sponsorshipRequests],
        };
      });
    },

    updateNotificationPrefs(patch: Partial<DemoNotificationPrefs>) {
      update((curr) => ({
        ...curr,
        notificationPrefs: {
          ...curr.notificationPrefs,
          ...patch,
        },
      }));
    },

    resetDemoState() {
      writeState(INITIAL_EMPLOYEE_DEMO_STATE);
    },
  };
}
