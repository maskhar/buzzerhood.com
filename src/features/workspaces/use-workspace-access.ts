import { useQuery } from '@tanstack/react-query';
import type { WorkspaceAccess } from '@/features/auth/auth-types';
import { useAuth } from '@/features/auth/use-auth';
import { apiRequest } from '@/lib/api/client';
import { apiQueryKeys } from '@/lib/api/query-keys';

type WorkspaceResponse = { client: { organizationId: string; name: string; role: string }[]; partner: { partnerId: string; displayName: string; role: string; status: string }[]; admin: boolean };

async function getWorkspaceAccess(): Promise<WorkspaceAccess[]> {
  const response = await apiRequest<WorkspaceResponse>('/me/workspaces');
  return [
    ...response.client.map((workspace) => ({ kind: 'client' as const, organizationId: workspace.organizationId, organizationName: workspace.name })),
    ...response.partner.map((workspace) => ({ kind: 'partner' as const, organizationId: workspace.partnerId, organizationName: workspace.displayName })),
    ...(response.admin ? [{ kind: 'admin' as const, organizationName: 'Internal team' }] : []),
  ];
}

export function useWorkspaceAccess() {
  const { user } = useAuth();
  return useQuery({
    queryKey: user ? apiQueryKeys.workspaces(user.id) : ['api', 'me', 'workspaces', 'anonymous'],
    queryFn: getWorkspaceAccess,
    enabled: Boolean(user),
  });
}
