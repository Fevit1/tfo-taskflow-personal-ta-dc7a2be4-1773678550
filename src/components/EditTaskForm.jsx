'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTasks, updateTask, deleteTask } from '@/lib/api';
import { Toast } from './Toast';

const PRIORITY_OPTIONS = [
  { label: 'Low',    value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High',   value: 'high' },
];

export function EditTaskForm({ taskId }) {
  const router = useRouter();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    category: '',
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    const loadTask = async () => {
      setLoading(true);
      // Fetch with no filters — we need to get a single task by id
      // We'll fetch all then find ours (simple approach for personal app)
      const { data, error } = await getTasks({ pageSize: 100 });
      setLoading(false);
      if (error) {
        setFetchError(error);
        return;
      }
      const found = data?.tasks?.find((t) => t.id === taskId);
      if (!found) {
        setFetchError('Task not found.');
        return;
      }
      setTask(found);
      setForm({
        title: found.title ?? '',
        description: found.description ?? '',
        priority: found.priority ?? 'medium',
        due_date: found.due_date ?? '',
        category: found.category ?? '',
      });
    };
    loadTask();
  }, [taskId]);

  const validate = () => {
    const errors = {};
    if (!form.title.trim()) errors.title = 'Title is required.';
    if (form.title.length > 255) errors.title = 'Title must be 255 characters or fewer.';
    if (form.description.length > 5000) errors.description = 'Description must be 5000 characters or fewer.';
    if (form.category.length > 100) errors.category = 'Category must be 100 characters or fewer.';
    if (form.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(form.due_date)) errors.due_date = 'Enter a valid date.';
    return errors;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      due_date: form.due_date || null,
      category: form.category.trim() || null,
    };
    const { error } = await updateTask(taskId, payload);
    setSaving(false);
    if (error) {
      showToast(error, 'error');
      return;
    }
    showToast('Task saved');
    setTimeout(() => router.push('/tasks'), 800);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await deleteTask(taskId);
    setDeleting(false);
    if (error) {
      showToast(error, 'error');
      setDeleteConfirm(false);
      return;
    }
    router.push('/tasks');
  };

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{fetchError}</p>
          <button
            onClick={() => router.push('/tasks')}
            className="text-sm text-zinc-400 hover:text-white underline"
          >
            ← Back to tasks
          </button>
        </div>
      </div>
    );
  }

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
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => router.push('/tasks')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to tasks
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
              <CheckSquareIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-semibold tracking-tight text-sm">TaskFlow</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white">Edit Task</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Update task details or delete it permanently.</p>
        </div>

        <form onSubmit={handleSave} noValidate className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              maxLength={255}
              className={`w-full bg-zinc-900 border text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm outline-none transition ${
                formErrors.title
                  ? 'border-red-600 focus:border-red-500'
                  : 'border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500'
              }`}
            />
            {formErrors.title && (
              <p className="text-red-400 text-xs mt-1">{formErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              maxLength={5000}
              rows={4}
              placeholder="Optional details…"
              className={`w-full bg-zinc-900 border text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm outline-none transition resize-none ${
                formErrors.description
                  ? 'border-red-600 focus:border-red-500'
                  : 'border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500'
              }`}
            />
            <div className="flex justify-between items-center mt-1">
              {formErrors.description ? (
                <p className="text-red-400 text-xs">{formErrors.description}</p>
              ) : <span />}
              <p className="text-zinc-600 text-xs">{form.description.length}/5000</p>
            </div>
          </div>

          {/* Priority + Due date row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Priority</label>
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('priority', opt.value)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors duration-150 ${
                      form.priority === opt.value
                        ? opt.value === 'high'
                          ? 'bg-red-600 border-red-600 text-white'
                          : opt.value === 'medium'
                          ? 'bg-amber-600 border-amber-600 text-white'
                          : 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Due date */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => set('due_date', e.target.value)}
                className={`w-full bg-zinc-900 border text-white rounded-xl px-4 py-2.5 text-sm outline-none transition ${
                  formErrors.due_date
                    ? 'border-red-600'
                    : 'border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500'
                } [color-scheme:dark]`}
              />
              {formErrors.due_date && (
                <p className="text-red-400 text-xs mt-1">{formErrors.due_date}</p>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Category</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              maxLength={100}
              placeholder="e.g. Work, Personal, Shopping…"
              className={`w-full bg-zinc-900 border text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm outline-none transition ${
                formErrors.category
                  ? 'border-red-600 focus:border-red-500'
                  : 'border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500'
              }`}
            />
            {formErrors.category && (
              <p className="text-red-400 text-xs mt-1">{formErrors.category}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            {/* Delete */}
            <div className="flex items-center gap-2">
              {deleteConfirm ? (
                <>
                  <span className="text-zinc-400 text-xs">Are you sure?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {deleting && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(false)}
                    className="text-zinc-500 hover:text-white text-xs px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-1.5 text-zinc-500 hover:text-red-400 text-sm transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete task
                </button>
              )}
            </div>

            {/* Save */}
            <button
              type="submit"
              disabled={saving}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors duration-150 flex items-center gap-2"
            >
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function ArrowLeftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
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

function TrashIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}
