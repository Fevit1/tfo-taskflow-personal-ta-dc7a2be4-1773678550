'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

/**
 * AuthContext shape:
 * {
 *   user: User | null,
 *   session: Session | null,
 *   loading: boolean,
 *   signOut: () => Promise<void>,
 * }
 */
const AuthContext = createContext(null);

/**
 * AuthProvider
 * Place this at the root of the app (in layout.jsx) to make auth state
 * available to every client component via useAuth().
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, [supabase]);

  useEffect(() => {
    // Fetch the initial session on mount.
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    });

    // Subscribe to auth state changes (sign in, sign out, token refresh).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, updatedSession) => {
      setSession(updatedSession);
      setUser(updatedSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = {
    user,
    session,
    loading,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth hook
 * Consume auth state in any client component.
 *
 * Example:
 *   const { user, loading, signOut } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an <AuthProvider>. Wrap your app in <AuthProvider> in layout.jsx.');
  }
  return context;
}
