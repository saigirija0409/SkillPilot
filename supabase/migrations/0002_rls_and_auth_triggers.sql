-- =============================================================================
-- SkillPilot Phase 2 Migration 0002: Auth Profile Trigger, Field Guards & RLS
-- Execution order: 2 of 4 (run immediately after 0001_initial_schema.sql)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Automatic profile creation on auth.users signup (never trusts client role)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    safe_full_name text;
BEGIN
    safe_full_name := COALESCE(
        NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
        split_part(COALESCE(NEW.email, ''), '@', 1),
        'SkillPilot User'
    );

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        account_type,
        onboarding_completed,
        onboarding_step
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        safe_full_name,
        'learner',
        false,
        1
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. Prevent privilege escalation, org mismatch & fraudulent verification
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_privileged_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF current_user::text IN ('authenticated', 'anon') THEN
        IF NEW.account_type IS DISTINCT FROM OLD.account_type THEN
            RAISE EXCEPTION 'Insufficient privileges to modify account_type' USING ERRCODE = '42501';
        END IF;
        IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
            RAISE EXCEPTION 'Insufficient privileges to modify organization_id' USING ERRCODE = '42501';
        END IF;
        IF NEW.email IS DISTINCT FROM OLD.email THEN
            RAISE EXCEPTION 'Profile email cannot be modified directly' USING ERRCODE = '42501';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_privileged_profile_fields();

CREATE OR REPLACE FUNCTION public.protect_skill_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF current_user::text IN ('authenticated', 'anon') THEN
        IF TG_OP = 'INSERT' THEN
            IF NEW.verification_status = 'verified' OR NEW.verified_at IS NOT NULL THEN
                RAISE EXCEPTION 'Self-reported skills cannot be marked verified directly' USING ERRCODE = '42501';
            END IF;
        ELSIF TG_OP = 'UPDATE' THEN
            IF NEW.verification_status = 'verified' AND OLD.verification_status IS DISTINCT FROM 'verified' THEN
                RAISE EXCEPTION 'Skills can only be verified through assessments or trusted verification' USING ERRCODE = '42501';
            END IF;
            IF OLD.verification_status = 'verified' AND (
                NEW.proficiency IS DISTINCT FROM OLD.proficiency
                OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
                OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
                OR NEW.evidence_type IS DISTINCT FROM OLD.evidence_type
            ) THEN
                RAISE EXCEPTION 'Verified skill records cannot be altered by user directly' USING ERRCODE = '42501';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_skills ON public.user_skills;
CREATE TRIGGER trg_protect_user_skills
    BEFORE INSERT OR UPDATE ON public.user_skills
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_skill_verification_fields();

CREATE OR REPLACE FUNCTION public.validate_team_member_organization()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    user_org_id uuid;
BEGIN
    SELECT organization_id INTO user_org_id
    FROM public.profiles
    WHERE id = NEW.user_id;

    IF user_org_id IS NOT NULL AND user_org_id IS DISTINCT FROM NEW.organization_id THEN
        RAISE EXCEPTION 'User profile organization_id does not match team organization_id' USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_team_member_org ON public.team_members;
CREATE TRIGGER trg_validate_team_member_org
    BEFORE INSERT OR UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_team_member_organization();

