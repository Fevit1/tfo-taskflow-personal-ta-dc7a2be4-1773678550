-- =============================================================================
-- ADDITIONAL AUTH VERIFICATION QUERIES
-- Run these after executing the SCHEMA migration to confirm everything is wired
-- up correctly before the app goes live.
-- =============================================================================

-- 1. Confirm RLS is enabled and forced on the tasks table.
--    Both rowsecurity and forcerowsecurity must be TRUE.
SELECT
  tablename,
  rowsecurity,
  forcerowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'tasks';

-- 2. Confirm all four RLS policies exist with correct commands.
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'tasks'
ORDER BY policyname;

-- 3. Confirm the anon role has no privileges on tasks.
--    This query should return zero rows for the anon role.
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'tasks'
  AND grantee = 'anon';

-- 4. Confirm the authenticated role has the correct privileges.
--    Should return SELECT, INSERT, UPDATE, DELETE for authenticated.
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'tasks'
  AND grantee = 'authenticated'
ORDER BY privilege_type;

-- =============================================================================
-- NO additional RLS policies are needed beyond what SCHEMA already created.
-- The four policies (tasks_select_own, tasks_insert_own, tasks_update_own,
-- tasks_delete_own) with FORCE ROW LEVEL SECURITY fully cover all auth
-- requirements for this application.
-- =============================================================================
