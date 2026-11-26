export type AccountType = "learner" | "employee" | "manager" | "admin";
export type ExperienceLevel = "student" | "entry" | "mid" | "senior" | "lead";
export type VerificationStatus = "self_reported" | "inferred" | "verified";
export type PreferredPace = "relaxed" | "steady" | "intensive";

export interface CareerRole {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  is_demo: boolean;
}

export interface Skill {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  is_demo: boolean;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  current_job_role: string | null;
  industry: string | null;
  experience_level: ExperienceLevel | null;
  target_role_id: string | null;
  target_role_name: string | null;
  account_type: AccountType;
  organization_id: string | null;
  onboarding_completed: boolean;
  onboarding_step: number;
  consent_share_with_manager: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  proficiency: number;
  verification_status: VerificationStatus;
  evidence_type: string | null;
  evidence_notes: string | null;
  verified_at: string | null;
  skills?: Skill;
}

export interface LearningPreferences {
  id: string;
  user_id: string;
  interests: string[];
  daily_minutes: number;
  budget_inr: number;
  preferred_methods: string[];
  preferred_pace: PreferredPace;
}

export interface ResumeRecord {
  id: string;
  user_id: string;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  parse_status: "uploaded" | "parsed" | "failed";
  is_active: boolean;
  share_with_manager: boolean;
  uploaded_at: string;
}

export interface Opportunity {
  id: string;
  title: string;
  provider: string;
  opportunity_type: string;
  description: string;
  skill_tags: string[];
  difficulty_level: string;
  estimated_hours: number;
  cost_inr: number;
  format: string;
  deadline_at?: string | null;
  url?: string | null;
  source_type: "demo_seed" | "internal" | "live_external";
  is_demo: boolean;
}

export interface AuthMeProfileSummary {
  id: string;
  full_name: string;
  account_type: AccountType;
  organization_id: string | null;
  onboarding_completed: boolean;
  onboarding_step: number;
}

export interface AuthMeResponse {
  authenticated: boolean;
  user_id: string;
  email: string | null;
  jwt_role: string;
  issuer: string | null;
  audience: string | null;
  auth_method: string;
  profile: AuthMeProfileSummary | null;
}

export interface SelectedSkillInput {
  skill_id: string;
  proficiency: number;
}
