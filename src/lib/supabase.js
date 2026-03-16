import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Browser-side Supabase client.
 * Use this in Client Components and browser-only code.
 * Session is managed automatically via cookies by @supabase/ssr.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
