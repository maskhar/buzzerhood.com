import { useQuery } from '@tanstack/react-query';
import type { WorkspaceAccess } from '@/features/auth/auth-types';
import { useAuth } from '@/features/auth/use-auth';
import { queryKeys } from '@/lib/supabase/query-keys';

type WorkspaceMembershipRow = { organization_id: string; organizations: { id: string; name: string; kind: 'client' | 'partner' | 'internal' } | null };

async function getWorkspaceAccess(userId: string): Promise<WorkspaceAccess[]> {
  const { getBuzzerhoodDb } = await import('@/lib/supabase/client');
  const { data, error } = await getBuzzerhoodDb()
    .from('organization_members')
    .select('organization_id, organizations(id, name, kind)')
    .eq('profile_id', userId)
    .eq('status', 'active');
  if (error) throw error;
  return ((data ?? []) as unknown as WorkspaceMembershipRow[]).flatMap((membership) => {
    const organization = membership.organizations;
    if (!organization) return [];
    const kind = organization.kind === 'internal' ? 'admin' : organization.kind;
    return [{ kind, organizationId: organization.id, organizationName: organization.name }];
  });
}

export function useWorkspaceAccess() {
  const { user } = useAuth();
  return useQuery({
    queryKey: user ? queryKeys.workspaces(user.id) : ['workspaces', 'anonymous'],
    queryFn: () => getWorkspaceAccess(user?.id ?? ''),
    enabled: Boolean(user),
  });
}
