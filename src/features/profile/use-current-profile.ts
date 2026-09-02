import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/use-auth';
import { getCurrentProfile } from '@/features/profile/profile-api';
import { queryKeys } from '@/lib/supabase/query-keys';

export function useCurrentProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: user ? queryKeys.profile(user.id) : ['auth', 'profile', 'anonymous'],
    queryFn: () => getCurrentProfile(user?.id ?? ''),
    enabled: Boolean(user),
  });
}
