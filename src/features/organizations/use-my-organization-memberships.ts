import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/use-auth';
import { getMyOrganizations } from '@/features/organizations/organization-api';
import { apiQueryKeys } from '@/lib/api/query-keys';

export function useMyOrganizations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: user ? apiQueryKeys.organizations(user.id) : ['api', 'organizations', 'anonymous'],
    queryFn: getMyOrganizations,
    enabled: Boolean(user),
  });
}
