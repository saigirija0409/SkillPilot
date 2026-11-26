# Supabase Database, Auth, Storage, and Realtime

## Exact SQL Execution Order (Supabase Dashboard -> SQL Editor)

Run the following SQL files **in exact order** inside your Supabase project's **SQL Editor**:

1. `supabase/migrations/0001_initial_schema.sql` — Creates all 15 normalized tables, indexes, constraints, and `updated_at` triggers.
2. `supabase/migrations/0002_rls_and_auth_triggers.sql` — Creates the automatic `auth.users -> profiles` signup trigger, privilege-escalation guards, helper functions, and enables Row Level Security (RLS) across all tables.
3. `supabase/migrations/0003_storage_resumes.sql` — Creates the private `resumes` Storage bucket (5 MB PDF limit) and owner-only storage policies.
4. `supabase/migrations/0004_table_permissions.sql` — Grants least-privilege schema and table-level permissions to `authenticated` (while revoking `anon`/`PUBLIC` table access and preserving RLS).
5. `supabase/seed/0001_seed_data.sql` — Seeds 30 skills, 6 target career roles, role skill requirements, and 8 clearly labeled `[DEMO]` opportunities.

> Note: If you already ran `0001`, `0002`, `0003`, and `seed/0001`, you only need to run `supabase/migrations/0004_table_permissions.sql` — do **not** drop tables or rerun seed data.
