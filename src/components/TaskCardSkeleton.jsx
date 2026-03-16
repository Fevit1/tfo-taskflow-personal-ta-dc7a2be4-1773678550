'use client';

export function TaskCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 flex items-start gap-3.5 animate-pulse">
      {/* Circle */}
      <div className="mt-0.5 w-5 h-5 rounded-full bg-zinc-800 shrink-0" />
      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-zinc-800 rounded w-3/4" />
        <div className="h-3 bg-zinc-800 rounded w-1/2" />
        <div className="flex gap-2 mt-1">
          <div className="h-5 w-14 bg-zinc-800 rounded-full" />
          <div className="h-5 w-20 bg-zinc-800 rounded-full" />
        </div>
      </div>
    </div>
  );
}
