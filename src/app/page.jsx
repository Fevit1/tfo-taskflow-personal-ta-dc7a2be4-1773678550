/**
 * Root page (/).
 * In practice, the Next.js middleware handles the smart redirect:
 *   - Authenticated  → /tasks
 *   - Unauthenticated → /login
 *
 * This component is a safety net in case the middleware redirect
 * is bypassed for any reason.
 */
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export default async function RootPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/tasks');
  } else {
    redirect('/login');
  }
}
