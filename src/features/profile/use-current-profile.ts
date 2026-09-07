import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/use-auth';
import { getCurrentProfile } from '@/features/profile/profile-api';
import { apiQueryKeys } from '@/lib/api/query-keys';

export function useCurrentProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: user ? apiQueryKeys.profile(user.id) : ['api', 'auth', 'profile', 'anonymous'],
    queryFn: getCurrentProfile,
    enabled: Boolean(user),
  });
}
