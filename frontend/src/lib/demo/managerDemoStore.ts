"use client";

import { useSyncExternalStore } from "react";

import {
  EMPLOYEE_DEMO_STORAGE_KEY,
  INITIAL_EMPLOYEE_DEMO_STATE,
  INITIAL_SPONSORSHIP_REQUESTS,
  SHARED_SPONSORSHIP_STORAGE_KEY,
  type DemoSkillEvidenceRecord,
  type DemoSponsorshipRequest,
  type EmployeeDemoState,
} from "@/lib/demo/employeeDemoStore";

export const MANAGER_DEMO_STORAGE_KEY = "skillpilot_manager_demo_v1";

export type DepartmentName =
  | "Data Science"
  | "Engineering"
  | "Frontend"
  | "Cloud"
  | "Analytics";

export const DEPARTMENTS: DepartmentName[] = [
  "Data Science",
  "Engineering",
  "Frontend",
  "Cloud",
  "Analytics",
];

export const HEATMAP_SKILLS = [
  { name: "Python", category: "Data & AI" },
  { name: "SQL", category: "Data & AI" },
  { name: "Machine Learning", category: "Data & AI" },
  { name: "Generative AI", category: "Data & AI" },
  { name: "Cloud Computing", category: "Cloud & Infra" },
  { name: "DevOps", category: "Cloud & Infra" },
  { name: "Data Visualization", category: "Analytics & UI" },
] as const;

export interface DemoEmployeeProfile {
  id: string;
  name: string;
  initials: string;
  role: string;
  department: DepartmentName;
  progressPct: number;
  skills: Record<string, number>; // skillName -> proficiency 1..5
  evidenceStatus: Record<
    string,
    "verified" | "demonstrated" | "self_reported"
  >;
  priorities: string[];
  linkedToLiveDemoLearner?: boolean;
}

export const DEMO_TEAM_EMPLOYEES: DemoEmployeeProfile[] = [
  {
    id: "emp-ananya",
    name: "Ananya Rao [DEMO]",
    initials: "AR",
    role: "Associate Data Engineer",
    department: "Data Science",
    progressPct: 72,
    skills: {
      Python: 4,
      SQL: 4,
      "Machine Learning": 3,
      "Generative AI": 2,
      "Cloud Computing": 2,
      DevOps: 2,
      "Data Visualization": 3,
    },
    evidenceStatus: {
      Python: "verified",
      SQL: "demonstrated",
      "Machine Learning": "self_reported",
      "Generative AI": "self_reported",
    },
    priorities: ["Generative AI", "Cloud Computing"],
    linkedToLiveDemoLearner: true,
  },
  {
    id: "emp-rohan",
    name: "Rohan Kulkarni [DEMO]",
    initials: "RK",
    role: "Senior Backend Engineer",
    department: "Engineering",
    progressPct: 81,
    skills: {
      Python: 5,
      SQL: 4,
      "Machine Learning": 2,
      "Generative AI": 3,
      "Cloud Computing": 4,
      DevOps: 4,
      "Data Visualization": 2,
    },
    evidenceStatus: {
      Python: "verified",
      SQL: "verified",
      "Cloud Computing": "demonstrated",
      DevOps: "verified",
    },
    priorities: ["Generative AI", "Machine Learning"],
  },
  {
    id: "emp-meera",
    name: "Meera Nair [DEMO]",
    initials: "MN",
    role: "Product Frontend Engineer",
    department: "Frontend",
    progressPct: 68,
    skills: {
      Python: 2,
      SQL: 3,
      "Machine Learning": 1,
      "Generative AI": 3,
      "Cloud Computing": 2,
      DevOps: 2,
      "Data Visualization": 5,
    },
    evidenceStatus: {
      "Data Visualization": "verified",
      "Generative AI": "demonstrated",
      SQL: "self_reported",
    },
    priorities: ["Cloud Computing", "Python"],
  },
  {
    id: "emp-kabir",
    name: "Kabir Verma [DEMO]",
    initials: "KV",
    role: "Platform Cloud Architect",
    department: "Cloud",
    progressPct: 76,
    skills: {
      Python: 3,
      SQL: 3,
      "Machine Learning": 2,
      "Generative AI": 2,
      "Cloud Computing": 5,
      DevOps: 5,
      "Data Visualization": 2,
    },
    evidenceStatus: {
      "Cloud Computing": "verified",
      DevOps: "verified",
      Python: "demonstrated",
    },
    priorities: ["Generative AI", "SQL"],
  },
  {
    id: "emp-diya",
    name: "Diya Sengupta [DEMO]",
    initials: "DS",
    role: "BI & Analytics Lead",
    department: "Analytics",
    progressPct: 85,
    skills: {
      Python: 4,
      SQL: 5,
      "Machine Learning": 3,
      "Generative AI": 2,
      "Cloud Computing": 2,
      DevOps: 1,
      "Data Visualization": 5,
    },
    evidenceStatus: {
      SQL: "verified",
      "Data Visualization": "verified",
      Python: "demonstrated",
      "Machine Learning": "self_reported",
    },
    priorities: ["Generative AI", "Cloud Computing"],
  },
  {
    id: "emp-arjun",
    name: "Arjun Menon [DEMO]",
    initials: "AM",
    role: "Applied ML Specialist",
    department: "Data Science",
    progressPct: 79,
    skills: {
      Python: 5,
      SQL: 3,
      "Machine Learning": 5,
      "Generative AI": 4,
      "Cloud Computing": 3,
      DevOps: 2,
      "Data Visualization": 3,
    },
    evidenceStatus: {
      Python: "verified",
      "Machine Learning": "verified",
      "Generative AI": "demonstrated",
    },
    priorities: ["DevOps", "Cloud Computing"],
  },
];

