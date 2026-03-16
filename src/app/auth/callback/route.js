import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * GET /auth/callback
 *
 * Supabase redirects the user here after they click the magic link.
 * This route exchanges the one-time token (OTP) or PKCE code for a
 * full session and writes it to a secure httpOnly cookie.
 *
 * Query params Supabase may send:
 *   - code: PKCE authorization code (preferred flow)
 *   - token_hash + type: older OTP hash flow
 *   - error / error_description: if something went wrong
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // If Supabase returned an error in the URL, redirect to login with a generic message.
  if (error) {
    console.error('[auth/callback] Supabase error:', error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=link_invalid`,
      { status: 302 }
    );
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, {
            ...options,
            // Enforce secure cookie settings regardless of what Supabase defaults to.
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          });
        });
      },
    },
  });

  // --- PKCE flow (code exchange) ---
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      console.error('[auth/callback] exchangeCodeForSession error:', exchangeError.message);
      return NextResponse.redirect(`${origin}/login?error=link_invalid`, { status: 302 });
    }
    return NextResponse.redirect(`${origin}/tasks`, { status: 302 });
  }

  // --- OTP token_hash flow ---
  if (tokenHash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (verifyError) {
      console.error('[auth/callback] verifyOtp error:', verifyError.message);
      return NextResponse.redirect(`${origin}/login?error=link_invalid`, { status: 302 });
    }
    return NextResponse.redirect(`${origin}/tasks`, { status: 302 });
  }

  // No valid params — redirect to login.
  return NextResponse.redirect(`${origin}/login?error=link_invalid`, { status: 302 });
}
