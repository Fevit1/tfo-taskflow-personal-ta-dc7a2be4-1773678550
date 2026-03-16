'use client';

const STATUS_OPTIONS = [
  { label: 'All',       value: undefined },
  { label: 'Active',    value: false },
  { label: 'Done',      value: true },
];

const PRIORITY_OPTIONS = [
  { label: 'Any priority', value: '' },
  { label: 'High',         value: 'high' },
  { label: 'Medium',       value: 'medium' },
  { label: 'Low',          value: 'low' },
];

export function FilterBar({ filters, onChange }) {
  const set = (key, value) => onChange((prev) => ({ ...prev, [key]: value }));

  const hasActiveFilters =
    filters.search ||
    filters.priority ||
    filters.category ||
    filters.completed !== undefined;

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          placeholder="Search tasks…"
          className="w-full bg-zinc-900 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-white placeholder-zinc-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition"
        />
        {filters.search && (
          <button
            onClick={() => set('search', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Status + Priority row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Status tabs */}
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => set('completed', opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 ${
                filters.completed === opt.value
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Priority select */}
        <select
          value={filters.priority}
          onChange={(e) => set('priority', e.target.value)}
          className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-violet-500 transition cursor-pointer"
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Category filter */}
        <div className="relative">
          <input
            type="text"
            value={filters.category}
            onChange={(e) => set('category', e.target.value)}
            placeholder="Category…"
            className="bg-zinc-900 border border-zinc-800 focus:border-violet-500 text-zinc-300 placeholder-zinc-600 text-xs rounded-lg pl-3 pr-7 py-2 outline-none transition w-32"
          />
          {filters.category && (
            <button
              onClick={() => set('category', '')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <XIcon className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            onClick={() => onChange({ search: '', completed: undefined, priority: '', category: '' })}
            className="text-xs text-zinc-500 hover:text-white transition-colors ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

function SearchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
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
