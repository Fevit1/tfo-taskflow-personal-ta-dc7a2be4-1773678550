'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithMagicLink } from '@/lib/auth';
import { useAuth } from '@/components/AuthProvider';

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * LoginPage
 * Route: /login
 *
 * Handles the magic link (passwordless) authentication flow:
 * 1. User enters their email and submits.
 * 2. Supabase sends a magic link to that address.
 * 3. We always show a generic "check your email" confirmation.
 * 4. After RESEND_COOLDOWN_SECONDS, the user may request another link.
 */
export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState('idle'); // 'idle' | 'loading' | 'sent' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);

  // Redirect already-authenticated users away from the login page.
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/tasks');
    }
  }, [user, authLoading, router]);

  // Manage the resend cooldown countdown timer.
  useEffect(() => {
    if (cooldown <= 0) {
      clearInterval(cooldownRef.current);
      return;
    }
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, [cooldown]);

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (cooldown > 0) return;

    setSubmitState('loading');

    const { success, error } = await signInWithMagicLink(email);

    if (!success && error) {
      setSubmitState('error');
      setErrorMessage(error);
      return;
    }

    // Always show the generic confirmation regardless of whether the email exists.
    setSubmitState('sent');
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setSubmitState('loading');
    setErrorMessage('');

    const { success, error } = await signInWithMagicLink(email);

    if (!success && error) {
      setSubmitState('error');
      setErrorMessage(error);
      return;
    }

    setSubmitState('sent');
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  const handleEditEmail = () => {
    setSubmitState('idle');
    setErrorMessage('');
    setCooldown(0);
    clearInterval(cooldownRef.current);
  };

  // Don't flash the login page while we check if the user is already authed.
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Wordmark */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-600 mb-4">
            <CheckSquareIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">TaskFlow</h1>
          <p className="text-zinc-400 text-sm mt-1">Your personal task organizer</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
          {submitState !== 'sent' ? (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-medium text-white">Sign in</h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Enter your email and we&apos;ll send you a magic link.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-4">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-zinc-300 mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dan@example.com"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                    disabled={submitState === 'loading'}
                  />
                </div>

                {/* Error message */}
                {errorMessage && (
                  <div className="mb-4 flex items-start gap-2 bg-red-950/50 border border-red-800 rounded-lg px-3 py-2.5">
                    <AlertIcon className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-red-300 text-sm">{errorMessage}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitState === 'loading' || !email.trim()}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition-colors duration-150 flex items-center justify-center gap-2"
                >
                  {submitState === 'loading' ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending link&hellip;
                    </>
                  ) : (
                    'Send magic link'
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Confirmation state */
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-900/50 border border-green-700 mb-4">
                <MailIcon className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="text-lg font-medium text-white mb-2">Check your email</h2>
              <p className="text-zinc-400 text-sm mb-1">
                We sent a sign-in link to
              </p>
              <p className="text-violet-400 text-sm font-medium mb-6 break-all">
                {email}
              </p>
              <p className="text-zinc-500 text-xs mb-6">
                Click the link in the email to sign in. The link expires in 1 hour.
              </p>

              {/* Resend / edit controls */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 font-medium rounded-lg py-2.5 text-sm transition-colors duration-150"
                >
                  {cooldown > 0
                    ? `Resend link in ${cooldown}s`
                    : 'Resend link'}
                </button>
                <button
                  onClick={handleEditEmail}
                  className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors duration-150 py-1"
                >
                  Use a different email
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          No password required &mdash; just a link in your inbox.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline SVG icons (no external icon dependency required for foundation)
// ---------------------------------------------------------------------------

function CheckSquareIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function MailIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function AlertIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
