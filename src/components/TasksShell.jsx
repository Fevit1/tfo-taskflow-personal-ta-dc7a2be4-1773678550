'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

/**
 * TasksShell
 * Foundation-scope shell for the /tasks page.
 * Renders the page header, empty state, and a placeholder quick-add bar.
 * Full task list, TaskCard, and CRUD functionality are out of scope for foundation.
 *
 * @param {{ user: import('@supabase/supabase-js').User }} props
 */
export function TasksShell({ user }) {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ------------------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------------------ */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <CheckSquareIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold tracking-tight">TaskFlow</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-zinc-500 text-sm hidden sm:block truncate max-w-[200px]">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors duration-150"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Main content */}
      {/* ------------------------------------------------------------------ */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white tracking-tight">My Tasks</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Stay on top of what matters.</p>
        </div>

        {/* Quick-add input placeholder */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a task&hellip;"
              disabled
              className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-500 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm cursor-not-allowed"
            />
            <button
              disabled
              className="bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl text-sm font-medium"
            >
              Add
            </button>
          </div>
          <p className="text-zinc-600 text-xs mt-2 ml-1">Full task creation coming in core build.</p>
        </div>

        {/* Task list container — empty state for foundation */}
        <TaskListContainer />
      </main>
    </div>
  );
}

/**
 * TaskListContainer
 * Placeholder that will be replaced by the full TaskList component in core build.
 * Renders the empty state for new users.
 */
function TaskListContainer() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl">
      {/* Filter bar placeholder */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
        <div className="h-7 w-16 bg-zinc-800 rounded-lg animate-none opacity-50" />
        <div className="h-7 w-20 bg-zinc-800 rounded-lg opacity-50" />
        <div className="h-7 w-16 bg-zinc-800 rounded-lg opacity-50" />
        <div className="ml-auto h-7 w-28 bg-zinc-800 rounded-lg opacity-50" />
      </div>

      {/* Empty state */}
      <EmptyState />
    </div>
  );
}

/**
 * EmptyState
 * Shown when the authenticated user has no tasks yet.
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
        <ClipboardIcon className="w-7 h-7 text-zinc-500" />
      </div>
      <h3 className="text-white font-medium mb-1">No tasks yet</h3>
      <p className="text-zinc-500 text-sm max-w-xs">
        Your task list is empty. Add your first task using the input above to get started.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function CheckSquareIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function ClipboardIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}
