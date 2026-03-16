import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { isValidUUID } from '@/lib/validate';

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const reorderSchema = z.object({
  updates: z
    .array(
      z.object({
        id:         z.string().refine(isValidUUID, { message: 'Each id must be a valid UUID.' }),
        sort_order: z.number().int().min(0, 'sort_order must be a non-negative integer.'),
      })
    )
    .min(1, 'At least one update is required.')
    .max(200, 'Cannot reorder more than 200 tasks at once.'),
});

// ---------------------------------------------------------------------------
// PUT /api/tasks/reorder
// ---------------------------------------------------------------------------

/**
 * Batch-update the sort_order of multiple tasks in a single request.
 * Used by the drag-and-drop reorder UI.
 *
 * All task IDs must belong to the authenticated user — RLS enforces this
 * at the database level. Any ID that does not belong to the user is silently
 * skipped (no error, no data leak).
 *
 * Request body:
 *   { updates: [{ id: string, sort_order: number }, ...] }
 *
 * Payload is limited to 200 items to prevent abuse.
 *
 * Response 200: { success: true, updated: number }
 * Response 400: invalid UUIDs or malformed body
 * Response 422: validation failure
 */
export async function PUT(request) {
  try {
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

    // Validate
    const parseResult = reorderSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed.', details: parseResult.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { updates } = parseResult.data;

    // Execute updates as individual upserts inside a transaction-like pattern.
    // Supabase does not expose multi-row update with different values per row
    // via the JS client, so we run them as a batch of individual updates.
    // RLS on each update ensures users can only affect their own tasks.
    const results = await Promise.allSettled(
      updates.map(({ id, sort_order }) =>
        supabase
          .from('tasks')
          .update({ sort_order })
          .eq('id', id)
          .select('id')
      )
    );

    // Count successful updates
    const updatedCount = results.filter(
      (r) => r.status === 'fulfilled' && !r.value.error && (r.value.data?.length ?? 0) > 0
    ).length;

    // Log any individual failures for debugging (without surfacing them to the client)
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`[PUT /api/tasks/reorder] update ${i} rejected:`, r.reason);
      } else if (r.value.error) {
        console.error(`[PUT /api/tasks/reorder] update ${i} error:`, r.value.error.message);
      }
    });

    return NextResponse.json({ success: true, updated: updatedCount });
  } catch (err) {
    console.error('[PUT /api/tasks/reorder] unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
