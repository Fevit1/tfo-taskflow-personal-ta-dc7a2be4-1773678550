-- =============================================================================
-- ROLLBACK: undo initial_schema migration
-- Run in this order to respect dependency constraints
-- =============================================================================

-- Drop trigger before dropping function
DROP TRIGGER IF EXISTS tasks_set_updated_at ON public.tasks;

-- Drop the helper function
DROP FUNCTION IF EXISTS public.set_updated_at();

-- Drop the tasks table (cascades indexes and policies automatically)
DROP TABLE IF EXISTS public.tasks CASCADE;

-- Drop extension only if nothing else depends on it
-- (uuid-ossp is commonly used by other tables; uncomment only if safe)
-- DROP EXTENSION IF EXISTS "uuid-ossp";