-- -----------------------------------------------------------------------------
-- 3. Non-recursive SECURITY DEFINER helper functions for RLS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT auth.uid() IS NOT NULL AND (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.organization_id = p_org_id
        )
        OR EXISTS (
            SELECT 1
            FROM public.team_members tm
            WHERE tm.user_id = auth.uid()
              AND tm.organization_id = p_org_id
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.is_team_manager(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1
        FROM public.team_members tm
        JOIN public.profiles mgr ON mgr.id = tm.user_id
        WHERE tm.user_id = auth.uid()
          AND tm.team_id = p_team_id
          AND tm.role = 'manager'
          AND mgr.account_type IN ('manager', 'admin')
          AND (mgr.organization_id IS NULL OR mgr.organization_id = tm.organization_id)
    );
$$;

CREATE OR REPLACE FUNCTION public.is_manager_of_consented_user(p_target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1
        FROM public.team_members mgr_tm
        JOIN public.team_members emp_tm
          ON emp_tm.team_id = mgr_tm.team_id
         AND emp_tm.organization_id = mgr_tm.organization_id
        JOIN public.profiles mgr_profile ON mgr_profile.id = mgr_tm.user_id
        JOIN public.profiles emp_profile ON emp_profile.id = emp_tm.user_id
        WHERE mgr_tm.user_id = auth.uid()
          AND mgr_tm.role = 'manager'
          AND mgr_profile.account_type IN ('manager', 'admin')
          AND (mgr_profile.organization_id IS NULL OR mgr_profile.organization_id = mgr_tm.organization_id)
          AND emp_tm.user_id = p_target_user_id
          AND emp_profile.consent_share_with_manager = true
    );
$$;

REVOKE ALL ON FUNCTION public.is_org_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_team_manager(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_manager_of_consented_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_manager(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager_of_consented_user(uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. Enable Row Level Security on all tables
-- -----------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 5. RLS Policies (idempotent DROP IF EXISTS + CREATE)
-- -----------------------------------------------------------------------------

-- Organizations & Teams: readable only by members of that organization
DROP POLICY IF EXISTS "Org members can read their organization" ON public.organizations;
CREATE POLICY "Org members can read their organization"
    ON public.organizations FOR SELECT
    TO authenticated
    USING (public.is_org_member(id));

DROP POLICY IF EXISTS "Org members can read teams in their organization" ON public.teams;
CREATE POLICY "Org members can read teams in their organization"
    ON public.teams FOR SELECT
    TO authenticated
    USING (public.is_org_member(organization_id));

-- Team Members: users see own membership; managers see members of teams they manage
DROP POLICY IF EXISTS "Users can view own team memberships" ON public.team_members;
CREATE POLICY "Users can view own team memberships"
    ON public.team_members FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Managers can view members of teams they manage" ON public.team_members;
CREATE POLICY "Managers can view members of teams they manage"
    ON public.team_members FOR SELECT
    TO authenticated
    USING (public.is_team_manager(team_id));

-- Public reference catalogs (read-only for authenticated users, no client writes)
DROP POLICY IF EXISTS "Catalog career roles are readable" ON public.career_roles;
CREATE POLICY "Catalog career roles are readable"
    ON public.career_roles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Catalog skills are readable" ON public.skills;
CREATE POLICY "Catalog skills are readable"
    ON public.skills FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Catalog role skills are readable" ON public.role_skills;
CREATE POLICY "Catalog role skills are readable"
    ON public.role_skills FOR SELECT
    TO authenticated
    USING (true);

-- Learning opportunities: public catalog (org_id IS NULL) or member of owning org
DROP POLICY IF EXISTS "Public and org learning opportunities are readable" ON public.opportunities;
CREATE POLICY "Public and org learning opportunities are readable"
    ON public.opportunities FOR SELECT
    TO authenticated
    USING (organization_id IS NULL OR public.is_org_member(organization_id));

-- Profiles: owner read/update; managers read only consented team members
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Managers can view consented team member profiles" ON public.profiles;
CREATE POLICY "Managers can view consented team member profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (public.is_manager_of_consented_user(id));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id AND account_type = 'learner' AND organization_id IS NULL);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- User Skills: owner full access; managers read only consented team members
DROP POLICY IF EXISTS "Users can manage own skills" ON public.user_skills;
CREATE POLICY "Users can manage own skills"
    ON public.user_skills FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Managers can view consented team member skills" ON public.user_skills;
CREATE POLICY "Managers can view consented team member skills"
    ON public.user_skills FOR SELECT
    TO authenticated
    USING (public.is_manager_of_consented_user(user_id));

-- Learning Preferences: strictly owner-only
DROP POLICY IF EXISTS "Users can manage own learning preferences" ON public.learning_preferences;
CREATE POLICY "Users can manage own learning preferences"
    ON public.learning_preferences FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Resumes: owner full access (folder-scoped); managers ONLY if BOTH flags are true
DROP POLICY IF EXISTS "Users can manage own resumes" ON public.resumes;
CREATE POLICY "Users can manage own resumes"
    ON public.resumes FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND storage_path LIKE (auth.uid()::text || '/%')
    );

DROP POLICY IF EXISTS "Managers can view explicitly shared team member resumes" ON public.resumes;
CREATE POLICY "Managers can view explicitly shared team member resumes"
    ON public.resumes FOR SELECT
    TO authenticated
    USING (
        share_with_manager = true
        AND public.is_manager_of_consented_user(user_id)
    );

-- Roadmaps & Roadmap Items: owner full access; items must belong to owner's own roadmap
DROP POLICY IF EXISTS "Users can manage own roadmaps" ON public.roadmaps;
CREATE POLICY "Users can manage own roadmaps"
    ON public.roadmaps FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Managers can view consented team member roadmaps" ON public.roadmaps;
CREATE POLICY "Managers can view consented team member roadmaps"
    ON public.roadmaps FOR SELECT
    TO authenticated
    USING (public.is_manager_of_consented_user(user_id));

DROP POLICY IF EXISTS "Users can manage own roadmap items" ON public.roadmap_items;
CREATE POLICY "Users can manage own roadmap items"
    ON public.roadmap_items FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1
            FROM public.roadmaps r
            WHERE r.id = roadmap_id
              AND r.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Managers can view consented team member roadmap items" ON public.roadmap_items;
CREATE POLICY "Managers can view consented team member roadmap items"
    ON public.roadmap_items FOR SELECT
    TO authenticated
    USING (public.is_manager_of_consented_user(user_id));

-- Assessments: owner read/insert; managers read consented team members
DROP POLICY IF EXISTS "Users can view own assessments" ON public.assessments;
CREATE POLICY "Users can view own assessments"
    ON public.assessments FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own assessments" ON public.assessments;
CREATE POLICY "Users can insert own assessments"
    ON public.assessments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Managers can view consented team member assessments" ON public.assessments;
CREATE POLICY "Managers can view consented team member assessments"
    ON public.assessments FOR SELECT
    TO authenticated
    USING (public.is_manager_of_consented_user(user_id));

-- Activity Logs: owner read/insert (org-validated); managers read consented team members
DROP POLICY IF EXISTS "Users can view own activity logs" ON public.activity_logs;
CREATE POLICY "Users can view own activity logs"
    ON public.activity_logs FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activity logs" ON public.activity_logs;
CREATE POLICY "Users can insert own activity logs"
    ON public.activity_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND (organization_id IS NULL OR public.is_org_member(organization_id))
    );

DROP POLICY IF EXISTS "Managers can view consented team member activity logs" ON public.activity_logs;
CREATE POLICY "Managers can view consented team member activity logs"
    ON public.activity_logs FOR SELECT
    TO authenticated
    USING (public.is_manager_of_consented_user(user_id));
