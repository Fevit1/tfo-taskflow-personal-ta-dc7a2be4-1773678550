import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { sanitizeText } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Title is required.' })
    .trim()
    .min(1, 'Title cannot be empty.')
    .max(255, 'Title must be 255 characters or fewer.'),
  description: z
    .string()
    .trim()
    .max(5000, 'Description must be 5000 characters or fewer.')
    .optional()
    .nullable(),
  priority: z
    .enum(['low', 'medium', 'high'], {
      errorMap: () => ({ message: "Priority must be 'low', 'medium', or 'high'." }),
    })
    .default('medium'),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'due_date must be in YYYY-MM-DD format.')
    .optional()
    .nullable(),
  category: z
    .string()
    .trim()
    .max(100, 'Category must be 100 characters or fewer.')
    .optional()
    .nullable(),
});

const getTasksQuerySchema = z.object({
  completed: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().trim().max(100).optional(),
  search: z.string().trim().max(255).optional(),
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((n) => n >= 1, 'page must be >= 1')
    .default('1'),
  pageSize: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((n) => n >= 1 && n <= 100, 'pageSize must be between 1 and 100')
    .default('50'),
});

// ---------------------------------------------------------------------------
// GET /api/tasks
// ---------------------------------------------------------------------------

/**
 * Fetch all tasks for the authenticated user.
 * Supports filtering by completion status, priority, category, and keyword search.
 * Results are ordered by sort_order ASC, then created_at ASC.
 * Paginated: default page=1, pageSize=50, max pageSize=100.
 *
 * Query params:
 *   - completed: 'true' | 'false'
 *   - priority:  'low' | 'medium' | 'high'
 *   - category:  string
 *   - search:    string (matches title or description, case-insensitive)
 *   - page:      integer >= 1
 *   - pageSize:  integer 1–100
 *
 * Response 200:
 *   { tasks: Task[], total: number, page: number, pageSize: number }
 */
export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());
    const parseResult = getTasksQuerySchema.safeParse(rawParams);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters.', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { completed, priority, category, search, page, pageSize } = parseResult.data;
    const offset = (page - 1) * pageSize;

    // Build the base query — RLS ensures only this user's rows are returned
    let query = supabase
      .from('tasks')
      .select('*', { count: 'exact' })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (completed !== undefined) {
      query = query.eq('is_completed', completed);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      // Case-insensitive full-text search across title and description
      query = query.or(
        `title.ilike.%${search.replace(/[%_]/g, '\\$&')}%,description.ilike.%${search.replace(/[%_]/g, '\\$&')}%`
      );
    }

    const { data: tasks, error: dbError, count } = await query;

    if (dbError) {
      console.error('[GET /api/tasks] db error:', dbError.message);
      return NextResponse.json({ error: 'Failed to fetch tasks.' }, { status: 500 });
    }

    return NextResponse.json({
      tasks: tasks ?? [],
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (err) {
    console.error('[GET /api/tasks] unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/tasks
// ---------------------------------------------------------------------------

/**
 * Create a new task for the authenticated user.
 * user_id is always taken from the session — never from the request body.
 *
 * Request body (JSON):
 *   { title, description?, priority?, due_date?, category? }
 *
 * Response 201:
 *   Task
 */
export async function POST(request) {
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

    // Validate with Zod
    const parseResult = createTaskSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed.', details: parseResult.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const validated = parseResult.data;

    // Sanitize all text fields before storage
    const sanitizedTitle       = sanitizeText(validated.title);
    const sanitizedDescription = validated.description ? sanitizeText(validated.description) : null;
    const sanitizedCategory    = validated.category    ? sanitizeText(validated.category)    : null;

    if (!sanitizedTitle) {
      return NextResponse.json({ error: 'Title cannot be empty after sanitization.' }, { status: 422 });
    }

    // Insert — user_id is always set from the verified session
    const { data: task, error: dbError } = await supabase
      .from('tasks')
      .insert({
        user_id:     user.id,
        title:       sanitizedTitle,
        description: sanitizedDescription,
        priority:    validated.priority,
        due_date:    validated.due_date ?? null,
        category:    sanitizedCategory,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[POST /api/tasks] db error:', dbError.message);
      return NextResponse.json({ error: 'Failed to create task.' }, { status: 500 });
    }

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error('[POST /api/tasks] unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
