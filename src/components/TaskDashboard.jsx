'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { getTasks, createTask, toggleTaskCompletion, deleteTask } from '@/lib/api';
import { TaskCard } from './TaskCard';
import { TaskCardSkeleton } from './TaskCardSkeleton';
import { EmptyState } from './EmptyState';
import { Toast } from './Toast';
import { FilterBar } from './FilterBar';

export function TaskDashboard({ user }) {
  const { signOut } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    completed: undefined,
    priority: '',
    category: '',
  });

  const searchDebounceRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const fetchTasks = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await getTasks({
      search: params.search || undefined,
      completed: params.completed,
      priority: params.priority || undefined,
      category: params.category || undefined,
    });
    setLoading(false);
    if (fetchError) {
      setError(fetchError);
      return;
    }
    setTasks(data?.tasks ?? []);
  }, []);

  useEffect(() => {
    fetchTasks({
      search: debouncedSearch,
      completed: filters.completed,
      priority: filters.priority,
      category: filters.category,
    });
  }, [fetchTasks, debouncedSearch, filters.completed, filters.priority, filters.category]);

  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 350);
    return () => clearTimeout(searchDebounceRef.current);
  }, [filters.search]);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    const title = quickAddTitle.trim();
    if (!title) return;
    setQuickAddLoading(true);
    const { data, error: createError } = await createTask({ title });
    setQuickAddLoading(false);
    if (createError) {
      showToast(createError, 'error');
      return;
    }
    setQuickAddTitle('');
    setTasks((prev) => [data, ...prev]);
    showToast('Task added');
  };

  const handleToggle = async (task) => {
    const newValue = !task.is_completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, is_completed: newValue } : t))
    );
    const { error: toggleError } = await toggleTaskCompletion(task.id, newValue);
    if (toggleError) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, is_completed: task.is_completed } : t))
      );
      showToast(toggleError, 'error');
    }
  };

  const handleDelete = async (taskId) => {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    const { error: deleteError } = await deleteTask(taskId);
    if (deleteError) {
      setTasks(previous);
      showToast(deleteError, 'error');
      return;
    }
    showToast('Task deleted');
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const activeTasks = tasks.filter((t) => !t.is_completed);
  const completedTasks = tasks.filter((t) => t.is_completed);

  return (
    <div className="min-h-screen bg-zinc-950">
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
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

      {/* Main */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white tracking-tight">My Tasks</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Stay on top of what matters.</p>
        </div>

        {/* Quick add */}
        <form onSubmit={handleQuickAdd} className="mb-5">
          <div className="flex gap-2">
            <input
              type="text"
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              placeholder="Add a task…"
              maxLength={255}
              className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm outline-none transition"
            />
            <button
              type="submit"
              disabled={quickAddLoading || !quickAddTitle.trim()}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl text-sm font-medium transition-colors duration-150 flex items-center gap-2 shrink-0"
            >
              {quickAddLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <PlusIcon className="w-4 h-4" />
              )}
              Add
            </button>
          </div>
        </form>

        {/* Filter bar */}
        <FilterBar filters={filters} onChange={setFilters} />

        {/* Task list */}
        <div className="mt-4 space-y-6">
          {error && (
            <div className="bg-red-950/40 border border-red-800 rounded-xl px-4 py-3 flex items-start gap-3">
              <AlertIcon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 text-sm font-medium">Failed to load tasks</p>
                <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
              </div>
              <button
                onClick={() => fetchTasks({ search: debouncedSearch, ...filters })}
                className="ml-auto text-xs text-red-400 hover:text-red-200 underline"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <TaskCardSkeleton key={i} />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState hasFilters={!!debouncedSearch || !!filters.priority || !!filters.category || filters.completed !== undefined} />
          ) : (
            <>
              {activeTasks.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 px-1">
                    Active · {activeTasks.length}
                  </h2>
                  <div className="space-y-2">
                    {activeTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        onEdit={(id) => router.push(`/tasks/${id}/edit`)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {completedTasks.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 px-1">
                    Completed · {completedTasks.length}
                  </h2>
                  <div className="space-y-2 opacity-60">
                    {completedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        onEdit={(id) => router.push(`/tasks/${id}/edit`)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function CheckSquareIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function PlusIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function AlertIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
