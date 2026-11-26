-- =============================================================================
-- SkillPilot Phase 2 Migration 0003: Private PDF Resume Storage Bucket & RLS
-- Execution order: 3 of 4 (run after 0002_rls_and_auth_triggers.sql)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'resumes',
    'resumes',
    false,
    5242880,
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['application/pdf'];

-- Owner-only Storage policies scoped to <user_id>/<filename>.pdf
DROP POLICY IF EXISTS "Users can view own resume files" ON storage.objects;
CREATE POLICY "Users can view own resume files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'resumes'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can upload own resume files" ON storage.objects;
CREATE POLICY "Users can upload own resume files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'resumes'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can update own resume files" ON storage.objects;
CREATE POLICY "Users can update own resume files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'resumes'
        AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'resumes'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can delete own resume files" ON storage.objects;
CREATE POLICY "Users can delete own resume files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'resumes'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
