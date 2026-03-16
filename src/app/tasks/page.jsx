import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { TaskDashboard } from '@/components/TaskDashboard';

export const metadata = {
  title: 'My Tasks — TaskFlow',
};

/**
 * TasksPage
 * Server Component — verifies auth server-side before rendering.
 * Passes the user object to the client dashboard component.
 */
export default async function TasksPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <TaskDashboard user={user} />;
}