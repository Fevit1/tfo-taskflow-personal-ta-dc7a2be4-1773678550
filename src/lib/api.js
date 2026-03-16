/**
 * TaskFlow API Client
 * -------------------
 * All data operations the frontend needs, organized as clean async functions.
 * These call the Next.js API route handlers (not Supabase directly) so that
 * Zod validation, input sanitization, and server-side auth checks run on every
 * request.
 *
 * Return shape convention:
 *   { data: T | null, error: string | null }
 *
 * Usage example:
 *   const { data, error } = await getTasks({ priority: 'high' });
 */

// ---------------------------------------------------------------------------
// Types (JSDoc)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Task
 * @property {string}  id           - UUID
 * @property {string}  user_id      - UUID of owning user
 * @property {string}  title        - 1–255 chars
 * @property {string|null} description  - up to 5000 chars
 * @property {boolean} is_completed
 * @property {'low'|'medium'|'high'} priority
 * @property {string|null} due_date  - ISO date string (YYYY-MM-DD)
 * @property {string|null} category  - up to 100 chars
 * @property {number}  sort_order
 * @property {string}  created_at   - ISO timestamp
 * @property {string}  updated_at   - ISO timestamp
 */

/**
 * @typedef {Object} ApiResult
 * @template T
 * @property {T|null}      data
 * @property {string|null} error
 */

/**
 * @typedef {Object} GetTasksParams
 * @property {boolean}             [completed]  - filter by completion status
 * @property {'low'|'medium'|'high'} [priority] - filter by priority
 * @property {string}              [category]   - filter by category
 * @property {string}              [search]     - keyword search on title/description
 * @property {number}              [page]       - 1-based page number (default 1)
 * @property {number}              [pageSize]   - results per page (default 50, max 100)
 */

/**
 * @typedef {Object} CreateTaskPayload
 * @property {string}              title        - required, 1–255 chars
 * @property {string}              [description]
 * @property {'low'|'medium'|'high'} [priority] - default 'medium'
 * @property {string}              [due_date]   - YYYY-MM-DD
 * @property {string}              [category]
 */

/**
 * @typedef {Object} UpdateTaskPayload
 * @property {string}              [title]
 * @property {string}              [description]
 * @property {boolean}             [is_completed]
 * @property {'low'|'medium'|'high'} [priority]
 * @property {string}              [due_date]
 * @property {string}              [category]
 * @property {number}              [sort_order]
 */

/**
 * @typedef {Object} ReorderPayload
 * @property {{ id: string, sort_order: number }[]} updates - array of id + new sort_order
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Generic fetch wrapper that:
 * - Attaches JSON content-type header
 * - Parses the JSON response body
 * - Normalizes errors into the { data, error } shape
 *
 * @template T
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<ApiResult<T>>}
 */
async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    let body = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await res.json();
    }

    if (!res.ok) {
      const message =
        body?.error ||
        body?.message ||
        `Request failed with status ${res.status}`;
      return { data: null, error: message };
    }

    return { data: body, error: null };
  } catch (err) {
    // Network error or JSON parse failure
    console.error('[api] fetch error:', err);
    return { data: null, error: 'Network error. Please check your connection.' };
  }
}

// ---------------------------------------------------------------------------
// Task API functions
// ---------------------------------------------------------------------------

/**
 * Fetch all tasks for the current user.
 * Supports filtering by status, priority, category, and keyword search.
 * Results are paginated.
 *
 * @param {GetTasksParams} [params]
 * @returns {Promise<ApiResult<{ tasks: Task[], total: number, page: number, pageSize: number }>>}
 */
export async function getTasks(params = {}) {
  const {
    completed,
    priority,
    category,
    search,
    page = 1,
    pageSize = 50,
  } = params;

  const qs = new URLSearchParams();

  if (completed !== undefined) qs.set('completed', String(completed));
  if (priority)               qs.set('priority', priority);
  if (category)               qs.set('category', category);
  if (search)                 qs.set('search', search);
  qs.set('page', String(Math.max(1, page)));
  qs.set('pageSize', String(Math.min(100, Math.max(1, pageSize))));

  const query = qs.toString();
  return apiFetch(`/api/tasks${query ? `?${query}` : ''}`);
}

/**
 * Create a new task.
 *
 * @param {CreateTaskPayload} payload
 * @returns {Promise<ApiResult<Task>>}
 */
export async function createTask(payload) {
  return apiFetch('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update any fields on an existing task.
 * Also used for toggling is_completed.
 *
 * @param {string}            taskId  - UUID
 * @param {UpdateTaskPayload} payload
 * @returns {Promise<ApiResult<Task>>}
 */
export async function updateTask(taskId, payload) {
  if (!taskId) return { data: null, error: 'Task ID is required.' };
  return apiFetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Toggle a task's completion status.
 * Convenience wrapper around updateTask.
 *
 * @param {string}  taskId
 * @param {boolean} isCompleted - the NEW desired value
 * @returns {Promise<ApiResult<Task>>}
 */
export async function toggleTaskCompletion(taskId, isCompleted) {
  return updateTask(taskId, { is_completed: isCompleted });
}

/**
 * Delete a task by ID.
 * Returns 404 if the task does not exist or belongs to another user.
 *
 * @param {string} taskId - UUID
 * @returns {Promise<ApiResult<{ success: true }>>}
 */
export async function deleteTask(taskId) {
  if (!taskId) return { data: null, error: 'Task ID is required.' };
  return apiFetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: 'DELETE',
  });
}

/**
 * Batch-update sort_order values for drag-and-drop reordering.
 *
 * @param {ReorderPayload} payload
 * @returns {Promise<ApiResult<{ success: true }>>}
 */
export async function reorderTasks(payload) {
  if (!payload?.updates?.length) {
    return { data: null, error: 'No updates provided.' };
  }
  return apiFetch('/api/tasks/reorder', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Pagination helper
// ---------------------------------------------------------------------------

/**
 * Build pagination metadata from an API response.
 *
 * @param {number} total    - total number of matching records
 * @param {number} page     - current page (1-based)
 * @param {number} pageSize - records per page
 * @returns {{ currentPage: number, totalPages: number, hasNextPage: boolean, hasPrevPage: boolean, total: number }}
 */
export function buildPaginationMeta(total, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    currentPage: page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    total,
  };
}
