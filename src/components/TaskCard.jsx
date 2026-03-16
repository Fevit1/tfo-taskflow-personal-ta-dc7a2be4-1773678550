'use client';

import { useState } from 'react';

const PRIORITY_CONFIG = {
  high:   { label: 'High',   classes: 'bg-red-950/60 text-red-400 border border-red-800/50' },
  medium: { label: 'Medium', classes: 'bg-amber-950/60 text-amber-400 border border-amber-800/50' },
  low:    { label: 'Low',    classes: 'bg-blue-950/60 text-blue-400 border border-blue-800/50' },
};

export function TaskCard({ task, onToggle, onDelete, onEdit }) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;

  const isOverdue =
    task.due_date &&
    !task.is_completed &&
    new Date(task.due_date + 'T00:00:00') < new Date(new Date().toDateString());

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      className={`group bg-zinc-900 border rounded-xl px-4 py-3.5 flex items-start gap-3.5 transition-all duration-150 ${
        task.is_completed
          ? 'border-zinc-800/60'
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Completion toggle */}
      <button
        onClick={() => onToggle(task)}
        aria-label={task.is_completed ? 'Mark incomplete' : 'Mark complete'}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150 ${
          task.is_completed
            ? 'bg-violet-600 border-violet-600'
            : 'border-zinc-600 hover:border-violet-500'
        }`}
      >
        {task.is_completed && (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2 6 5 9 10 3" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium leading-snug ${
            task.is_completed ? 'line-through text-zinc-500' : 'text-white'
          }`}
        >
          {task.title}
        </p>

        {task.description && (
          <p className={`text-xs mt-1 leading-relaxed line-clamp-2 ${
            task.is_completed ? 'text-zinc-600' : 'text-zinc-400'
          }`}>
            {task.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${priority.classes}`}>
            {priority.label}
          </span>

          {task.category && (
            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              <TagIcon className="w-3 h-3 mr-1" />
              {task.category}
            </span>
          )}

          {task.due_date && (
            <span className={`inline-flex items-center text-xs gap-1 ${
              isOverdue ? 'text-red-400' : 'text-zinc-500'
            }`}>
              <CalendarIcon className="w-3 h-3" />
              {isOverdue ? 'Overdue · ' : ''}{formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={() => onEdit(task.id)}
          aria-label="Edit task"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors duration-150"
        >
          <PencilIcon className="w-3.5 h-3.5" />
        </button>

        {deleteConfirm ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => { onDelete(task.id); setDeleteConfirm(false); }}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-500 text-white transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setDeleteConfirm(false)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setDeleteConfirm(true)}
            aria-label="Delete task"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors duration-150"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function PencilIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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

function XIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function TagIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
