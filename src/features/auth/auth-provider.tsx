import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { hasSupabaseConfig } from '@/app/config/environment';
import { AuthContext } from '@/features/auth/auth-context';

async function loadSupabaseClient() {
  const module = await import('@/lib/supabase/client');
  return module.getSupabaseClient();
}

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(hasSupabaseConfig);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    void loadSupabaseClient().then(async (supabase) => {
      const { data } = await supabase.auth.getSession();
      if (disposed) return;
      setSession(data.session);
      setIsLoading(false);
      const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
        setSession(nextSession);
        if (event === 'SIGNED_OUT') queryClient.clear();
      });
      unsubscribe = () => listener.subscription.unsubscribe();
    });
    return () => { disposed = true; unsubscribe?.(); };
  }, [queryClient]);

  const signOut = useCallback(async () => {
    if (!hasSupabaseConfig) return;
    const supabase = await loadSupabaseClient();
    await supabase.auth.signOut();
    queryClient.clear();
  }, [queryClient]);

  const user: User | null = session?.user ?? null;
  const value = useMemo(() => ({ session, user, isLoading, isConfigured: hasSupabaseConfig, signOut }), [isLoading, session, signOut, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
