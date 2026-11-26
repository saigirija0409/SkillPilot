/**
 * Presentation-layer display formatters that normalize dynamically fetched titles,
 * descriptions, enum values, and algorithm names without altering underlying database records.
 */

const PREFIX_PATTERNS: RegExp[] = [
  /\[DEMO(?:\s+[A-Z]+)*\]\s*:?\s*/gi,
  /\[CATALOG\]\s*:?\s*/gi,
  /\(\s*Demo(?:\s+(?:Preview|Seed|Submission|Mode|Org|Record|Model|Assessment|State))?\s*\)/gi,
];

const EXACT_ENUM_MAP: Record<string, string> = {
  self_paced: "Self-paced",
  online: "Online",
  in_person: "In-person",
  hybrid: "Hybrid",
  certification: "Certification",
  course: "Course",
  workshop: "Workshop",
  hackathon: "Hackathon",
  conference: "Conference",
  competition: "Competition",
  open_source: "Open Source",
  internal_training: "Internal Training",
  internal: "Internal Training",
  mentoring: "Mentoring",
  practical_task: "Practical Task",
  project: "Project",
  assessment: "Assessment",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  self_reported: "Self-Reported",
  inferred: "Resume Inferred",
  verified: "Verified Credential",
  demonstrated: "Demonstrated",
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  skipped: "Skipped",
  active: "Active",
  draft: "Draft",
};

const ALGORITHM_LABELS: Record<string, string> = {
  semantic_embedding: "Semantic Matching",
  tag_overlap: "Skill Tag Matching",
  none: "Catalog Overview",
};

/**
 * Removes redundant [DEMO] / (Demo) tags from static or dynamically fetched copy
 * while preserving the rest of the text cleanly.
 */
export function cleanDisplayText(value: string | null | undefined): string {
  if (!value) return "";
  let cleaned = value;
  for (const pattern of PREFIX_PATTERNS) {
    cleaned = cleaned.replace(pattern, " ");
  }
  cleaned = cleaned
    .replace(/\bSkillPilot Demo Catalog\b/gi, "SkillPilot Sample Catalog")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
  return cleaned;
}

/**
 * Maps snake_case backend or catalog enums into clean human-readable labels.
 */
export function formatEnumLabel(value: string | null | undefined): string {
  if (!value) return "";
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  if (EXACT_ENUM_MAP[normalized]) {
    return EXACT_ENUM_MAP[normalized];
  }
  return value
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/**
 * Maps ML recommendation algorithm identifiers to concise user-facing labels.
 */
export function formatRecommendationAlgorithm(
  algorithm: string | null | undefined
): string {
  if (!algorithm) return "Personalized Ranking";
  return ALGORITHM_LABELS[algorithm] ?? "Personalized Ranking";
}

/**
 * Normalizes sponsorship request status strings cleanly for portal badges.
 */
export function formatSponsorshipStatus(status: string): string {
  if (status.startsWith("Pending Review")) return "Pending Review";
  if (status.startsWith("Approved")) return "Approved";
  if (status.startsWith("Revision Requested")) return "Revision Requested";
  return cleanDisplayText(status);
}
