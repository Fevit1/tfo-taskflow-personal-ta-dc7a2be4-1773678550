'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

/**
 * ProtectedRoute
 * Wraps a page component and ensures only authenticated users can view it.
 * Server-side middleware is the primary guard; this is a client-side fallback
 * to handle edge cases (e.g. token expiry during an active session).
 *
 * Usage:
 *   export default function TasksPage() {
 *     return (
 *       <ProtectedRoute>
 *         <TaskDashboard />
 *       </ProtectedRoute>
 *     );
 *   }
 *
 * @param {{ children: React.ReactNode, redirectTo?: string }} props
 */
export function ProtectedRoute({ children, redirectTo = '/login' }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  // Show a full-screen loading state while session is being resolved.
  if (loading) {
    return <AuthLoadingScreen />;
  }

  // Don't render children if the user is not authenticated.
  // The useEffect above will trigger a redirect momentarily.
  if (!user) {
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
}

/**
 * Full-screen loading spinner shown while auth state is being determined.
 */
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm">Loading&hellip;</p>
      </div>
    </div>
  );
}
