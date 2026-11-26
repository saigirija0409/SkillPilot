-- =============================================================================
-- SkillPilot Phase 2 Migration 0004: Least-Privilege Table & Schema Grants
-- Execution order: 4 of 5 (run on existing database without dropping tables)
-- Safe to run on databases that already have data and migrations 0001..0003.
-- =============================================================================

-- Ensure authenticated role can resolve objects in public schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Revoke broad default privileges from PUBLIC and unauthenticated anon role
REVOKE ALL ON TABLE
    public.organizations,
    public.teams,
    public.team_members,
    public.career_roles,
    public.skills,
    public.role_skills,
    public.profiles,
    public.user_skills,
    public.opportunities,
    public.learning_preferences,
    public.resumes,
    public.roadmaps,
    public.roadmap_items,
    public.assessments,
    public.activity_logs
FROM PUBLIC, anon;

-- 1. Read-only catalogs & organization/team structure (RLS restricts org rows)
GRANT SELECT ON TABLE
    public.career_roles,
    public.skills,
    public.role_skills,
    public.opportunities,
    public.organizations,
    public.teams,
    public.team_members
TO authenticated;

-- 2. User profiles (no client DELETE; privileged columns guarded by trigger)
GRANT SELECT, INSERT, UPDATE ON TABLE
    public.profiles
TO authenticated;

-- 3. User-owned CRUD tables (RLS enforces owner-only writes; managers read only consented)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    public.user_skills,
    public.learning_preferences,
    public.resumes,
    public.roadmaps,
    public.roadmap_items
TO authenticated;

-- 4. Append-and-read tables (no client UPDATE/DELETE)
GRANT SELECT, INSERT ON TABLE
    public.assessments,
    public.activity_logs
TO authenticated;