export interface ProjectSkillRequirement {
  id: string;
  skill: string;
  requiredLevel: number;
  importance: number; // 1..10
}

export interface ProjectPreset {
  id: string;
  name: string;
  timeline: string;
  summary: string;
  requirements: ProjectSkillRequirement[];
}

export const SAMPLE_PROJECT_PRESETS: ProjectPreset[] = [
  {
    id: "proj-ai-copilot",
    name: "[DEMO] Enterprise AI Career Copilot",
    timeline: "Q1 (10 Weeks)",
    summary:
      "Multi-agent retrieval workflow with FastAPI orchestration, vector SQL retrieval, and evaluation pipelines.",
    requirements: [
      { id: "r1", skill: "Python", requiredLevel: 4, importance: 9 },
      { id: "r2", skill: "Generative AI", requiredLevel: 4, importance: 10 },
      { id: "r3", skill: "SQL", requiredLevel: 4, importance: 7 },
      { id: "r4", skill: "Cloud Computing", requiredLevel: 3, importance: 6 },
    ],
  },
  {
    id: "proj-cloud-modern",
    name: "[DEMO] Zero-Trust Cloud Migration",
    timeline: "Q2 (12 Weeks)",
    summary:
      "Containerized multi-region deployment with automated CI/CD observability and hardened IAM.",
    requirements: [
      { id: "c1", skill: "Cloud Computing", requiredLevel: 5, importance: 10 },
      { id: "c2", skill: "DevOps", requiredLevel: 4, importance: 9 },
      { id: "c3", skill: "Python", requiredLevel: 3, importance: 6 },
    ],
  },
  {
    id: "proj-telemetry",
    name: "[DEMO] Executive Telemetry Warehouse",
    timeline: "Q1 (8 Weeks)",
    summary:
      "Cohort retention modeling, SQL warehouse contracts, and interactive competency dashboards.",
    requirements: [
      { id: "t1", skill: "SQL", requiredLevel: 5, importance: 10 },
      { id: "t2", skill: "Data Visualization", requiredLevel: 4, importance: 9 },
      { id: "t3", skill: "Machine Learning", requiredLevel: 3, importance: 6 },
    ],
  },
];

export interface ManagerTrainingCatalogItem {
  id: string;
  title: string;
  targetSkill: string;
  departmentFocus: DepartmentName | "All Departments";
  durationHours: number;
  costPerSeatInr: number;
  expectedLift: string;
}

