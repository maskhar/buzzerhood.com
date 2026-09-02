import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/use-auth';
import { getMyOrganizationMemberships } from '@/features/organizations/organization-api';
import { queryKeys } from '@/lib/supabase/query-keys';

export function useMyOrganizationMemberships() {
  const { user } = useAuth();
  return useQuery({
    queryKey: user ? queryKeys.organizations(user.id) : ['organizations', 'mine', 'anonymous'],
    queryFn: () => getMyOrganizationMemberships(user?.id ?? ''),
    enabled: Boolean(user),
  });
}
