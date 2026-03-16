import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { TasksShell } from '@/components/TasksShell';

export const metadata = {
  title: 'My Tasks — TaskFlow',
};

/**
 * TasksPage
 * Server Component — verifies auth server-side before rendering.
 * Passes the user object to the client shell component.
 */
export default async function TasksPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Belt-and-suspenders: middleware should have already redirected,
  // but we guard here too in case of any edge case.
  if (!user) {
    redirect('/login');
  }

  return <TasksShell user={user} />;
}