export const MANAGER_TRAINING_CATALOG: ManagerTrainingCatalogItem[] = [
  {
    id: "tr-genai-eval",
    title: "[DEMO] Applied Generative AI & Evaluation Workshop",
    targetSkill: "Generative AI",
    departmentFocus: "Data Science",
    durationHours: 14,
    costPerSeatInr: 4500,
    expectedLift: "+1.2 estimated proficiency coverage",
  },
  {
    id: "tr-cloud-sec",
    title: "[DEMO] Production Cloud & Container Hardening Lab",
    targetSkill: "Cloud Computing",
    departmentFocus: "Engineering",
    durationHours: 16,
    costPerSeatInr: 5000,
    expectedLift: "+1.4 estimated proficiency coverage",
  },
  {
    id: "tr-devops-cicd",
    title: "[DEMO] Zero-Downtime CI/CD & DevOps Sprint",
    targetSkill: "DevOps",
    departmentFocus: "Cloud",
    durationHours: 12,
    costPerSeatInr: 3500,
    expectedLift: "+1.0 estimated proficiency coverage",
  },
  {
    id: "tr-sql-lake",
    title: "[DEMO] Cohort Retention & Postgres Performance Lab",
    targetSkill: "SQL",
    departmentFocus: "Analytics",
    durationHours: 8,
    costPerSeatInr: 0,
    expectedLift: "+0.8 estimated proficiency coverage",
  },
  {
    id: "tr-dataviz-ui",
    title: "[DEMO] Interactive Telemetry Visualization Studio",
    targetSkill: "Data Visualization",
    departmentFocus: "Frontend",
    durationHours: 10,
    costPerSeatInr: 2500,
    expectedLift: "+1.1 estimated proficiency coverage",
  },
];

export interface ManagerCopilotMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  actions?: Array<{ label: string; href: string }>;
}

export interface ManagerDemoState {
  organizationDisplayName: string;
  totalTrainingBudgetInr: number;
  budgetAllocations: Record<DepartmentName, number>; // percentage summing ~100
  projectPresetId: string;
  projectName: string;
  projectTimeline: string;
  projectRequirements: ProjectSkillRequirement[];
  managerNotesByRequestId: Record<string, string>;
  sponsorshipApprovedDeductedIds: string[];
  copilotMessages: ManagerCopilotMessage[];
  managerNotificationPrefs: {
    sponsorshipSubmittedAlert: boolean;
    weeklyReadinessDigest: boolean;
    requireTwoStepApproval: boolean;
    privacyStrictMode: boolean;
  };
}

export const INITIAL_MANAGER_DEMO_STATE: ManagerDemoState = {
  organizationDisplayName: "SkillPilot India Engineering [DEMO Org]",
  totalTrainingBudgetInr: 60000,
  budgetAllocations: {
    "Data Science": 25,
    Engineering: 25,
    Cloud: 20,
    Frontend: 15,
    Analytics: 15,
  },
  projectPresetId: SAMPLE_PROJECT_PRESETS[0].id,
  projectName: SAMPLE_PROJECT_PRESETS[0].name,
  projectTimeline: SAMPLE_PROJECT_PRESETS[0].timeline,
  projectRequirements: SAMPLE_PROJECT_PRESETS[0].requirements,
  managerNotesByRequestId: {},
  sponsorshipApprovedDeductedIds: [],
  copilotMessages: [
    {
      id: "mgr-cp-0",
      role: "assistant",
      text: "Welcome to Manager Copilot preview. I combine your organizational skill matrix, live project readiness weights, INR training budget, and shared sponsorship requests. Live Gemini server orchestration connects in Phase 5.",
      actions: [
        { label: "Inspect Skill Heatmap", href: "/manager/skills" },
        { label: "Review Sponsorships", href: "/manager/sponsorship" },
      ],
    },
  ],
  managerNotificationPrefs: {
    sponsorshipSubmittedAlert: true,
    weeklyReadinessDigest: true,
    requireTwoStepApproval: true,
    privacyStrictMode: true,
  },
};

export interface CombinedManagerSnapshot {
  manager: ManagerDemoState;
  sponsorships: DemoSponsorshipRequest[];
  employeeEvidence: Record<string, DemoSkillEvidenceRecord>;
}

