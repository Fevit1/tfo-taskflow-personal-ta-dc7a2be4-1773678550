import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { EditTaskForm } from '@/components/EditTaskForm';

export const metadata = {
  title: 'Edit Task — TaskFlow',
};

export default async function EditTaskPage({ params }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  return <EditTaskForm taskId={id} />;
}
