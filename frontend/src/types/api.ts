export interface ExtractedSkillDto {
  name: string;
  category: string;
  proficiency: number;
  confidence: number;
  source: string;
}

export interface ResumeParseResponseDto {
  resume_id: string;
  parse_status: string;
  extracted_text_length: number;
  skills: ExtractedSkillDto[];
  summary: string;
  education: string[];
  experience_years: number | null;
  contact: Record<string, unknown> | null;
  raw_sections: Record<string, unknown> | null;
}

export interface SkillExtractionResponseDto {
  skills: ExtractedSkillDto[];
  suggested_target_roles: string[];
  experience_level: string | null;
}

export interface SkillGapItemDto {
  skill_id: string | null;
  skill_name: string;
  skill_slug: string | null;
  category: string;
  required_level: number;
  current_level: number;
  gap: number;
  importance_weight: number;
  priority: "critical" | "high" | "medium" | "low" | string;
}

export interface SkillGapResponseDto {
  user_id: string;
  target_role_id: string;
  target_role_title: string;
  overall_readiness_score: number;
  skills_matched: number;
  skills_total: number;
  gaps: SkillGapItemDto[];
  strengths: SkillGapItemDto[];
  top_missing_skills: string[];
}

export interface RecommendedOpportunityDto {
  opportunity_id: string;
  title: string;
  provider: string;
  opportunity_type: string;
  description: string;
  skill_tags: string[];
  difficulty_level: string;
  estimated_hours: number;
  cost_inr: number;
  format: string;
  url: string | null;
  relevance_score: number;
  match_reason: string;
}

export interface RecommendationResponseDto {
  user_id: string;
  recommendations: RecommendedOpportunityDto[];
  algorithm: "semantic_embedding" | "tag_overlap" | "none" | string;
  total_found: number;
}

export interface RoadmapItemDto {
  id?: string;
  title: string;
  item_type: string;
  day_bucket: 30 | 60 | 90 | number;
  estimated_minutes: number;
  skill_name?: string;
  rationale?: string;
  notes?: string | null;
  status?: "pending" | "in_progress" | "completed" | "skipped" | string;
  scheduled_date?: string | null;
  completed_at?: string | null;
  opportunity_id?: string | null;
  url?: string | null;
  provider?: string | null;
  cost_inr?: number;
  sort_order: number;
}

export interface RoadmapGenerateRequestDto {
  user_id: string;
  target_role_id: string;
  duration_days: 30 | 60 | 90;
  daily_minutes_budget: number;
  total_budget_inr: number;
  force_regenerate?: boolean;
}

export interface RoadmapGenerateResponseDto {
  roadmap_id: string | null;
  user_id: string;
  target_role_id: string;
  target_role_title: string;
  duration_days: number;
  title: string;
  items: RoadmapItemDto[];
  total_estimated_hours: number;
  total_cost_inr: number;
  generated_by: string;
}

export interface RoadmapListItemDto {
  id: string;
  title: string;
  duration_days: number;
  status: string;
  created_at: string;
  updated_at: string;
  career_roles?: { title?: string } | null;
}

export interface RoadmapDetailDto {
  id: string;
  user_id: string;
  target_role_id: string | null;
  title: string;
  duration_days: number;
  status: string;
  created_at: string;
  updated_at: string;
  career_roles?: { title?: string; slug?: string } | null;
  items: RoadmapItemDto[];
}

export interface TeamMemberSkillSummaryDto {
  user_id: string;
  full_name: string;
  email: string;
  target_role_title: string | null;
  readiness_score: number;
  skills_count: number;
  top_gaps: string[];
  last_activity: string | null;
}

export interface TeamSkillHeatmapCellDto {
  skill_name: string;
  category: string;
  avg_proficiency: number;
  coverage_pct: number;
  team_gap: number;
}

export interface ManagerAnalyticsResponseDto {
  organization_id: string;
  team_id: string | null;
  team_size: number;
  avg_readiness_score: number;
  members: TeamMemberSkillSummaryDto[];
  skill_heatmap: TeamSkillHeatmapCellDto[];
  critical_skill_gaps: string[];
  top_recommended_trainings: string[];
}

export interface ManagerTeamMemberRowDto {
  user_id: string;
  role: string;
  joined_at: string;
  profiles?: {
    full_name?: string;
    email?: string;
    target_role_name?: string | null;
    onboarding_completed?: boolean;
  } | null;
}