const DEFAULT_SNAPSHOT: CombinedManagerSnapshot = {
  manager: INITIAL_MANAGER_DEMO_STATE,
  sponsorships: INITIAL_SPONSORSHIP_REQUESTS,
  employeeEvidence: INITIAL_EMPLOYEE_DEMO_STATE.demoSkillEvidence,
};

const listeners = new Set<() => void>();
let cachedSignature = "";
let cachedSnapshot: CombinedManagerSnapshot = DEFAULT_SNAPSHOT;
let storageBound = false;

function readCombinedSnapshot(): CombinedManagerSnapshot {
  if (typeof window === "undefined") {
    return DEFAULT_SNAPSHOT;
  }

  try {
    const rawManager = window.localStorage.getItem(MANAGER_DEMO_STORAGE_KEY) ?? "";
    const rawSponsorship =
      window.localStorage.getItem(SHARED_SPONSORSHIP_STORAGE_KEY) ?? "";
    const rawEmployee =
      window.localStorage.getItem(EMPLOYEE_DEMO_STORAGE_KEY) ?? "";

    const signature = `${rawManager}|${rawSponsorship}|${rawEmployee}`;
    if (signature === cachedSignature) {
      return cachedSnapshot;
    }

    cachedSignature = signature;

    const parsedManager = rawManager
      ? (JSON.parse(rawManager) as Partial<ManagerDemoState>)
      : {};
    const parsedSponsorship = rawSponsorship
      ? (JSON.parse(rawSponsorship) as DemoSponsorshipRequest[])
      : null;
    const parsedEmployee = rawEmployee
      ? (JSON.parse(rawEmployee) as Partial<EmployeeDemoState>)
      : null;

    const sponsorships =
      Array.isArray(parsedSponsorship) && parsedSponsorship.length > 0
        ? parsedSponsorship
        : Array.isArray(parsedEmployee?.sponsorshipRequests)
          ? parsedEmployee.sponsorshipRequests
          : INITIAL_SPONSORSHIP_REQUESTS;

    cachedSnapshot = {
      manager: {
        ...INITIAL_MANAGER_DEMO_STATE,
        ...parsedManager,
        budgetAllocations: {
          ...INITIAL_MANAGER_DEMO_STATE.budgetAllocations,
          ...(parsedManager.budgetAllocations ?? {}),
        },
        managerNotificationPrefs: {
          ...INITIAL_MANAGER_DEMO_STATE.managerNotificationPrefs,
          ...(parsedManager.managerNotificationPrefs ?? {}),
        },
      },
      sponsorships,
      employeeEvidence:
        parsedEmployee?.demoSkillEvidence ??
        INITIAL_EMPLOYEE_DEMO_STATE.demoSkillEvidence,
    };

    return cachedSnapshot;
  } catch {
    return DEFAULT_SNAPSHOT;
  }
}

function writeManagerState(next: ManagerDemoState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MANAGER_DEMO_STORAGE_KEY, JSON.stringify(next));
    cachedSignature = "";
  } catch {
    // ignore quota errors
  }
  listeners.forEach((cb) => cb());
}

function writeSharedSponsorships(nextSponsorships: DemoSponsorshipRequest[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      SHARED_SPONSORSHIP_STORAGE_KEY,
      JSON.stringify(nextSponsorships)
    );
    // Mirror inside employee demo blob if present so both sides stay synchronized
    const rawEmp = window.localStorage.getItem(EMPLOYEE_DEMO_STORAGE_KEY);
    if (rawEmp) {
      const parsedEmp = JSON.parse(rawEmp) as EmployeeDemoState;
      window.localStorage.setItem(
        EMPLOYEE_DEMO_STORAGE_KEY,
        JSON.stringify({
          ...parsedEmp,
          sponsorshipRequests: nextSponsorships,
        })
      );
    }
    cachedSignature = "";
  } catch {
    // ignore storage errors
  }
  listeners.forEach((cb) => cb());
}

