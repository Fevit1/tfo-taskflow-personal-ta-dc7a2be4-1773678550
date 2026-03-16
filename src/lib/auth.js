import { createClient } from './supabase';

/**
 * Send a magic link to the provided email address.
 * Always returns a generic success shape to prevent email enumeration.
 *
 * @param {string} email
 * @returns {{ success: boolean, error: string | null }}
 */
export async function signInWithMagicLink(email) {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      // Redirect the user here after clicking the magic link.
      // The /auth/callback route will exchange the token for a session.
      emailRedirectTo: `${getBaseUrl()}/auth/callback`,
    },
  });

  // Do NOT expose whether the email exists — always return the same message.
  if (error) {
    // Log internally for debugging but do not surface to the client.
    console.error('[auth] signInWithMagicLink error:', error.message);
    // Return a generic error only for non-email-existence issues (e.g. rate limiting).
    if (error.status === 429) {
      return { success: false, error: 'Too many requests. Please wait before trying again.' };
    }
    // For all other errors, still show the generic confirmation to prevent enumeration.
  }

  return { success: true, error: null };
}

/**
 * Sign the current user out and clear the session cookie.
 *
 * @returns {{ error: string | null }}
 */
export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('[auth] signOut error:', error.message);
    return { error: 'Failed to sign out. Please try again.' };
  }

  return { error: null };
}

/**
 * Get the current session (browser-side).
 * Returns null if the user is not authenticated.
 *
 * @returns {Promise<import('@supabase/supabase-js').Session | null>}
 */
export async function getSession() {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('[auth] getSession error:', error.message);
    return null;
  }

  return session;
}

/**
 * Get the currently authenticated user (browser-side).
 * Prefers getUser() over getSession().user for security — verifies JWT server-side.
 *
 * @returns {Promise<import('@supabase/supabase-js').User | null>}
 */
export async function getUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    // 'Auth session missing' is expected for unauthenticated users — not a real error.
    if (!error.message.includes('Auth session missing')) {
      console.error('[auth] getUser error:', error.message);
    }
    return null;
  }

  return user;
}

/**
 * Derive the base URL for the current environment.
 * Used to construct the magic link callback URL.
 */
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Server-side fallback
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}
