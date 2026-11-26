-- =============================================================================
-- SkillPilot Phase 2 Migration 0001: Core Normalized PostgreSQL Schema
-- Execution order: 1 of 4 (run before 0002, 0003, and seed/0001)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Shared updated_at trigger helper (explicit search_path for Supabase security)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 1. Organizations (optional for independent learners)
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_organizations_updated_at ON public.organizations;
CREATE TRIGGER set_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 2. Teams within organizations
CREATE TABLE IF NOT EXISTS public.teams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, name),
    UNIQUE (id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_teams_organization_id ON public.teams(organization_id);

DROP TRIGGER IF EXISTS set_teams_updated_at ON public.teams;
CREATE TRIGGER set_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Target career roles catalog
CREATE TABLE IF NOT EXISTS public.career_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    title text NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    is_demo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Canonical skills catalog
CREATE TABLE IF NOT EXISTS public.skills (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    category text NOT NULL,
    description text,
    is_demo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skills_category ON public.skills(category);

-- 5. Role-to-Skill competency requirements
CREATE TABLE IF NOT EXISTS public.role_skills (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id uuid NOT NULL REFERENCES public.career_roles(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    required_level smallint NOT NULL CHECK (required_level BETWEEN 1 AND 5),
    importance_weight numeric(4, 2) NOT NULL DEFAULT 0.15 CHECK (importance_weight > 0 AND importance_weight <= 1),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (role_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_role_skills_role_id ON public.role_skills(role_id);
CREATE INDEX IF NOT EXISTS idx_role_skills_skill_id ON public.role_skills(skill_id);

-- 6. User profiles (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    full_name text NOT NULL DEFAULT '',
    current_job_role text,
    industry text,
    experience_level text CHECK (experience_level IN ('student', 'entry', 'mid', 'senior', 'lead')),
    target_role_id uuid REFERENCES public.career_roles(id) ON DELETE SET NULL,
    target_role_name text,
    account_type text NOT NULL DEFAULT 'learner' CHECK (account_type IN ('learner', 'employee', 'manager', 'admin')),
    organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
    onboarding_completed boolean NOT NULL DEFAULT false,
    onboarding_step smallint NOT NULL DEFAULT 1 CHECK (onboarding_step BETWEEN 1 AND 4),
    consent_share_with_manager boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_target_role_id ON public.profiles(target_role_id);

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Team memberships (composite FK prevents referencing a team from another organization)
CREATE TABLE IF NOT EXISTS public.team_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    team_id uuid NOT NULL,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'manager')),
    joined_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (team_id, user_id),
    FOREIGN KEY (team_id, organization_id)
        REFERENCES public.teams(id, organization_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_org_team ON public.team_members(organization_id, team_id);

-- 8. User skills with explicit verification separation
CREATE TABLE IF NOT EXISTS public.user_skills (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    proficiency smallint NOT NULL CHECK (proficiency BETWEEN 1 AND 5),
    verification_status text NOT NULL DEFAULT 'self_reported' CHECK (verification_status IN ('self_reported', 'inferred', 'verified')),
    evidence_type text,
    evidence_notes text,
    verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON public.user_skills(skill_id);

DROP TRIGGER IF EXISTS set_user_skills_updated_at ON public.user_skills;
CREATE TRIGGER set_user_skills_updated_at
    BEFORE UPDATE ON public.user_skills
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 9. Learning opportunities catalog (public demo/live + optional org-internal, costs in INR)
CREATE TABLE IF NOT EXISTS public.opportunities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    provider text NOT NULL,
    opportunity_type text NOT NULL CHECK (
        opportunity_type IN (
            'course',
            'workshop',
            'hackathon',
            'certification',
            'conference',
            'mentoring',
            'open_source',
            'internal_training'
        )
    ),
    description text NOT NULL,
    skill_tags text[] NOT NULL DEFAULT '{}',
    difficulty_level text NOT NULL DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_hours numeric(6, 2) NOT NULL DEFAULT 4 CHECK (estimated_hours > 0),
    cost_inr numeric(10, 2) NOT NULL DEFAULT 0 CHECK (cost_inr >= 0),
    format text NOT NULL DEFAULT 'self_paced' CHECK (format IN ('online', 'in_person', 'hybrid', 'self_paced')),
    deadline_at timestamptz,
    url text,
    source_type text NOT NULL DEFAULT 'demo_seed' CHECK (source_type IN ('demo_seed', 'internal', 'live_external')),
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    is_demo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_type ON public.opportunities(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_opportunities_org_id ON public.opportunities(organization_id);

-- 10. User learning preferences (budget in INR)
CREATE TABLE IF NOT EXISTS public.learning_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    interests text[] NOT NULL DEFAULT '{}',
    daily_minutes integer NOT NULL DEFAULT 45 CHECK (daily_minutes BETWEEN 10 AND 480),
    budget_inr numeric(10, 2) NOT NULL DEFAULT 0 CHECK (budget_inr >= 0),
    preferred_methods text[] NOT NULL DEFAULT '{}',
    preferred_pace text NOT NULL DEFAULT 'steady' CHECK (preferred_pace IN ('relaxed', 'steady', 'intensive')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_learning_preferences_updated_at ON public.learning_preferences;
CREATE TRIGGER set_learning_preferences_updated_at
    BEFORE UPDATE ON public.learning_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 11. Private PDF resume metadata (files stored in private 'resumes' Storage bucket)
CREATE TABLE IF NOT EXISTS public.resumes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    storage_bucket text NOT NULL DEFAULT 'resumes' CHECK (storage_bucket = 'resumes'),
    storage_path text NOT NULL UNIQUE,
    file_name text NOT NULL,
    mime_type text NOT NULL CHECK (mime_type = 'application/pdf'),
    file_size_bytes integer NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 5242880),
    parse_status text NOT NULL DEFAULT 'uploaded' CHECK (parse_status IN ('uploaded', 'parsed', 'failed')),
    extracted_summary jsonb,
    is_active boolean NOT NULL DEFAULT true,
    share_with_manager boolean NOT NULL DEFAULT false,
    uploaded_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);

DROP TRIGGER IF EXISTS set_resumes_updated_at ON public.resumes;
CREATE TRIGGER set_resumes_updated_at
    BEFORE UPDATE ON public.resumes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 12. Personalized 30/60/90-day learning roadmaps (budget in INR)
CREATE TABLE IF NOT EXISTS public.roadmaps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_role_id uuid REFERENCES public.career_roles(id) ON DELETE SET NULL,
    title text NOT NULL,
    duration_days smallint NOT NULL DEFAULT 90 CHECK (duration_days IN (30, 60, 90)),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    daily_minutes_budget integer CHECK (daily_minutes_budget IS NULL OR daily_minutes_budget BETWEEN 10 AND 480),
    total_budget_inr numeric(10, 2) CHECK (total_budget_inr IS NULL OR total_budget_inr >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON public.roadmaps(user_id);

DROP TRIGGER IF EXISTS set_roadmaps_updated_at ON public.roadmaps;
CREATE TRIGGER set_roadmaps_updated_at
    BEFORE UPDATE ON public.roadmaps
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 13. Individual roadmap activities (composite FK prevents referencing another user's roadmap)
CREATE TABLE IF NOT EXISTS public.roadmap_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id uuid NOT NULL,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
    title text NOT NULL,
    item_type text NOT NULL DEFAULT 'course' CHECK (item_type IN ('course', 'practical_task', 'workshop', 'project', 'assessment')),
    day_bucket smallint NOT NULL CHECK (day_bucket IN (30, 60, 90)),
    scheduled_date date,
    estimated_minutes integer NOT NULL DEFAULT 60 CHECK (estimated_minutes > 0),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    completed_at timestamptz,
    notes text,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (roadmap_id, user_id)
        REFERENCES public.roadmaps(id, user_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_roadmap_items_roadmap_id ON public.roadmap_items(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_user_id ON public.roadmap_items(user_id);

DROP TRIGGER IF EXISTS set_roadmap_items_updated_at ON public.roadmap_items;
CREATE TRIGGER set_roadmap_items_updated_at
    BEFORE UPDATE ON public.roadmap_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 14. Skill assessments (distinct from course completion for verification)
CREATE TABLE IF NOT EXISTS public.assessments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    title text NOT NULL,
    score numeric(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
    passed boolean NOT NULL DEFAULT false,
    verifier_type text NOT NULL DEFAULT 'platform_quiz' CHECK (verifier_type IN ('platform_quiz', 'practical_review', 'external_credential')),
    evidence_url text,
    assessed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON public.assessments(user_id);

-- 15. Learning & skill activity logs (also feeds Realtime manager dashboard later)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
    activity_type text NOT NULL,
    entity_type text,
    entity_id uuid,
    summary text NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_org_created ON public.activity_logs(organization_id, created_at DESC);
