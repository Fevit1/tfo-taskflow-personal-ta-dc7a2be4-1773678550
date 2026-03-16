import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { sanitizeText } from '@/lib/sanitize';
import { isValidUUID } from '@/lib/validate';

// ---------------------------------------------------------------------------
// Zod schema for updates
// ---------------------------------------------------------------------------

const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title cannot be empty.')
      .max(255, 'Title must be 255 characters or fewer.')
      .optional(),
    description: z
      .string()
      .trim()
      .max(5000, 'Description must be 5000 characters or fewer.')
      .nullable()
      .optional(),
    is_completed: z.boolean().optional(),
    priority: z
      .enum(['low', 'medium', 'high'], {
        errorMap: () => ({ message: "Priority must be 'low', 'medium', or 'high'." }),
      })
      .optional(),
    due_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'due_date must be in YYYY-MM-DD format.')
      .nullable()
      .optional(),
    category: z
      .string()
      .trim()
      .max(100, 'Category must be 100 characters or fewer.')
      .nullable()
      .optional(),
    sort_order: z.number().int().min(0).optional(),
  })
  .strict() // reject unknown keys
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one field must be provided for update.',
  });

// ---------------------------------------------------------------------------
// PUT /api/tasks/[id]
// ---------------------------------------------------------------------------

/**
 * Update any fields on a task owned by the authenticated user.
 * Handles completion toggles, edits, and sort_order changes.
 *
 * Path param: id (UUID)
 *
 * Request body (JSON): any subset of task fields (at least one required)
 *
 * Response 200: updated Task
 * Response 400: invalid UUID
 * Response 404: task not found or not owned by user
 * Response 422: validation failure
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;

    // Validate UUID format before touching the database
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid task ID.' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    // Validate with Zod
    const parseResult = updateTaskSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed.', details: parseResult.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const validated = parseResult.data;

    // Sanitize text fields if present
    const updates = { ...validated };
    if (updates.title !== undefined) {
      updates.title = sanitizeText(updates.title);
      if (!updates.title) {
        return NextResponse.json({ error: 'Title cannot be empty after sanitization.' }, { status: 422 });
      }
    }
    if (updates.description !== undefined && updates.description !== null) {
      updates.description = sanitizeText(updates.description);
    }
    if (updates.category !== undefined && updates.category !== null) {
      updates.category = sanitizeText(updates.category);
    }

    // RLS enforces ownership — this update will silently affect 0 rows if not owner
    const { data: task, error: dbError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      // PGRST116 = no rows returned (PostgREST code for .single() with 0 rows)
      if (dbError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
      }
      console.error('[PUT /api/tasks/[id]] db error:', dbError.message);
      return NextResponse.json({ error: 'Failed to update task.' }, { status: 500 });
    }

    if (!task) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (err) {
    console.error('[PUT /api/tasks/[id]] unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/tasks/[id]
// ---------------------------------------------------------------------------

/**
 * Delete a task owned by the authenticated user.
 * Returns 404 if no row was affected — this deliberately does not distinguish
 * between "task doesn't exist" and "task belongs to another user" to avoid
 * leaking information about other users' task IDs.
 *
 * Path param: id (UUID)
 *
 * Response 200: { success: true }
 * Response 400: invalid UUID
 * Response 404: task not found
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Validate UUID format before touching the database
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid task ID.' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // RLS enforces ownership — delete will affect 0 rows if not the owner
    const { data: deleted, error: dbError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .select('id')
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        // No rows affected — task not found or not owned by user
        return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
      }
      console.error('[DELETE /api/tasks/[id]] db error:', dbError.message);
      return NextResponse.json({ error: 'Failed to delete task.' }, { status: 500 });
    }

    if (!deleted) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/tasks/[id]] unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
