-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TASKS TABLE
-- References auth.users (managed by Supabase Auth) via user_id
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT          NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 255),
  description   TEXT          CHECK (description IS NULL OR char_length(description) <= 5000),
  is_completed  BOOLEAN       NOT NULL DEFAULT FALSE,
  priority      TEXT          NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date      DATE          NULL,
  category      TEXT          NULL CHECK (category IS NULL OR char_length(category) <= 100),
  sort_order    INTEGER       NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- Optimise the most common query patterns:
--   - Fetch all tasks for a user (primary list query)
--   - Filter by completion status
--   - Filter by priority
--   - Filter by category
--   - Order by sort_order + created_at
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_user_id
  ON public.tasks (user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id_is_completed
  ON public.tasks (user_id, is_completed);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id_priority
  ON public.tasks (user_id, priority);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id_category
  ON public.tasks (user_id, category);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id_sort_order_created_at
  ON public.tasks (user_id, sort_order ASC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id_due_date
  ON public.tasks (user_id, due_date)
  WHERE due_date IS NOT NULL;

-- =============================================================================
-- UPDATED_AT TRIGGER
-- Automatically keeps updated_at current on every row update
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- Enable RLS first, then define the four required policies.
-- auth.uid() is the Supabase-provided function that returns the UUID of the
-- currently authenticated user from the JWT. This is the primary data
-- isolation mechanism — the database itself enforces ownership.
-- =============================================================================
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Force RLS to apply even to the table owner (extra safety)
ALTER TABLE public.tasks FORCE ROW LEVEL SECURITY;

-- SELECT: users can only read their own tasks
CREATE POLICY "tasks_select_own"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: users can only create tasks for themselves
-- WITH CHECK prevents spoofed user_id values in the request body
CREATE POLICY "tasks_insert_own"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can only update their own tasks
CREATE POLICY "tasks_update_own"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: users can only delete their own tasks
CREATE POLICY "tasks_delete_own"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================================================
-- GRANT PERMISSIONS
-- Grant the minimum required privileges to the authenticated and anon roles.
-- The anon role gets no access — all operations require authentication.
-- RLS policies above further restrict authenticated access to own rows only.
-- =============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
REVOKE ALL ON public.tasks FROM anon;

-- =============================================================================
-- VERIFICATION COMMENT
-- After running this migration, confirm RLS is active by running:
--   SELECT tablename, rowsecurity, forcerowsecurity
--   FROM pg_tables
--   WHERE schemaname = 'public' AND tablename = 'tasks';
-- Both rowsecurity and forcerowsecurity should be TRUE.
--
-- Confirm all four policies exist:
--   SELECT policyname, cmd, roles, qual, with_check
--   FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'tasks';
-- =============================================================================