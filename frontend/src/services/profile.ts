import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  CareerRole,
  ExperienceLevel,
  LearningPreferences,
  Opportunity,
  PreferredPace,
  Profile,
  ResumeRecord,
  SelectedSkillInput,
  Skill,
  UserSkill,
} from "@/types/database";

export interface CatalogData {
  careerRoles: CareerRole[];
  skills: Skill[];
}

export interface UserProfileBundle {
  profile: Profile | null;
  userSkills: UserSkill[];
  preferences: LearningPreferences | null;
  resumes: ResumeRecord[];
}

const SUPABASE_QUERY_TIMEOUT_MS = 12000;

export function withRequestTimeout<T>(
  promise: Promise<T>,
  label: string,
  timeoutMs = SUPABASE_QUERY_TIMEOUT_MS
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out. Please check your network and retry.`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export async function fetchCatalogData(): Promise<CatalogData> {
  const supabase = createSupabaseBrowserClient();
  const [rolesResult, skillsResult] = await withRequestTimeout(
    Promise.all([
      supabase.from("career_roles").select("*").order("title"),
      supabase.from("skills").select("*").order("category").order("name"),
    ]),
    "Loading career roles and skills catalog"
  );

  if (rolesResult.error) {
    throw new Error(rolesResult.error.message);
  }
  if (skillsResult.error) {
    throw new Error(skillsResult.error.message);
  }

  return {
    careerRoles: (rolesResult.data ?? []) as CareerRole[],
    skills: (skillsResult.data ?? []) as Skill[],
  };
}

export async function fetchUserProfileBundle(
  userId: string
): Promise<UserProfileBundle> {
  const supabase = createSupabaseBrowserClient();

  const [profileRes, skillsRes, prefsRes, resumesRes] = await withRequestTimeout(
    Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("user_skills")
        .select("*, skills(*)")
        .eq("user_id", userId)
        .order("proficiency", { ascending: false }),
      supabase
        .from("learning_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("resumes")
        .select("*")
        .eq("user_id", userId)
        .order("uploaded_at", { ascending: false }),
    ]),
    "Loading user profile bundle"
  );

  if (profileRes.error) throw new Error(profileRes.error.message);
  if (skillsRes.error) throw new Error(skillsRes.error.message);
  if (prefsRes.error) throw new Error(prefsRes.error.message);
  if (resumesRes.error) throw new Error(resumesRes.error.message);

  return {
    profile: (profileRes.data ?? null) as Profile | null,
    userSkills: (skillsRes.data ?? []) as UserSkill[],
    preferences: (prefsRes.data ?? null) as LearningPreferences | null,
    resumes: (resumesRes.data ?? []) as ResumeRecord[],
  };
}

export async function fetchDemoOpportunitiesPreview(): Promise<Opportunity[]> {
  return fetchAllCatalogOpportunities(6);
}

export async function fetchAllCatalogOpportunities(
  limitCount = 50
): Promise<Opportunity[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await withRequestTimeout(
    Promise.resolve(
      supabase
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(limitCount)
    ),
    "Loading learning opportunities"
  );

  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as Opportunity[];
}

export interface RoleSkillRequirement {
  id: string;
  role_id: string;
  skill_id: string;
  required_level: number;
  importance_weight: number;
  skills: Skill | null;
}

export async function fetchRoleSkillRequirements(
  roleId: string
): Promise<RoleSkillRequirement[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await withRequestTimeout(
    Promise.resolve(
      supabase
        .from("role_skills")
        .select("id, role_id, skill_id, required_level, importance_weight, skills(*)")
        .eq("role_id", roleId)
        .order("importance_weight", { ascending: false })
    ),
    "Loading role skill benchmarks"
  );

  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as unknown as RoleSkillRequirement[];
}

export interface SaveProfilePayload {
  full_name: string;
  current_job_role: string | null;
  industry: string | null;
  experience_level: ExperienceLevel | null;
  target_role_id: string | null;
  target_role_name: string | null;
  onboarding_step: number;
  onboarding_completed: boolean;
  consent_share_with_manager: boolean;
}

export async function saveProfileInfo(
  userId: string,
  payload: SaveProfilePayload
): Promise<Profile> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: payload.full_name.trim(),
      current_job_role: payload.current_job_role?.trim() || null,
      industry: payload.industry?.trim() || null,
      experience_level: payload.experience_level,
      target_role_id: payload.target_role_id || null,
      target_role_name: payload.target_role_name?.trim() || null,
      onboarding_step: payload.onboarding_step,
      onboarding_completed: payload.onboarding_completed,
      consent_share_with_manager: payload.consent_share_with_manager,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as Profile;
}

export async function replaceSelfReportedSkills(
  userId: string,
  selectedSkills: SelectedSkillInput[]
): Promise<void> {
  const supabase = createSupabaseBrowserClient();

  const { error: deleteErr } = await supabase
    .from("user_skills")
    .delete()
    .eq("user_id", userId)
    .eq("verification_status", "self_reported");

  if (deleteErr) {
    throw new Error(deleteErr.message);
  }

  if (selectedSkills.length === 0) {
    return;
  }

  const rows = selectedSkills.map((item) => ({
    user_id: userId,
    skill_id: item.skill_id,
    proficiency: item.proficiency,
    verification_status: "self_reported" as const,
    evidence_type: "onboarding_self_assessment",
  }));

  const { error: upsertErr } = await supabase
    .from("user_skills")
    .upsert(rows, { onConflict: "user_id,skill_id" });

  if (upsertErr) {
    throw new Error(upsertErr.message);
  }
}

export interface SaveLearningPreferencesPayload {
  interests: string[];
  daily_minutes: number;
  budget_inr: number;
  preferred_methods: string[];
  preferred_pace: PreferredPace;
}

export async function saveLearningPreferences(
  userId: string,
  payload: SaveLearningPreferencesPayload
): Promise<LearningPreferences> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("learning_preferences")
    .upsert(
      {
        user_id: userId,
        interests: payload.interests,
        daily_minutes: payload.daily_minutes,
        budget_inr: payload.budget_inr,
        preferred_methods: payload.preferred_methods,
        preferred_pace: payload.preferred_pace,
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as LearningPreferences;
}

export async function logUserActivity(
  userId: string,
  activityType: string,
  summary: string
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("activity_logs").insert({
    user_id: userId,
    activity_type: activityType,
    summary,
  });
  if (error) {
    throw new Error(error.message);
  }
}
