'use client';

export function EmptyState({ hasFilters = false }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
        {hasFilters ? (
          <SearchIcon className="w-7 h-7 text-zinc-500" />
        ) : (
          <ClipboardIcon className="w-7 h-7 text-zinc-500" />
        )}
      </div>
      <h3 className="text-white font-medium mb-1">
        {hasFilters ? 'No matching tasks' : 'No tasks yet'}
      </h3>
      <p className="text-zinc-500 text-sm max-w-xs">
        {hasFilters
          ? 'Try adjusting your filters or search query to find what you\'re looking for.'
          : 'Add your first task using the input above to get started.'}
      </p>
    </div>
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

function SearchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
