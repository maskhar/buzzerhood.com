import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { hasApiConfig } from '@/app/config/environment';
import { AuthContext } from '@/features/auth/auth-context';
import { getCurrentUser, login, logout, type BackendUser, type LoginInput } from '@/lib/api/auth';
import { refreshAccessToken } from '@/lib/api/client';

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<BackendUser | null>(null);
  const [isLoading, setIsLoading] = useState(hasApiConfig);

  useEffect(() => {
    if (!hasApiConfig) return;
    let disposed = false;
    void refreshAccessToken().then(async (token) => {
      if (!token || disposed) return;
      try { setUser(await getCurrentUser()); } catch { setUser(null); }
    }).catch(() => { if (!disposed) setUser(null); }).finally(() => { if (!disposed) setIsLoading(false); });
    return () => { disposed = true; };
  }, []);

  const signIn = useCallback(async (input: LoginInput) => {
    const nextUser = await login(input);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(async () => {
    try { await logout(); }
    finally { setUser(null); queryClient.clear(); }
  }, [queryClient]);

  const value = useMemo(() => ({ user, isLoading, isConfigured: hasApiConfig, signIn, signOut }), [isLoading, signIn, signOut, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