function subscribe(listener: () => void) {
  if (typeof window !== "undefined" && !storageBound) {
    storageBound = true;
    window.addEventListener("storage", (e) => {
      if (
        e.key === MANAGER_DEMO_STORAGE_KEY ||
        e.key === SHARED_SPONSORSHIP_STORAGE_KEY ||
        e.key === EMPLOYEE_DEMO_STORAGE_KEY
      ) {
        cachedSignature = "";
        listeners.forEach((cb) => cb());
      }
    });
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getServerSnapshot(): CombinedManagerSnapshot {
  return DEFAULT_SNAPSHOT;
}

/**
 * Computes deterministic competency coverage using the required weighted formula:
 * Skill coverage = min(current proficiency / required proficiency, 1)
 * Overall coverage = weighted average of individual skill coverage
 */
export function computeProjectCoverageForSkills(
  employeeSkills: Record<string, number>,
  requirements: ProjectSkillRequirement[]
) {
  if (requirements.length === 0) {
    return {
      overallPct: 100,
      breakdown: [] as Array<{
        req: ProjectSkillRequirement;
        current: number;
        coverageRatio: number;
        gap: number;
      }>,
    };
  }

  let totalWeight = 0;
  let weightedSum = 0;
  const breakdown = requirements.map((req) => {
    const current = employeeSkills[req.skill] ?? 0;
    const coverageRatio =
      req.requiredLevel > 0 ? Math.min(current / req.requiredLevel, 1) : 1;
    totalWeight += req.importance;
    weightedSum += coverageRatio * req.importance;
    return {
      req,
      current,
      coverageRatio,
      gap: Math.max(0, req.requiredLevel - current),
    };
  });

  const overallPct =
    totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;
  return { overallPct, breakdown };
}

export function getEnrichedEmployees(
  employeeEvidence: Record<string, DemoSkillEvidenceRecord>
): DemoEmployeeProfile[] {
  return DEMO_TEAM_EMPLOYEES.map((emp) => {
    if (!emp.linkedToLiveDemoLearner) return emp;
    const updatedSkills = { ...emp.skills };
    const updatedEvidence = { ...emp.evidenceStatus };
    Object.values(employeeEvidence).forEach((ev) => {
      updatedSkills[ev.skillName] = Math.max(updatedSkills[ev.skillName] ?? 0, 4);
      if (updatedEvidence[ev.skillName] !== "verified") {
        updatedEvidence[ev.skillName] = "demonstrated";
      }
    });
    return {
      ...emp,
      skills: updatedSkills,
      evidenceStatus: updatedEvidence,
    };
  });
}

export function useManagerDemo() {
  const snapshot = useSyncExternalStore(
    subscribe,
    readCombinedSnapshot,
    getServerSnapshot
  );

  const approvedSponsorshipSpentInr = snapshot.sponsorships
    .filter((req) => req.status === "Approved (Demo)")
    .reduce((acc, req) => acc + req.amountInr, 0);

  const remainingTrainingBudgetInr = Math.max(
    0,
    snapshot.manager.totalTrainingBudgetInr - approvedSponsorshipSpentInr
  );

  function updateManager(
    updater: (curr: ManagerDemoState) => ManagerDemoState
  ) {
    const curr = readCombinedSnapshot().manager;
    writeManagerState(updater(curr));
  }

  return {
    managerState: snapshot.manager,
    sponsorships: snapshot.sponsorships,
    employeeEvidence: snapshot.employeeEvidence,
    employees: getEnrichedEmployees(snapshot.employeeEvidence),
    approvedSponsorshipSpentInr,
    remainingTrainingBudgetInr,

    setProjectMetadata(name: string, timeline: string) {
      updateManager((curr) => ({
        ...curr,
        projectPresetId: "custom",
        projectName: name,
        projectTimeline: timeline,
      }));
    },

    applyProjectPreset(presetId: string) {
      const preset = SAMPLE_PROJECT_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      updateManager((curr) => ({
        ...curr,
        projectPresetId: preset.id,
        projectName: preset.name,
        projectTimeline: preset.timeline,
        projectRequirements: preset.requirements.map((r) => ({ ...r })),
      }));
    },

    addProjectRequirement(
      skill: string,
      requiredLevel: number,
      importance: number
    ) {
      updateManager((curr) => {
        if (curr.projectRequirements.some((r) => r.skill === skill)) {
          return curr;
        }
        return {
          ...curr,
          projectRequirements: [
            ...curr.projectRequirements,
            {
              id: `req-${skill.toLowerCase().replace(/\s+/g, "-")}-${curr.projectRequirements.length + 1}`,
              skill,
              requiredLevel,
              importance,
            },
          ],
        };
      });
    },

    updateProjectRequirement(
      reqId: string,
      patch: Partial<Pick<ProjectSkillRequirement, "requiredLevel" | "importance">>
    ) {
      updateManager((curr) => ({
        ...curr,
        projectRequirements: curr.projectRequirements.map((r) =>
          r.id === reqId ? { ...r, ...patch } : r
        ),
      }));
    },

    removeProjectRequirement(reqId: string) {
      updateManager((curr) => ({
        ...curr,
        projectRequirements: curr.projectRequirements.filter(
          (r) => r.id !== reqId
        ),
      }));
    },

    setTrainingBudgetInr(totalTrainingBudgetInr: number) {
      updateManager((curr) => ({
        ...curr,
        totalTrainingBudgetInr: Math.max(0, totalTrainingBudgetInr),
      }));
    },

    setDepartmentAllocation(dept: DepartmentName, pct: number) {
      updateManager((curr) => ({
        ...curr,
        budgetAllocations: {
          ...curr.budgetAllocations,
          [dept]: Math.max(0, Math.min(100, pct)),
        },
      }));
    },

    approveSponsorshipRequest(
      requestId: string,
      note: string
    ): { ok: boolean; error?: string } {
      const currSnap = readCombinedSnapshot();
      const target = currSnap.sponsorships.find((s) => s.id === requestId);
      if (!target) {
        return { ok: false, error: "Request not found." };
      }
      if (
        target.status === "Approved (Demo)" ||
        currSnap.manager.sponsorshipApprovedDeductedIds.includes(requestId)
      ) {
        return {
          ok: false,
          error: "Duplicate approval prevented: this request is already approved.",
        };
      }

      const spent = currSnap.sponsorships
        .filter((s) => s.status === "Approved (Demo)")
        .reduce((acc, s) => acc + s.amountInr, 0);
      const remaining = Math.max(
        0,
        currSnap.manager.totalTrainingBudgetInr - spent
      );

      if (target.amountInr > remaining) {
        return {
          ok: false,
          error: `Insufficient demo budget: requires ₹${target.amountInr.toLocaleString("en-IN")} INR but only ₹${remaining.toLocaleString("en-IN")} INR remains.`,
        };
      }

      const updatedReqs = currSnap.sponsorships.map((s) =>
        s.id === requestId
          ? { ...s, status: "Approved (Demo)" as const }
          : s
      );
      writeManagerState({
        ...currSnap.manager,
        sponsorshipApprovedDeductedIds: [
          ...currSnap.manager.sponsorshipApprovedDeductedIds,
          requestId,
        ],
        managerNotesByRequestId: {
          ...currSnap.manager.managerNotesByRequestId,
          [requestId]: note,
        },
      });
      writeSharedSponsorships(updatedReqs);
      return { ok: true };
    },

    rejectSponsorshipRequest(requestId: string, note: string) {
      const currSnap = readCombinedSnapshot();
      const target = currSnap.sponsorships.find((s) => s.id === requestId);
      if (!target || target.status === "Approved (Demo)") return;

      const updatedReqs = currSnap.sponsorships.map((s) =>
        s.id === requestId
          ? { ...s, status: "Revision Requested (Demo)" as const }
          : s
      );
      writeManagerState({
        ...currSnap.manager,
        managerNotesByRequestId: {
          ...currSnap.manager.managerNotesByRequestId,
          [requestId]: note,
        },
      });
      writeSharedSponsorships(updatedReqs);
    },

    appendCopilotMessages(msgs: ManagerCopilotMessage[]) {
      updateManager((curr) => ({
        ...curr,
        copilotMessages: [...curr.copilotMessages, ...msgs],
      }));
    },

    updateOrganizationSettings(
      patch: Partial<
        Pick<ManagerDemoState, "organizationDisplayName" | "managerNotificationPrefs">
      >
    ) {
      updateManager((curr) => ({
        ...curr,
        ...patch,
      }));
    },

    resetManagerDemo() {
      writeManagerState(INITIAL_MANAGER_DEMO_STATE);
    },
  };
}
