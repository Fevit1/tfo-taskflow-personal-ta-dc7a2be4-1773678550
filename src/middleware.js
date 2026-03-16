import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Middleware runs on every matched request before it reaches any page or API route.
 *
 * Responsibilities:
 * 1. Refresh the Supabase session token if it is approaching expiry.
 * 2. Enforce authentication — redirect unauthenticated requests to /login.
 * 3. Redirect authenticated users away from /login back to /tasks.
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Build a Supabase client that can read/write cookies on the response.
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Write updated cookies onto the response so the browser receives them.
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, {
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          });
        });
      },
    },
  });

  // IMPORTANT: Call getUser() here — not getSession().
  // getUser() validates the JWT against Supabase's servers, preventing
  // forged or tampered tokens from bypassing the middleware.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;

  // --- Route protection rules ---

  // Unauthenticated users trying to access protected routes → /login
  const isProtectedRoute =
    pathname.startsWith('/tasks') || pathname.startsWith('/api/');

  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated users trying to visit /login or / → /tasks
  const isAuthRoute = pathname === '/login' || pathname === '/';

  if (isAuthenticated && isAuthRoute) {
    const tasksUrl = new URL('/tasks', request.url);
    return NextResponse.redirect(tasksUrl);
  }

  // Unauthenticated users at / → /login
  if (!isAuthenticated && pathname === '/') {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

/**
 * Matcher config — run middleware on all routes except:
 * - Static files (_next/static, _next/image)
 * - Public assets (favicon, images, etc.)
 * - The auth callback route itself (must be reachable without a session)
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
